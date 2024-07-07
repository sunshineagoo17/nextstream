const User = require("../models/userModel");
const bcrypt = require('bcryptjs');

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
      receiveReminders: user.receiveReminders,
      receiveNotifications: user.receiveNotifications,
      region: user.region
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, username, email, password, receiveReminders, receiveNotifications, region } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (receiveReminders !== undefined) updates.receiveReminders = receiveReminders;
    if (receiveNotifications !== undefined) updates.receiveNotifications = receiveNotifications;
    if (region) updates.region = region;
    if (password) updates.password = await bcrypt.hash(password, 10);

    await User.updateUser(req.user.id, updates);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};