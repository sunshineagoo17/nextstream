const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const getMediaDetailsByTitle = async (title, mediaType) => {
  try {
    // Search for the media by title
    const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    const response = await axios.get(url);

    if (response.data && response.data.results && response.data.results.length > 0) {
      const media = response.data.results[0];

      // Fetch full details for the media to get duration and genres
      const mediaDetailsUrl = `${TMDB_BASE_URL}/${mediaType}/${media.id}?api_key=${TMDB_API_KEY}`;
      const mediaDetailsResponse = await axios.get(mediaDetailsUrl);
      const mediaDetails = mediaDetailsResponse.data;

      // Extract duration (runtime for movies, episode_run_time for TV shows)
      const duration = mediaType === 'movie' ? mediaDetails.runtime : (mediaDetails.episode_run_time ? mediaDetails.episode_run_time[0] : null);

      // Extract genres as a list of genre names
      const genres = mediaDetails.genres.map((genre) => genre.name);

      return {
        id: media.id,
        title: media.title || media.name, 
        duration,
        genres,
      };
    } else {
      console.error(`No ${mediaType} found with title: ${title}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${mediaType} details for title ${title}:`, error);
    return null;
  }
};

module.exports = { getMediaDetailsByTitle };