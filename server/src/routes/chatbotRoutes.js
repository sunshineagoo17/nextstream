const express = require('express');
const axios = require('axios');
const { processInput } = require('../services/nlpService');
const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Map to handle genres by intent
const genreMap = {
  // Movies
  'recommend_action': { type: 'movie', genreId: 28 },
  'recommend_adventure': { type: 'movie', genreId: 12 },
  'recommend_animation': { type: 'movie', genreId: 16 },
  'recommend_comedy': { type: 'movie', genreId: 35 },
  'recommend_documentary': { type: 'movie', genreId: 99 },
  'recommend_drama': { type: 'movie', genreId: 18 },
  'recommend_family': { type: 'movie', genreId: 10751 },
  'recommend_fantasy': { type: 'movie', genreId: 14 },
  'recommend_horror': { type: 'movie', genreId: 27 },
  'recommend_mystery': { type: 'movie', genreId: 9648 },
  'recommend_romance': { type: 'movie', genreId: 10749 },
  'recommend_romcom': { type: 'movie', genreId: '10749,35' },
  'recommend_scifi': { type: 'movie', genreId: 878 },
  'recommend_thriller': { type: 'movie', genreId: 53 },
  'recommend_tvmovie': { type: 'movie', genreId: 10770 },

  // TV Shows
  'recommend_action_tv': { type: 'tv', genreId: 10759 },
  'recommend_adventure_tv': { type: 'tv', genreId: 10759 },
  'recommend_animation_tv': { type: 'tv', genreId: 16 },
  'recommend_comedy_tv': { type: 'tv', genreId: 35 },
  'recommend_documentary_tv': { type: 'tv', genreId: 99 },
  'recommend_drama_tv': { type: 'tv', genreId: 18 },
  'recommend_family_tv': { type: 'tv', genreId: 10751 },
  'recommend_fantasy_tv': { type: 'tv', genreId: 10765 },
  'recommend_kids_tv': { type: 'tv', genreId: 10762 },
  'recommend_horror_tv': { type: 'tv', genreId: 27 },
  'recommend_mystery_tv': { type: 'tv', genreId: 9648 },
  'recommend_reality_tv': { type: 'tv', genreId: 10764 },
  'recommend_romance_tv': { type: 'tv', genreId: 10749 },
  'recommend_romcom_tv': { type: 'tv', genreId: '10749,35' },
  'recommend_scifi_tv': { type: 'tv', genreId: 10765 },
};

