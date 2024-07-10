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

// // Function to fetch popular media from TMDB
// const fetchPopularMedia = async () => {
//   const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
//   const response = await axios.get(url);
//   return response.data.results;
// };

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

// Fetch recommendations for a user
router.get('/recommendations/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Fetch user's liked media
      const likedMedia = await db('interactions')
        .select('media_id', 'media_type')
        .where('userId', userId)
        .andWhere('interaction', 1);
  
      let recommendations = [];
  
      // Content-based filtering
      for (let media of likedMedia) {
        const details = await getMediaDetails(media.media_id, media.media_type);
        if (details) {
          const similarMedia = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.media_id}/similar`, {
            params: { api_key: TMDB_API_KEY }
          });
          recommendations.push(...similarMedia.data.results);
        }
      }
  
      // Ensure recommendations are unique and exclude media already liked by the user
      const uniqueRecommendations = recommendations.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.id === item.id
        )) && !likedMedia.some(media => media.media_id === item.id)
      );
  
      // Sort recommendations by popularity or other criteria
      const sortedRecommendations = uniqueRecommendations.sort((a, b) => b.popularity - a.popularity);
  
      // Fallback to popular media if recommendations are insufficient
      if (sortedRecommendations.length < 3) {
        const popularMedia = await db('popular_media').select('*').limit(3 - sortedRecommendations.length);
        sortedRecommendations.push(...popularMedia);
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
