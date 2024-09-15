const cron = require('node-cron');
const moment = require('moment-timezone');
const axios = require('axios');
const { generateAndNotifyRecommendations } = require('./recommendationService');
const { sendScheduledEventReminders } = require('../utils/scheduledEventReminders');
const knexConfig = require('../../knexfile');
const knex = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const STREAMING_PROVIDERS = ['Amazon Prime Video', 'Apple TV Plus', 'Netflix', 'Crave', 'Disney Plus'];
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

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

// Function to fetch and cache popular releases
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

// Schedule jobs
const scheduleJobs = () => {
  // Schedule the fetching task every hour
  cron.schedule('0 * * * *', fetchPopularReleases);

  // Schedule the recommendation notifications to run daily at 9:00 AM Eastern Time (EDT)
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily recommendation notifications at', moment().tz('America/Toronto').format());
    try {
      const users = await knex('users').where({ receiveNotifications: 1 }).select('id');
      for (const user of users) {
        await generateAndNotifyRecommendations(user.id);
      }
      console.log('Daily recommendation notifications sent successfully at', moment().tz('America/Toronto').format());
    } catch (error) {
      console.error('Error sending daily recommendation notifications at', moment().tz('America/Toronto').format(), error);
    }
  });

  // Schedule the event reminders to run daily at 8 AM Eastern Time (EDT)
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily event reminders at', moment().tz('America/Toronto').format());
    try {
      const users = await knex('users').where({ receiveReminders: 1 }).select('id', 'email');
      console.log('Users to send reminders:', users);
      for (const user of users) {
        const startOfDay = moment().tz('America/Toronto').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endOfDay = moment().tz('America/Toronto').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        console.log(`Fetching events for user ${user.email} between ${startOfDay} and ${endOfDay}`);

        // Fetch events for the user
        const events = await knex('events')
          .where({ user_id: user.id })
          .andWhere('start', '>=', startOfDay)
          .andWhere('start', '<=', endOfDay)
          .select('title', 'start');
        console.log(`Events fetched for user ${user.email}:`, events);

        if (events.length > 0) {
          console.log(`Sending reminders to ${user.email} for events:`, events);
          await sendScheduledEventReminders(user.email, events);
        } else {
          console.log(`No events found for user ${user.email}`);
        }
      }
      console.log('Daily event reminders sent successfully at', moment().tz('America/Toronto').format());
    } catch (error) {
      console.error('Error sending daily event reminders at', moment().tz('America/Toronto').format(), error);
    }
  });
};

module.exports = { fetchPopularReleases, scheduleJobs };