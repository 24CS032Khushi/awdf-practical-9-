/**
 * Runs WITHOUT MongoDB: the Task model is replaced by a tiny in-memory fake
 * that counts how many "database" queries happen. This proves the cache works
 * and that invalidation keeps data correct.   npm test
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');

// ---- fake DB -------------------------------------------------------------
let rows = [];
let dbQueries = 0;
let nextId = 1;
const oid = () => String(nextId++).padStart(24, '0');
const lean = (v) => ({ sort: () => ({ lean: async () => v }), lean: async () => v });
Task.find = (q) => { dbQueries++; return lean(rows.filter((r) => r.user === q.user).reverse()); };
Task.findOne = (q) => { dbQueries++; return lean(rows.find((r) => r._id === q._id && r.user === q.user) || null); };
Task.create = async (d) => { dbQueries++; const r = { _id: oid(), ...d }; rows.push(r); return r; };
Task.findOneAndUpdate = async (q, upd) => {
  dbQueries++;
  const r = rows.find((x) => x._id === q._id && x.user === q.user);
  if (r) Object.assign(r, upd);
  return r || null;
};
Task.findOneAndDelete = async (q) => {
  dbQueries++;
  const i = rows.findIndex((x) => x._id === q._id && x.user === q.user);
  return i >= 0 ? rows.splice(i, 1)[0] : null;
};

// ---- app under test --------------------------------------------------------
const cache = require('../config/cache');
const stats = require('../utils/cacheStats');
const app = express();
app.use(express.json());
app.use(require('../middleware/responseTime'));
app.use('/api/tasks', require('../routes/taskRoutes'));
app.use('/api/debug', require('../routes/debugRoutes'));
app.use(require('../middleware/errorHandler').errorHandler);

let server, base;
const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);
const req = async (method, path, user, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(user)}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, xCache: res.headers.get('x-cache'), body: await res.json() };
};

test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());
test.beforeEach(() => { rows = []; dbQueries = 0; cache.flushAll(); cache.enabled = true; stats.reset(); });

const U1 = 'a'.repeat(24);
const U2 = 'b'.repeat(24);

test('GET /tasks: 1st request MISS (hits DB), next requests HIT (no DB query)', async () => {
  rows.push({ _id: oid(), title: 't1', user: U1 });
  const a = await req('GET', '/api/tasks', U1);
  const b = await req('GET', '/api/tasks', U1);
  const c = await req('GET', '/api/tasks', U1);
  assert.deepStrictEqual([a.xCache, b.xCache, c.xCache], ['MISS', 'HIT', 'HIT']);
  assert.strictEqual(dbQueries, 1);
  assert.deepStrictEqual(stats.snapshot().byEndpoint.all_tasks, { hits: 2, misses: 1, hitRatio: 0.667 });
});

test('POST invalidates the list cache (no stale data)', async () => {
  await req('GET', '/api/tasks', U1); // warm
  const created = await req('POST', '/api/tasks', U1, { title: 'new' });
  const list = await req('GET', '/api/tasks', U1);
  assert.strictEqual(list.xCache, 'MISS');
  assert.ok(list.body.some((t) => t._id === created.body._id));
});

test('PUT invalidates list AND single-task cache', async () => {
  const id = oid(); rows.push({ _id: id, title: 'old', status: 'pending', user: U1 });
  await req('GET', '/api/tasks', U1);
  await req('GET', `/api/tasks/${id}`, U1);
  assert.strictEqual((await req('GET', `/api/tasks/${id}`, U1)).xCache, 'HIT');
  await req('PUT', `/api/tasks/${id}`, U1, { status: 'completed' });
  const one = await req('GET', `/api/tasks/${id}`, U1);
  const list = await req('GET', '/api/tasks', U1);
  assert.strictEqual(one.body.status, 'completed');
  assert.strictEqual(list.body[0].status, 'completed');
});

test('DELETE invalidates list AND single-task cache', async () => {
  const id = oid(); rows.push({ _id: id, title: 'x', user: U1 });
  await req('GET', '/api/tasks', U1);
  await req('GET', `/api/tasks/${id}`, U1);
  await req('DELETE', `/api/tasks/${id}`, U1);
  assert.strictEqual((await req('GET', `/api/tasks/${id}`, U1)).status, 404);
  assert.strictEqual((await req('GET', '/api/tasks', U1)).body.length, 0);
});

test('cache is per user: user 2 never sees user 1 cached tasks', async () => {
  rows.push({ _id: oid(), title: 'private', user: U1 });
  await req('GET', '/api/tasks', U1);
  const other = await req('GET', '/api/tasks', U2);
  assert.strictEqual(other.xCache, 'MISS');
  assert.strictEqual(other.body.length, 0);
});

test('404 is not cached; task created later is found', async () => {
  const id = '1'.repeat(24);
  assert.strictEqual((await req('GET', `/api/tasks/${id}`, U1)).status, 404);
  rows.push({ _id: id, title: 'late', user: U1 });
  assert.strictEqual((await req('GET', `/api/tasks/${id}`, U1)).status, 200);
});

test('TTL expiry: entry disappears after its TTL', async () => {
  await req('GET', '/api/tasks', U1);
  const key = cache.keys()[0];
  cache.ttl; // default stays 60
  cache.set(key, [], 1);
  await new Promise((r) => setTimeout(r, 1200));
  assert.strictEqual((await req('GET', '/api/tasks', U1)).xCache, 'MISS');
});

test('cache disabled -> BYPASS and every request hits the DB', async () => {
  cache.enabled = false;
  await req('GET', '/api/tasks', U1);
  const r = await req('GET', '/api/tasks', U1);
  assert.strictEqual(r.xCache, 'BYPASS');
  assert.strictEqual(dbQueries, 2);
});

test('debug endpoint reports counters and keys', async () => {
  await req('GET', '/api/tasks', U1);
  await req('GET', '/api/tasks', U1);
  const res = await fetch(base + '/api/debug/cache-stats');
  const s = await res.json();
  assert.strictEqual(s.hits, 1);
  assert.strictEqual(s.misses, 1);
  assert.strictEqual(s.cachedKeys.length, 1);
});
