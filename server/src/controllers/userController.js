const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log(`Registering user: ${username}, ${email}`);
        const existingUser = await User.getByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const user = await User.create({ username, email, password });
        console.log(`User created: ${user}`);
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`Token generated: ${token}`);
        res.status(201).json({ token, email, username });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

// Log in a user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Logging in user: ${email}`);
        const user = await User.getByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`Token generated: ${token}`);
        res.json({ token, email: user.email, username: user.username });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

// Get the profile of the logged-in user
const getProfile = async (req, res) => {
    try {
        const user = await User.getById(req.user.id);
        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            userId: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Error fetching user profile', error: err.message });
    }
};

// Update the profile of the logged-in user
const updateProfile = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (password) updates.password = await bcrypt.hash(password, 10);

        await User.update(req.user.id, updates);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
};