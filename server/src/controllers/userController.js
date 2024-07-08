const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directory to save the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter 
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
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

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

    await User.deleteUser(req.user.id);
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile: [upload.single('avatar'), updateProfile], // Use multer middleware to handle file uploads
  deleteUser
};