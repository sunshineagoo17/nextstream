const express = require('express');
const axios = require('axios');
const router = express.Router();
const NodeCache = require('node-cache');
const cron = require('node-cron');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
require('dotenv').config();

const cache = new NodeCache({ stdTTL: 3600 });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const STREAMING_PROVIDERS = [
  'Amazon Prime Video',
  'Apple TV Plus',
  'Netflix',
  'Crave',
  'Disney Plus',
  'Hulu',
  'HBO Max',
  'Paramount Plus',
  'Peacock',
  'CBC Gem',
  'CTV',
  'Global TV',
  'Sundance Now',
  'Acorn TV',
  'BritBox',
  'Crackle',
  'Starz',
  'Showtime',
  'Tubi'
];

// Function to get the watch providers
const getWatchProviders = async (mediaType, mediaId) => {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data.results?.CA?.flatrate || [];
  } catch (error) {
    console.error(`Error fetching watch providers for ${mediaType} ${mediaId}:`, error.message);
    return [];
  }
};

// Function to fetch popular movies and shows, handling pagination
const fetchPopularReleases = async () => {
  try {
    console.log('Fetching popular releases...');
    
    const fetchAllPages = async (mediaType) => {
      let results = [];
      let page = 1;
      let totalPages = 1;

      while (results.length < 50 && page <= totalPages) {
        const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/popular`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
            region: 'CA',
            page: page
          }
        });

        if (response.data) {
          totalPages = response.data.total_pages;
          results = results.concat(response.data.results);
          page++;
        }
      }

      return results;
    };

    const movies = await fetchAllPages('movie');
    const shows = await fetchAllPages('tv');

    console.log('Total shows fetched:', shows.length);

    let streamingMovies = [];
    let streamingShows = [];

    // Filter movies by streaming providers
    for (const movie of movies) {
      const providers = await getWatchProviders('movie', movie.id);
      if (providers.some(provider => STREAMING_PROVIDERS.includes(provider.provider_name))) {
        streamingMovies.push({ ...movie, media_type: 'movie', providers });
      }
    }

    // Include all English-language shows without filtering by streaming providers
    for (const show of shows) {
      if (show.original_language === 'en') {
        streamingShows.push({ ...show, media_type: 'tv' });
      }
    }

    console.log('Shows after filtering by language only:', streamingShows.length);

    // Ensure at least 6 movies and 6 shows are selected
    streamingMovies = streamingMovies.slice(0, 6);
    streamingShows = streamingShows.slice(0, 6);

    // If there aren't enough movies, backfill without filtering providers
    if (streamingMovies.length < 6) {
      streamingMovies = streamingMovies.concat(
        movies.filter(movie => !streamingMovies.some(m => m.id === movie.id)).slice(0, 6 - streamingMovies.length).map(movie => ({ ...movie, media_type: 'movie', providers: [] }))
      );
    }

    // If there aren't enough shows, backfill without filtering providers
    if (streamingShows.length < 6) {
      streamingShows = streamingShows.concat(
        shows.filter(show => show.original_language === 'en' && !streamingShows.some(s => s.id === show.id)).slice(0, 6 - streamingShows.length).map(show => ({ ...show, media_type: 'tv' }))
      );
    }

    const popularReleases = [...streamingMovies, ...streamingShows].map(item => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: item.media_type,
      url: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
    }));

    if (popularReleases.length > 0) {
      // Cache the results
      cache.set('popularReleases', popularReleases);
      console.log('Popular releases cached successfully.');
    } else {
      console.warn('No valid popular releases found to cache.');
    }

  } catch (error) {
    console.error('Error fetching popular releases:', error.message);
  }
};

// Schedule the fetching task every hour
cron.schedule('0 * * * *', fetchPopularReleases);

// Fetch popular releases initially on server start
fetchPopularReleases();

// Endpoint to get the popular movies and shows
router.get('/popular', (req, res) => {
  const popularReleases = cache.get('popularReleases');

  if (popularReleases && popularReleases.length > 0) {
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
    
    const filteredResults = response.data.results.filter(result => result.media_type === 'movie' || result.media_type === 'tv');

    res.json({ results: filteredResults });
  } catch (error) {
    console.error('Error fetching search results:', error.message);
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
    console.error('Error fetching image URL:', error.message);
    res.status(500).json({ message: 'Error fetching image URL' });
  }
});

// Endpoint to get watch providers for a movie or TV show
router.get('/:mediaType/:mediaId/watch/providers', async (req, res) => {
  const { mediaType, mediaId } = req.params;
  try {
    const providers = await getWatchProviders(mediaType, mediaId);
    res.json(providers);
  } catch (error) {
    console.error(`Error handling watch providers request for ${mediaType} ${mediaId}:`, error.message);
    res.status(500).json({ message: 'Error fetching watch providers' });
  }
});

// Endpoint to get credits (cast and crew) for a movie or TV show
router.get('/:mediaType/:mediaId/credits', async (req, res) => {
  const { mediaType, mediaId } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching credits for ${mediaType} ${mediaId}:`, error.message);
    res.status(500).json({ message: 'Error fetching credits' });
  }
});

// Endpoint to get videos (e.g., trailers) for a movie or TV show
router.get('/:mediaType/:mediaId/videos', async (req, res) => {
  const { mediaType, mediaId } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching videos for ${mediaType} ${mediaId}:`, error.message);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// Endpoint to get details for a movie
router.get('/movie/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching movie details for ${id}:`, error.message);
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

// Endpoint to get details for a TV show
router.get('/tv/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching TV show details for ${id}:`, error.message);
    res.status(500).json({ message: 'Error fetching TV show details' });
  }
});

// Endpoint to fetch detailed media data, including interaction, trailers, and watch providers for the NextViewPage
router.get('/nextview/:userId/:mediaId/:mediaType', async (req, res) => {
  const { userId, mediaId, mediaType } = req.params;

  try {
    // Fetch the media details from TMDB including videos
    const mediaResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=videos`);
    const mediaData = mediaResponse.data;

    // Fetch user interaction for this media item
    const interaction = await db('interactions')
      .where({ userId, media_id: mediaId, media_type: mediaType })
      .first();

    // Fetch watch providers
    const providers = await getWatchProviders(mediaType, mediaId);

    // Fetch credits (cast and crew)
    const creditsResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits?api_key=${TMDB_API_KEY}`);
    const credits = creditsResponse.data.cast.slice(0, 10); // Top 10 cast members

    // Combine the data
    const responseData = {
      ...mediaData,
      interaction: interaction ? interaction.interaction : null,
      providers,
      credits,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching next view media data:', error);
    res.status(500).json({ message: 'Error fetching media data' });
  }
});

module.exports = router;