const express = require('express');
const axios = require('axios');
const { processInput } = require('../services/nlpService'); 
const router = express.Router();

const genreMap = {
  'recommend_action': 28,
  'recommend_comedy': 35,
  'recommend_thriller': 53,
  'recommend_romance': 10749,
  'recommend_romcom': '10749,35'  // Romantic Comedy
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
        // Fetch movies based on the identified genre and return the most popular ones
        const movies = await getMoviesByGenre(genreMap[intent]);
  
        if (movies.length === 0) {
          res.json({ message: `No movies found for ${intent.split('_')[1]} at the moment.` });
        } else {
          // Respond with the predefined answer and most popular movies
          res.json({
            message: answer,  // Use the predefined answer from the NLP manager
            movies,
          });
        }
      } else {
        // Respond if intent is not recognized
        res.json({ message: "Sorry, I didn't understand that." });
      }
    } catch (error) {
      console.error('Error processing chatbot request:', error);
      res.status(500).json({ message: 'Something went wrong.' });
    }
  });

// Function to fetch movies by genre, handling rom-coms manually
async function getMoviesByGenre(genreId) {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    // Handle rom-com separately by fetching movies that have both romance (10749) and comedy (35) genres
    if (genreId === '10749,35') {
      const romcomUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&with_genres=10749,35&sort_by=popularity.desc`;
      
      try {
        const romcomResponse = await axios.get(romcomUrl);
        return romcomResponse.data.results;
      } catch (error) {
        console.error('Error fetching rom-com movies:', error);
        throw new Error('Failed to fetch rom-com movies');
      }
    } else {
      // Regular genre fetch for non-rom-com genres
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&with_genres=${genreId}&sort_by=popularity.desc`;
      try {
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(`Error fetching movies from TMDB: ${error}`);
        throw new Error('Failed to fetch movies');
      }
    }
  }
  
module.exports = router;