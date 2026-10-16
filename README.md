# Practical 9 - In-Memory Caching and Query Optimization (node-cache)

The Express API now caches read endpoints in memory. Full lab journal, key-question answers and the measurement tables: **`docs/CACHING_REPORT.md`**.

```bash
cd server && npm install        # adds node-cache
npm run dev                     # API on :5000 (dev only: /api/debug/* endpoints enabled)
npm test                        # 9 offline tests (no MongoDB needed) - hit/miss, invalidation, TTL
npm run seed -- you@example.com 500                                  # add sample tasks so the speed-up is visible
npm run benchmark -- --email you@example.com --password yourpass     # cached vs uncached table + invalidation PASS/FAIL
```

| Item | Detail |
|---|---|
| Cache module | `server/config/cache.js` (`stdTTL` 60 s, override with `CACHE_TTL`) |
| `GET /api/tasks` | cache-aside, key `all_tasks:<userId>` (per-user so users never see each other's tasks) |
| `GET /api/tasks/:id` | cached separately, key `task:<userId>:<id>` |
| Invalidation | POST -> list key; PUT/DELETE -> list key + that task's key (after a successful write only) |
| Response headers | `X-Cache: HIT / MISS / BYPASS`, `X-Response-Time: 1.23ms` |
| Debug (non-production) | `GET /api/debug/cache-stats`, `POST /api/debug/cache-reset`, `POST /api/debug/cache-toggle {"enabled":false}` |
| Switch caching off for the "uncached" readings | `cache-toggle` endpoint, or `CACHE_ENABLED=false` in `server/.env` - no code editing needed |

**Known limitation:** node-cache is process-local memory - it is wiped on restart and is not shared between server instances (use Redis for that).

---

# TaskFlow - ITUE301 Practical 8: Performance Optimization and Lazy Loading in React

Full-stack Task Management app (React + Vite frontend, Express + MongoDB backend with JWT auth from Practical 7),
optimised with **route-based code splitting** (`React.lazy` + `Suspense`).

```
task-manager-fullstack/
├── server/   Express + MongoDB API (Practical 6/7: bcrypt, JWT, validation middleware)
├── client/   React 18 + Vite + React Router (this practical)
└── docs/     PERFORMANCE_REPORT.md  <- fill in your before/after numbers + screenshots
```

## 1. Setup
Prerequisites: Node.js v18+, MongoDB running locally (or an Atlas URI).

```bash
npm run install:all                  # installs server + client dependencies
# edit server/.env  -> set MONGO_URI and a long random JWT_SECRET
```
Run in two terminals:
```bash
npm run server     # API on http://localhost:5000
npm run client     # React app on http://localhost:5173  (proxies /api to :5000)
```

## 2. What was implemented (Problem Statement)
| Requirement | Where |
|---|---|
| `React.lazy()` + `Suspense` on route components (Projects, Contact **and** every other page) | `client/src/App.jsx` |
| Meaningful fallback UI | `components/PageLoader.jsx` (spinner + skeleton) |
| Measure before/after | `npm run build:baseline` vs `npm run build`, see section 4 |
| Document comparison | `docs/PERFORMANCE_REPORT.md` |
| **Supp. 1** Lazy-load a heavy 3rd-party component only when needed | Recharts in `components/chart/TaskChart.jsx`, loaded only when you click "Show analytics" on My Tasks |
| **Supp. 2** Minimum-delay fallback (300 ms) | `utils/lazyWithDelay.js` (`VITE_MIN_DELAY` in `client/.env`) |
| **Supp. 3** Profiler: one unnecessary re-render | section 6 |

Only the tiny shell (Navbar, Footer, auth/toast context, router) is in the main bundle.

## 3. How "before" and "after" are built from the same code
`client/vite.config.js` swaps two files by mode:
- `npm run build` -> `App.jsx` (lazy, code-split) + `ChartEntry.lazy.jsx` -> output in `client/dist`
- `npm run build:baseline` -> `AppBaseline.jsx` (all static imports) + `ChartEntry.eager.jsx` -> output in `client/dist-baseline`

So the baseline really is "everything in one main bundle", and you can re-measure it any time.
> Faculty guidance says to capture baseline screenshots **before** optimising. Do that with the baseline build
> and commit the screenshots first, then commit the optimised build (see section 8).

## 4. How to measure (do this for BOTH builds)
**Set `VITE_MIN_DELAY=0` in `client/.env` while measuring**, otherwise the artificial 300 ms delay is added to load time. Put it back to 300 afterwards (or keep 0 and mention it).

**A. Bundle size (terminal)**
```bash
cd client
npm run build:baseline    # note: index-*.js size + gzip  (one big file)
npm run build             # note: main index-*.js + each page chunk + TaskChart chunk
```
**B. Load time and transferred JS (browser)**
1. Start the backend (`npm run server`).
2. Baseline: `npm run preview:baseline` -> open http://localhost:4174. Optimised: `npm run preview` -> http://localhost:4173.
3. DevTools -> **Network** tab -> tick **Disable cache** -> filter **JS** -> hard reload (Ctrl+Shift+R).
4. Record: number of JS requests, **transferred** size (bottom bar), **Finish**/**DOMContentLoaded**/**Load** time.
5. Optimised build: click Projects, Contact, log in and open My Tasks -> each click downloads one new chunk. Click **Show analytics** -> `TaskChart-*.js` downloads only now.
6. Throttle to **Slow 3G** (Network tab dropdown) and reload/navigate -> the loading fallback is clearly visible. Take a screenshot of the fallback.
7. Optional: **Lighthouse** tab -> run on both builds and compare Performance score / LCP.

Always preview the **production build**; the dev server (`npm run dev`) is unbundled and not valid for size comparisons.

## 5. Key Questions (answers)
**1. Initial bundle vs lazy-loaded chunk?**
The initial bundle (`main`/`index-*.js`) is downloaded on the first visit and contains the shell and everything imported statically. A lazy chunk is created by `import()` and downloaded only when that route (or component) is first rendered, then cached.

**2. Why does lazy loading improve perceived performance if the total code is the same?**
The browser must download, parse and execute the whole main bundle before showing anything. A smaller main bundle means a faster first paint and interactivity; the rest is fetched on demand (and may never be needed). Total code over a long session can be equal, but the user waits less at the start. Lazy loading changes *when* code is downloaded, not *how much* eventually is.

**3. When is lazy loading not worth it?**
Very small apps (a few KB per page): the extra network request and loading flicker cost more than they save. Also components needed immediately on every page (navbar), or on very fast/local setups where the saving is unnoticeable.

## 6. React DevTools Profiler - unnecessary re-render (Supplementary 3)
Install the *React Developer Tools* browser extension, open **Profiler** -> gear icon -> tick **"Record why each component rendered"**.

Reproduce the problem:
1. In `client/src/components/TaskItem.jsx`, temporarily change the last line to `export default TaskItem;` (remove `memo`).
2. Run `npm run dev`, log in, add 5+ tasks, start recording, type a few letters in the **Search tasks** box, stop recording.
3. Observe: **every `TaskItem` re-renders on each keystroke** although no task changed (the parent `Tasks` re-renders because `query` state changed). Screenshot this flame chart.
4. Restore `memo(TaskItem)` and record again: `TaskItem` no longer re-renders. This works because the handlers passed down (`handleUpdate`, `handleDelete`) are stable thanks to `useCallback`.

Write in your report: *"Typing in the search input changed `query` in `Tasks`, re-rendering all `TaskItem`s with unchanged props. Fixed with `React.memo` + `useCallback`."*

## 7. Common mistakes / troubleshooting (all avoided in the code)
| Mistake | How this project avoids it |
|---|---|
| "Element type is invalid" after lazy() | Every page and `TaskChart` uses `export default` |
| `lazy()` inside a component (remounts / loops) | All `lazy` calls are at module top level |
| Suspense around the whole App | Only the `<Routes>` block is wrapped, so Navbar/Footer stay visible |
| Suspense around every component | One boundary for routes + one for the chart |
| No separate chunks after build | Dynamic `import()` used; verify the `dist/assets` list after `npm run build` |
| Fallback never visible | Use Slow 3G throttling; also 300 ms minimum delay |
| Forgetting baseline metrics | `build:baseline` reproduces them from the same code |
| Measuring with dev server | Use `build` + `preview` |
| Login/API fails in preview | Backend must be running on port 5000 (preview proxies `/api`) |

## 8. Suggested Git commits (GitHub deliverable)
```bash
git add . && git commit -m "docs: baseline (eager) bundle metrics and screenshots"
git add . && git commit -m "perf: route-based code splitting with React.lazy and Suspense"
git add . && git commit -m "perf: lazy load Recharts analytics + min-delay fallback + memoised TaskItem"
git add . && git commit -m "docs: before/after comparison in README"
```
Keep screenshots in `docs/` and link them from the report.

## 9. API (from Practical 7)
`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id` (all `/api/tasks*` require `Authorization: Bearer <token>`).

## 10. Notes
- The Contact form is a front-end demo (simulated send); the backend has no contact endpoint.
- Project cards use sample data in `client/src/data/projects.js`; your name/links are in `client/src/data/site.js`.
- Production: `npm run build`, then `npm run server` also serves `client/dist` at http://localhost:5000.
