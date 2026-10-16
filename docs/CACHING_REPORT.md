# Practical 9 - In-Memory Caching and Query Optimization (Lab Journal)

**Name:** ________  **Enrolment No.:** ________  **Date:** ________

## 1. What was implemented
| Requirement | Where |
|---|---|
| node-cache installed, shared instance, TTL 60 s | `server/config/cache.js` |
| Cache `GET /api/tasks` (cache-aside) | `server/controllers/taskController.js` -> `getTasks` |
| Invalidate on POST / PUT / DELETE | `createTask`, `updateTask`, `deleteTask` + `server/utils/cacheKeys.js` |
| **Supp. 1** Cache `GET /api/tasks/:id` separately | `getTask`, key `task:<userId>:<taskId>` |
| **Supp. 2** Hit/miss counter + debug endpoint | `server/utils/cacheStats.js`, `GET /api/debug/cache-stats` |
| **Supp. 3** TTL experiment | section 5 below (`CACHE_TTL` in `.env`) |
| Response time measurement | Postman "Time" + `X-Response-Time` / `X-Cache` headers + `npm run benchmark` |

**Cache key design.** The lab uses the key `all_tasks`. In this app every user only sees their own tasks, so a single global key would
serve user A's tasks to user B (a data leak). The key is therefore `all_tasks:<userId>` - still fixed and stable per user
(so it can actually be hit), but private per user. Single-task key: `task:<userId>:<taskId>`.

**Design choices worth mentioning in the viva**
- *Cache-aside:* read -> check cache -> on miss query MongoDB and store. Write -> update MongoDB **first**, then delete keys (delete only after a successful write; a failed/404 write leaves the cache untouched).
- *Delete instead of update:* after a write we delete the key and let the next read rebuild it - simpler and cannot store a half-correct value.
- *404 responses are not cached,* so a task created later is never hidden by a stale "not found".
- `.lean()` returns plain objects (cheaper than Mongoose documents and safe to cache); `useClones:false` because cached objects are never mutated.
- Debug endpoints are mounted only when `NODE_ENV !== 'production'`.

## 2. Environment
- Node version: ____   MongoDB: local / Atlas (circle one)   Postman / Thunder Client (circle one)
- Number of tasks for the test user: ____ (`npm run seed -- <email> 500` adds sample data)
- Response size of `GET /api/tasks`: ____ KB
- TTL during measurement: 60 s

## 3. Measurements (GET /api/tasks) - record the Postman **"Time"** value
**Order matters (faculty guidance): take the UNCACHED readings first.**

Method:
1. Log in (`POST /api/auth/login`), copy the token into Postman -> Authorization -> Bearer Token.
2. *Uncached:* `POST /api/debug/cache-toggle` with body `{"enabled": false}`. Send `GET /api/tasks` 3-5 times. Header `X-Cache` shows `BYPASS`.
3. *Cached:* `POST /api/debug/cache-toggle` with `{"enabled": true}` (this also flushes the cache). Send `GET /api/tasks` 3-5 times. First is `X-Cache: MISS`, the rest `HIT`.
4. Look at `GET /api/debug/cache-stats` for the counters.

| Reading | Uncached - Postman Time (ms) | Cached - Postman Time (ms) | X-Cache (cached run) |
|---|---|---|---|
| 1 | ____ | ____ (cold) | MISS |
| 2 | ____ | ____ | HIT |
| 3 | ____ | ____ | HIT |
| 4 | ____ | ____ | HIT |
| 5 | ____ | ____ | HIT |
| **Average** | ____ | ____ (HIT-only: ____) | |

Improvement = uncached average / cached HIT average = ____ x

**Automated cross-check** (optional, same numbers from a script):
```bash
cd server
npm run seed -- you@example.com 500
npm run benchmark -- --email you@example.com --password yourpass --runs 5
```
Paste the printed table here: ________

**Observation (write in your own words):** e.g. "The first cached request (MISS) was about as slow as uncached because it
still queries MongoDB and then stores the result; later requests (HIT) skipped the database and were ___ ms faster."

