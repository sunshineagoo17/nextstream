const express = require('express');
const router = express.Router();
const axios = require('axios');
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to get media details from TMDB
const getMediaDetails = async (media_id, media_type) => {
  if (!media_type) {
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await axios.get(url);

    if (media_type === 'person') {
      return {
        media_id,
        name: response.data.name,
        biography: response.data.biography,
        profile_path: response.data.profile_path,
        media_type,
        popularity: response.data.popularity,
        known_for_department: response.data.known_for_department,
      };
    }

    // Proceed as usual for 'movie' or 'tv'
    const { title, name, overview, poster_path, genres, popularity, release_date, vote_average, origin_country } = response.data;
    return {
      media_id,
      title: title || name,
      overview,
      poster_path,
      genres: genres ? genres.map(genre => genre.name) : [],  
      media_type,
      popularity,
      release_date,
      vote_average,
      origin_country
    };
  } catch (error) {
    return null;
  }
};

// Function to get trailer details from TMDB
const getMediaTrailer = async (media_id, media_type) => {
  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}/videos?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);

    let videoTypesChecked = [];

    let video = response.data.results.find(
      video => {
        videoTypesChecked.push('YouTube Trailer');
        return video.type === 'Trailer' && video.site === 'YouTube';
      }
    );

    if (!video) {
      video = response.data.results.find(
        video => {
          videoTypesChecked.push('Vimeo Trailer');
          return video.type === 'Trailer' && video.site === 'Vimeo';
        }
      );
    }

    if (!video && media_type === 'tv') {
      video = response.data.results.find(
        video => {
          videoTypesChecked.push('Featurette');
          return video.type === 'Featurette' && (video.site === 'YouTube' || video.site === 'Vimeo');
        }
      );
    }

    if (!video && media_type === 'tv') {
      video = response.data.results.find(
        video => {
          videoTypesChecked.push('Teaser');
          return video.type === 'Teaser' && (video.site === 'YouTube' || video.site === 'Vimeo');
        }
      );
    }

    if (!video && media_type === 'tv') {
      video = response.data.results.find(
        video => {
          videoTypesChecked.push('Opening Credits');
          return video.type === 'Opening Credits' && (video.site === 'YouTube' || video.site === 'Vimeo');
        }
      );
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

// Fetch user's favorite interactions with pagination and search
router.get('/:userId/faves', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, search = '', filter = '' } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch all liked interactions (without pagination at this point)
    const faves = await db('interactions')
      .where({ userId, interaction: 1 })
      .distinct('media_id', 'media_type');

    // Fetch details for the liked media items
    const mediaDetails = await Promise.all(faves.map(async (fave) => {
      const details = await getMediaDetails(fave.media_id, fave.media_type);
      return details;
    }));

    // Filter out any null results
    let filteredMediaDetails = mediaDetails.filter(detail => detail !== null);

    // Apply filtering
    if (filter) {
      switch (filter) {
        case 'popular':
          filteredMediaDetails = filteredMediaDetails.sort((a, b) => b.popularity - a.popularity);
          break;
        case 'new':
          const currentYear = new Date().getFullYear();
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            new Date(detail.release_date).getFullYear() === currentYear
          );
          break;
        case 'top-rated':
          filteredMediaDetails = filteredMediaDetails.sort((a, b) => b.vote_average - a.vote_average);
          break;
        case 'children':
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            Array.isArray(detail.genres) && detail.genres.some(genre => genre && (genre === 'Family' || genre === 'Animation'))
          );
          break;
        case 'adult':
        case 'broad-audience': 
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            Array.isArray(detail.genres) && detail.genres.every(genre => genre && genre !== 'Family' && genre !== 'Animation')
          );
          break;
        case 'international':
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            detail.origin_country && Array.isArray(detail.origin_country) && detail.origin_country.length > 0 && 
            !detail.origin_country.includes('US') && !detail.origin_country.includes('CA')
          );
          break;
        case 'science-fiction':
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            Array.isArray(detail.genres) && detail.genres.some(genre => genre && genre === 'Science Fiction')
          );
          break;
        default:
          filteredMediaDetails = filteredMediaDetails.filter(detail => 
            Array.isArray(detail.genres) && detail.genres.some(genre => genre && genre.includes(filter.charAt(0).toUpperCase() + filter.slice(1)))
          );
          break;
      }
    }

    // Apply search with safety checks
    if (search) {
      filteredMediaDetails = filteredMediaDetails.filter(detail => {
        const titleMatch = detail.title ? detail.title.toLowerCase().includes(search.toLowerCase()) : false;
        const overviewMatch = detail.overview ? detail.overview.toLowerCase().includes(search.toLowerCase()) : false;
        const genreMatch = Array.isArray(detail.genres) 
          ? detail.genres.some(genre => genre && genre.toLowerCase().includes(search.toLowerCase())) 
          : false;
        const mediaTypeMatch = detail.media_type ? detail.media_type.toLowerCase().includes(search.toLowerCase()) : false;

        return titleMatch || overviewMatch || genreMatch || mediaTypeMatch;
      });
    }

    // Now paginate the filtered results
    const paginatedResults = filteredMediaDetails.slice((page - 1) * limit, page * limit);

    res.json(paginatedResults);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching favorite movies/shows' });
  }
});

// Fetch trailer for a media item
router.get('/:userId/trailer/:media_type/:media_id', async (req, res) => {
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

// Update the interaction value from 1 to 0 when removing a media item from favorites
router.delete('/:userId/delete/:media_id/:media_type', async (req, res) => {
  try {
    const { userId, media_id, media_type } = req.params;

    // Update interaction value to 0 in the database instead of deleting the record
    await db('interactions')
      .where({ userId, media_id, media_type })
      .update({ interaction: 0 });

    // Update the `media_statuses` table to reflect that the media is no longer "to_watch"
    await db('media_statuses')
      .where({ userId: userId, media_id: media_id, media_type: media_type }) 
      .del()
      .catch(error => {
        console.error('Error deleting from media_statuses:', error);
      });

    res.json({ message: 'Media interaction updated to 0 (removed from favorites) and media_statuses updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating media interaction' });
  }
});

module.exports = router;