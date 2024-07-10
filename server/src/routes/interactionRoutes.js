const express = require('express');
const router = express.Router();
const knexConfig = require('../../knexfile');

// Initialize Knex
const db = require('knex')(knexConfig.development);

// Record interaction
router.post('/', async (req, res) => {
  const { userId, media_id, interaction, media_type } = req.body;
  try {
    await db('interactions').insert({
      userId,
      media_id,
      interaction,
      media_type
    });
    res.status(200).json({ message: 'Interaction recorded' });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch recommendations (simple example)
router.get('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params; 
  try {
    const results = await db('interactions')
      .select('media_id')
      .count('media_id as likes')
      .where('interaction', 1) 
      .andWhereNot('userId', userId) 
      .groupBy('media_id')
      .orderBy('likes', 'desc') 
      .limit(5); 

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;