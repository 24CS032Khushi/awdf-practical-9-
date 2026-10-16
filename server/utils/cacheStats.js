/** Simple hit/miss counters (Supplementary Problem 2). Reset on server restart. */
const counters = {
  all_tasks: { hits: 0, misses: 0 },
  single_task: { hits: 0, misses: 0 },
};

const hit = (name) => { counters[name].hits += 1; };
const miss = (name) => { counters[name].misses += 1; };

const reset = () => {
  Object.values(counters).forEach((c) => { c.hits = 0; c.misses = 0; });
};

const snapshot = () => {
  const out = {};
  let hits = 0;
  let misses = 0;
  for (const [name, c] of Object.entries(counters)) {
    const total = c.hits + c.misses;
    out[name] = { ...c, hitRatio: total ? +(c.hits / total).toFixed(3) : 0 };
    hits += c.hits;
    misses += c.misses;
  }
  const total = hits + misses;
  return { hits, misses, hitRatio: total ? +(hits / total).toFixed(3) : 0, byEndpoint: out };
};

module.exports = { hit, miss, reset, snapshot };
