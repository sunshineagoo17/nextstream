const express = require('express');
const axios = require('axios');
const router = express.Router();
const NodeCache = require('node-cache');
const cron = require('node-cron');
require('dotenv').config();

const cache = new NodeCache({ stdTTL: 3600 }); 

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Streaming providers to filter by
const STREAMING_PROVIDERS = ['Amazon Prime Video', 'Apple TV Plus', 'Netflix', 'Crave', 'Disney Plus'];

// Function to get the watch providers
const getWatchProviders = async (mediaType, mediaId) => {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data.results?.CA?.flatrate || [];
  } catch (error) {
    console.error(`Error fetching watch providers for ${mediaType} ${mediaId}:`, error);
    return [];
  }
};

// Function to fetch and cache popular movies and shows
const fetchPopularReleases = async () => {
  try {
    const moviesResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        region: 'CA',
        page: 1
      }
    });

    const showsResponse = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        region: 'CA',
        page: 1
      }
    });

    const movies = moviesResponse.data.results;
    const shows = showsResponse.data.results;

    const streamingMovies = [];
    const streamingShows = [];

    // Filter movies
    for (const movie of movies) {
      const providers = await getWatchProviders('movie', movie.id);
      if (providers.some(provider => STREAMING_PROVIDERS.includes(provider.provider_name))) {
        streamingMovies.push({ ...movie, media_type: 'movie', providers });
      }
      if (streamingMovies.length === 3) break; // Stop once we have 3 movies
    }

    // Filter shows
    for (const show of shows) {
      const providers = await getWatchProviders('tv', show.id);
      if (providers.some(provider => STREAMING_PROVIDERS.includes(provider.provider_name))) {
        streamingShows.push({ ...show, media_type: 'tv', providers });
      }
      if (streamingShows.length === 3) break; // Stop once we have 3 shows
    }

    // Ensure we have 3 movies and 3 shows
    while (streamingMovies.length < 3 && movies.length > streamingMovies.length) {
      const movie = movies[streamingMovies.length];
      const providers = await getWatchProviders('movie', movie.id);
      if (providers.some(provider => STREAMING_PROVIDERS.includes(provider.provider_name))) {
        streamingMovies.push({ ...movie, media_type: 'movie', providers });
      }
    }

    while (streamingShows.length < 3 && shows.length > streamingShows.length) {
      const show = shows[streamingShows.length];
      const providers = await getWatchProviders('tv', show.id);
      if (providers.some(provider => STREAMING_PROVIDERS.includes(provider.provider_name))) {
        streamingShows.push({ ...show, media_type: 'tv', providers });
      }
    }

    const popularReleases = [...streamingMovies, ...streamingShows].map(item => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: item.media_type,
      url: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
      providers: item.providers.map(provider => provider.provider_name)
    }));

    // Cache the results
    cache.set('popularReleases', popularReleases);
  } catch (error) {
    console.error('Error fetching popular releases:', error);
  }
};

// Schedule the fetching task every hour
cron.schedule('0 * * * *', fetchPopularReleases);

// Fetch popular releases initially on server start
fetchPopularReleases();

// Endpoint to get the popular movies and shows
router.get('/popular', async (req, res) => {
  const popularReleases = cache.get('popularReleases');

  if (popularReleases) {
    res.json({ results: popularReleases });
  } else {
    res.status(500).json({ message: 'Popular releases not available at the moment. Please try again later.' });
  }
});

// Endpoint to search for movies and TV shows
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ message: 'Error fetching search results' });
  }
});

// Endpoint to fetch image based on poster_path
router.get('/image/:posterPath', async (req, res) => {
  const { posterPath } = req.params;
  try {
    const imageUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error fetching image URL:', error);
    res.status(500).json({ message: 'Error fetching image URL' });
  }
});

module.exports = router;