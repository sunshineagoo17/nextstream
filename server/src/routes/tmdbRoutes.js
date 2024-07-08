const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Endpoint to get the latest movies and shows
router.get('/new-releases', async (req, res) => {
  try {
    // Fetch the latest movies
    const moviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });

    // Fetch the latest TV shows
    const showsResponse = await axios.get(`${TMDB_BASE_URL}/tv/on_the_air`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });

    // Combine the results and sort by release date
    const combinedResults = [...moviesResponse.data.results, ...showsResponse.data.results];
    combinedResults.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));

    // Send the first 3 results
    res.json({ results: combinedResults.slice(0, 3) });
  } catch (error) {
    console.error('Error fetching new releases:', error);
    res.status(500).json({ message: 'Error fetching new releases' });
  }
});

module.exports = router;