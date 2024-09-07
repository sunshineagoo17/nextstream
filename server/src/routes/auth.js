const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('../config/db');
const router = express.Router();
const cookieParser = require('cookie-parser');

// Middleware to use cookie-parser
router.use(cookieParser());

// Function to generate default username, with a unique check
const generateDefaultUsername = async () => {
  const [latestUser] = await knex('users').orderBy('id', 'desc').limit(1);
  const userCount = latestUser ? latestUser.id + 1 : 1;

  // Generates a username and check if it already exists
  let username = `nextstreamuser${userCount}`;
  let existingUser = await knex('users').where({ username }).first();

  // Increments username if a collision is found
  while (existingUser) {
    userCount++;
    username = `nextstreamuser${userCount}`;
    existingUser = await knex('users').where({ username }).first();
  }

  return username;
};

// Traditional Registration (email/password)
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
      password: hashedPassword,
    });

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    res.status(201).json({ success: true, message: 'User registered successfully', userId, token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Error registering user', error });
  }
});

// Traditional Login (email/password)
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

// OAuth Registration (Google/GitHub)
router.post('/oauth-register', async (req, res) => {
  try {
    const { email, displayName, provider } = req.body;

    // Check if the user already exists
    const existingUser = await knex('users').where({ email }).first();

    if (existingUser) {
      if (existingUser.provider === provider) {
        // If the user already exists with the same provider, notify them
        return res.status(400).json({ success: false, message: 'Email already registered with this provider' });
      } else {
        // If the user exists with a different provider, notify them about that
        return res.status(400).json({
          success: false,
          reason: 'email_linked_to_other_provider',
          provider: existingUser.provider,
          message: `This email is already linked to ${existingUser.provider}. Please log in using ${existingUser.provider}.`
        });
      }
    }

    // Generate a default username if needed
    const username = await generateDefaultUsername();

    // Insert new user into the database
    const [userId] = await knex('users').insert({
      name: displayName, 
      email,
      provider,          
      password: null,     // No password needed for OAuth users
      username,           // Use the generated username
    });

    // Create a JWT token for the new user
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the token in the cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    res.status(201).json({ success: true, message: 'OAuth registration successful', userId, token });
  } catch (error) {
    console.error('Error in OAuth registration:', error);
    res.status(500).json({ success: false, message: 'OAuth registration failed', error });
  }
});

// OAuth Login (Google/GitHub)
router.post('/oauth-login', async (req, res) => {
  try {
    const { email, provider } = req.body;

    let user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
    }

    // Check if the user is trying to log in with a different provider
    if (user.provider !== provider) {
      return res.status(400).json({
        success: false,
        reason: 'email_linked_to_other_provider',
        provider: user.provider,
        message: `This email is linked to ${user.provider}. Please log in with that provider.`
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    res.status(200).json({ success: true, message: 'OAuth login successful', userId: user.id, token });
  } catch (error) {
    console.error('Error in OAuth login:', error);
    res.status(500).json({ success: false, message: 'OAuth login failed', error });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Guest Login Route with extended expiration time
router.post('/guest-login', (req, res) => {
  // Creates a JWT token with a 'guest' role and no userId
  const token = jwt.sign({ role: 'guest' }, process.env.JWT_SECRET, { expiresIn: '24h' });

  // Set the JWT as a cookie
  res.cookie('guestToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(Date.now() + 86400000) // 24 hours expiry
  });

  res.json({ success: true, message: 'Guest logged in successfully', token });
});

// Guest Logout Route
router.post('/guest-logout', (req, res) => {
  res.clearCookie('guestToken');
  res.json({ success: true, message: 'Guest logged out successfully' });
});

module.exports = router;