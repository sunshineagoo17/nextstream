const express = require('express');
const crypto = require('crypto');
const knex = require('../config/db');
const router = express.Router();

// Validate Token Route (GET)
router.get('/validate-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Unsubscribe token is missing.' });
  }

  console.log('Token received from frontend:', token);
  console.log('Length of token received:', token.length);

  try {
    // Check if token exists and is still valid
    const user = await knex('users')
      .select('*')
      .where({ unsubscribeToken: token })
      .andWhere('unsubscribeExpires', '>', Date.now()) // Ensure token is still valid
      .first();

    if (!user) {
      console.log('No user found for token:', token);
      return res.status(400).json({ message: 'Unsubscribe token is invalid or has expired.' });
    }

    // Token is valid, return success to load unsubscribe page
    console.log('Token is valid. User found:', user);
    res.status(200).json({ message: 'Token is valid.' });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ message: 'Error processing the token validation request.' });
  }
});

// Unsubscribe Route (POST)
router.post('/', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Unsubscribe token is missing.' });
  }

  console.log('Token received for unsubscribe:', token);

  try {
    // Find user with the given token and ensure it's still valid
    const user = await knex('users')
      .where({ unsubscribeToken: token })
      .andWhere('unsubscribeExpires', '>', Date.now()) // Ensure token is still valid
      .first();

    if (!user) {
      return res.status(400).json({ message: 'Unsubscribe token is invalid or has expired.' });
    }

    // Proceed with the unsubscribe action
    await knex('users')
      .where({ id: user.id })
      .update({
        receiveReminders: 0,
        receiveNotifications: 0,
        unsubscribeToken: null,
        unsubscribeExpires: null,
      });

    res.status(200).json({ message: 'You have successfully unsubscribed from notifications.' });
  } catch (error) {
    console.error('Error handling unsubscribe request:', error);
    res.status(500).json({ message: 'Error processing unsubscribe request.' });
  }
});

// Generate Unsubscribe Token Route
router.post('/generate-unsubscribe-token', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required to generate unsubscribe token.' });
  }

  try {
    const user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ message: 'No user with that email address found.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour expiry

    console.log('Generated token:', token);  // Log generated token

    await knex('users')
      .where({ email })
      .update({
        unsubscribeToken: token,
        unsubscribeExpires: tokenExpiry,
      });

    const unsubscribeURL = `http://localhost:3000/unsubscribe?token=${token}`;
    res.status(200).json({ message: 'Unsubscribe token generated', unsubscribeURL });
  } catch (error) {
    console.error('Error generating unsubscribe token:', error);
    res.status(500).json({ message: 'Error generating unsubscribe token.' });
  }
});

module.exports = router;