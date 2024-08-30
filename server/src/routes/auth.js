const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('../config/db');
const router = express.Router();
const cookieParser = require('cookie-parser');

// Middleware to use cookie-parser
router.use(cookieParser());

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const existingUser = await knex('users').where({ email }).first();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await knex('users').insert({
      name,
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 3600000) // 1 hour expiry
    });

    res.status(201).json({ success: true, message: 'User registered successfully', userId, token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Error registering user', error });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);

    const user = await knex('users').where({ email }).first();
    console.log('User found:', user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Invalid email or password');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the JWT as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + 3600000) // 1 hour expiry
    });

    res.json({ success: true, message: 'Logged in successfully', userId: user.id, token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Guest Login Route
router.post('/guest-login', (req, res) => {
  // Create a JWT token with a 'guest' role and no userId
  const token = jwt.sign({ role: 'guest' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Set the JWT as a cookie
  res.cookie('guestToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(Date.now() + 3600000) 
  });

  res.json({ success: true, message: 'Guest logged in successfully', token });
});

// Guest Logout Route
router.post('/guest-logout', (req, res) => {
  res.clearCookie('guestToken');
  res.json({ success: true, message: 'Guest logged out successfully' });
});

module.exports = router;