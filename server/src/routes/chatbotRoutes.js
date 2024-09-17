const express = require('express');
const axios = require('axios');
const { processInput } = require('../services/nlpService');
const router = express.Router();

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

  try {
    // Process the user input through NLP
    const nlpResult = await processInput(userInput);
    const intent = nlpResult.intent;
    const answer = nlpResult.answer;

    if (intent in genreMap) {
      const { type, genreId } = genreMap[intent];

      // Fetch media based on the identified genre
      const media = await getMediaByGenre(type, genreId);

      if (media.length === 0) {
        res.json({ message: `No ${type === 'movie' ? 'movies' : 'shows'} found for ${intent.split('_')[1]} at the moment.` });
      } else {
        res.json({
          message: answer,
          media,
        });
      }
    } else {
      // If it's not a media recommendation, respond directly with the answer from NLP
      res.json({
        message: answer, // General conversation answers
      });
    }
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// Function to fetch media (movies or shows) by genre
async function getMediaByGenre(type, genreId) {
  const tmdbApiKey = process.env.TMDB_API_KEY;
  const mediaType = type === 'movie' ? 'movie' : 'tv'; // Ensure proper media type
  let url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbApiKey}&with_genres=${genreId}&sort_by=popularity.desc`;

  // Handle rom-com genre for both movies and TV shows
  if (genreId === '10749,35') {
    url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbApiKey}&with_genres=10749,35&sort_by=popularity.desc`;
  }

  try {
    const response = await axios.get(url);
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name, // Handle both movie and TV show titles
      poster_path: item.poster_path,
      media_type: mediaType, // Explicitly include media type in the response
      vote_average: item.vote_average != null ? item.vote_average : 0,
    }));
  } catch (error) {
    console.error(`Error fetching ${mediaType} from TMDB: ${error}`);
    throw new Error(`Failed to fetch ${mediaType}`);
  }
}

module.exports = router;