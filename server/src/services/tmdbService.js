// tmdbService.js
const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to dynamically search movies, TV shows, or actors from TMDB
async function dynamicSearch(query) {
  const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    if (results.length > 0) {
        return results.map((item) => ({
            id: item.id,
            title: item.title || item.name,  // Use title for movies/TV shows and name for actors
            name: item.name || null,         // Explicitly use name for actors
            media_type: item.media_type,     // 'movie', 'tv', or 'person'
            poster_path: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : item.profile_path
                ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
                : 'default-poster.jpg',  // Fallback for missing poster/profile
          }));
          
          
    } else {
      return null;  // No results found
    }
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    throw new Error('Failed to search TMDB');
  }
}

module.exports = {
  dynamicSearch,
};