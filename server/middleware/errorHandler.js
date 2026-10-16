exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler - catches anything thrown/forwarded with next(err)
exports.errorHandler = (err, req, res, next) => {
  // Malformed JSON body (e.g. missing quote)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }
  // Duplicate key (unique email)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: 'Internal server error' });
};
