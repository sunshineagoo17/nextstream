const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const knex = require('../config/db');
const axios = require('axios');
const router = express.Router();
const { comparePassword } = require('../utils/hashPasswords');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateAndNotifyRecommendations } = require('../services/recommendationService');

// Region mappings
const regionMapping = {
  // Canada
  'Ontario': 1, // Eastern Time Zone
  'Manitoba': 1, // Central Time Zone
  'Alberta': 1, // Mountain Time Zone
  'British Columbia': 1, // Pacific Time Zone
  'Nova Scotia': 1, // Atlantic Time Zone
  // United States
  'New York': 2, // Eastern Time Zone
  'Illinois': 2, // Central Time Zone
  'Colorado': 2, // Mountain Time Zone
  'California': 2, // Pacific Time Zone
  'Alaska': 2, // Alaska Time Zone
  // United Kingdom
  'London': 3, // GMT/BST
  'Scotland': 3, // WET
  'Northern Ireland': 3, // IST
  'Wales': 3, // BST
  'England': 3 // BST
};

const regionReverseMapping = {
  1: 'Canada',
  2: 'United States',
  3: 'United Kingdom'
};

// Middleware to ensure the uploads/avatars directory exists
const ensureUploadsDirectoryExists = (req, res, next) => {
  const dir = path.join(__dirname, '../uploads/avatars');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  next();
};

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    cb(null, dir); // Use the absolute path for the directory
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg|webp|bmp|tiff/;
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
      region: regionReverseMapping[user.region] || '',
      isSubscribed: user.isSubscribed,
      isActive: user.isActive,
      avatar: user.avatar 
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
    region: regionMapping[region] || null,
    isSubscribed,
    isActive 
  };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
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

    if (receiveNotifications) {
      await generateAndNotifyRecommendations(user.id);
    }

    res.json({ message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Upload user avatar
router.post('/:userId/avatar', authenticate, ensureUploadsDirectoryExists, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = `uploads/avatars/${req.file.filename}`;
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
    
    await knex('users').where({ id: req.params.userId }).update({ avatar: null });
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ message: 'Error deleting avatar' });
  }
});

// Update user status
router.post('/:userId/update-status', authenticate, async (req, res) => {
  const { isActive } = req.body;
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await knex('users').where({ id: req.params.userId }).update({ isActive });
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

// Fetch geolocation and update region
router.get('/:userId/location', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`https://ipinfo.io/json?token=${process.env.IPINFO_TOKEN}`);
    console.log('IP Info Response:', response.data); 
    const region = response.data.region; // Use region instead of country

    const regionId = regionMapping[region] || null;
    if (regionId) {
      await knex('users').where({ id: req.params.userId }).update({ region: regionId });
      res.json({ message: 'Location updated successfully', region });
    } else {
      res.status(400).json({ error: 'Region not recognized' });
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

module.exports = router;