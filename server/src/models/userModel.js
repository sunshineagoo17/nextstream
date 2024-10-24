const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users (for testing purposes, not to be exposed in the final API)
const getAllUsers = async () => {
    try {
        return await db('users').select('*');
    } catch (error) {
        throw error;
    }
};

// Get a user by email
const getUserByEmail = async (email) => {
    try {
        return await db('users').where({ email }).first();
    } catch (error) {
        throw error;
    }
};

// Get a user by ID
const getUserById = async (id) => {
    try {
        return await db('users').where({ id }).first();
    } catch (error) {
        throw error;
    }
};

// Create a new user
const createUser = async (user) => {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const [id] = await db('users').insert({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            receiveReminders: user.receiveReminders !== undefined ? user.receiveReminders : true,
            receiveNotifications: user.receiveNotifications !== undefined ? user.receiveNotifications : true,
            region: user.region,
            isSubscribed: user.isSubscribed !== undefined ? user.isSubscribed : true,
            isActive: user.isActive !== undefined ? user.isActive : true, 
            avatar: user.avatar || null 
        });
        return getUserById(id);
    } catch (error) {
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
        throw error;
    }
};

// Delete a user's profile
const deleteUser = async (id) => {
    try {
        await db('users')
            .where({ id })
            .del();
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
