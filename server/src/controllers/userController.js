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
      receiveReminders: user.receiveReminders !== undefined ? user.receiveReminders : true,
      receiveNotifications: user.receiveNotifications !== undefined ? user.receiveNotifications : true,
      region: user.region,
      isSubscribed: user.isSubscribed !== undefined ? user.isSubscribed : true,
      isActive: user.isActive !== undefined ? user.isActive : true 
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
    if (email) updates.email = email;
    if (receiveReminders !== undefined) updates.receiveReminders = receiveReminders;
    if (receiveNotifications !== undefined) updates.receiveNotifications = receiveNotifications;
    if (region) updates.region = region;
    if (isSubscribed !== undefined) updates.isSubscribed = isSubscribed;
    if (isActive !== undefined) updates.isActive = isActive; 
    if (password) updates.password = await bcrypt.hash(password, 10);

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
  updateProfile,
  deleteUser
};