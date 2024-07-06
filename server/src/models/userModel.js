const db = require('../config/db');
const bcrypt = require('bcrypt');

// Get all users (for testing purposes, not to be exposed in the final API)
const getAllUsers = () => {
    return db('users').select('*');
};

// Get a user by email
const getUserByEmail = (email) => {
    return db('users').where({ email }).first();
};

// Get a user by ID
const getUserById = (id) => {
    return db('users').where({ id }).first();
};

// Create a new user
const createUser = async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [id] = await db('users').insert({
        username: user.username,
        email: user.email,
        password: hashedPassword,
    });
    return getUserById(id);
};

// Update a user's profile
const updateUser = async (id, user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    return db('users')
        .where({ id })
        .update(user);
};

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
};
