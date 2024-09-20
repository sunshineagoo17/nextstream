const express = require('express');
const axios = require('axios');
const { processInput } = require('../services/nlpService');
const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
    // Process the user input through NLP
    const nlpResult = await processInput(userInput);
    console.log('NLP Result:', nlpResult);
    const intent = nlpResult.intent;
    const answer = nlpResult.answer;

    // Check if the intent is to recommend media by genre
    if (intent in genreMap) {
      const { type, genreId } = genreMap[intent];
      const media = await getMediaByGenre(type, genreId);

      res.json({
        message: answer,
        media,
      });

    // Check if the intent is movie or TV title search
    } else if (intent === 'search_movie' || intent === 'search_tv') {
      const mediaResults = await searchMediaByTitle(userInput, intent);
      
      res.json({
        message: `Here are some ${intent === 'search_movie' ? 'movies' : 'TV shows'} matching "${userInput}":`,
        media: mediaResults,
      });

    // Check if the intent is actor/people search
    } else if (intent === 'search_actor') {
      const actorResults = await searchPersonByName(userInput);

      res.json({
        message: `Here are some actors/people matching "${userInput}":`,
        media: actorResults,
      });

    } else {
      // General conversation or unhandled intent
      res.json({
        message: answer, 
      });
    }
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// Function to fetch media (movies or shows) by genre
async function getMediaByGenre(type, genreId) {
  const mediaType = type === 'movie' ? 'movie' : 'tv';
  let url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;

  // Handle special case for romcom genre
  if (genreId === '10749,35') {
    url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=10749,35&sort_by=popularity.desc`;
  }

  try {
    const response = await axios.get(url);
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: mediaType,
      vote_average: item.vote_average !== undefined ? item.vote_average : 0,
    }));
  } catch (error) {
    console.error(`Error fetching ${mediaType} from TMDB:`, error);
    throw new Error(`Failed to fetch ${mediaType}`);
  }
}

// Function to search for a movie or TV show by title
async function searchMediaByTitle(query, type) {
  const mediaType = type === 'search_movie' ? 'movie' : 'tv';
  const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: mediaType,
      vote_average: item.vote_average !== undefined ? item.vote_average : 0,
    }));
  } catch (error) {
    console.error(`Error searching ${mediaType} by title from TMDB:`, error);
    throw new Error(`Failed to search ${mediaType}`);
  }
}

// Function to search for a person (actor) by name
async function searchPersonByName(query) {
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    return response.data.results.map((person) => ({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path,
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

module.exports = router;