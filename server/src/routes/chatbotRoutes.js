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
  'recommend_crime': { type: 'movie', genreId: 80 },
  'recommend_documentary': { type: 'movie', genreId: 99 },
  'recommend_drama': { type: 'movie', genreId: 18 },
  'recommend_family': { type: 'movie', genreId: 10751 },
  'recommend_fantasy': { type: 'movie', genreId: 14 },
  'recommend_history': { type: 'movie', genreId: 36 },
  'recommend_horror': { type: 'movie', genreId: 27 },
  'recommend_music': { type: 'movie', genreId: 10402 },
  'recommend_mystery': { type: 'movie', genreId: 9648 },
  'recommend_romance': { type: 'movie', genreId: 10749 },
  'recommend_romcom': { type: 'movie', genreId: '10749,35' },
  'recommend_scifi': { type: 'movie', genreId: 878 },
  'recommend_thriller': { type: 'movie', genreId: 53 },
  'recommend_tvmovie': { type: 'movie', genreId: 10770 },
  'recommend_war': { type: 'movie', genreId: 10752 },
  'recommend_western': { type: 'movie', genreId: 37 },

  // TV Shows
  'recommend_action_tv': { type: 'tv', genreId: 10759 },
  'recommend_adventure_tv': { type: 'tv', genreId: 10759 },
  'recommend_animation_tv': { type: 'tv', genreId: 16 },
  'recommend_comedy_tv': { type: 'tv', genreId: 35 },
  'recommend_crime_tv': { type: 'tv', genreId: 80 },
  'recommend_documentary_tv': { type: 'tv', genreId: 99 },
  'recommend_drama_tv': { type: 'tv', genreId: 18 },
  'recommend_family_tv': { type: 'tv', genreId: 10751 },
  'recommend_fantasy_tv': { type: 'tv', genreId: 10765 },
  'recommend_kids_tv': { type: 'tv', genreId: 10762 },
  'recommend_horror_tv': { type: 'tv', genreId: 27 },
  'recommend_mystery_tv': { type: 'tv', genreId: 9648 },
  'recommend_news_tv': { type: 'tv', genreId: 10763 },
  'recommend_reality_tv': { type: 'tv', genreId: 10764 },
  'recommend_romance_tv': { type: 'tv', genreId: 10749 },
  'recommend_romcom_tv': { type: 'tv', genreId: '10749,35' },
  'recommend_scifi_tv': { type: 'tv', genreId: 10765 },
  'recommend_soap_tv': { type: 'tv', genreId: 10766 },
  'recommend_talk_tv': { type: 'tv', genreId: 10767 },
  'recommend_war_and_politics_tv': { type: 'tv', genreId: 10768 },
  'recommend_western_tv': { type: 'tv', genreId: 37 },
};

// Function to remove duplicates based on ID and media_type
function removeDuplicates(mediaArray) {
  const uniqueResults = [];
  const idsSet = new Set();

  for (const item of mediaArray) {
    const uniqueKey = `${item.id}-${item.media_type}`;

    if (!idsSet.has(uniqueKey)) {
      idsSet.add(uniqueKey);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

// Adjusted chatbot route to handle both title and person searches correctly with deduplication
router.post('/', async (req, res) => {
  const { userInput } = req.body;

  console.log('Received user input:', userInput);

  try {
    // Process user input through NLP
    const nlpResult = await processInput(userInput);
    console.log('NLP Result:', nlpResult);

    const { intent, title, person } = nlpResult;

    let combinedResults = [];

    // Handle the unified search intent for movies, TV shows, and persons
    if (intent === 'search_movie_or_tv_or_person') {
      // If titles exist, search for each title separately
      if (title && title.length > 0) {
        for (const singleTitle of title) {
          const movieResults = await searchMediaByTitle(singleTitle, 'search_movie');
          const tvResults = await searchMediaByTitle(singleTitle, 'search_tv');

          combinedResults = [...combinedResults, ...movieResults, ...tvResults];
        }
      }

      // If persons exist, add them to the combined results
      if (person && person.length > 0) {
        for (const singlePerson of person) {
          const personResults = await searchPersonByName(singlePerson);
          combinedResults = [...combinedResults, ...personResults];
        }
      }

      // Apply deduplication before returning results
      const uniqueResults = removeDuplicates(combinedResults);

      console.log('Combined and deduplicated movie, TV, and person results:', uniqueResults);

      if (uniqueResults.length > 0) {
        return res.json({
          message: `Here are some results matching your search:`,
          media: uniqueResults,
        });
      } else {
        return res.json({
          message: `Sorry, no results found for your search.`,
        });
      }
    }

    // Handle genre-based recommendation intent
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

// Function to search for movies or TV shows by title (also fetching trailers and credits)
async function searchMediaByTitle(query, type) {
  const mediaType = type === 'search_movie' ? 'movie' : 'tv';
  const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    console.log(`TMDB response for ${query}:`, response.data);

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
          poster_path: item.poster_path,
          media_type: mediaType,
          vote_average: item.vote_average !== undefined ? item.vote_average : 0,
          trailerUrl,
          credits, 
        };
      })
    );

    return mediaData;
  } catch (error) {
    console.error(`Error searching ${mediaType} by title from TMDB:`, error);
    throw new Error(`Failed to search ${mediaType}`);
  }
}

// Function to search for a person by name
async function searchPersonByName(query) {
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);

    // If no results are found, return a user-friendly message
    if (response.data.results.length === 0) {
      return [{ message: `No persons found matching "${query}".` }];
    }

    return response.data.results.map((person) => ({
      id: person.id,
      name: person.name,
      media_type: 'person',
      profile_path: person.profile_path 
          ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
          : null,
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
    return response.data.cast.slice(0, 10); 
  } catch (error) {
    console.error(`Error fetching credits for ${media_type} ${media_id}:`, error.message);
    return [];
  }
}

// Function to fetch movies or TV shows by genre from TMDB and include trailers and credits
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
          poster_path: item.poster_path,
          media_type: mediaType,
          vote_average: item.vote_average !== undefined ? item.vote_average : 0,
          trailerUrl,
          credits,
        };
      })
    );

    return mediaData;
  } catch (error) {
    console.error(`Error fetching ${mediaType} from TMDB:`, error);
    throw new Error(`Failed to fetch ${mediaType}`);
  }
}

module.exports = router;