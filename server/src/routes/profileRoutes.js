const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const knex = require('../config/db');
const router = express.Router();
const { comparePassword } = require('../utils/hashPasswords'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
});

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
      isActive: user.isActive,
      avatar: user.avatar // Add avatar to response
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
    receiveReminders,
    receiveNotifications,
    region,
    isSubscribed,
    isActive 
  };

  if (password) {
    console.log('Hashing password:', password); // Log the plain password (for debugging only)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword); // Log the hashed password (for debugging only)
    updatedUser.password = hashedPassword;
  }

  try {
    // Check for duplicate email
    const existingUser = await knex('users').where({ email }).whereNot({ id: req.params.userId }).first();
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already taken' });
    }

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

// Upload user avatar
router.post('/:userId/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = req.file.path;
    await knex('users').where({ id: req.params.userId }).update({ avatar: avatarPath });
    res.json({ message: 'Avatar uploaded successfully', avatar: avatarPath });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
});

// Delete user avatar
router.delete('/:userId/avatar', authenticate, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const avatarPath = user.avatar;
    if (avatarPath) {
      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error('Error deleting avatar file:', err);
          return res.status(500).json({ message: 'Error deleting avatar file' });
        }
      });
      await knex('users').where({ id: req.params.userId }).update({ avatar: null });
    }

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ message: 'Error deleting avatar' });
  }
});

// Update user status
router.post('/:userId/update-status', authenticate, async (req, res) => {
  const { userId, isActive } = req.body;
  try {
    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await knex('users').where({ id: userId }).update({ isActive });
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
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