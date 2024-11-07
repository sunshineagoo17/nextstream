const express = require('express');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const knex = require('../config/db');
const axios = require('axios');
const admin = require('firebase-admin');
const router = express.Router();
const moment = require('moment-timezone');
const { comparePassword } = require('../utils/hashPasswords');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { generateAndNotifyRecommendations } = require('../services/recommendationService');
const { sendScheduledEventReminders } = require('../utils/scheduledEventReminders');
const { sendPushNotifications } = require('../services/pushNotificationService');

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
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg|webp|bmp|tiff|heic|x-heic/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Please upload a valid image (jpg, jpeg, png, gif, svg, webp, bmp, tiff, heic).'));
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
      provider: user.provider || 'traditional', 
      receiveReminders: user.receiveReminders,
      receiveNotifications: user.receiveNotifications,
      receivePushNotifications: user.receivePushNotifications,
      notificationTime: user.notificationTime,
      customHours: user.customHours,
      customMinutes: user.customMinutes,
      region: regionReverseMapping[user.region] || '',
      isSubscribed: user.isSubscribed,
      isActive: user.isActive,
      avatar: user.avatar 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Check password endpoint (for traditional users only)
router.post('/check-password', async (req, res) => {
  const { userId, currentPassword } = req.body;
  try {
    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    if (user.provider) {
      return res.status(400).json({ valid: false, message: 'OAuth users do not have a password set.' });
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ valid: false, message: 'Incorrect password' });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  const { name, username, email, password, receiveReminders, receiveNotifications, receivePushNotifications, notificationTime, customHours, customMinutes, region, isSubscribed, isActive } = req.body;
  const updatedUser = {
    name,
    username,
    email,
    receiveReminders,
    receiveNotifications,
    receivePushNotifications,
    notificationTime,
    customHours,
    customMinutes,
    region: regionMapping[region] || null,
    isSubscribed,
    isActive 
  };

  try {
    // Fetch the user
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for duplicate email
    const existingUser = await knex('users').where({ email }).whereNot({ id: req.params.userId }).first();
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already taken' });
    }

    // Check if the user is an OAuth user
    if (password && user.provider) {
      return res.status(400).json({ message: 'Cannot update password for OAuth users' });
    }

    // Hash the password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedUser.password = hashedPassword;
    }

    // Update the user's profile
    await knex('users').where({ id: req.params.userId }).update(updatedUser);

    if (receiveNotifications) {
      await generateAndNotifyRecommendations(user.id);
    }

    if (receiveReminders) {
      const events = await knex('events')
        .where({ user_id: user.id })
        .andWhere('start', '>=', moment().startOf('day').toISOString())
        .andWhere('start', '<', moment().add(1, 'day').startOf('day').toISOString())
        .select('title', 'start');

      if (events.length > 0) {
        await sendScheduledEventReminders(user.email, events);
      }
    }

    if (receivePushNotifications) {
      let notificationTimeOffset = notificationTime;
    
      // Handle custom time selection
      if (notificationTime === 'custom') {
        // Calculate the offset in minutes
        notificationTimeOffset = parseInt(customHours || 0) * 60 + parseInt(customMinutes || 0);
      }
    
      // Calculate the time window based on the selected notification time
      const notificationWindowStart = moment().add(notificationTimeOffset, 'minutes').toISOString();
      const notificationWindowEnd = moment(notificationWindowStart).add(1, 'hours').toISOString(); 
    
      const events = await knex('events')
        .where({ user_id: user.id })
        .andWhere('start', '>=', notificationWindowStart)
        .andWhere('start', '<', notificationWindowEnd)
        .select('title', 'start');
    
      if (events.length > 0) {
        await sendPushNotifications(user, events);
      }
    }

    res.json({ message: 'User profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Upload user avatar
router.post('/:userId/avatar', authenticate, ensureUploadsDirectoryExists, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const filePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
    let finalPath = filePath;

    // Check if the uploaded file is HEIC
    if (req.file.mimetype === 'image/heic') {
      const jpegPath = filePath.replace(/\.heic$/, '.jpg'); 
      await sharp(filePath).toFormat('jpeg').toFile(jpegPath); 
      fs.unlinkSync(filePath);
      finalPath = jpegPath; 
    }

    const avatarUrl = `uploads/avatars/${path.basename(finalPath)}`;

    await knex('users').where({ id: userId }).update({ avatar: avatarUrl });

    res.json({ message: 'Avatar uploaded successfully', avatar: avatarUrl });
  } catch (error) {
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
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Delete user account (MySQL + Firebase)
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all related events for this user in MySQL
    await knex('events').where({ user_id: req.params.userId }).del();

    // Check and delete Firebase user if Firebase UID exists
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        // Optionally handle failure to delete the Firebase user, if needed
        return res.status(500).json({ message: 'Error deleting Firebase user.' });
      }
    } else {
      console.warn(`No Firebase UID found for user`);
    }

    // Permanently delete the user from MySQL
    await knex('users').where({ id: req.params.userId }).del();

    res.json({ message: 'User account and related events deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Fetch geolocation and update region
router.get('/:userId/location', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`https://ipinfo.io/json?token=${process.env.IPINFO_TOKEN}`);
    const region = response.data.region; 

    const regionId = regionMapping[region] || null;
    if (regionId) {
      await knex('users').where({ id: req.params.userId }).update({ region: regionId });
      res.json({ message: 'Location updated successfully', region });
    } else {
      res.status(400).json({ error: 'Region not recognized' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Updates FCM token
router.post('/update-fcm-token', authenticate, async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.userId; 

  if (!fcmToken) {
    return res.status(400).json({ message: 'FCM token is required.' });
  }
  
  try {
    await knex('users')
      .where({ id: userId })
      .update({ fcmToken });

    res.status(200).json({ message: 'FCM Token updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating FCM token.' });
  }
});

module.exports = router;