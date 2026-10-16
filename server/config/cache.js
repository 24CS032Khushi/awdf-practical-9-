const NodeCache = require('node-cache');

/**
 * Shared in-memory cache instance (Practical 9).
 *
 * - stdTTL        : default time-to-live in seconds (override with CACHE_TTL in .env)
 * - checkperiod   : how often (s) node-cache sweeps expired keys
 * - useClones     : false -> we store plain (lean) objects and never mutate them,
 *                   so skipping the deep-clone on every get/set is faster and safe.
 *
 * `cache.enabled` is a runtime switch (CACHE_ENABLED in .env, or the debug
 * endpoint POST /api/debug/cache-toggle). It lets us measure cached vs uncached
 * response times WITHOUT editing/commenting-out code between the two runs.
 *
 * NOTE: this cache lives in THIS Node process's memory only. See the README
 * (Key Question 3) for why that breaks with multiple server instances.
 */
const TTL = Number(process.env.CACHE_TTL) > 0 ? Number(process.env.CACHE_TTL) : 60;

const cache = new NodeCache({ stdTTL: TTL, checkperiod: 120, useClones: false });

cache.ttl = TTL; // exposed for the debug endpoint
cache.enabled = process.env.CACHE_ENABLED !== 'false';

module.exports = cache;
