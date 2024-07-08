const express = require('express');
const axios = require('axios');
const router = express.Router();

// TMDb API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Search endpoint
router.get('/search', async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching search results from TMDb:', error);
    res.status(500).json({ message: 'Error fetching search results' });
  }
});

module.exports = router;