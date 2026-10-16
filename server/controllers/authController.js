const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

// POST /api/auth/register  -> hash password -> save User -> 201
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login  -> verify password -> sign JWT -> return token
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // password has select:false, so explicitly request it here
    const user = await User.findOne({ email }).select('+password');

    // Same message for "no user" and "wrong password" (don't reveal which emails exist)
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected) -> details of the logged-in user from the decoded JWT
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
      tokenExpiresAt: new Date(req.user.exp * 1000).toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
