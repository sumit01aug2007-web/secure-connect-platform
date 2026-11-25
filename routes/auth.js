const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const eventBus = require('../utils/eventBus');

const router = express.Router();
const SALT_ROUNDS = 12;

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username: username.trim(), email: normalizedEmail, password: hashedPassword });
    eventBus.emit('user:registered', { userId: user.id, email: user.email });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered' });
    console.error('[signup]', error.message);
    return res.status(500).json({ message: 'Unable to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    eventBus.emit('user:login', { userId: user.id });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('[login]', error.message);
    return res.status(500).json({ message: 'Unable to log in' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome, admin. You have access to this protected resource.' });
});

module.exports = router;
