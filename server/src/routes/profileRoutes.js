const express = require('express');
const authenticate = require('../middleware/authenticate'); 
const knex = require('../config/db');
const router = express.Router();

// Get user profile
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.params.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: user.id, name: user.name, username: user.username, email: user.email });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router;