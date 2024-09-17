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
  'recommend_romance': { type: 'movie', genreId: 10749 },
  'recommend_romcom': { type: 'movie', genreId: '10749,35' }, 
  'recommend_thriller': { type: 'movie', genreId: 53 }, 

  // TV Shows
  'recommend_action_tv': { type: 'tv', genreId: 10759 },
  'recommend_adventure_tv': { type: 'tv', genreId: 10759 },
  'recommend_animation_tv': { type: 'tv', genreId: 16 },
  'recommend_comedy_tv': { type: 'tv', genreId: 35 },
  'recommend_documentary_tv': { type: 'tv', genreId: 99 },
  'recommend_drama_tv': { type: 'tv', genreId: 18 },
  'recommend_thriller_tv': { type: 'tv', genreId: 80 },
  'recommend_romance_tv': { type: 'tv', genreId: 10749 },
  'recommend_romcom_tv': { type: 'tv', genreId: '10749,35' }
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
        
        // Fetch movies or TV shows based on the identified genre and return the most popular ones
        const media = await getMediaByGenre(type, genreId);
  
        if (media.length === 0) {
          res.json({ message: `No ${type === 'movie' ? 'movies' : 'shows'} found for ${intent.split('_')[1]} at the moment.` });
        } else {
          // Respond with the predefined answer and most popular media
          res.json({
            message: answer,  
            media,  
          });
        }
      } else {
        // If it's not a media recommendation, respond directly with the answer from NLP
        res.json({
          message: answer  // General conversation answers like FAQ or fun chit-chat
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
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    let url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbApiKey}&with_genres=${genreId}&sort_by=popularity.desc`;

    // If it's a rom-com, adjust for both romance and comedy
    if (genreId === '10749,35') {
      url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${tmdbApiKey}&with_genres=10749,35&sort_by=popularity.desc`;
    }

    try {
      const response = await axios.get(url);
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching ${mediaType} from TMDB: ${error}`);
      throw new Error(`Failed to fetch ${mediaType}`);
    }
}

module.exports = router;