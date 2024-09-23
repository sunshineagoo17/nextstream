const express = require('express');
const axios = require('axios');
const router = express.Router();

// Set your API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('No OpenAI API key provided');
  process.exit(1);
}

if (!TMDB_API_KEY) {
  console.error('No TMDB API key provided');
  process.exit(1);
}

// Fetch movies from TMDB
const fetchMovies = async (query) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });

    return response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      media_type: 'movie',
      poster_path: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      vote_average: movie.vote_average || 0,
    }));
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

// Fetch TV shows from TMDB
const fetchTvShows = async (query) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });

    return response.data.results.map((show) => ({
      id: show.id,
      title: show.name,
      media_type: 'tv',
      poster_path: show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : null,
      vote_average: show.vote_average || 0,
    }));
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    return [];
  }
};

// Fetch person data from TMDB
const fetchPerson = async (query) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/person`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
      },
    });

    return response.data.results.map((person) => ({
      id: person.id,
      name: person.name,
      media_type: 'person',
      profile_path: person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : null,
      known_for: person.known_for.map((item) => ({
        title: item.title || item.name,
        media_type: item.media_type,
      })),
    }));
  } catch (error) {
    console.error('Error fetching persons:', error);
    return [];
  }
};

// Route to handle GPT and TMDB queries
router.post('/', async (req, res) => {
  const { userInput, userId } = req.body;

  if (!userInput || !userId) {
    return res.status(400).json({ error: 'Invalid input or missing userId' });
  }
  
  try {
    // Send user input to GPT API
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',  // Or 'gpt-4' if available
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userInput },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const gptMessage = gptResponse.data.choices[0].message.content;

    // Analyze GPT response and determine what to query in TMDB
    let mediaResults = [];
    if (/movie/i.test(userInput)) {
      mediaResults = await fetchMovies(userInput);
    } else if (/tv|show/i.test(userInput)) {
      mediaResults = await fetchTvShows(userInput);
    } else if (/actor|director|person/i.test(userInput)) {
      mediaResults = await fetchPerson(userInput);
    }

    // Return both GPT response and TMDB results
    return res.json({
      response: gptMessage,
      media: mediaResults,
    });
  } catch (error) {
    console.error('Error from GPT or TMDB API:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Error communicating with GPT or TMDB API' });
  }
});

module.exports = router;