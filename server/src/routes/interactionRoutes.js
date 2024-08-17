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
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${media_type} ${media_id}:`, error);
    return null;
  }
};

// Record interaction
router.post('/', async (req, res) => {
  const { userId, media_id, interaction, media_type } = req.body;

  if (!media_type) {
    console.error('Media type is missing');
    return res.status(400).json({ error: 'Media type is required' });
  }

  try {
    console.log('Inserting interaction:', { userId, media_id, interaction, media_type });
    await db('interactions').insert({
      userId,
      media_id,
      interaction,
      media_type
    });

    // Record viewed media
    await db('viewed_media').insert({
      userId,
      media_id,
      media_type,
      viewed_at: db.fn.now()
    });

    res.status(200).json({ message: 'Interaction recorded' });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch initial top picks and recommendations for a user
router.get('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user's liked media
    const likedMedia = await db('interactions')
      .select('media_id', 'media_type')
      .where('userId', userId)
      .andWhere('interaction', 1);

    // Fetch user's viewed media
    const viewedMedia = await db('viewed_media')
      .select('media_id', 'media_type')
      .where('userId', userId);

    // Fetch media sent via email
    const sentRecommendations = await db('sent_recommendations')
      .select('recommendationId')
      .where('userId', userId);

    // Merge liked, viewed, and sent media to avoid recommending them again
    const interactedMediaIds = likedMedia.map(media => media.media_id)
      .concat(viewedMedia.map(media => media.media_id))
      .concat(sentRecommendations.map(rec => rec.recommendationId));

    let initialTopPicks = [];
    let recommendations = [];

    // Fetch initial top picks with a balance of movies and shows
    const fetchTopPicks = async (page = 1) => {
      try {
        const popularMoviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });
        const popularShowsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });

        const popularMovies = popularMoviesResponse.data.results
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'movie' }));

        const popularShows = popularShowsResponse.data.results
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'tv' }));

        // Ensure equal balance
        const picksCount = Math.min(3, popularMovies.length, popularShows.length);
        initialTopPicks = [
          ...popularMovies.slice(0, picksCount),
          ...popularShows.slice(0, picksCount)
        ];

        if (initialTopPicks.length < 3) {
          await fetchTopPicks(page + 1);
        }
      } catch (error) {
        console.error('Error fetching top picks:', error);
      }
    };

    await fetchTopPicks();

    // Content-based filtering for recommendations with a balance of movies and shows
    const fetchRecommendations = async (page = 1) => {
      let movieRecommendations = [];
      let showRecommendations = [];

      for (let media of likedMedia) {
        if (!media.media_type) {
          console.error(`Skipping media with null media type for media ID: ${media.media_id}`);
          continue;
        }
        const details = await getMediaDetails(media.media_id, media.media_type);
        if (details) {
          const similarMedia = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.media_id}/similar`, {
            params: { api_key: TMDB_API_KEY }
          });
          const similarItems = similarMedia.data.results.map(item => ({
            ...item,
            media_type: media.media_type
          }));

          if (media.media_type === 'movie') {
            movieRecommendations.push(...similarItems);
          } else if (media.media_type === 'tv') {
            showRecommendations.push(...similarItems);
          }
        }
      }

      // Filter out duplicates and already interacted media
      movieRecommendations = movieRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !interactedMediaIds.includes(item.id)
      );

      showRecommendations = showRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !interactedMediaIds.includes(item.id)
      );

      // Balance the recommendations
      const recommendationsCount = Math.min(2, movieRecommendations.length, showRecommendations.length);
      const finalRecommendations = [
        ...movieRecommendations.slice(0, recommendationsCount),
        ...showRecommendations.slice(0, recommendationsCount)
      ];

      if (finalRecommendations.length < 2 && page <= 2) {
        await fetchRecommendations(page + 1);
      }

      return finalRecommendations;
    };

    const finalRecommendations = await fetchRecommendations();

    console.log('Final Recommendations:', finalRecommendations); // Added logging

    res.status(200).json({
      topPicks: initialTopPicks,
      recommendations: finalRecommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch all interactions for a specific user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { interactionType } = req.query;

  try {
    let query = db('interactions').where('userId', userId);

    if (interactionType !== undefined) {
      query = query.andWhere('interaction', interactionType);
    }

    const interactions = await query;
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Error fetching interactions' });
  }
});

module.exports = router;