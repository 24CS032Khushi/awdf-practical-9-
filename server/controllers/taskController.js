const Task = require('../models/Task');
const cache = require('../config/cache');
const stats = require('../utils/cacheStats');
const { allTasksKey, taskKey, invalidateList, invalidateTask } = require('../utils/cacheKeys');

/**
 * Cache-aside pattern (Practical 9)
 *   READ  : check cache -> HIT: return it | MISS: query MongoDB -> store -> return
 *   WRITE : write to MongoDB FIRST, then delete the affected cache keys
 * The X-Cache response header (HIT / MISS / BYPASS) makes this visible in Postman.
 */

// GET /api/tasks  - only the logged-in user's tasks (cached)
exports.getTasks = async (req, res, next) => {
  try {
    const key = allTasksKey(req.user.id);

    if (cache.enabled) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        stats.hit('all_tasks');
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
      stats.miss('all_tasks');
    }

    // .lean() -> plain JS objects (cheaper than Mongoose documents, safe to cache)
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();

    if (cache.enabled) cache.set(key, tasks);
    res.set('X-Cache', cache.enabled ? 'MISS' : 'BYPASS');
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks  -> list is now stale
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    invalidateList(req.user.id); // only after a SUCCESSFUL write
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id  (cached separately from the list)
exports.getTask = async (req, res, next) => {
  try {
    const key = taskKey(req.user.id, req.params.id);

    if (cache.enabled) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        stats.hit('single_task');
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
      stats.miss('single_task');
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id }).lean();
    // 404s are NOT cached, so a task created later is never hidden by a stale "not found"
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (cache.enabled) cache.set(key, task);
    res.set('X-Cache', cache.enabled ? 'MISS' : 'BYPASS');
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id  -> list + this task are now stale
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // ownership check
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    invalidateTask(req.user.id, req.params.id);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id  -> list + this task are now stale
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    invalidateTask(req.user.id, req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
