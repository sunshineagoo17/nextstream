const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to dynamically search movies, TV shows, or persons from TMDB
async function dynamicSearch(query, fetchExtras = false) {
  const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    if (results.length > 0) {
      // Map over the results to create a consistent response structure
      return await Promise.all(
        results.map(async (item) => {
          // Handle poster path for movies/TV shows and profile path for persons
          let imagePath = item.media_type === 'person'
            ? item.profile_path 
              ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
              : 'default-profile.jpg'  // Fallback for persons with no profile image
            : item.poster_path 
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'default-poster.jpg';   // Fallback for movies/TV shows with no poster

          // Define the base structure for the result
          let mediaData = {
            id: item.id,
            title: item.title || item.name,  // Use title for movies/TV shows, name for persons
            name: item.name || null,         // Explicitly use name for persons
            media_type: item.media_type,     // 'movie', 'tv', or 'person'
            image_path: imagePath,           // Use appropriate image (poster or profile)
            vote_average: item.vote_average || null,  // Ratings for movies/TV shows
          };

          // Optionally fetch trailers or credits based on `fetchExtras` flag
          if (fetchExtras && (item.media_type === 'movie' || item.media_type === 'tv')) {
            const trailerUrl = await getMediaTrailer(item.id, item.media_type);
            const credits = await getMediaCredits(item.id, item.media_type);
            mediaData.trailerUrl = trailerUrl;
            mediaData.credits = credits;
          }

          return mediaData;
        })
      );
    } else {
      return [];  // Return an empty array if no results are found
    }
  } catch (error) {
    throw new Error(`Failed to search TMDB for query "${query}"`);
  }
}

// Optional: Fetch trailers
async function getMediaTrailer(mediaId, mediaType) {
  const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}`;
  try {
    const response = await axios.get(url);
    const video = response.data.results.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    );
    return video ? `https://www.youtube.com/embed/${video.key}` : null;
  } catch (error) {
    return null;
  }
}

// Optional: Fetch credits
async function getMediaCredits(mediaId, mediaType) {
  const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits?api_key=${TMDB_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.cast.slice(0, 10); 
  } catch (error) {
    return [];
  }
}

module.exports = {
  dynamicSearch,
};