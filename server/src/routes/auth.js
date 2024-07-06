const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../config/db');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [userId] = await knex('users').insert({
            name,
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ success: true, message: 'User registered successfully', token });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Error registering user', error });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt with email:', email);

        const user = await knex('users').where({ email }).first();

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        console.log('User found:', user);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('Invalid password');
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });

        console.log('Login successful');
        res.json({ success: true, message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Error logging in', error });
    }
});

module.exports = router;