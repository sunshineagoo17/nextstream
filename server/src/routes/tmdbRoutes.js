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

// Utility function to get the trailer or other video types
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

// Endpoint to search for movies, TV shows, and persons
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });
    
    const filteredResults = response.data.results.filter(result => 
      result.media_type === 'movie' || 
      result.media_type === 'tv' || 
      result.media_type === 'person'
    );

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
    // Use the getMediaTrailer function here to get the trailer or other videos
    const trailerUrl = await getMediaTrailer(mediaId, mediaType);
    
    if (trailerUrl) {
      res.json({ trailerUrl });
    } else {
      res.status(404).json({ message: 'Apologies, no trailer is available.' });
    }
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
      // Fetch the media details from TMDB including videos and certifications
      const mediaResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}`, {
          params: {
              api_key: TMDB_API_KEY,
              append_to_response: 'videos,release_dates,content_ratings'
          }
      });
      const mediaData = mediaResponse.data;

      // Fetch the content rating based on mediaType
      let certification = null;
      if (mediaType === 'movie') {
          const releaseInfo = mediaData.release_dates.results.find(country => country.iso_3166_1 === 'US');
          if (releaseInfo && releaseInfo.release_dates.length > 0) {
              certification = releaseInfo.release_dates[0].certification || null;
          }
      } else if (mediaType === 'tv') {
          const contentRatingInfo = mediaData.content_ratings.results.find(country => country.iso_3166_1 === 'US');
          if (contentRatingInfo) {
              certification = contentRatingInfo.rating || null;
          }
      }

      // Fetch user interaction for this media item
      const interaction = await db('interactions')
          .where({ userId, media_id: mediaId, media_type: mediaType })
          .first();

      // Fetch watch providers
      const providers = await getWatchProviders(mediaType, mediaId);

      // Fetch credits (cast and crew)
      const creditsResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits`, {
          params: {
              api_key: TMDB_API_KEY
          }
      });
      const credits = creditsResponse.data.cast.slice(0, 10); // Top 10 cast members

      // Fetch the trailer using the enhanced logic
      const trailerUrl = await getMediaTrailer(mediaId, mediaType);

      // Combine the data
      const responseData = {
          ...mediaData,
          certification, // Add the certification data to the response
          interaction: interaction ? interaction.interaction : null,
          providers,
          credits,
          trailerUrl, // Add the trailer URL to the response
      };

      res.json(responseData);
  } catch (error) {
      console.error('Error fetching next view media data:', error);
      res.status(500).json({ message: 'Error fetching media data' });
  }
});

// Endpoint to get details for a person, including their "known for" media
router.get('/person/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch person details from TMDB
    const personResponse = await axios.get(`${TMDB_BASE_URL}/person/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'combined_credits'
      }
    });
    const personData = personResponse.data;

    // Extract the "known for" movies and TV shows
    const knownFor = personData.combined_credits.cast.slice(0, 5).map(media => ({
      id: media.id,
      title: media.title || media.name,
      poster_path: media.poster_path,
      media_type: media.media_type
    }));

    // Fetch the cast information for each "known for" item
    const enrichedKnownFor = await Promise.all(
      knownFor.map(async media => {
        const creditsResponse = await axios.get(`${TMDB_BASE_URL}/${media.media_type}/${media.id}/credits`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        return {
          ...media,
          cast: creditsResponse.data.cast.slice(0, 5) 
        };
      })
    );

    res.json({ ...personData, knownFor: enrichedKnownFor });
  } catch (error) {
    console.error(`Error fetching person details for ${id}:`, error.message);
    res.status(500).json({ message: 'Error fetching person details' });
  }
});

// Trending endpoint for movies, TV, and all
router.get('/trending/:mediaType/:timeWindow', async (req, res) => {
  const { mediaType, timeWindow } = req.params;

  if (!['movie', 'tv', 'all'].includes(mediaType) || !['day', 'week'].includes(timeWindow)) {
    return res.status(400).json({ message: 'Invalid media type or time window' });
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    // Filter out 'person' media type if present in the response 
    const filteredResults = response.data.results.filter(result => result.media_type !== 'person');

    res.json({ results: filteredResults });
  } catch (error) {
    console.error(`Error fetching trending ${mediaType} for ${timeWindow}:`, error.message);
    res.status(500).json({ message: `Error fetching trending ${mediaType} for ${timeWindow}` });
  }
});

// Movie category endpoint for now playing, popular, top rated, and upcoming
router.get('/movie/:movieCategory', async (req, res) => {
  const { movieCategory } = req.params;

  if (!['now_playing', 'popular', 'top_rated', 'upcoming'].includes(movieCategory)) {
    return res.status(400).json({ message: 'Invalid movie category' });
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieCategory}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        region: 'CA',
      },
    });
    res.json(response.data.results);
  } catch (error) {
    console.error(`Error fetching ${movieCategory} movies:`, error.message);
    res.status(500).json({ message: `Error fetching ${movieCategory} movies` });
  }
});

// TV category endpoint for airing today, on the air, popular, and top rated
router.get('/tv/:tvCategory', async (req, res) => {
  const { tvCategory } = req.params;

  if (!['airing_today', 'on_the_air', 'popular', 'top_rated'].includes(tvCategory)) {
    return res.status(400).json({ message: 'Invalid TV category' });
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvCategory}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        region: 'CA',
      },
    });
    res.json(response.data.results);
  } catch (error) {
    console.error(`Error fetching ${tvCategory} TV shows:`, error.message);
    res.status(500).json({ message: `Error fetching ${tvCategory} TV shows` });
  }
});

module.exports = router;