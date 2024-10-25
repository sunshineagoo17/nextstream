const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const authenticate = require('../middleware/authenticate');
const guestAuthenticate = require('../middleware/guestAuthenticate');
const { loadModel, trainModel, predictUserPreference } = require('../models/recommendationModel');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware to handle authentication for both users and guests
const handleAuthentication = (req, res, next) => {
  const token = req.cookies.token || req.cookies.guestToken;
  if (token) {
    if (req.cookies.token) {
      authenticate(req, res, next);
    } else if (req.cookies.guestToken) {
      guestAuthenticate(req, res, next);
    }
  } else {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
};

// Function to get media details from TMDB using the media ID and type
const getMediaDetails = async (media_id, media_type) => {
  try {
    // Check if media_type is not 'person' since 'person' doesn't have genres
    if (media_type === 'person') {
      return null;
    }

    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);

    const { genres = [], runtime, episode_run_time = [], ...otherData } = response.data;

    // Calculate duration based on media type (runtime for movies, episode_run_time for TV shows)
    const duration = media_type === 'movie' ? runtime : (episode_run_time.length > 0 ? episode_run_time[0] : null);

    return {
      ...otherData,
      genres: genres.map(genre => genre.name),
      duration,  
    };
  } catch (error) {
    return null;
  }
};

// Function to get trailers and other videos (featurette, teaser, etc.)
const getMediaTrailer = async (media_id, media_type) => {
  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}/videos?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);

    const videoTypesChecked = [];
    let video = response.data.results.find(video => {
      videoTypesChecked.push('YouTube Trailer');
      return video.type === 'Trailer' && video.site === 'YouTube';
    });

    if (!video) {
      video = response.data.results.find(video => {
        videoTypesChecked.push('Featurette');
        return video.type === 'Featurette' && (video.site === 'YouTube' || video.site === 'Vimeo');
      });
    }

    if (!video) {
      video = response.data.results.find(video => {
        videoTypesChecked.push('Teaser');
        return video.type === 'Teaser' && (video.site === 'YouTube' || video.site === 'Vimeo');
      });
    }

    if (!video) {
      video = response.data.results.find(video => {
        videoTypesChecked.push('Opening Scene');
        return video.type === 'Opening Scene' && (video.site === 'YouTube' || video.site === 'Vimeo');
      });
    }

    if (!video) {
      video = response.data.results.find(video => {
        videoTypesChecked.push('Opening Credits');
        return video.type === 'Opening Credits' && (video.site === 'YouTube' || video.site === 'Vimeo');
      });
    }

    if (video) {
      const embedUrl = video.site === 'YouTube'
        ? `https://www.youtube.com/embed/${video.key}`
        : `https://player.vimeo.com/video/${video.key}`;
      return embedUrl;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Route to record or update a user's interaction with a media item
router.post('/', handleAuthentication, async (req, res) => {
  const { media_id, interaction, media_type } = req.body;
  const userId = req.user.userId;

  if (!media_type) {
    return res.status(400).json({ error: 'Media type is required' });
  }

  try {
    // Check if the interaction already exists
    const existingInteraction = await db('interactions')
      .where({ userId, media_id, media_type })
      .first();

    if (existingInteraction) {
      // Update the existing interaction
      await db('interactions')
        .where({ userId, media_id, media_type })
        .update({ interaction });
    } else {
      // Insert a new interaction
      await db('interactions').insert({
        userId,
        media_id,
        interaction,
        media_type
      });
    }

    // If the interaction is a like (1), update or insert into `media_statuses`
    if (interaction === 1) {
      const mediaDetails = await getMediaDetails(media_id, media_type);
      if (!mediaDetails) {
        return res.status(500).json({ message: 'Failed to fetch media details.' });
      }
      
      // Destructure fields from the API response
      const { title, name, poster_path, overview, release_date, genres, duration } = mediaDetails;
      
      // Handle media title depending on whether it's a movie or a TV show
      const mediaTitle = title || name || 'Untitled'; 

      await db('media_statuses')
        .insert({
          userId,
          media_id,
          status: 'to_watch',
          title: mediaTitle, 
          poster_path,
          overview,
          release_date: release_date || null,  
          genre: genres.join(', '),
          duration: duration || null,  
          media_type
        })
        .onConflict(['userId', 'media_id'])  
        .merge({ status: 'to_watch' });
    }

    await db('viewed_media').insert({
      userId,
      media_id,
      media_type,
      viewed_at: db.fn.now()
    });

    await trainModel(userId);
    res.status(200).json({ message: 'Interaction recorded and media status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch initial top picks for a user or guest
router.get('/toppicks/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.role === 'guest' ? null : req.user.userId;

  try {
    // For guests, simply fetch popular movies and shows
    if (!userId) {
      const popularMoviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
      });
      const popularShowsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
      });

      const topPicks = [
        ...popularMoviesResponse.data.results.map(item => ({ ...item, media_type: 'movie' })),
        ...popularShowsResponse.data.results.map(item => ({ ...item, media_type: 'tv' }))
      ];

      return res.status(200).json({ topPicks });
    }

    // For authenticated users, fetch the user's liked, viewed, and sent media to avoid duplicates in top picks
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

    // Combine all interacted media IDs to filter them out from top picks
    const interactedMediaIds = likedMedia.map(media => media.media_id)
      .concat(viewedMedia.map(media => media.media_id))
      .concat(sentRecommendations.map(rec => rec.recommendationId));

    let initialTopPicks = [];

    // Recursive function to fetch popular movies and shows until a balance is found
    const fetchTopPicks = async (page = 1) => {
      try {
        const popularMoviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });
        const popularShowsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });

        // Filter out already interacted media and add media type to the objects
        const popularMovies = popularMoviesResponse.data.results
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'movie' }));

        const popularShows = popularShowsResponse.data.results
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'tv' }));

        // Ensure equal balance between movies and shows in top picks
        const picksCount = Math.min(4, popularMovies.length, popularShows.length);
        initialTopPicks = [
          ...popularMovies.slice(0, picksCount),
          ...popularShows.slice(0, picksCount)
        ];

        // If there aren't enough picks, fetch the next page
        if (initialTopPicks.length < 4) {
          await fetchTopPicks(page + 1);
        }
      } catch (error) {
      }
    };

    await fetchTopPicks();

    // Fetch detailed information for each top pick to include genres
    const detailedTopPicks = await Promise.all(
      initialTopPicks.map(async (item) => {
        const details = await getMediaDetails(item.id, item.media_type);
        return {
          ...item,
          genres: details ? details.genres : []
        };
      })
    );

    res.status(200).json({ topPicks: detailedTopPicks });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to make TensorFlow predictions on user preferences
