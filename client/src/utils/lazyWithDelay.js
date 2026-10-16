import { lazy } from 'react';

// Supplementary problem: minimum-delay fallback (default 300 ms) so the loading
// state does not flash on fast connections. Set VITE_MIN_DELAY=0 in .env to disable.
const MIN_DELAY = Number(import.meta.env.VITE_MIN_DELAY ?? 300);

/**
 * Same as React.lazy(), but waits for BOTH the chunk download and a minimum delay.
 * The delay only applies the first time a page loads; afterwards React caches it.
 */
export function lazyWithDelay(importFn, delay = MIN_DELAY) {
  return lazy(() =>
    Promise.all([importFn(), new Promise((resolve) => setTimeout(resolve, delay))]).then(
      ([module]) => module
    )
  );
}
