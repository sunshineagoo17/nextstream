const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get person details, images, and combined credits
router.get('/:person_id', async (req, res) => {
  const { person_id } = req.params;

  try {
    // Fetch person details, images, and combined credits concurrently
    const [detailsResponse, imagesResponse, creditsResponse] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/person/${person_id}`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/person/${person_id}/images`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/person/${person_id}/combined_credits`, {
        params: { api_key: TMDB_API_KEY },
      }),
    ]);

    // Send the combined data as a response
    return res.json({
      details: detailsResponse.data,
      images: imagesResponse.data,
      combinedCredits: creditsResponse.data,
    });
  } catch (error) {
    console.error('Error fetching person data:', error.message);
    res.status(500).json({ message: 'Failed to fetch person data' });
  }
});

module.exports = router;