const express = require('express');
const router = express.Router();
const knex = require('../config/db');

// Search users by name, username, or email
router.get('/search', async (req, res) => {
  const { query } = req.query;
  
  try {
    const users = await knex('users')
      .where('name', 'like', `%${query}%`)
      .orWhere('username', 'like', `%${query}%`)
      .orWhere('email', 'like', `%${query}%`) 
      .select('id', 'name', 'username', 'avatar', 'email'); 
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

module.exports = router;