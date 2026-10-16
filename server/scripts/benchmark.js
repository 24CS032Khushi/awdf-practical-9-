/**
 * Automated cached-vs-uncached measurement + invalidation correctness check.
 * Requires the server running (npm run dev) and Node 18+ (global fetch).
 *
 *   node scripts/benchmark.js --email you@example.com --password secret123
 *   options: --url http://localhost:5000  --runs 5
 *
 * It uses the debug endpoints to switch the cache off/on, so you do NOT have
 * to comment out code between the two sets of readings.
 * Output is a markdown table you can paste into docs/CACHING_REPORT.md.
 * (Your lab journal should still contain the Postman "Time" readings.)
 */
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const BASE = args.url || 'http://localhost:5000';
const RUNS = Number(args.runs) || 5;

if (!args.email || !args.password) {
  console.error('Usage: node scripts/benchmark.js --email <email> --password <password> [--url ...] [--runs 5]');
  process.exit(1);
}

let token;
const call = async (method, path, body) => {
  const t0 = performance.now();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const ms = performance.now() - t0;
  return {
    status: res.status,
    ms,
    xCache: res.headers.get('x-cache'),
    serverMs: parseFloat(res.headers.get('x-response-time')),
    bytes: Buffer.byteLength(text),
    json: text ? JSON.parse(text) : null,
  };
};

const f = (n) => n.toFixed(1);
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

(async () => {
  const login = await call('POST', '/api/auth/login', { email: args.email, password: args.password });
  if (login.status !== 200) throw new Error(`Login failed (${login.status}): ${JSON.stringify(login.json)}`);
  token = login.json.token;

  const dbg = await call('GET', '/api/debug/cache-stats');
  if (dbg.status !== 200) throw new Error('Debug endpoints unavailable (is NODE_ENV=production?)');

  const first = await call('GET', '/api/tasks');
  const n = first.json.length;
  console.log(`Logged in. User has ${n} tasks (${(first.bytes / 1024).toFixed(1)} KB response). Runs per case: ${RUNS}\n`);
  if (n < 100) console.log('TIP: with so few tasks the difference is tiny - run `npm run seed -- <email> 500` first.\n');

  // ---------- A) UNCACHED ----------
  await call('POST', '/api/debug/cache-toggle', { enabled: false });
  const uncached = [];
  for (let i = 0; i < RUNS; i++) uncached.push(await call('GET', '/api/tasks'));

  // ---------- B) CACHED (1st = MISS, rest = HIT) ----------
  await call('POST', '/api/debug/cache-toggle', { enabled: true });
  await call('POST', '/api/debug/cache-reset');
  const cached = [];
  for (let i = 0; i < RUNS; i++) cached.push(await call('GET', '/api/tasks'));

  console.log('### GET /api/tasks - response time (ms), client round trip / server-only');
  console.log('| Reading | Uncached (no cache) | Cached (cache on) | X-Cache |');
  console.log('|---|---|---|---|');
  for (let i = 0; i < RUNS; i++) {
    console.log(
      `| ${i + 1} | ${f(uncached[i].ms)} / ${f(uncached[i].serverMs)} | ${f(cached[i].ms)} / ${f(cached[i].serverMs)} | ${cached[i].xCache} |`
    );
  }
  const unAvg = avg(uncached.map((r) => r.ms));
  const hitRuns = cached.filter((r) => r.xCache === 'HIT');
  const hitAvg = hitRuns.length ? avg(hitRuns.map((r) => r.ms)) : NaN;
  console.log(`| **Average** | **${f(unAvg)}** | **${f(avg(cached.map((r) => r.ms)))}** (HIT-only: **${f(hitAvg)}**) | |`);
  console.log(`\nSpeed-up (uncached avg / HIT avg): ${(unAvg / hitAvg).toFixed(1)}x`);

  // ---------- C) CORRECTNESS: invalidation ----------
  console.log('\n### Invalidation check');
  const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) process.exitCode = 1; };

  await call('GET', '/api/tasks'); // warm list
  const created = await call('POST', '/api/tasks', { title: 'cache-test task' });
  const id = created.json._id;
  const afterCreate = await call('GET', '/api/tasks');
  ok(afterCreate.xCache === 'MISS' && afterCreate.json.some((t) => t._id === id), 'POST invalidates list; new task appears immediately');

  await call('GET', `/api/tasks/${id}`); // warm single
  const hit = await call('GET', `/api/tasks/${id}`);
  ok(hit.xCache === 'HIT', 'GET /tasks/:id is cached separately (2nd call = HIT)');

  await call('PUT', `/api/tasks/${id}`, { status: 'completed' });
  const afterPut = await call('GET', `/api/tasks/${id}`);
  ok(afterPut.xCache === 'MISS' && afterPut.json.status === 'completed', 'PUT invalidates single-task key; fresh status returned');
  const listAfterPut = await call('GET', '/api/tasks');
  ok(listAfterPut.json.find((t) => t._id === id)?.status === 'completed', 'PUT invalidates list; list shows updated status');

  await call('DELETE', `/api/tasks/${id}`);
  const afterDel = await call('GET', `/api/tasks/${id}`);
  ok(afterDel.status === 404, 'DELETE invalidates single-task key; GET now returns 404');
  const listAfterDel = await call('GET', '/api/tasks');
  ok(!listAfterDel.json.some((t) => t._id === id), 'DELETE invalidates list; task gone from list');

  const final = await call('GET', '/api/debug/cache-stats');
  console.log(`\nCounters: hits=${final.json.hits}, misses=${final.json.misses}, hitRatio=${final.json.hitRatio}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
