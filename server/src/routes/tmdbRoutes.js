const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;

router.get('/newest', async (req, res) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: 'release_date.desc',
        page: 1
      }
    });

    const movies = response.data.results.slice(0, 3);
    res.json(movies);
  } catch (error) {
    console.error('Error fetching newest movies:', error);
    res.status(500).json({ message: 'Error fetching newest movies' });
  }
});

module.exports = router;