const makePrediction = async (model, media) => {
  const preference = await predictUserPreference(model, media.media_id, media.media_type);
  return { ...media, preference };
};

// Fetch user's liked, viewed, and sent media to avoid recommending them again
router.get('/recommendations/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.userId;

  try {
    const likedMedia = await db('interactions').select('media_id', 'media_type').where('userId', userId).andWhere('interaction', 1);
    const viewedMedia = await db('viewed_media').select('media_id', 'media_type').where('userId', userId);
    const sentRecommendations = await db('sent_recommendations').select('recommendationId').where('userId', userId);

    const interactedMediaIds = likedMedia.map(media => media.media_id)
      .concat(viewedMedia.map(media => media.media_id))
      .concat(sentRecommendations.map(rec => rec.recommendationId));

    let model = await loadModel(userId);
    if (!model) {
      model = await trainModel(userId);
      if (!model) {
        return res.status(500).json({ message: 'Failed to train and load the TensorFlow model.' });
      }
    }

    let recommendations = [];

    // Recursive function to fetch similar media from TMDB based on liked media
    const fetchRecommendations = async (page = 1) => {
      let movieRecommendations = [];
      let showRecommendations = [];

      // For each liked media, fetch similar media from TMDB
      for (let media of likedMedia) {
        if (!media.media_type) {
          continue;
        }
        const details = await getMediaDetails(media.media_id, media.media_type);
        if (details) {
          const similarMedia = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.media_id}/similar`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US' }
          });
          const similarItems = similarMedia.data.results.map(item => ({
            ...item, media_type: media.media_type, genres: details.genres
          }));

          // Separate by media type
          if (media.media_type === 'movie') {
            movieRecommendations.push(...similarItems);
          } else if (media.media_type === 'tv') {
            showRecommendations.push(...similarItems);
          }
        }
      }

      // Remove duplicates and already interacted media
      movieRecommendations = movieRecommendations.filter(item => !interactedMediaIds.includes(item.id));
      showRecommendations = showRecommendations.filter(item => !interactedMediaIds.includes(item.id));

      // Balance between movies and shows
      const recommendationsCount = Math.min(2, movieRecommendations.length, showRecommendations.length);
      recommendations = [...movieRecommendations.slice(0, recommendationsCount), ...showRecommendations.slice(0, recommendationsCount)];

      // If not enough recommendations, fetch next page
      if (recommendations.length < 4 && page <= 2) {
        await fetchRecommendations(page + 1);
      }

      return recommendations;
    };

    // Fetch recommendations from TMDB
    let finalRecommendations = await fetchRecommendations();

    // Apply TensorFlow predictions to each recommended media item
    finalRecommendations = await Promise.all(finalRecommendations.map(async (media) => await makePrediction(model, media)));

    // Fallback to popular media if no recommendations found
    if (finalRecommendations.length === 0) {
      const fetchFallbackMedia = async () => {
        const popularMoviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
        });
        const popularShowsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
          params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
        });
        return [
          ...popularMoviesResponse.data.results.slice(0, 2).map(item => ({ ...item, media_type: 'movie' })),
          ...popularShowsResponse.data.results.slice(0, 2).map(item => ({ ...item, media_type: 'tv' }))
        ];
      };

      finalRecommendations = await fetchFallbackMedia();
    }

    res.status(200).json({ recommendations: finalRecommendations });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch all interactions for a specific user, optionally filtered by interaction type
router.get('/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.role === 'guest' ? null : req.user.userId;
  const { interactionType } = req.query;

  try {
    // If the user is a guest, return an empty array since they don't have interactions
    if (!userId) {
      return res.status(200).json([]);
    }

    // Build the query to fetch interactions based on userId and optional interactionType for authenticated users
    let query = db('interactions').where('userId', userId);

    if (interactionType !== undefined) {
      query = query.andWhere('interaction', interactionType);
    }

    const interactions = await query;
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching interactions' });
  }
});

// Example route using getMediaTrailer
router.get('/:userId/trailer/:media_type/:media_id', handleAuthentication, async (req, res) => {
  try {
    const { media_type, media_id } = req.params;
    const trailerUrl = await getMediaTrailer(media_id, media_type);

    if (!trailerUrl) {
      return res.status(404).json({ error: 'Apologies, no trailer is available.' });
    }

    res.json({ trailerUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching video' });
  }
});

module.exports = router;