// Define chatbot route
router.post('/', async (req, res) => {
  const { userInput } = req.body;

  console.log('Received user input:', userInput);

  try {
    // Process user input through NLP
    const nlpResult = await processInput(userInput);
    console.log('NLP Result:', nlpResult);

    const { intent, title, actor } = nlpResult;

    // Handle the unified search intent for movies, TV shows, and actors
    if (intent === 'search_movie_or_tv') {
      // If there's a title, search for movies and TV shows
      if (title) {
        const query = title || userInput;  // Use extracted title if available
        
        // Search for both movies and TV shows
        const movieResults = await searchMediaByTitle(query, 'search_movie');
        const tvResults = await searchMediaByTitle(query, 'search_tv');

        const mediaResults = [...movieResults, ...tvResults]; // Combine results

        console.log('Combined movie and TV results:', mediaResults);

        if (mediaResults.length > 0) {
          return res.json({
            message: `Here are some results matching "${query}":`,
            media: mediaResults,
          });
        } else {
          return res.json({
            message: `Sorry, no movies or TV shows found for "${query}".`,
          });
        }
      }
      // If there's an actor, search for actors
      else if (actor) {
        const query = actor || userInput;  // Use extracted actor if available
        const actorResults = await searchPersonByName(query);

        console.log('Actor results:', actorResults);

        if (actorResults.length > 0) {
          return res.json({
            message: `Here are some actors matching "${query}":`,
            media: actorResults,
          });
        } else {
          return res.json({
            message: `Sorry, no actors found for "${query}".`,
          });
        }
      }
    } 

    // Check if the intent is to recommend media by genre
    else if (intent in genreMap) {
      const { type, genreId } = genreMap[intent];
      const media = await getMediaByGenre(type, genreId);

      return res.json({
        message: nlpResult.answer,
        media,
      });
    } else {
      // General conversation or unhandled intent
      return res.json({
        message: nlpResult.answer,
      });
    }
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// Fetch movies or TV shows by genre from TMDB and include trailers and credits
async function getMediaByGenre(type, genreId) {
  const mediaType = type === 'movie' ? 'movie' : 'tv';
  let url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;

  // Handle special case for romcom genre
  if (genreId === '10749,35') {
    url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=10749,35&sort_by=popularity.desc`;
  }

  try {
    const response = await axios.get(url);

    // If no results are found, return a user-friendly message
    if (response.data.results.length === 0) {
      return [{ message: `No ${mediaType} found in this genre.` }];
    }

    // Fetch trailer and credits for each media item
    const mediaData = await Promise.all(
      response.data.results.map(async (item) => {
        const trailerUrl = await getMediaTrailer(item.id, mediaType);
        const credits = await getMediaCredits(item.id, mediaType);
        return {
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path || 'default-poster.jpg',
          media_type: mediaType,
          vote_average: item.vote_average !== undefined ? item.vote_average : 0,
          trailerUrl,
          credits, // Include the credits in the result
        };
      })
    );

    return mediaData;
  } catch (error) {
    console.error(`Error fetching ${mediaType} from TMDB:`, error);
    throw new Error(`Failed to fetch ${mediaType}`);
  }
}

// Function to search for movies or TV shows by title (also fetching trailers and credits)
async function searchMediaByTitle(query, type) {
  const mediaType = type === 'search_movie' ? 'movie' : 'tv';
  const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    console.log(`TMDB response for ${query}:`, response.data);

    // If no results are found, return a user-friendly message
    if (response.data.results.length === 0) {
      console.log(`No results found for ${query}`);
      return [{ message: `No ${mediaType} found matching "${query}".` }];
    }

    // Fetch trailer and credits for each result
    const mediaData = await Promise.all(
      response.data.results.map(async (item) => {
        const trailerUrl = await getMediaTrailer(item.id, mediaType);
        const credits = await getMediaCredits(item.id, mediaType);
        return {
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path || 'default-poster.jpg',
          media_type: mediaType,
          vote_average: item.vote_average !== undefined ? item.vote_average : 0,
          trailerUrl,
          credits, // Include the credits in the result
        };
      })
    );

    return mediaData;
  } catch (error) {
    console.error(`Error searching ${mediaType} by title from TMDB:`, error);
    throw new Error(`Failed to search ${mediaType}`);
  }
}

// Function to search for an actor or person by name
async function searchPersonByName(query) {
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);

    // If no results are found, return a user-friendly message
    if (response.data.results.length === 0) {
      return [{ message: `No actors found matching "${query}".` }];
    }

    return response.data.results.map((person) => ({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path 
          ? `https://image.tmdb.org/t/p/w500${person.profile_path}` 
          : 'default-profile.jpg',  // Fallback image for missing profile
      known_for: person.known_for.map((media) => ({
          id: media.id,
          title: media.title || media.name,
          media_type: media.media_type,
      })),
  }));
  
  } catch (error) {
    console.error('Error fetching person from TMDB:', error);
    throw new Error('Failed to fetch person');
  }
}

// Function to fetch trailers
async function getMediaTrailer(media_id, media_type) {
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
}

// Function to fetch credits
async function getMediaCredits(media_id, media_type) {
  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}/credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data.cast.slice(0, 10); // Return top 10 cast members
  } catch (error) {
    console.error(`Error fetching credits for ${media_type} ${media_id}:`, error.message);
    return [];
  }
}

module.exports = router;