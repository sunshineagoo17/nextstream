const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to get media details from TMDB
const getMediaDetails = async (media_id, media_type) => {
  if (!media_type) {
    console.error(`Media type is missing for media ID: ${media_id}`);
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await axios.get(url);
    const { title, name, overview, poster_path, genres } = response.data;
    return {
      media_id,
      title: title || name,
      overview,
      poster_path,
      genres: genres.map(genre => genre.name),
      media_type
    };
  } catch (error) {
    console.error(`Error fetching details for ${media_type} ${media_id}:`, error);
    return null;
  }
};

// Fetch user's favorite interactions
router.get('/:userId/faves', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch the first 10 interactions with 'like' status (assuming interaction value for likes is 1)
    const faves = await db('interactions')
      .where({ userId, interaction: 1 })
      .limit(10) // Limit to first 10
      .select('media_id', 'media_type'); // Select relevant fields

    // Fetch details for the liked media items
    const mediaDetails = await Promise.all(faves.map(async (fave) => {
      const details = await getMediaDetails(fave.media_id, fave.media_type);
      return details;
    }));

    // Filter out any null results
    const filteredMediaDetails = mediaDetails.filter(detail => detail !== null);

    res.json(filteredMediaDetails);
  } catch (error) {
    console.error('Error fetching favorite movies/shows:', error);
    res.status(500).json({ error: 'Error fetching favorite movies/shows' });
  }
});

module.exports = router;