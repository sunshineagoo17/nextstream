const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, SVG, WEBP, BMP, and TIFF are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      userId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      receiveReminders: user.receiveReminders !== undefined ? user.receiveReminders : true,
      receiveNotifications: user.receiveNotifications !== undefined ? user.receiveNotifications : true,
      region: user.region,
      isSubscribed: user.isSubscribed !== undefined ? user.isSubscribed : true,
      isActive: user.isActive !== undefined ? user.isActive : true,
      avatar: user.avatar || null 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, username, email, password, receiveReminders, receiveNotifications, region, isSubscribed, isActive } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) {
      // Check if the email is already taken
      const existingUser = await User.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
      updates.email = email;
    }
    if (receiveReminders !== undefined) updates.receiveReminders = receiveReminders;
    if (receiveNotifications !== undefined) updates.receiveNotifications = receiveNotifications;
    if (region) updates.region = region;
    if (isSubscribed !== undefined) updates.isSubscribed = isSubscribed;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar if a new one is uploaded
    const user = await User.getUserById(req.user.id);
    if (user.avatar && req.file) {
      fs.unlink(path.join(__dirname, '..', user.avatar), (err) => {
        if (err) {
          console.error('Error deleting old avatar:', err);
        }
      });
    }

    await User.updateUser(req.user.id, updates);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// Delete user profile
const deleteUser = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user avatar if it exists
    if (user.avatar) {
      fs.unlink(path.join(__dirname, '..', user.avatar), (err) => {
        if (err) {
          console.error('Error deleting user avatar:', err);
        }
      });
    }

    await User.deleteUser(req.user.id);
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile: [upload.single('avatar'), updateProfile], 
  deleteUser
};
