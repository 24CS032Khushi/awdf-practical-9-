const jwt = require('jsonwebtoken');

/**
 * Auth middleware
 * 1. Reads "Authorization: Bearer <token>"
 * 2. Verifies signature + expiry using JWT_SECRET (from .env)
 * 3. Sets req.user = decoded payload ({ id, iat, exp })
 * jwt.verify THROWS on invalid/expired tokens, so it is wrapped in try/catch
 * and we answer 401 instead of crashing the server.
 */
module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Access denied. Authorization header missing or malformed (use: Bearer <token>)' });
  }

  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token expired. Please login again'
        : 'Invalid token';
    return res.status(401).json({ message });
  }
};
