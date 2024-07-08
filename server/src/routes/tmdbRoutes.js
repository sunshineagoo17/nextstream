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

    // Send the first 6 results
    const newReleases = combinedResults.slice(0, 6).map(item => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'), // Determine media type if not provided
      url: `https://www.themoviedb.org/${item.title ? 'movie' : 'tv'}/${item.id}`
    }));

    res.json({ results: newReleases });
  } catch (error) {
    console.error('Error fetching new releases:', error);
    res.status(500).json({ message: 'Error fetching new releases' });
  }
});

module.exports = router;
