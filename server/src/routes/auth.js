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
        
        // Insert user data into the 'users' table
        await knex('users').insert({ name, username, email, password: hashedPassword }); 
        
        // Respond with success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        // Handle registration error
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user', error });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Retrieve user from 'users' table based on email
        const user = await knex('users').where({ email }).first();
        
        // If no user found or password doesn't match, return unauthorized
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Generate JWT token with userId payload
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Set cookie with token (optional based on your application's needs)
        res.cookie('token', token, { httpOnly: true });
        
        // Respond with success message and token
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        // Handle login error
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
});

module.exports = router;