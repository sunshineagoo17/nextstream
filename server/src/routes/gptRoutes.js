const express = require('express');
const axios = require('axios');
const router = express.Router();

// Make sure to set your OpenAI API key in your environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('No OpenAI API key provided');
  process.exit(1);
}

// Route to handle GPT queries
router.post('/', async (req, res) => {
  const userInput = req.body.input;

  if (!userInput) {
    return res.status(400).json({ error: 'Input text is required' });
  }

  try {
    // Make request to OpenAI API
    const response = await axios.post(
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
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and send GPT's response
    const gptResponse = response.data.choices[0].message.content;
    return res.json({ response: gptResponse });

  } catch (error) {
    console.error('Error from GPT API:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Error communicating with GPT API' });
  }
});

module.exports = router;