const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to get media details from TMDB
const getMediaDetails = async (mediaId, mediaType) => {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${mediaType} ${mediaId}:`, error);
    return null;
  }
};

// Record interaction
router.post('/', async (req, res) => {
  const { userId, media_id, interaction, media_type } = req.body;
  try {
    console.log('Inserting interaction:', { userId, media_id, interaction, media_type });
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

// Fetch recommendations for a user
router.get('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user's liked media
    const likedMedia = await db('interactions')
      .select('media_id', 'media_type')
      .where('userId', userId)
      .andWhere('interaction', 1);

    // Fetch user's disliked media
    const dislikedMedia = await db('interactions')
      .select('media_id')
      .where('userId', userId)
      .andWhere('interaction', 0);

    // Merge liked and disliked media to avoid recommending them again
    const interactedMediaIds = likedMedia.map(media => media.media_id).concat(dislikedMedia.map(media => media.media_id));

    let recommendations = [];

    // Content-based filtering
    for (let media of likedMedia) {
      const details = await getMediaDetails(media.media_id, media.media_type);
      if (details) {
        const similarMedia = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.media_id}/similar`, {
          params: { api_key: TMDB_API_KEY }
        });
        recommendations.push(...similarMedia.data.results.map(item => ({ ...item, media_type: media.media_type }))); 
      }
    }

    // Ensure recommendations are unique and exclude media already interacted by the user
    const uniqueRecommendations = recommendations.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.id === item.id
      )) && !interactedMediaIds.includes(item.id)
    );

    // Sort recommendations by popularity or other criteria
    const sortedRecommendations = uniqueRecommendations.sort((a, b) => b.popularity - a.popularity);

    // Fallback to popular media if recommendations are insufficient
    if (sortedRecommendations.length < 3) {
      const popularMovies = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
      });
      const popularShows = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
      });

      const popularMedia = [...popularMovies.data.results, ...popularShows.data.results];
      const popularMediaFiltered = popularMedia.filter(media => !interactedMediaIds.includes(media.id));
      sortedRecommendations.push(...popularMediaFiltered.slice(0, 3 - sortedRecommendations.length).map(item => ({
        ...item,
        media_type: item.title ? 'movie' : 'tv'
      }))); // Set media_type based on presence of title
    }

    // Return the top 3 recommendations
    const top3Recommendations = sortedRecommendations.slice(0, 3);

    res.status(200).json(top3Recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;