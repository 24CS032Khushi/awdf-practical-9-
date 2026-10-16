/**
 * Central place for cache keys + invalidation, so every controller uses the
 * SAME stable key strings (a changing key = permanent cache miss).
 *
 * Tasks are private to each user (GET /api/tasks returns only the logged-in
 * user's tasks), so the user id is part of the key. A single global
 * "all_tasks" key would serve user A's tasks to user B - a data leak.
 * The key is still fixed/stable for a given user:  all_tasks:<userId>
 */
const cache = require('../config/cache');

const allTasksKey = (userId) => `all_tasks:${userId}`;
const taskKey = (userId, taskId) => `task:${userId}:${taskId}`;

/** Call after a successful POST (create): only the list is affected. */
const invalidateList = (userId) => cache.del(allTasksKey(userId));

/** Call after a successful PUT / DELETE: list + that single task are stale. */
const invalidateTask = (userId, taskId) => {
  cache.del([allTasksKey(userId), taskKey(userId, taskId)]);
};

module.exports = { allTasksKey, taskKey, invalidateList, invalidateTask };
