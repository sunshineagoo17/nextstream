const express = require('express');
const router = express.Router();
const knexConfig = require('../../knexfile');

// Initialize Knex
const db = require('knex')(knexConfig.development);

// Record interaction
router.post('/', async (req, res) => {
  const { user_id, media_id, interaction, media_type } = req.body;
  try {
    await db('interactions').insert({
      user_id,
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
router.get('/recommendations/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const results = await db('interactions')
      .select('media_id')
      .count('media_id as likes')
      .where('interaction', 1)
      .andWhereNot('user_id', user_id)
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