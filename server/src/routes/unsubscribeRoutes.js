const express = require('express');
const crypto = require('crypto');
const knex = require('../config/db');
const router = express.Router();

router.get('/validate-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Unsubscribe token is missing.' });
  }

  try {
    const user = await knex('users')
      .select('*')
      .where({ unsubscribeToken: token })
      .andWhere('unsubscribeExpires', '>', Date.now()) 
      .first();

    if (!user) {
      return res.status(400).json({ message: 'Unsubscribe token is invalid or has expired.' });
    }

    res.status(200).json({ message: 'Token is valid.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing the token validation request.' });
  }
});

// Unsubscribe Route (POST)
router.post('/', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Unsubscribe token is missing.' });
  }

  try {
    const user = await knex('users')
      .where({ unsubscribeToken: token })
      .andWhere('unsubscribeExpires', '>', Date.now()) 
      .first();

    if (!user) {
      return res.status(400).json({ message: 'Unsubscribe token is invalid or has expired.' });
    }

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

    await knex('users')
      .where({ email })
      .update({
        unsubscribeToken: token,
        unsubscribeExpires: tokenExpiry,
      });

    const unsubscribeURL = `${process.env.CLIENT_URL}/unsubscribe?token=${token}`;
    res.status(200).json({ message: 'Unsubscribe token generated', unsubscribeURL });
  } catch (error) {
    res.status(500).json({ message: 'Error generating unsubscribe token.' });
  }
});

module.exports = router;