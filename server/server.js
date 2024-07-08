const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const cron = require('node-cron');
const axios = require('axios');
const emailRoutes = require('./src/routes/emailRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profileRoutes');
const tmdbRoutes = require('./src/routes/tmdbRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Initialize NodeCache with TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
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

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Serve static files from the React app if needed
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app for specific routes
const allowedRoutes = ['/','/terms'];
app.get(allowedRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Wait! Something broke!');
});

// Server listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Hey you. The server's running on port ${PORT}`);
});