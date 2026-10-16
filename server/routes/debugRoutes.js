const router = require('express').Router();
const cache = require('../config/cache');
const stats = require('../utils/cacheStats');

/**
 * Debug endpoints for Practical 9 (Supplementary Problem 2).
 * Mounted in server.js ONLY when NODE_ENV !== 'production' - they expose
 * internals (key names include user ids) and let anyone flush the cache.
 */

// GET /api/debug/cache-stats  -> hit/miss counters + current keys
router.get('/cache-stats', (req, res) => {
  const keys = cache.keys();
  res.json({
    enabled: cache.enabled,
    ttlSeconds: cache.ttl,
    ...stats.snapshot(),
    cachedKeys: keys.map((k) => ({
      key: k,
      expiresInSeconds: Math.max(0, Math.round(((cache.getTtl(k) || 0) - Date.now()) / 1000)),
    })),
    nodeCache: cache.getStats(),
  });
});

// POST /api/debug/cache-reset  -> flush all keys + zero the counters
router.post('/cache-reset', (req, res) => {
  cache.flushAll();
  cache.flushStats();
  stats.reset();
  res.json({ message: 'Cache flushed and counters reset' });
});

// POST /api/debug/cache-toggle  body: {"enabled": false}  -> switch caching on/off at runtime
router.post('/cache-toggle', (req, res) => {
  const enabled = req.body && typeof req.body.enabled === 'boolean' ? req.body.enabled : !cache.enabled;
  cache.enabled = enabled;
  cache.flushAll(); // start the next measurement from a clean cache
  res.json({ enabled: cache.enabled });
});

module.exports = router;
