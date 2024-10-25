const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const { trainModel, loadModel, predictUserPreference } = require('../models/recommendationModel');

// Function to ensure model is trained before making predictions
const ensureModelTrained = async (userId) => {
  const model = await loadModel();
  if (!model) {
    const trainedModel = await trainModel(userId);
    if (!trainedModel) {
      throw new Error('Model training failed.');
    }
    return trainedModel;
  }
  return model;
};

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
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return null;
  }
};

// Function to apply TensorFlow predictions to media items
const applyTensorFlowPredictions = async (model, mediaItems) => {
  const predictedMedia = await Promise.all(mediaItems.map(async (media) => {
    try {
      const preference = await predictUserPreference(model, media.id, media.media_type);
      return { ...media, preference }; 
    } catch (error) {
      return { ...media, preference: null }; 
    }
  }));
  return predictedMedia;
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

    // Ensure the model is trained before making predictions
    const model = await ensureModelTrained(userId);

    // Content-based filtering: Recursive function to fetch recommendations based on liked media
    const fetchRecommendations = async (page = 1) => {
      let movieRecommendations = [];
      let showRecommendations = [];
    
      // Iterate over the liked media to fetch recommendations
      for (let media of likedMedia) {
        // Ensure the media type is only 'movie' or 'tv'
        if (!media.media_type || (media.media_type !== 'movie' && media.media_type !== 'tv')) {
          continue;  
        }
    
        const details = await getMediaDetails(media.media_id, media.media_type);
        if (details) {
          try {
            const similarMedia = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.media_id}/similar`, {
              params: { api_key: TMDB_API_KEY, language: 'en-US', page }
            });
            const similarItems = similarMedia.data.results.map(item => ({
              ...item,
              media_type: media.media_type,
              genres: details.genres
            }));
    
            // Add recommendations to respective lists based on media type
            if (media.media_type === 'movie') {
              movieRecommendations.push(...similarItems);
            } else if (media.media_type === 'tv') {
              showRecommendations.push(...similarItems);
            }
          } catch (error) {
            console.error(`Error fetching similar media.`);
          }
        }
      }
    
      // Remove duplicates and already interacted/displayed media from recommendations
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
    
      // If fewer than 4 recommendations are found, continue fetching recursively
      if (finalRecommendations.length < 4 && page <= 10) {
        return await fetchRecommendations(page + 1);
      }
    
      return finalRecommendations;
    };    

    let finalRecommendations = await fetchRecommendations();

    if (finalRecommendations.length === 0) {

      const fetchFallbackMedia = async () => {
        try {
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
        } catch (error) {
          return [];
        }
      };

      finalRecommendations = await fetchFallbackMedia();
    }

    // Apply TensorFlow predictions to the final recommendations
    const predictedRecommendations = await applyTensorFlowPredictions(model, finalRecommendations);

    // Store the IDs of the recommendations in the session
    req.session.displayedMedia.push(...finalRecommendations.map(item => item.id));

    res.status(200).json({
      recommendations: predictedRecommendations
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;