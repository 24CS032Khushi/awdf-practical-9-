/**
 * Server-side validation + sanitization middleware.
 * Runs BEFORE the controller, so malformed requests never reach the database.
 * Frontend validation can be bypassed (Postman, curl), so the server must check too.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUSES = ['pending', 'in-progress', 'completed'];

// Remove angle brackets (basic XSS sanitization) and trim spaces
const clean = (v) => v.replace(/[<>]/g, '').trim();

const fail = (res, errors) => res.status(400).json({ message: 'Validation failed', errors });

// Body must be an object. Also rejects NoSQL-injection payloads like {"email": {"$gt": ""}}
const isString = (v) => typeof v === 'string';

exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!isString(email) || !EMAIL_REGEX.test(email.trim())) errors.push('A valid email is required');
  if (!isString(password) || password.length < 6) errors.push('Password must be at least 6 characters');
  if (isString(password) && password.length > 72) errors.push('Password must be at most 72 characters (bcrypt limit)');
  if (name !== undefined && !isString(name)) errors.push('Name must be a string');

  if (errors.length) return fail(res, errors);

  req.body = {
    name: isString(name) ? clean(name) : '',
    email: email.trim().toLowerCase(),
    password,
  };
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!isString(email) || !EMAIL_REGEX.test(email.trim())) errors.push('A valid email is required');
  if (!isString(password) || password.length === 0) errors.push('Password is required');

  if (errors.length) return fail(res, errors);

  req.body = { email: email.trim().toLowerCase(), password };
  next();
};

exports.validateTaskCreate = (req, res, next) => {
  const { title, description, status } = req.body || {};
  const errors = [];

  if (!isString(title) || clean(title).length === 0) errors.push('Title is required');
  else if (clean(title).length > 100) errors.push('Title must be at most 100 characters');

  if (description !== undefined && !isString(description)) errors.push('Description must be a string');
  else if (isString(description) && description.length > 500) errors.push('Description must be at most 500 characters');

  if (status !== undefined && !STATUSES.includes(status)) errors.push(`Status must be one of: ${STATUSES.join(', ')}`);

  if (errors.length) return fail(res, errors);

  req.body = {
    title: clean(title),
    description: isString(description) ? clean(description) : '',
    ...(status && { status }),
  };
  next();
};

exports.validateTaskUpdate = (req, res, next) => {
  const { title, description, status } = req.body || {};
  const errors = [];
  const update = {};

  if (title !== undefined) {
    if (!isString(title) || clean(title).length === 0) errors.push('Title cannot be empty');
    else if (clean(title).length > 100) errors.push('Title must be at most 100 characters');
    else update.title = clean(title);
  }
  if (description !== undefined) {
    if (!isString(description)) errors.push('Description must be a string');
    else if (description.length > 500) errors.push('Description must be at most 500 characters');
    else update.description = clean(description);
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) errors.push(`Status must be one of: ${STATUSES.join(', ')}`);
    else update.status = status;
  }
  if (!errors.length && Object.keys(update).length === 0) errors.push('Provide at least one field to update');

  if (errors.length) return fail(res, errors);

  req.body = update;
  next();
};

// Reject malformed ObjectIds (e.g. /api/tasks/abc) before they hit Mongoose
exports.validateObjectId = (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  next();
};
