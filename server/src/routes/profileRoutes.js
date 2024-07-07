const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const knex = require('../config/db');
const router = express.Router();

// Get user profile
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      receiveReminders: user.receiveReminders,
      receiveNotifications: user.receiveNotifications,
      region: user.region,
      isSubscribed: user.isSubscribed,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/:userId', authenticate, async (req, res) => {
  const { name, username, email, password, receiveReminders, receiveNotifications, region, isSubscribed, isActive } = req.body;
  const updatedUser = {
    name,
    username,
    email,
    receiveReminders,
    receiveNotifications,
    region,
    isSubscribed,
    isActive // Include isActive field
  };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updatedUser.password = hashedPassword;
  }

  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await knex('users').where({ id: req.params.userId }).update(updatedUser);
    res.json({ message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Delete user account
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await knex('users').where({ id: req.params.userId }).del();
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

module.exports = router;
