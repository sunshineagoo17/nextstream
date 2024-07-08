const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const knex = require('../config/db');
const router = express.Router();
const { comparePassword } = require('../utils/hashPasswords'); 

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

// Check password endpoint
router.post('/check-password', async (req, res) => {
  const { userId, currentPassword } = req.body;
  try {
    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ valid: false, message: 'Incorrect password' });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Error checking password:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  const { name, username, email, password, receiveReminders, receiveNotifications, region, isSubscribed, isActive } = req.body;
  const updatedUser = {
    name,
    username,
    email,
    receiveReminders: receiveReminders !== undefined ? receiveReminders : true,
    receiveNotifications: receiveNotifications !== undefined ? receiveNotifications : true,
    region,
    isSubscribed: isSubscribed !== undefined ? isSubscribed : true,
    isActive: isActive !== undefined ? isActive : true // Set default to true if not provided
  };

  if (password) {
    console.log('Hashing password:', password); // Log the plain password (for debugging only)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword); // Log the hashed password (for debugging only)
    updatedUser.password = hashedPassword;
  }

  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await knex('users').where({ id: req.params.userId }).update(updatedUser);
    console.log('Updated user:', updatedUser); // Log the updated user object (for debugging only)
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