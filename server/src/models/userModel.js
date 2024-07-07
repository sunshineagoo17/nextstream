const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users (for testing purposes, not to be exposed in the final API)
const getAllUsers = async () => {
    try {
        return await db('users').select('*');
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
};

// Get a user by email
const getUserByEmail = async (email) => {
    try {
        return await db('users').where({ email }).first();
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
};

// Get a user by ID
const getUserById = async (id) => {
    try {
        return await db('users').where({ id }).first();
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error;
    }
};

// Create a new user
const createUser = async (user) => {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const [id] = await db('users').insert({
            name: user.name,
            username: user.username,
            email: user.email,
            password: hashedPassword,
            receiveReminders: user.receiveReminders || false,
            receiveNotifications: user.receiveNotifications || false,
            region: user.region || ''
        });
        return getUserById(id);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Update a user's profile
const updateUser = async (id, user) => {
    try {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }
        await db('users')
            .where({ id })
            .update(user);
        return getUserById(id);
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
};