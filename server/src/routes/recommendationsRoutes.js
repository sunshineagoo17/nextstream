const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware to initialize session data if it doesn't exist
router.use((req, res, next) => {
  if (!req.session.displayedMedia) {
    req.session.displayedMedia = [];
  }
  next();
});

// Function to get media details from TMDB using the media ID and type
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

// Route to fetch unique recommendations for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user's liked, viewed, and sent media to avoid recommending them again
    const likedMedia = await db('interactions')
      .select('media_id', 'media_type')
      .where('userId', userId)
      .andWhere('interaction', 1);

    const viewedMedia = await db('viewed_media')
      .select('media_id', 'media_type')
      .where('userId', userId);

    const sentRecommendations = await db('sent_recommendations')
      .select('recommendationId')
      .where('userId', userId);

    // Combine all interacted media IDs to filter them out from recommendations
    const interactedMediaIds = likedMedia.map(media => media.media_id)
      .concat(viewedMedia.map(media => media.media_id))
      .concat(sentRecommendations.map(rec => rec.recommendationId));

    // Add previously displayed media from session to the exclusion list
    const exclusionList = [...interactedMediaIds, ...req.session.displayedMedia];

    let recommendations = [];

    // Content-based filtering: Recursive function to fetch recommendations based on liked media
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
            params: { api_key: TMDB_API_KEY, language: 'en-US' }
          });
          const similarItems = similarMedia.data.results.map(item => ({
            ...item,
            media_type: media.media_type,
            genres: details.genres
          }));

          if (media.media_type === 'movie') {
            movieRecommendations.push(...similarItems);
          } else if (media.media_type === 'tv') {
            showRecommendations.push(...similarItems);
          }
        }
      }

      // Remove duplicates and already interacted or displayed media from recommendations
      movieRecommendations = movieRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !exclusionList.includes(item.id)
      );

      showRecommendations = showRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !exclusionList.includes(item.id)
      );

      const recommendationsCount = Math.min(2, movieRecommendations.length, showRecommendations.length);
      const finalRecommendations = [
        ...movieRecommendations.slice(0, recommendationsCount),
        ...showRecommendations.slice(0, recommendationsCount)
      ];

      if (finalRecommendations.length < 4 && page <= 10) {
        return await fetchRecommendations(page + 1);
      }

      return finalRecommendations;
    };

    let finalRecommendations = await fetchRecommendations();

    if (finalRecommendations.length === 0) {
      console.log('No recommendations found. Falling back to popular media.');

      const fetchFallbackMedia = async () => {
        const popularMoviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
        });
        const popularShowsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
        });

        const popularMovies = popularMoviesResponse.data.results
          .filter(media => !exclusionList.includes(media.id))
          .map(item => ({ ...item, media_type: 'movie' }));

        const popularShows = popularShowsResponse.data.results
          .filter(media => !exclusionList.includes(media.id))
          .map(item => ({ ...item, media_type: 'tv' }));

        return [
          ...popularMovies.slice(0, 2),
          ...popularShows.slice(0, 2)
        ];
      };

      finalRecommendations = await fetchFallbackMedia();
    }

    // Store the IDs of the recommendations in the session
    req.session.displayedMedia.push(...finalRecommendations.map(item => item.id));

    res.status(200).json({
      recommendations: finalRecommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;