## 4. Correctness evidence
`cd server && npm test` -> 9 passing tests (works without MongoDB, uses a counting fake DB) covering MISS->HIT, invalidation on
POST/PUT/DELETE, per-user isolation, 404 not cached, TTL expiry, cache disabled mode, debug stats.
`npm run benchmark` also prints PASS/FAIL lines for the same invalidation behaviour against the real database.

Manual demo of the stale-data risk (for the viva): in `updateTask` comment out `invalidateTask(...)`, PUT a task's status, then GET it
(cached) -> old status is returned until the TTL expires. Restore the line afterwards.

## 5. TTL experiment (Supplementary 3)
Set `CACHE_TTL` in `server/.env`, restart, and for each value: GET (MISS), PUT a change **directly in MongoDB/Compass** (bypassing the API
so no invalidation happens), then GET again and note how long the old value keeps being served.

| TTL | Hit ratio after 20 requests | Max staleness observed | Comment |
|---|---|---|---|
| 5 s | ____ | ____ | fresh but many misses |
| 60 s | ____ | ____ | balanced |
| 300 s | ____ | ____ | fastest, but stale for up to 5 min |

## 6. Key Questions - answers
**1. Why must the cache be invalidated on every write, and what happens to correctness if not?**
The cache holds a *copy* of the data. A write changes MongoDB (the source of truth) but not the copy, so until the TTL expires every read returns the old
copy: a newly created task is missing, an edited task shows its old status, a deleted task still appears (and a later PUT on it returns 404).
Users would see their own actions "not saved". Invalidating after each successful write (delete `all_tasks:<user>` and `task:<user>:<id>`) forces the next
read to rebuild from the database, so cached data is never older than the last write made through this server.

**2. What is a reasonable TTL in a task-management context, and what trade-off does TTL length represent?**
Around 30-60 s is reasonable: tasks change rarely, users re-open the list often, and a short TTL bounds how long any missed invalidation can hurt. TTL is a
trade-off between **freshness** and **performance/load**: a long TTL means more hits, less database load and faster responses, but data can be stale longer
(especially if something changes the DB without going through this server); a short TTL means fresher data but more misses, so less benefit. Too short (e.g. 1-2 s)
and the cache is effectively never hit during testing.

**3. Why is node-cache unsuitable for a multi-server / multi-instance deployment, even though it works in this lab?**
node-cache stores data in the memory of one Node.js process. With several instances behind a load balancer each has its **own separate cache**. A PUT handled by
instance A invalidates only A's cache; instance B keeps serving the old data until its TTL expires, so users see inconsistent results depending on which instance
answers. Caches are also lost on restart/deploy, cannot be shared or inspected centrally, and duplicate memory per instance. The fix is a shared external cache such as
**Redis** (or Memcached) used by all instances, so one invalidation is visible to all.

## 7. Common mistakes / troubleshooting (all avoided in the code)
| Symptom | Cause | How this project handles it |
|---|---|---|
| Updated task not reflected in GET | cache not invalidated | `invalidateTask` in PUT/DELETE, `invalidateList` in POST |
| No difference cached vs uncached | TTL too short / key changes each request / tiny dataset | stable keys, TTL 60 s, `npm run seed` to add data |
| Cache wiped after restart | in-memory by design | expected - noted as known limitation |
| Response time barely changes | MongoDB already fast | seed 500+ tasks |
| One reading only | unreliable | 3-5 readings + averages |

## 8. Suggested Git commits (GitHub deliverable - at least one caching commit)
```bash
git add server/package.json server/config/cache.js server/utils
git commit -m "feat(cache): add node-cache instance, key helpers and hit/miss counters"
git add server/controllers/taskController.js server/middleware/responseTime.js server/server.js
git commit -m "feat(cache): cache GET /tasks and GET /tasks/:id with invalidation on POST/PUT/DELETE"
git add server/routes/debugRoutes.js server/scripts server/tests
git commit -m "test(cache): debug stats endpoint, seed + benchmark scripts, invalidation tests"
git add docs README.md
git commit -m "docs: Practical 9 cached vs uncached response times and key questions"
```
