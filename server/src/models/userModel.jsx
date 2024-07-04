const db = require('../config/db');
const bcrypt = require('bcrypt');

// Get all users (for testing purposes, not to be exposed in the final API)
const getAll = () => {
    return db('users').select('*');
};

// Get a user by email
const getByEmail = (email) => {
    return db('users').where({ email }).first();
};

// Get a user by ID
const getById = (id) => {
    return db('users').where({ id }).first();
};

// Create a new user
const create = async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return db('users').insert({
        username: user.username,
        email: user.email,
        password: hashedPassword,
    });
};

// Update a user's profile
const update = (id, user) => {
    return db('users')
        .where({ id })
        .update(user);
};

module.exports = {
    getAll,
    getByEmail,
    getById,
    create,
    update,
};