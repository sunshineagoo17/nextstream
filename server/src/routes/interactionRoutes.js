const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const authenticate = require('../middleware/authenticate');
const guestAuthenticate = require('../middleware/guestAuthenticate');
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
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    const { genres, ...otherData } = response.data;
    return {
      ...otherData,
      genres: genres.map(genre => genre.name)
    };
  } catch (error) {
    console.error('Error fetching media details:', error);
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
      console.log(`No video found. Types checked: ${videoTypesChecked.join(', ')}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching video for ${media_type} ${media_id}:`, error);
    return null;
  }
};

// Route to record or update a user's interaction with a media item
router.post('/', handleAuthentication, async (req, res) => {
  const { media_id, interaction, media_type } = req.body;
  const userId = req.user.userId;

  if (!media_type) {
    console.error('Media type is missing');
    return res.status(400).json({ error: 'Media type is required' });
  }

  try {
    console.log('Recording interaction:', { userId, media_id, interaction, media_type });

    // Check if the interaction already exists
    const existingInteraction = await db('interactions')
      .where({ userId, media_id, media_type })
      .first();

    if (existingInteraction) {
      // Update the existing interaction
      await db('interactions')
        .where({ userId, media_id, media_type })
        .update({ interaction });

      console.log('Interaction updated');
    } else {
      // Insert a new interaction
      await db('interactions').insert({
        userId,
        media_id,
        interaction,
        media_type
      });

      console.log('Interaction inserted');
    }

    // Record the viewed media in the 'viewed_media' table if necessary
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

// Fetch initial top picks for a user or guest
router.get('/toppicks/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.userId;

  try {
    // Fetch the user's liked, viewed, and sent media to avoid duplicates in top picks
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
        console.error('Error fetching top picks:', error);
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

    res.status(200).json({
      topPicks: detailedTopPicks
    });
  } catch (error) {
    console.error('Error fetching top picks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch user's liked, viewed, and sent media to avoid recommending them again
router.get('/recommendations/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.userId;

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

    // Combine all interacted media IDs to filter them out from recommendations
    const interactedMediaIds = likedMedia.map(media => media.media_id)
      .concat(viewedMedia.map(media => media.media_id))
      .concat(sentRecommendations.map(rec => rec.recommendationId));

    let recommendations = [];

    // Content-based filtering: Recursive function to fetch recommendations based on liked media
    const fetchRecommendations = async (page = 1) => {
      let movieRecommendations = [];
      let showRecommendations = [];

      // For each liked media, fetch similar media from TMDB
      for (let media of likedMedia) {
        if (!media.media_type) {
          console.error(`Skipping media with null media type for media ID: ${media.media_id}`);
          continue;
        }

        // Fetch detailed media information, including genres
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

          // Separate recommendations by media type
          if (media.media_type === 'movie') {
            movieRecommendations.push(...similarItems);
          } else if (media.media_type === 'tv') {
            showRecommendations.push(...similarItems);
          }
        }
      }

      // Remove duplicates and already interacted media from recommendations
      movieRecommendations = movieRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !interactedMediaIds.includes(item.id)
      );

      showRecommendations = showRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id) && !interactedMediaIds.includes(item.id)
      );

      // Balance the recommendations with equal movies and shows
      const recommendationsCount = Math.min(2, movieRecommendations.length, showRecommendations.length);
      const finalRecommendations = [
        ...movieRecommendations.slice(0, recommendationsCount),
        ...showRecommendations.slice(0, recommendationsCount)
      ];

      // If not enough recommendations, fetch the next page
      if (finalRecommendations.length < 4 && page <= 2) {
        return await fetchRecommendations(page + 1);
      }

      return finalRecommendations;
    };

    let finalRecommendations = await fetchRecommendations();

    // Fallback to popular media if no recommendations were found
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
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'movie' }));

        const popularShows = popularShowsResponse.data.results
          .filter(media => !interactedMediaIds.includes(media.id))
          .map(item => ({ ...item, media_type: 'tv' }));

        return [
          ...popularMovies.slice(0, 2),
          ...popularShows.slice(0, 2)
        ];
      };

      finalRecommendations = await fetchFallbackMedia();
    }

    res.status(200).json({
      recommendations: finalRecommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch all interactions for a specific user, optionally filtered by interaction type
router.get('/:userId', handleAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const { interactionType } = req.query;

  try {
    // Build the query to fetch interactions based on userId and optional interactionType
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
    console.error(`Error fetching video for ${media_type} ${media_id}:`, error);
    res.status(500).json({ error: 'Error fetching video' });
  }
});

module.exports = router;