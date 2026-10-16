# Practical 8 - Performance Report (Before vs After)

**Name:** ________  **Enrolment No.:** ________  **Date:** ________

## 1. Environment
- Browser / version: ________
- Network setting for the test: No throttling / Slow 3G (circle one)
- Cache: Disabled (DevTools "Disable cache" ticked)
- `VITE_MIN_DELAY` during measurement: ____

## 2. Build output (from the terminal)
| File | Baseline (`build:baseline`) | Optimised (`build`) |
|---|---|---|
| Main `index-*.js` (size / gzip) | ____ / ____ | ____ / ____ |
| Home chunk | - (in main) | ____ / ____ |
| Projects chunk | - (in main) | ____ / ____ |
| Contact chunk | - (in main) | ____ / ____ |
| Tasks chunk | - (in main) | ____ / ____ |
| TaskChart (Recharts) chunk | - (in main) | ____ / ____ |
| Number of JS files | 1 | ____ |

## 3. Browser Network tab (first load of `/`)
| Metric | Before | After | Change |
|---|---|---|---|
| JS requests | ____ | ____ | |
| JS transferred | ____ | ____ | |
| DOMContentLoaded | ____ | ____ | |
| Load / Finish | ____ | ____ | |
| Lighthouse Performance (optional) | ____ | ____ | |

## 4. Chunk loading behaviour (After)
- Visiting `/projects` loaded: ________
- Visiting `/contact` loaded: ________
- Opening "Show analytics" loaded: ________

## 5. Screenshots
- Before: Network tab ![before](before-network.png)
- After: Network tab ![after](after-network.png)
- Fallback UI on Slow 3G ![fallback](fallback.png)
- Profiler: unnecessary re-render ![profiler](profiler.png)

## 6. Reflection (errors faced and how they were solved)
- ________

## 7. Conclusion
Lazy loading reduced the initial bundle from ____ to ____ (____ %), because ________.
