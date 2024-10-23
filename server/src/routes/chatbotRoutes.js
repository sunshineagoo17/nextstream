const express = require('express');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

const bucketName = 'nextstream'; 
const fileName = 'nlpService.js'; 
const localNLPFilePath = path.join(__dirname, '../services/nlpService.js');

// Function to download the NLP service file from Google Cloud Storage
async function downloadNLPServiceFile() {
  try {
    await storage.bucket(bucketName).file(fileName).download({ destination: localNLPFilePath });
    console.log(`Downloaded NLP service file to ${localNLPFilePath}`);
  } catch (error) {
    console.error('Error downloading NLP service file:', error);
    throw new Error('Failed to download NLP service file');
  }
}

async function processInputFromNLPService(userInput) {
  try {
    // Check if the file already exists before downloading
    if (!fs.existsSync(localNLPFilePath)) {
      await downloadNLPServiceFile();
    }

    // Dynamically load the file after downloading it
    const nlpService = require(localNLPFilePath);

    // Call the processInput function from the module
    const nlpResult = await nlpService.processInput(userInput);

    return nlpResult;
  } catch (error) {
    console.error('Error processing NLP service:', error);
    throw new Error('Failed to process input with NLP service');
  }
}

// Map to handle genres by intent
const genreMap = {
  // Movies
  recommend_action: { type: 'movie', genreId: 28 },
  recommend_adventure: { type: 'movie', genreId: 12 },
  recommend_animation: { type: 'movie', genreId: 16 },
  recommend_comedy: { type: 'movie', genreId: 35 },
  recommend_crime: { type: 'movie', genreId: 80 },
  recommend_documentary: { type: 'movie', genreId: 99 },
  recommend_drama: { type: 'movie', genreId: 18 },
  recommend_family: { type: 'movie', genreId: 10751 },
  recommend_fantasy: { type: 'movie', genreId: 14 },
  recommend_history: { type: 'movie', genreId: 36 },
  recommend_horror: { type: 'movie', genreId: 27 },
  recommend_music: { type: 'movie', genreId: 10402 },
  recommend_mystery: { type: 'movie', genreId: 9648 },
  recommend_romance: { type: 'movie', genreId: 10749 },
  recommend_romcom: { type: 'movie', genreId: '10749,35' },
  recommend_scifi: { type: 'movie', genreId: 878 },
  recommend_thriller: { type: 'movie', genreId: 53 },
  recommend_tvmovie: { type: 'movie', genreId: 10770 },
  recommend_war: { type: 'movie', genreId: 10752 },
  recommend_western: { type: 'movie', genreId: 37 },

  // TV Shows
  recommend_action_tv: { type: 'tv', genreId: 10759 },
  recommend_adventure_tv: { type: 'tv', genreId: 10759 },
  recommend_animation_tv: { type: 'tv', genreId: 16 },
  recommend_comedy_tv: { type: 'tv', genreId: 35 },
  recommend_crime_tv: { type: 'tv', genreId: 80 },
  recommend_documentary_tv: { type: 'tv', genreId: 99 },
  recommend_drama_tv: { type: 'tv', genreId: 18 },
  recommend_family_tv: { type: 'tv', genreId: 10751 },
  recommend_fantasy_tv: { type: 'tv', genreId: 10765 },
  recommend_kids_tv: { type: 'tv', genreId: 10762 },
  recommend_horror_tv: { type: 'tv', genreId: 27 },
  recommend_mystery_tv: { type: 'tv', genreId: 9648 },
  recommend_news_tv: { type: 'tv', genreId: 10763 },
  recommend_reality_tv: { type: 'tv', genreId: 10764 },
  recommend_romance_tv: { type: 'tv', genreId: 10749 },
  recommend_romcom_tv: { type: 'tv', genreId: '10749,35' },
  recommend_scifi_tv: { type: 'tv', genreId: 10765 },
  recommend_soap_tv: { type: 'tv', genreId: 10766 },
  recommend_talk_tv: { type: 'tv', genreId: 10767 },
  recommend_war_and_politics_tv: { type: 'tv', genreId: 10768 },
  recommend_western_tv: { type: 'tv', genreId: 37 },
};

const categoryMap = {
  // Movies
  now_playing_movies: { type: 'movie', url: '/movie/now_playing' },
  popular_movies: { type: 'movie', url: '/movie/popular' },
  top_rated_movies: { type: 'movie', url: '/movie/top_rated' },
  upcoming_movies: { type: 'movie', url: '/movie/upcoming' },

  // TV Shows
  airing_today_tv: { type: 'tv', url: '/tv/airing_today' },
  on_the_air_tv: { type: 'tv', url: '/tv/on_the_air' },
  popular_tv: { type: 'tv', url: '/tv/popular' },
  top_rated_tv: { type: 'tv', url: '/tv/top_rated' },
};

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
    const nlpResult = await processInputFromNLPService(userInput); 
    console.log('NLP Result:', nlpResult);

    const { intent, title, person } = nlpResult;

    let combinedResults = [];

    // Characters

    // Aang
    if (intent === 'char_aang') {
      const theLastAirbenderMedia = [
        'The Last Airbender',
        'Avatar: The Last Airbender',
        'Avatar the Last Airbender',
        'Aang: The Last Airbender',
      ];

      const results = await Promise.all(
        theLastAirbenderMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Alfred Pennyworth
    else if (
      intent === 'char_alfred_pennyworth_movie' ||
      intent === 'char_alfred_pennyworth_show'
    ) {
      const alfredShows = ["Pennyworth: The Origin of Batman's Butler"];

      const results = await Promise.all(
        alfredShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Ariel
    else if (intent === 'chitchat_fave_disney_princess') {
      const littleMermaidMedia = [
        'The Little Mermaid',
        "The Little Mermaid: Ariel's Beginning",
        "The Little Mermaid II: Return to the Sea",
        "The Little Mermaid Live!",
        "Adventures of the Little Mermaid",
        "Little Mermaid's Island",
        "The Mermaid Princess",
        "Shirley Temple's Storybook: The Little Mermaid"
      ];

      const results = await Promise.all(
        littleMermaidMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Arya, Ned Stark and Jon Snow
    else if (intent === 'char_arya_stark' || intent === 'char_jon_snow' || intent === 'char_ned_stark' || intent === 'chitchat_fave_tv_show_character' || intent === 'quotes_winter_is_coming') {
      const gameOfThronesMedia = [
        'Game of Thrones',
        'House of the Dragon',
        "The Game of Thrones Reunion Hosted by Conan O'Brien",
        'Game of Thrones - Conquest & Rebellion: An Animated History of the Seven Kingdoms',
        'Game of Thrones: The Last Watch',
        'Game of Thrones: The Story So Far',
        'Game of Thrones: A Day in the Life',
        'Game of Thrones The IMAX Experience',
        'Game of Thrones Live Concert Experience 2018',
        "Coldplay's Game of Thrones: The Musical",
        'Purge of Kingdoms',
        'A Knight of the Seven Kingdoms: The Hedge Knight',
      ];

      const results = await Promise.all(
        gameOfThronesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Bruce Wayne
    else if (intent === 'char_bruce_wayne') {
      const batmanMedia = [
        'The Dark Knight',
        'The Dark Knight Rises',
        'Batman Begins',
        'Batman Returns',
        'Batman Forever',
        'Batman & Robin',
        'The Lego Batman Movie',
        'Batman: Mask of the Phantasm',
        'Batman: Year One',
        'Batman: The Dark Knight Returns, Part 1',
        'Batman: The Dark Knight Returns, Part 2',
        'Batman vs Teenage Mutant Ninja Turtles',
        'Batman: Hush',
        'Batman Ninja',
        'Batman',
        'The Batman',
        'Batman v Superman: Dawn of Justice',
        'Batman: The Long Halloween, Part Two',
        'Batman: Death in the Family',
        "Pennyworth: The Origin of Batman's Butler",
        'Batman: The Animated Series',
        'Batman: The Doom That Came to Gotham',
        'Batman Unlimited',
        'Batman: The Brave and the Bold',
        'Batman Beyond',
        'Beware the Batman',
        'Batman: Caped Crusader',
        'The New Batman Adventures',
        'Batman: Black and White Motion Comics',
        'The New Adventures of Batman',
        'The Adventures of Batman',
        'Icons Unearthed: Batman',
        'Batman Adventures: Mad Love',
        'The Bat Man of Shanghai',
      ];

      const results = await Promise.all(
        batmanMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Buzz Lightyear
    else if (intent === 'quotes_infinity_beyond') {
      const toyStoryMovies = [
        'Toy Story',
        'Toy Story 2',
        'Toy Story 3',
        'Toy Story 4',
        'Toy Story 5',
        'Lightyear',
        'Toy Story Treats',
        'Buzz Lightyear of Star Command',
        'Beyond Infinity: Buzz and the Journey to Lightyear'
      ];

      const results = await Promise.all(
        toyStoryMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Clark Kent
    else if (intent === 'char_clark_kent') {
      const supermanMedia = [
        'Man of Steel',
        'Lois & Clark: The New Adventures of Superman',
        'Superman',
        'Superman IV: The Quest for Peace',
        'Superman II',
        'Batman v Superman: Dawn of Justice',
        'Superman Returns',
        'Superman: Doomsday',
        'The Death and Return of Superman',
        'My Adventures with Superman',
        'Superman & Lois',
        'Superman: The Animated Series',
        'Adventures of Superman',
        'Christopher Reeve, Superman Forever',
        'Justice League',
        "Zack Snyder's Justice League",
        'Justice League: Crisis on Infinite Earths Part One',
        'Justice League: Crisis on Infinite Earths Part Two',
        'Justice League: Warworld',
        'Justice League Dark: Apokolips War',
        'Justice League: War',
        'Justice League: The Flashpoint Paradox',
        'Justice League: Throne of Atlantis',
        'Justice League vs. Teen Titans',
        'Justice League: Crisis on Two Earths',
        'Justice League: Gods and Monsters',
        'Justice League: The New Frontier',
        'Justice League: Doom',
        'Justice League: Secret Origins',
        'Justice League Dark',
        'Justice League vs. the Fatal Five',
        'Justice League x RWBY: Super Heroes & Huntsmen, Part One',
        'Justice League x RWBY: Super Heroes & Huntsmen, Part Two',
        'Justice League Unlimited',
        'Justice League: Crisis on Infinite Earths Part Three',
        'Justice League Action',
        'Justice League: Gods and Monsters Chronicles',
        'Superman: Red Son',
        'Supermansion',
        'The Superman/Aquaman Hour of Adventure',
        'A Man Who Was Superman',
        'The Superman Age',
      ];

      const results = await Promise.all(
        supermanMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Coraline
    else if (intent === 'char_coraline_jones') {
      const coralineMedia = [
        'Coraline',
        'Rebuilding Coraline',
        'Coraline: Creepy Coraline',
        "Coraline: The Making of 'Coraline'",
        'The Nightmare Before Christmas',
        'The Nightmare Before Christmas: The Original Poem',
        'Kubo and the Two Strings',
      ];

      const results = await Promise.all(
        coralineMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Doctor Who
    else if (intent === 'char_the_doctor' || intent === 'quotes_doctor_who') {
      const doctorWhoMedia = [
        'Doctor Who',
        'Doctor Who Confidential',
        'Doctor Who: The Day of the Doctor',
        'Doctor Who Extra',
        'Doctor Who: The Doctors Revisited',
        'Doctor Who Greatest Moments',
        'Doctor Who: Unleashed',
        'Doctor Who: Lost in Time',
        'Doctor Who: Dreamland',
        'Doctor Who: Real Time',
        'Doctor Who: Video Commentaries',
        'Doctor Who Monster Files',
        'Doctor Who: Fury from the Deep',
        'Doctor Who: Scream of the Shalka',
        "Doctor Who's Who's Who",
        'Doctor Who Then & Now',
        'Totally Doctor Who',
      ];

      const results = await Promise.all(
        doctorWhoMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Daryl Dixon, Glenn, Maggie, Michonne, and Rick Grimes
    else if (intent === 'char_daryl_dixon_show' || intent === 'char_michonne_show' || intent === 'char_rick_grimes_show' || intent === 'char_glenn_show' || intent === 'char_maggie_show') {
      const theWalkingDeadMedia = [
        'The Walking Dead',
        'The Walking Dead: Daryl Dixon',
        'The Walking Dead: Dead City',
        'The Walking Dead: Origins',
        'The Walking Dead: The Ones Who Live',
        'The Walking Dead: The Return',
        'The Walking Dead: World Beyond',
        'The Walking Dead - Webisodes',
        'The Last Drive-in: The Walking Dead',
        'The Making of The Walking Dead',
        'Talking Dead',
        'The Walking Dead: Best of Rick',
        'Tales of the Walking Dead',
        'Fear the Walking Dead',
        'Fear the Walking Dead: Passage',
        'Fear the Walking Dead: Dead in the Water',
      ];

      const results = await Promise.all(
        theWalkingDeadMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // E.T.
    else if (intent === 'quotes_et_phone_home') {
      const ETPhoneHomeMedia = [
        'E.T. the Extra-Terrestrial',
        "The Making of 'E.T. the Extra-Terrestrial'",
        'E.T. the Extra-Terrestrial 20th Anniversary Special',
        'The Iron Giant',
        'Super 8',
        'Close Encounters of the Third Kind',
        'The Goonies',
        'Bumblebee',
        'Explorers',
        'Paul',
        'A Wrinkle in Time',
        'Earth to Echo'
      ];

      const results = await Promise.all(
        ETPhoneHomeMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Ghostbusters
    else if (intent === 'quotes_who_gonna_call') {
      const ghostbustersMovies = [
        'Ghostbusters',
        'The Real Ghostbusters',
        'Ghostbusters: Frozen Empire',
        'Ghostbusters: Afterlife',
        'Ghostbusters II',
        'The Real Ghostbusters: Slimefighters',
        'Slimer! and the Real Ghostbusters',
        'Extreme Ghostbusters'
      ];

      const results = await Promise.all(
        ghostbustersMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Gru and Minions
    else if (intent === 'char_gru' || intent === 'char_minions') {
      const despicableMeMedia = [
        'Despicable Me',
        'Despicable Me 2',
        'Despicable Me 3',
        'Depicable Me 4',
        'Minions',
        'Minions: The Rise of Gru',
        'Minions 3',
        'Minions: 3 Mini-Movie Collection',
        'Minions: Holiday Special',
        'Minions: Home Makeover',
        'Minions: Orientation Day',
        'Minions: Training Wheels',
        'Minions & Monsters',
        'Minions & More 1',
        'Minions & More Volume 2',
        'The Minion Olympics',
        'Minions Jingle Bells',
        'Mower Minions',
        'Despicable Me: Minion Mayhem',
        'Despicable Me 2: 3 Mini-Movie Collection',
        'Despicable Me 2: Gadgets Galore',
        'Despicable Me Presents: Minion Madness',
      ];

      const results = await Promise.all(
        despicableMeMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Heisenberg / Walter White, Jesse Pinkman, and Saul Goodman
    else if (intent === 'char_heisenberg' || intent === 'char_walter_white' || intent === 'char_jesse_pinkman' || intent === "char_saul_goodman") {
      const breakingBadMedia = [
        'Breaking Bad',
        'El Camino: A Breaking Bad Movie',
        'Better Caul Saul',
        'The Road to El Camino: Behind the Scenes of El Camino: A Breaking Bad Movie',
        'No Half Measures: Creating the Final Season of Breaking Bad',
        'Better Call Saul Employee Training',
        "Better Call Saul Presents: Slippin' Jimmy"
      ];

      const results = await Promise.all(
        breakingBadMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Hiccup
    else if (intent === 'char_hiccup') {
      const howToTrainYourDragonMedia = [
        'How to Train Your Dragon',
        'How to Train Your Dragon 2',
        'How to Train Your Dragon: Homecoming',
        'How to Train Your Dragon: The Hidden World',
        'How to Train Your Dragon: Snoggletog Log',
        'How To Train Your Dragon: The Short Film Collection',
        'How to Train Your Dragon - Legends',
        'Book of Dragons',
        'Dragons: Gift of the Night Fury',
        "Legend of the BoneKnapper Dragon",
        'Where No One Goes: The Making of How to Train Your Dragon 2'
      ];

      const results = await Promise.all(
        howToTrainYourDragonMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Homer Simpson
    else if (intent === 'char_homer_simpson' || intent === 'quotes_doh') {
      const simpsonsMedia = [
        'The Simpsons',
        "The Simpsons Meet the Bocellis in “Feliz Navidad”",
        'The Simpsons in Plusaversary',
        'The Simpsons 20th Anniversary Special - In 3D! On Ice',
        'The Simpsons: Christmas 2',
        'The Simpsons: Christmas',
        'The Simpsons: Treehouse of Horror',
        'The Simpsons Movie 2',
        'The Simpsons: Treehouse of Horror',
        '20 years of Simpsons',
        "The Simpsons - On Your Marks, Get Set, D'oh!",
        'The Simpsons - Kiss and Tell: The Story of Their Love',
        'The Simpsons: The Dark Secrets of The Simpsons',
        'The Simpsons & Bad Bunny: Te deseo lo mejor',
        'May the 12th Be with You',
        'The Simpsons: Christmas 2',
        'Icons Unearthed: The Simpsons',
        'The Simpsons: Viva Los Simpsons',
        'The Simpsons: Too Hot For TV'
      ];

      const results = await Promise.all(
        simpsonsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Indiana Jones
    else if (intent === 'chitchat_fave_movie_character' || intent === 'q_and_a_recommend_indiana_jones') {
      const indianaJonesMedia = [
        'Indiana Jones and the Dial of Destiny',
        'Indiana Jones and the Last Crusade',
        'Indiana Jones and the Kingdom of the Crystal Skull',
        "Indiana Jones: The Search for the Lost Golden Age",
        'Indiana Jones and the Temple of Doom',
        'The Young Indiana Jones Chronicles',
        'The Adventures of Young Indiana Jones',
      ];

      const results = await Promise.all(
        indianaJonesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Joker
    else if (intent === 'char_joker' || intent === 'quotes_why_so_serious') {
      const jokerMedia = [
        'Joker',
        'Joker: Folie à Deux',
        'The Dark Knight',
        'Batman',
        'Batman Unlimited',
      ];

      const results = await Promise.all(
        jokerMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

     // Julia Child
     else if (intent === 'char_julia_child_movies') {
      const juliaChildMedia = [
        'Julie & Julia',
        "The Way to Cook",
        "Julia Child! America's Favorite Chef",
        "Julia Child: An Appetite for Life",
        "Julia Child & Company",
        "The Julia Child Challenge",
        "Dishing with Julia Child",
        "Julia",
        "In Julia's Kitchen with Master Chefs",
        "The French Chef"
      ];

      const results = await Promise.all(
        juliaChildMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Patrick Bateman
    else if (intent === 'char_patrick_bateman') {
      const americanPsychoMedia = [
        'American Psycho',
        "American Psycho II: All American Girl"
      ];

      const results = await Promise.all(
        americanPsychoMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Peter Griffin and Stewie Griffin
    else if (intent === 'char_peter_griffin' || intent === 'char_stewie_griffin') {
      const familyGuyMedia = [
        'Family Guy',
        "Family Guy Presents: It's a Trap!",
        'Family Guy Presents... Stewie Griffin: The Untold Story',
        'Family Guy Presents: Blue Harvest',
        'Family Guy Presents: Something, Something, Something, Dark Side',
        "A Very Special Family Guy Freakin' Christmas",
        'Family Guy Presents: Stewie Kills Lois and Lois Kills Stewie',
        'Family Guy: Creating the Chaos',
        "Family Guy Presents: Seth & Alex's Almost Live Comedy Show",
        "Family Guy COVID-19 Vaccine Awareness PSA",
        "America Dad!",
        'The Cleveland Show',
        'Ted',
        'Ted 2'
      ];

      const results = await Promise.all(
        familyGuyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Regina George
    else if (intent === 'char_regina_george') {
      const meanGirlsMedia = [
        'Mean Girls',
        'Mean Girls 2'
      ];

      const results = await Promise.all(
        meanGirlsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Shrek
    else if (intent === 'chitchat_fave_animated_character') {
      const shrekMedia = [
        'Shrek',
        'Shrek 2',
        'Shrek Forever After',
        "Shrek the Third",
        'Shrek 5',
        'Shrek the Halls',
        'Shrek the Musical',
        "Donkey's Christmas Shrektacular",
        "Scared Shrekless",
        "Shrek's Thrilling Tales"
      ];

      const results = await Promise.all(
        shrekMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Willy Wonka
    else if (intent === 'char_willy_wonka') {
      const willyWonkaMedia = [
        'Willy Wonka & the Chocolate Factory',
        'Wonka',
        "Pure Imagination: The Story of 'Willy Wonka & the Chocolate Factory'",
        'Tom and Jerry: Willy Wonka and the Chocolate Factory'
      ];

      const results = await Promise.all(
        willyWonkaMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Chitchat

    // Fave Actress - Cate Blanchett
    else if (intent === 'chitchat_fave_actress') {
      const cateBlanchettMedia = [
        'The Lord of the Rings: The Fellowship of the Ring',
        'Tár',
        'The Curious Case of Benjamin Button',
        'How to Train Your Dragon 2',
        "Ocean's Eight",
        "Thor: Ragnarok",
        "Carol",
        "The Aviator",
        "Indiana Jones and the Kingdom of the Crystal Skull"
      ];

      const results = await Promise.all(
        cateBlanchettMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fave Celeb - Hugh Jackman
    else if (intent === 'chitchat_fave_celeb' || intent === 'chitchat_fave_actor') {
      const hughJackmanMedia = [
        'The Greatest Showman',
        "Logan",
        "The Prestige",
        "Prisoners",
        "Real Steel",
        "The Fountain",
        "Chappie",
        "Kate & Leopold",
        "Van Helsing",
        "The Wolverine",
        "Deadpool & Wolverine",
        "X-Men: Days of Future Past"
      ];

      const results = await Promise.all(
        hughJackmanMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fave Director
    else if (intent === 'chitchat_fave_director') {
      const christopherNolanMedia = [
        'Memento',
        "Insomnia",
        "The Prestige",
        "Inception",
        "The Dark Knight Rises",
        "Batman Begins",
        "The Dark Knight",
        "Interstellar",
        "Dunkirk",
        "Tenet",
        "Oppenheimer"
      ];

      const results = await Promise.all(
        christopherNolanMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fave Movie - AI-related
    else if (intent === 'chitchat_fave_movie' || intent === 'q_and_a_recommend_show_ai_movies') {
      const aiMoviesMedia = [
        "Ex Machina",
        "Her",
        "The Matrix",
        'Blade Runner',
        "The Terminator",
        "I, Robot",
        "Ghost in the Shell",
        "Transcendence",
        "WarGames",
        "The Bicentennial Man",
        "Chappie",
        "Upgrade",
        "Humans",
        "Westworld",
        "Black Mirror",
        "Devs",
        "Person of Interest",
        "Altered Carbon"
      ];

      const results = await Promise.all(
        aiMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Fave Movie Quote

    // Citizen Kane
    else if (intent === 'quotes_citizen_kane') {
      const citizenKaneMovies = [
        'Citizen Kane',
        'Casablanca',
        'The Godfather',
        'There Will Be Blood',
        'Raging Bull',
        'The Social Network',
        "All the King's Men",
        'Chinatown',
        'The Great Gatsby',
        'A Face in the Crowd',
        'The Aviator',
        'Lawrence of Arabia'
      ];

      const results = await Promise.all(
        citizenKaneMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Elf
    else if (intent === 'quotes_elf') {
      const elfMovies = [
        'Elf',
        'Home Alone',
        'The Santa Clause',
        'How the Grinch Stole Christmas',
        'The Polar Express',
        'A Christmas Story',
        "Jingle All the Way",
        'The Nightmare Before Christmas',
        'Fred Claus',
        'Noelle',
        'Arthur Christmas',
        'A Christmas Carol'
      ];

      const results = await Promise.all(
        elfMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Field of Dreams
    else if (intent === 'quotes_field_of_dreams') {
      const fieldOfDreamsMovies = [
        'Field of Dreams',
        'The Natural',
        'Moneyball',
        'Angels in the Outfield',
        'Miracle',
        "Mr. Holland's Opus",
        'October Sky',
        'For Love of the Game',
        'The Blind Side',
        'The Pursuit of Happyness'
      ];

      const results = await Promise.all(
        fieldOfDreamsMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // James Bond
    else if (intent === 'quotes_james_bond_shaken') {
      const jamesBondMovies = [
        'Dr. No',
        'Diamonds Are Forever',
        "For Your Eyes Only",
        'From Russia with Love',
        'Goldfinger',
        "Licence to Kill",
        "Live and Let Die",
        "Moonraker",
        "Octopussy",
        "On Her Majesty's Secret Service",
        "The Spy Who Loved Me",
        'Thunderball',
        "A View to a Kill",
        'You Only Live Twice',
      ];

      const results = await Promise.all(
        jamesBondMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // King Kong
    else if (intent === 'quotes_king_kong') {
      const kingKongMovies = [
        'King Kong',
        'Godzilla',
        'Jurassic Park',
        'Pacific Rim',
        'Cloverfield',
        'Kong: Skull Island',
        'Mighty Joe Young',
        'Rampage',
        'The Mummy',
        'Jaws'
      ];

      const results = await Promise.all(
        kingKongMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Maltese Falcon
    else if (intent === 'quotes_maltese_falcon') {
      const malteseFalconMovies = [
        'The Maltese Falcon',
        'Double Indemnity',
        'Sunset Boulevard',
        'The Big Sleep',
        'Chinatown',
        'The Third Man',
        'Out of the Past',
        'Laura',
        'Kiss Me Deadly',
        'The Lady from Shanghai',
        'Touch of Evil',
        'Body Heat'
      ];

      const results = await Promise.all(
        malteseFalconMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Planet of the Apes
    else if (intent === 'quotes_planet_of_the_apes') {
      const planetOfTheApesMovies = [
        'Kingdom of the Planet of the Apes',
        'Rise of the Planet of the Apes',
        'Dawn of the Planet of the Apes',
        'War of the Planet of the Apes',
        'Blade Runner',
        '2001: A Space Odyssey'
      ];

      const results = await Promise.all(
        planetOfTheApesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Scarface
    else if (intent === 'quotes_say_hello_little_friend') {
      const scarfaceMovies = [
        'Scarface',
        'The Godfather',
        'The Godfather Part II',
        'The Godfather Part III',
        'Goodfellas',
        'Casino',
        "Carlito's Way",
        'Heat',
        'Blow',
        'The Departed',
        'City of God',
        'Once Upon a Time in America',
        'American Gangster',
        'The Untouchables',
        'Donnie Brasco',
        'Public Enemies'
      ];

      const results = await Promise.all(
        scarfaceMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sherlock Holmes
    else if (intent === 'quotes_sherlock_holmes' || intent === 'q_and_a_recommend_sherlock_holmes') {
      const sherlockHolmesMovies = [
        'Sherlock Holmes',
        'Sherlock Holmes: A Game of Shadows',
        'Mr. Holmes',
        'The Adventures of Sherlock Holmes',
        'Young Sherlock Holmes',
        'Sherlock',
        'Poirot',
        'The Private Life of Sherlock Holmes',
        'The Hound of the Baskervilles',
        'Elementary',
        'The Case of the Silk Stocking'
      ];

      const results = await Promise.all(
        sherlockHolmesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // The Shining
    else if (intent === 'quotes_heres_johnny') {
      const theShiningMovies = [
        'The Shining',
        'Hereditary',
        'The Witch',
        "Rosemary's Baby",
        'The Lighthouse',
        'Black Swan',
        'The Babadook',
        "Jacob's Ladder",
        'Doctor Sleep',
        'It Follows',
        'Session 9',
        'Midsommar',
        'The Exorcist',
        'The Silence of the Lambs'
      ];

      const results = await Promise.all(
        theShiningMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sudden Impact
    else if (intent === 'quotes_sudden_impact') {
      const suddenImpactMovies = [
        'Sudden Impact',
        'Gran Torino',
        'Dirty Harry',
        'Magnum Force',
        'Death Wish',
        'Cobra',
        'The Punisher',
        'Point Blank',
        'The Enforcer',
        'Hard to Kill',
        'Lethal Weapon',
        'Man on Fire',
        'A History of Violence'
      ];

      const results = await Promise.all(
        suddenImpactMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Taxi Driver
    else if (intent === 'quotes_you_talking_to_me') {
      const taxiDriverMovies = [
        'Taxi Driver',
        'Joker',
        'Drive',
        'American Psycho',
        'Falling Down',
        'Nightcrawler',
        'Requiem for a Dream',
        'A Clockwork Orange',
        'Fight Club',
        'Raging Bull',
        'You Were Never Really Here',
        'Blue Velvet',
        'The King of Comedy',
        'Mean Streets',
        'Collateral'
      ];

      const results = await Promise.all(
        taxiDriverMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    else if (intent === 'chitchat_fave_movie_quote' || intent === 'quotes_hasta_la_vista') {
      const faveMovieQuoteMedia = [
        "The Terminator",
        "Terminator 2: Judgment Day",
        "Terminator 3: Rise of the Machines",
        "Terminator Salvation",
        "Terminator Salvation: The Machinima Series",
        "Terminator Genisys",
        "Terminator: Dark Fate",
        "Terminator: The Sarah Connor Chronicles",
        "Terminator Zero",
      ];

      const results = await Promise.all(
        faveMovieQuoteMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Fave Show 
    else if (intent === 'chitchat_fave_show') {
      const siliconValleyMedia = [
        "Silicon Valley",
        'Breaking the Code',
        "The Imitation Game",
        "A Beautiful Mind",
        "The Theory of Everything",
        "Good Will Hunting",
        "The Man Who Knew Infinity",
        "The Social Network",
        "The Prestige",
        "Hidden Figures"
      ];

      const results = await Promise.all(
        siliconValleyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fave Superhero
    else if (intent === 'chitchat_fave_super') {
      const faveSuperheroMedia = [
        "Iron Man",
        "Iron Man: Armored Adventures",
        "Iron Man: Extremis",
        "Iron Man 2",
        "Iron Man 3",
        "Iron Man: Rise of Technovore",
      ];

      const results = await Promise.all(
        faveSuperheroMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // In Movies
    else if (intent === 'chitchat_in_movie') {
      const theMatrixMoviesMedia = [
        "The Matrix",
        "The Matrix Reloaded",
        "The Matrix Resurrections",
        "The Matrix Revolutions",
        "The Matrix Revisited",
        "The Matrix Recalibrated",
        "The Matrix Revolutions Revisited",
        "The Animatrix",
        "A Glitch in the Matrix",
        "Making 'Enter the Matrix'",
        "Making 'The Matrix'",
        "The Matrix Reloaded Revisited",
        "The Matrix Reloaded: Car Chase",
        "The Matrix Revolutions: Neo Realism - Evolution of Bullet Time",
        "The Matrix Revolutions: Double Agent Smith",
        "The Matrix: What Is Bullet-Time?",
        "Return to Source: The Philosophy of The Matrix",
        "The Matrix Revolutions: Super Big Mini Models",
      ];

      const results = await Promise.all(
        theMatrixMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // In TV Shows
    else if (intent === 'chitchat_in_tv_show' || intent === 'recommend_viral_shows') {
      const blackMirrorShowsMedia = [
        "Black Mirror",
        "Altered Carbon",
        "Devs",
        "Electric Dreams",
        "Humans",
        "Love, Death & Robots",
        "Maniac",
        "The Twilight Zone",
        "Westworld",
        "Years and Years"
      ];

      const results = await Promise.all(
        blackMirrorShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // LGBTQ
    else if (intent === 'chitchat_lgbtq') {
      const lgbtqMedia = [
        "Schitt's Creek",
        'The Birdcage',
        'Pose',
        'Euphoria',
        'Sort Of',
        'Good Omens',
        'The Boys in the Band',
        'The Half of It',
        'Lingua Franca',
        'Love, Simon',
        'Heartstopper',
        "The Death and Life of Marsha P. Johnson",
        'The Prom',
        'Queer Eye',
        'Sex Education',
        'The Umbrella Academy',
        'Queer Eye for the Straight Guy'
      ];

      const results = await Promise.all(
        lgbtqMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Marvel or DC
    else if (intent === 'chitchat_marvel_dc') {
      const marvelOrDCMedia = [
        "Avengers: Endgame",
        "Spider-Man: Into the Spider-Verse",
        "Black Panther",
        "Iron Man",
        "Captain America: The First Avenger",
        "Guardians of the Galaxy",
        "Logan",
        "Deadpool",
        "X-Men '97",
        "X-Men: Days of Future Past",
        "The Dark Knight",
        "Wonder Woman",
        "Man of Steel",
        "Shazam!",
        "Joker",
        "Aquaman",
        "The Suicide Squad",
        "Zack Snyder's Justice League",
        "The Flash",
        "Smallville"
      ];

      const results = await Promise.all(
        marvelOrDCMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Star Wars
    else if (intent === 'chitchat_star_wars' || intent === 'quotes_star_wars_droids' || intent === 'quotes_star_wars_father' || intent === 'quotes_may_the_force' || intent === 'q_and_a_recommend_star_wars' || intent === 'chitchat_random_fact') {
      const starWarsMedia = [
        "The Mandalorian",
        "Star Wars",
        "Star Wars: Andor",
        "Obi-Wan Kenobi",
        "Star Wars: Episode I - The Phantom Menace",
        "Star Wars: Episode II - Attack of the Clones",
        "Star Wars: Episode III - Revenge of the Sith",
        "Star Wars: The Force Awakens",
        "Star Wars: The Last Jedi",
        "Star Wars: The Rise of Skywalker",
        "Star Wars Rebels",
        "Ahsoka",
        "LEGO Star Wars: All-Stars",
        "LEGO Star Wars Terrifying Tales",
        "Solo: A Star Wars Story",
        "Star Wars: The Clone Wars",
        "Rogue One: A Star Wars Story",
        "Robot Chicken: Star Wars",
      ];

      const results = await Promise.all(
        starWarsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Eras
    // 60s Films
    else if (intent === 'recommend_60s_movies') {
      const sixtiesMovies = [
        'Psycho',
        "Lawrence of Arabia",
        "2001: A Space Odyssey",
        "The Graduate",
        "To Kill a Mockingbird",
        "West Side Story",
        "Dr. Strangelove",
        "Bonnie and Clyde",
        "Breakfast at Tiffany's",
        "The Good, the Bad, and the Ugly"
      ];

      const results = await Promise.all(
        sixtiesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // 60s Shows
    else if (intent === 'recommend_60s_shows') {
      const sixtiesShows = [
        "Star Trek",
        "The Beverly Hillbillies",
        "The Twilight Zone",
        "Hogan's Heroes",
        "Petticoat Junction",
        "Bewitched",
        "The Andy Griffith Show",
        "Gilligan's Island",
        "I Dream of Jeannie",
        "Doctor Who",
        "The Outer Limits",
        "Green Acres"
      ];

      const results = await Promise.all(
        sixtiesShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // 70s Films
    else if (intent === 'recommend_70s_movies') {
      const seventiesMovies = [
        'The Godfather',
        "Rocky",
        "Jaws",
        "Apocalypse Now",
        "Taxi Driver",
        "Star Wars",
        "A Clockwork Orange",
        "One Flew Over the Cuckoo's Nest",
        "Chinatown"
      ];

      const results = await Promise.all(
        seventiesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // 70s Shows
    else if (intent === 'recommend_70s_shows') {
      const seventiesShows = [
        'M*A*S*H',
        "Sanford and Son",
        "All in the Family",
        "The Mary Tyler Moore Show",
        "Happy Days",
        "Columbo",
        "Little House on the Prairie",
        "Three's Company",
        "The Jeffersons",
        "The Six Million Dollar Man",
        "Charlie's Angels",
        "Laverne & Shirley",
        "Kojak",
        "The Brady Bunch"
      ];

      const results = await Promise.all(
        seventiesShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // 80s Films
    else if (intent === 'recommend_80s_movies') {
      const eightiesMovies = [
        "The Empire Strikes Back",
        "Back to the Future",
        "The Breakfast Club",
        "E.T. the Extra-Terrestrial",
        "Raiders of the Lost Ark",
        "The Shining",
        "Die Hard",
        "The Terminator",
        "Ghostbusters",
        "Raging Bull"
      ];

      const results = await Promise.all(
        eightiesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // 80s Shows
    else if (intent === 'recommend_80s_shows') {
      const eightiesShows = [
        'The Simpsons',
        "Cheers",
        "Miami Vice",
        "The A-Team",
        "Knight Rider",
        "Magnum, P.I.",
        "Family Ties",
        "Hill Street Blues",
        "Dallas",
        "The Wonder Years"
      ];

      const results = await Promise.all(
        eightiesShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // 90s Films
    else if (intent === 'recommend_90s_movies') {
      const ninetiesMovies = [
        'Pulp Fiction',
        "The Shawshank Redemption",
        "The Matrix",
        "Fight Club",
        "Schindler's List",
        "Jurassic Park",
        "Goodfellas",
        "Forrest Gump",
        "Titanic",
        "Saving Private Ryan"
      ];

      const results = await Promise.all(
        ninetiesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // 90s Shows
    else if (intent === 'recommend_90s_shows') {
      const ninetiesShows = [
        "Friends",
        "The X-Files",
        "Seinfeld",
        "Buffy the Vampire Slayer",
        "ER",
        "The Fresh Prince of Bel-Air",
        "The Sopranos",
        "Frasier",
        "Dawson's Creek",
        "Twin Peaks",
        "Charmed",
        "Will & Grace",
        "Boy Meets World",
        "Xena: Warrior Princess",
        "Daria",
        "Third Rock from the Sun",
        "Party of Five",
        "7th Heaven"
      ];

      const results = await Promise.all(
        ninetiesShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Holidays
    // Handle April Fools movie intent
    else if (intent === 'celebrate_april_fools') {
      const aprilFoolsMovies = [
        'Dumb and Dumber',
        "Ferris Bueller's Day Off",
        "April Fool's Day",
        'The Pink Panther',
        'The Mask',
        'Hot Fuzz',
      ];

      const results = await Promise.all(
        aprilFoolsMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Birthday movie intent
    else if (intent === 'celebrate_happy_birthday') {
      const birthdayMovies = [
        'Sixteen Candles',
        '13 Going on 30',
        'Happy Death Day',
        'The Birthday Party',
        'The Game',
        'Happy Birthday to Me',
      ];

      const results = await Promise.all(
        birthdayMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Boxing Day movie intent
    else if (intent === 'celebrate_boxing_day_movies') {
      const boxingDayMovies = [
        'Christmas in Connecticut',
        'Jingle All the Way',
        'Boxing Day',
        'The Family Stone',
        'Love Actually',
        'Confessions of a Shopaholic',
      ];

      const results = await Promise.all(
        boxingDayMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Boxing Day Shows
    else if (intent === 'celebrate_boxing_day_shows') {
      const boxingDayShows = [
        "The Great British Bake Off",
        "The Crown",
        "Downton Abbey",
        "Call the Midwife",
        "Father Ted",
        "The Vicar of Dibley",
        "Merry Christmas, Mr. Bean",
        "Big Fat Quiz"
      ];

      const results = await Promise.all(
        boxingDayShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Christmas movie intent
    else if (intent === 'celebrate_merry_christmas' || intent === 'recommend_santa_clause_movies') {
      const christmasMovies = [
        'Elf',
        "The Santa Clause",
        "A Christmas Story",
        "Miracle on 34th Street",
        'Klaus',
        'The Polar Express',
        'Die Hard',
        'The Grinch',
        'Love Actually',
      ];

      const results = await Promise.all(
        christmasMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Day of the Dead movie intent
    else if (intent === 'celebrate_day_of_the_dead_movies') {
      const dayOfTheDeadMovies = [
        'Coco',
        'The Book of Life',
        'Macario',
        'Spectre',
        'The Other Conquest',
        'The Dead',
        'Under the Volcano',
        'Muerte en el Altar',
        'Grave of the Fireflies',
        "Don't Swallow My Heart, Alligator Girl!",
      ];

      const results = await Promise.all(
        dayOfTheDeadMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Day of the Dead Shows
    else if (intent === 'celebrate_day_of_the_dead_shows') {
      const dayOfTheDeadShows = [
        "Maya and the Three",
        "Selena: The Series",
        "La Casa de las Flores",
        "Monarca",
        "El Día de los Muertos",
        "The Haunting of Hill House",
        "Maya and Miguel",
        "Day of the Dead"
      ];

      const results = await Promise.all(
        dayOfTheDeadShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Diwali movie intent
    else if (intent === 'celebrate_diwali_movies') {
      const diwaliMovies = [
        'Kabhi Khushi Kabhie Gham',
        'Hum Aapke Hain Koun..!',
        'Dilwale Dulhania Le Jayenge',
        'Prem Ratan Dhan Payo',
        'Taare Zameen Par',
        'Chhichhore',
      ];

      const results = await Promise.all(
        diwaliMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Diwali Shows
    else if (intent === 'celebrate_diwali_shows') {
      const diwaliShows = [
        "Mismatched",
        "Made in Heaven",
        "Delhi Crime",
        "The Big Day",
        "Yeh Meri Family",
        "Mighty Little Bheem: Diwali"
      ];

      const results = await Promise.all(
        diwaliShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Eid movie intent
    else if (intent === 'celebrate_eid_movies') {
      const eidMovies = [
        'Bajrangi Bhaijaan',
        'Ek Tha Tiger',
        'Sultan',
        'My Name is Khan',
        'Dangal',
      ];

      const results = await Promise.all(
        eidMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Eid Shows
    else if (intent === 'celebrate_eid_shows') {
      const eidShows = [
        "Kaisi Yeh Yaariyan",
        "Suno Chanda",
        "Churails",
        "Mann Mayal",
        "Crashing Eid",
        "One Day Eid Match",
        "Eid together"
      ];

      const results = await Promise.all(
        eidShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Halloween movie intent
    else if (intent === 'celebrate_halloween') {
      const halloweenMovies = [
        'Hocus Pocus',
        'The Nightmare Before Christmas',
        'Halloween',
        'Beetlejuice',
        'Coraline',
        'Scream',
      ];

      const results = await Promise.all(
        halloweenMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Hanukkah movie intent
    else if (intent === 'celebrate_hanukkah_movies') {
      const hanukkahMovies = [
        'An American Tail',
        'Full-Court Miracle',
        'The Hebrew Hammer',
        'Eight Crazy Nights',
        'Love, Lights, Hanukkah!',
        'Little Fockers',
      ];

      const results = await Promise.all(
        hanukkahMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Independence Day movie intent
    else if (intent === 'celebrate_independence_day_movies') {
      const independenceMovies = [
        'Independence Day',
        'Top Gun',
        'Saving Private Ryan',
        'Born on the Fourth of July',
        'Captain America: The First Avenger',
        'The Patriot',
        'Glory',
        'Forrest Gump',
      ];

      const results = await Promise.all(
        independenceMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }


    // Independence Day Shows
    else if (intent === 'celebrate_independence_day_shows') {
      const independenceDayShows = [
        "The Last Dance",
        "Band of Brothers",
        "Turn: Washington's Spies",
        "John Adams",
        "The Plot Against America",
        "A Capitol Fourth"
      ];

      const results = await Promise.all(
        independenceDayShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Mardi Gras movie intent
    else if (intent === 'celebrate_mardi_gras_movies') {
      const mardiGrasMovies = [
        'The Princess and the Frog',
        'The Big Easy',
        'Mardi Gras: Spring Break',
        'Maskerade',
        'Jezebel',
        'Mardi Gras: Made in China',
        'Shy People',
        'King Cake: The Big Easy Story',
      ];

      const results = await Promise.all(
        mardiGrasMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Mardi Gras Shows
    else if (intent === 'celebrate_mardi_gras_shows') {
      const mardiGrasShows = [
        "Treme",
        "The Originals",
        "NCIS: New Orleans",
        "American Horror Story",
        "Mardi Gras: Spring Break",
        "Southern Charm New Orleans"
      ];

      const results = await Promise.all(
        mardiGrasShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Mother's Day movie intent
    else if (intent === 'celebrate_mothers_day') {
      const mothersDayMovies = [
        'Stepmom',
        'The Joyluck Club',
        'Freaky Friday',
        'Brave',
        "Mamma Mia!",
        "The Blind Side",
        "Brave",
        "Lady Bird",
        'Terms of Endearment'
      ];

      const results = await Promise.all(
        mothersDayMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle New Year's Day movie intent
    else if (intent === 'celebrate_happy_new_year') {
      const newYearsDayMovies = [
        'When Harry Met Sally',
        "New Year's Eve",
        'About Time',
        "Bridget Jones's Diary",
        'Phantom Thread',
        'The Poseidon Adventure',
      ];

      const results = await Promise.all(
        newYearsDayMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Oktoberfest movie intent
    else if (intent === 'celebrate_oktoberfest_movies') {
      const oktoberfestMovies = [
        'Beerfest',
        'Oktoberfest: Beer & Blood',
        'The Beer Hunter',
        'The Bavarian Beer Wars',
        'In München steht ein Hofbräuhaus',
        'Beer for My Horses',
        "The World's End",
        'The Student Prince',
      ];

      const results = await Promise.all(
        oktoberfestMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Oktoberfest Shows
    else if (intent === 'celebrate_oktoberfest_shows') {
      const oktoberfestShows = [
        "Oktoberfest: Beer & Blood",
        "Das Boot",
        "Dark",
        "Bizarre Foods with Andrew Zimmern",
        "Babylon Berlin",
        "Tatort",
        "No Reservations"
      ];

      const results = await Promise.all(
        oktoberfestShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  

    // Handle Thanksgiving Day movie intent
    else if (intent === 'celebrate_thanksgiving') {
      const thanksgivingDayMovies = [
        'Planes, Trains, and Automobiles',
        'A Charlie Brown Thanksgiving',
        'Home for the Holidays',
        "Bridget Jones's Diary",
        'Friendsgiving',
        'Turkey Drop',
        'Holiday Rush',
        'Dutch',
        'The Oath',
        'An Old Fashioned Thanksgiving',
      ];

      const results = await Promise.all(
        thanksgivingDayMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle birthday movie intent
    else if (intent === 'celebrate_valentines_day') {
      const valentinesMovies = [
        'The Notebook',
        'Titanic',
        'Gone with the Wind',
        "Valentine's Day",
        'The Big Sick',
        'La La Land',
      ];

      const results = await Promise.all(
        valentinesMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Locations
    // Handle Toronto movie intent
    else if (intent === 'locations_movies_set_in_toronto') {
      const torontoMovies = [
        'Scott Pilgrim vs. the World',
        'The Shape of Water',
      ];

      const results = await Promise.all(
        torontoMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    // Handle New York movie intent
    else if (intent === 'locations_movies_set_in_new_york') {
      const newYorkMovies = ['The Great Gatsby', 'Inception'];

      const results = await Promise.all(
        newYorkMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Paris movie intent
    else if (intent === 'locations_movies_set_in_paris') {
      const parisMovies = ['Amélie', 'Midnight in Paris'];

      const results = await Promise.all(
        parisMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Movies

    // 18+ Movies
    else if (intent === 'recommend_18_plus_movies') {
      const eighteenPlusMoviesMedia = [
        "Blue is the Warmest Color",
        "Nymphomaniac",
        "Eyes Wide Shut",
        "Requiem for a Dream",
        "Shame",
        "The Wolf of Wall Street",
        "American Psycho",
        "Basic Instinct",
        "A Clockwork Orange",
        "Irreversible",
        "Gone Girl",
        "The Handmaiden",
        "Secretary",
        "Antichrist"
      ];
    
      const results = await Promise.all(
        eighteenPlusMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Abduction Movies
    else if (intent === 'recommend_abduction') {
      const abductionMovieMedia = [
        "Taken",
        "Prisoners",
        "Room",
        "Gone Baby Gone",
        "Man on Fire",
        "Ransom",
        "Flightplan",
        "Kidnap",
        "Changeling",
        "The Girl with the Dragon Tattoo"
      ];
    
      const results = await Promise.all(
        abductionMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // ADHD Movies
    else if (intent === 'recommend_adhd_movies') {
      const adhdMoviesMedia = [
        "The Perks of Being a Wallflower",
        "The King of Staten Island",
        "Me and Earl and the Dying Girl",
        "Little Miss Sunshine",
        "Inside Out",
        "Ferris Bueller's Day Off",
        "Matilda",
        "The Secret Life of Walter Mitty",
        "Moonlight",
        "Good Will Hunting"
      ];
    
      const results = await Promise.all(
        adhdMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Adrenaline Rush Movies
    else if (intent === 'recommend_adrenaline_rush') {
      const adrenalineRushMovieMedia = [
        "Speed",
        "Point Break",
        "Die Hard",
        "The Fast and the Furious",
        "Mad Max: Fury Road",
        "John Wick",
        "The Bourne Identity",
        "Taken",
        "Crank",
        "Bad Boys"
      ];
    
      const results = await Promise.all(
        adrenalineRushMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Afterlife Movies
    else if (intent === 'recommend_afterlife_movies') {
      const afterlifeMoviesMedia = [
        "Ghost",
        "What Dreams May Come",
        "The Lovely Bones",
        "Beetlejuice",
        "Flatliners",
        "Coco",
        "Hereafter",
        "Heart and Souls"
      ];
    
      const results = await Promise.all(
        afterlifeMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Alien Movies
    else if (intent === 'quotes_i_come_in_peace' || intent === 'quotes_we_come_in_peace') {
      const aliensMedia = ['Alien', 'Aliens', 'The Lord of the Rings: The Two Towers', 'Independence Day', 'E.T. the Extra-Terrestrial', 'The Thing', 'Mars Attacks!', 'District 9', 'Predator', 'War of the Worlds', 'Signs', 'Edge of Tomorrow', 'Species', 'The Faculty', 'Contact'];

      const results = await Promise.all(
        aliensMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // American Movies
    else if (intent === 'recommend_americana_movies') {
      const americanaMoviesMedia = [
        "The Grapes of Wrath",
        "The Last Picture Show",
        "Nomadland",
        "There Will Be Blood",
        "American Beauty",
        "No Country for Old Men",
        "The Deer Hunter",
        "To Kill a Mockingbird",
        "Dances with Wolves",
        "Forrest Gump"
      ];
    
      const results = await Promise.all(
        americanaMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Angel Movies
    else if (intent === 'recommend_angel_movies') {
      const angelMoviesMedia = [
        "City of Angels",
        "Michael",
        "The Prophecy",
        "Wings of Desire",
        "Heaven Can Wait",
        "Angels in the Outfield",
        "Meet Joe Black",
        "The Lovely Bones",
        "It's a Wonderful Life",
        "Legion"
      ];
    
      const results = await Promise.all(
        angelMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Anime Movies
    else if (intent === 'recommend_anime_movies') {
      const animeMoviesMedia = [
        "Spirited Away",
        "Your Name",
        "Princess Mononoke",
        "Weathering with You",
        "The Wind Rises",
        "Howl's Moving Castle",
        "Akira",
        "Grave of the Fireflies",
        "Castle in the Sky",
        "Nausicaä of the Valley of the Wind"
      ];
    
      const results = await Promise.all(
        animeMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Ape Movies
    else if (intent === 'recommend_ape_movies') {
      const apeMoviesMedia = [
        "Planet of the Apes",
        "King Kong",
        "Dawn of the Planet of the Apes",
        "War for the Planet of the Apes",
        "Rise of the Planet of the Apes",
        "Mighty Joe Young",
        "Kong: Skull Island",
        "The Legend of Tarzan"
      ];
    
      const results = await Promise.all(
        apeMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Archaeology Movies
    else if (intent === 'recommend_archaeology') {
      const archaeologyMovieMedia = [
        "Indiana Jones",
        "The Mummy",
        "Lara Croft: Tomb Raider",
        "The Lost City of Z",
        "The Adventures of Tintin",
        "Atlantis: The Lost Empire",
        "The Dig",
        "The Pyramid",
        "Jungle Cruise"
      ];
    
      const results = await Promise.all(
        archaeologyMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Archie Comics Movies
    else if (intent === 'recommend_archie_comics_movies') {
      const archieComicsMoviesMedia = [
        "Archie: To Riverdale and Back Again",
        "Josie and the Pussycats",
        "The Archies in JugMan",
        "The Archie Show",
        "Archie's Funhouse"
      ];
    
      const results = await Promise.all(
        archieComicsMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Art Movies and Shows
    else if (intent === 'q_and_a_art') {
      const artMedia = [
        "The Great Beauty",
        "Frida",
        "Exit Through the Gift Shop",
        "Loving Vincent",
        "Girl with a Pearl Earring",
        "Pollock",
        "The Danish Girl",
        "At Eternity's Gate",
        "Pablo Picasso: The Legacy of a Genius",
        "Portrait Artist of the Year"
      ];

      const results = await Promise.all(
        artMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Assassination Movies
    else if (intent === 'recommend_assassination') {
      const assassinationMovieMedia = [
        "John Wick",
        "The Bourne Identity",
        "The Day of the Jackal",
        "Kill Bill",
        "The Manchurian Candidate",
        "Leon: The Professional",
        "American Assassin",
        "Hanna",
        "Collateral",
        "Munich"
      ];
    
      const results = await Promise.all(
        assassinationMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Astronaut Movies
    else if (intent === 'recommend_astronaut_movies') {
      const astronautMoviesMedia = [
        "Interstellar",
        "Apollo 13",
        "Gravity",
        "The Martian",
        "First Man",
        "Ad Astra",
        "2001: A Space Odyssey",
        "Hidden Figures",
        "October Sky",
        "The Right Stuff"
      ];
    
      const results = await Promise.all(
        astronautMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Atypical Movies
    else if (intent === 'recommend_atypical_movies') {
      const atypicalMoviesMedia = [
        "Rain Man",
        "Parenthood",
        "Mozart and the Whale",
        "Adam",
        "Extremely Loud & Incredibly Close",
        "I Am Sam",
        "The Accountant",
        "The Peanut Butter Falcon",
        "Life, Animated"
      ];
    
      const results = await Promise.all(
        atypicalMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Babe Movies
    else if (intent === 'quotes_babe_thatll_do') {
      const babeMovies = ['Babe', "Charlotte's Web", "The Secret Life of Pets", 'Paddington', 'Stuart Little', 'Ratatouille', 'Zootopia', 'The Lion King', 'Bolt'];

      const results = await Promise.all(
        babeMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Back to the Future Movies
    else if (intent === 'quotes_back_to_the_future_roads') {
      const backToTheFutureMovies = ['Back to the Future', 'Back to the Future Part II', 'Back to the Future Part III', "Bill & Ted's Excellent Adventure", 'The Terminator', 'Looper', 'The Time Machine'];

      const results = await Promise.all(
        backToTheFutureMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Band Movies
    else if (intent === 'recommend_band') {
      const bandMovieMedia = [
        "Whiplash",
        "School of Rock",
        "Bohemian Rhapsody",
        "The Dirt",
        "A Star is Born",
        "Sing Street",
        "That Thing You Do!",
        "This Is Spinal Tap",
        "We Are Your Friends"
      ];
    
      const results = await Promise.all(
        bandMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Baseball Movies
    else if (intent === 'recommend_baseball') {
      const baseballMovieMedia = [
        "Moneyball",
        "Field of Dreams",
        "The Sandlot",
        "The Natural",
        "42",
        "Major League",
        "Bull Durham",
        "Angels in the Outfield",
        "For Love of the Game"
      ];
    
      const results = await Promise.all(
        baseballMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Basketball
    else if (intent === 'q_and_a_basketball') {
      const basketballMedia = [
        "Space Jam",
        "Coach Carter",
        "Hoosiers",
        "White Men Can't Jump",
        "He Got Game",
        "Love & Basketball",
        "Glory Road",
        "The Last Dance",
        "Above the Rim",
        "Blue Chips"
      ];
    
      const results = await Promise.all(
        basketballMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Behind-the-Scenes Movies and Shows
    else if (intent === 'recommend_behind_the_scenes') {
      const behindTheScenesMedia = [
        "The Disaster Artist",
        "Once Upon a Time in Hollywood",
        "The Office",
        "Singin' in the Rain",
        "Ed Wood",
        "Hitchcock",
        "Living in Oblivion",
        "Get Shorty",
        "Tropic Thunder",
        "Adaptation"
      ];
    
      const results = await Promise.all(
        behindTheScenesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Best-Rated Movies on Apple
    else if (intent === 'recommend_top_movies_apple_tv') {
      const topMoviesAppleTVMedia = [
        "Palmer",
        "Greyhound",
        "The Banker",
        "Finch",
        "Coda",
        "Cherry",
        "The Tragedy of Macbeth",
        "Swan Song",
        "Hala"
      ];
    
      const results = await Promise.all(
        topMoviesAppleTVMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Best-Rated Movies on CBC
    else if (intent === 'recommend_top_movies_cbc_gem') {
      const topMoviesCBCGemMedia = [
        "The Breadwinner",
        "Weirdos",
        "Maudie",
        "The Grizzlies",
        "Falls Around Her",
        "Giant Little Ones",
        "Indian Horse",
        "Our People Will Be Healed",
        "Anthropocene: The Human Epoch",
        "The Cuban"
      ];
    
      const results = await Promise.all(
        topMoviesCBCGemMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Best-Rated Movies on Crave
    else if (intent === 'recommend_top_movies_crave') {
      const topMoviesCraveMedia = [
        "The Shape of Water",
        "Goodfellas",
        "Joker",
        "Ford v Ferrari",
        "1917",
        "Once Upon a Time in Hollywood",
        "The Irishman",
        "The Dark Knight",
        "Parasite",
        "Jojo Rabbit"
      ];
    
      const results = await Promise.all(
        topMoviesCraveMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Best-Rated Movies on Disney+
    else if (intent === 'recommend_top_movies_disney_plus') {
      const topMoviesDisneyPlusMedia = [
        "Frozen",
        "Soul",
        "Raya and the Last Dragon",
        "Frozen II",
        "Mulan",
        "The Lion King",
        "Avengers: Endgame",
        "Toy Story 4",
        "Black Panther",
        "Star Wars: The Rise of Skywalker"
      ];
    
      const results = await Promise.all(
        topMoviesDisneyPlusMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Best-Rated Movies on Google
    else if (intent === 'recommend_best_rated_movies_google') {
      const bestRatedMoviesGoogleMedia = [
        "The Shawshank Redemption",
        "Pulp Fiction",
        "The Dark Knight",
        "Inception",
        "Forrest Gump",
        "The Godfather",
        "Schindler's List",
        "Fight Club",
        "The Matrix",
        "Interstellar"
      ];
    
      const results = await Promise.all(
        bestRatedMoviesGoogleMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Best-Rated Movies on IMDb
    else if (intent === 'recommend_best_rated_movies_imdb') {
      const bestRatedMoviesIMDBMedia = [
        "The Shawshank Redemption",
        "The Godfather",
        "The Dark Knight",
        "Schindler's List",
        "12 Angry Men",
        "Pulp Fiction",
        "The Lord of the Rings: The Return of the King",
        "Fight Club",
        "Forrest Gump",
        "Inception"
      ];
    
      const results = await Promise.all(
        bestRatedMoviesIMDBMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Best-Rated Movies on Netflix
    else if (intent === 'recommend_top_movies_netflix') {
      const topMoviesNetflixMedia = [
        "The Irishman",
        "Roma",
        "Marriage Story",
        "The Trial of the Chicago 7",
        "The Power of the Dog",
        "The Two Popes",
        "Extraction",
        "Bird Box",
        "The King",
        "Mank"
      ];
    
      const results = await Promise.all(
        topMoviesNetflixMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Movies on Prime Video
    else if (intent === 'recommend_top_movies_prime') {
      const topMoviesPrimeMedia = [
        "Manchester by the Sea",
        "The Big Sick",
        "One Night in Miami",
        "Sound of Metal",
        "Borat Subsequent Moviefilm",
        "A Quiet Place",
        "Coming 2 America",
        "The Tomorrow War",
      ];
    
      const results = await Promise.all(
        topMoviesPrimeMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Best-Rated Movies on Rotten Tomatoes
    else if (intent === 'recommend_top_movies_rotten_tomatoes') {
      const topMoviesRottenTomatoesMedia = [
        "Parasite",
        "Black Panther",
        "Toy Story 4",
        "The Irishman",
        "The Wizard of Oz",
        "Casablanca",
        "Avengers: Endgame",
        "Citizen Kane",
        "Spider-Man: Into the Spider-Verse"
      ];
    
      const results = await Promise.all(
        topMoviesRottenTomatoesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Best Foreign Movies
    else if (intent === 'recommend_best_foreign_films') {
      const bestForeignFilmsMedia = [
        "Parasite",
        "Amélie",
        "Roma",
        "City of God",
        "Pan's Labyrinth",
        "The Lives of Others",
        "The Intouchables",
        "Crouching Tiger, Hidden Dragon",
        "Life is Beautiful"
      ];
    
      const results = await Promise.all(
        bestForeignFilmsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Biography Movies
    else if (intent === 'recommend_biography_movies') {
      const biographyMoviesMedia = [
        "The Theory of Everything",
        "Bohemian Rhapsody",
        "A Beautiful Mind",
        "Rocketman",
        "The Social Network",
        "Walk the Line",
        "The Imitation Game",
        "Steve Jobs",
        "12 Years a Slave"
      ];
    
      const results = await Promise.all(
        biographyMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Blockbuster Movies
    else if (intent === 'recommend_blockbusters') {
      const blockbusterMovieMedia = [
        "Avengers: Endgame",
        "Jurassic Park",
        "Avatar",
        "Titanic",
        "The Dark Knight",
        "Star Wars: The Force Awakens",
        "Harry Potter and the Sorcerer's Stone",
        "The Lion King",
        "The Avengers",
        "Inception"
      ];
    
      const results = await Promise.all(
        blockbusterMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Body Positive Movies
    else if (intent === 'recommend_body_positive_movies') {
      const bodyPositiveMoviesMedia = [
        "The Upside",
        "Isn't It Romantic",
        "I Feel Pretty",
        "Hairspray",
        "Bridget Jones's Diary",
        "Real Women Have Curves",
        "Dumplin'",
        "Fat Girl",
        "Precious",
        "The Duff"
      ];
    
      const results = await Promise.all(
        bodyPositiveMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Boxing Movies and Shows
    else if (intent === 'q_and_a_boxing') {
      const boxingMedia = [
        "Rocky",
        "Raging Bull",
        "Creed",
        "Million Dollar Baby",
        "The Fighter",
        "Ali",
        "Cinderella Man",
        "Southpaw",
        "The Hurricane",
        "Bleed for This"
      ];
    
      const results = await Promise.all(
        boxingMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Brendan Fraser Movies
    else if (intent === 'q_and_a_recommend_brendan_fraser') {
      const brendanFraserMovies = ['Encino Man', 'School Ties', "George of the Jungle", "The Mummy", "Blast from the Past", "Bedazzled", "The Whale", "Gods and Monsters", "Doom Patrol", "Killers of the Flower Moon"];

      const results = await Promise.all(
        brendanFraserMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Canadian Movies
    else if (intent === 'recommend_canadian_movies') {
      const canadianMoviesMedia = [
        "Room",
        "Scott Pilgrim vs. the World",
        "Brooklyn",
        "Away from Her",
        "Bon Cop, Bad Cop",
        "The Trotsky",
        "One Week",
        "Maudie",
        "Stories We Tell"
      ];
    
      const results = await Promise.all(
        canadianMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Casablanca Movies
    else if (intent === 'quotes_heres_looking_at_you' || intent === 'q_and_a_recommend_classic_movies') {
      const casablancaMovies = ['Casablanca', 'Gone with the Wind', 'The African Queen', 'The English Patient ', 'Out of Africa', 'A Farewell to Arms', 'Doctor Zhivago', 'The Remains of the Day'];

      const results = await Promise.all(
        casablancaMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Cat Lovers Movies
    else if (intent === 'recommend_cat_lovers_movies') {
      const catLoversMoviesMedia = [
        "The Aristocats",
        "A Street Cat Named Bob",
        "Puss in Boots",
        "Keanu",
        "Nine Lives",
        "Kedi",
        "Homeward Bound",
        "Garfield",
        "That Darn Cat",
        "Oliver & Company"
      ];
    
      const results = await Promise.all(
        catLoversMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Climate Change Movies and Shows
    else if (intent === 'q_and_a_climate_change') {
      const climateChangeMedia = [
        "An Inconvenient Truth",
        "Our Planet",
        "An Inconvenient Sequel: Truth to Power",
        "The Day After Tomorrow",
        "Before the Flood",
        "Chasing Ice",
        "Ice on Fire",
        "2040",
        "The Boy Who Harnessed the Wind",
        "Interstellar",
        "Erin Brokovich",
        "Our Planet",
        "The Commons",
        "The Last Winter"
      ];

      const results = await Promise.all(
        climateChangeMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Clueless Movies
    else if (intent === 'quotes_clueless_as_if') {
      const cluelessMovies = ['Clueless', '10 Things I Hate About You', 'Legally Blonde', 'Mean Girls', "She's All That", 'Easy A', "The Devil Wears Prada", "Confessions of a Shopaholic", "Legally Blonde"];

      const results = await Promise.all(
        cluelessMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Coding Movies
    else if (intent === 'recommend_coding') {
      const codingMovieMedia = [
        "The Social Network",
        "Silicon Valley",
        "Ex Machina",
        "The Imitation Game",
        "Tron: Legacy",
        "Her",
        "Jobs",
        "Steve Jobs",
        "The Matrix",
        "AI: Artificial Intelligence"
      ];
    
      const results = await Promise.all(
        codingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Coming-of-Age Movies
    else if (intent === 'recommend_coming_of_age_movies') {
      const comingOfAgeMoviesMedia = [
        "The Perks of Being a Wallflower",
        "Lady Bird",
        "Stand by Me",
        "Boyhood",
        "Call Me by Your Name",
        "Dead Poets Society",
        "The Breakfast Club",
        "Juno",
        "Moonlight",
        "Little Miss Sunshine"
      ];
    
      const results = await Promise.all(
        comingOfAgeMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Cooking Movies
    else if (intent === 'recommend_cooking') {
      const cookingMovieMedia = [
        "Chef",
        "Julie & Julia",
        "Ratatouille",
        "Burnt",
        "Jiro Dreams of Sushi",
        "The Hundred-Foot Journey",
        "Big Night",
        "Eat Pray Love",
        "The Founder",
        "The Lunchbox"
      ];
    
      const results = await Promise.all(
        cookingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Cool Hand Luke Movies
    else if (intent === 'quotes_cool_hand_luke_failure') {
      const coolHandLukeMovies = ['Cool Hand Luke', 'The Shawshank Redemption', 'Escape from Alcatraz', "One Flew Over the Cuckoo's Nest", 'Papillon', 'The Great Escape', 'Brubaker', 'Badlands', 'Midnight Cowboy'];

      const results = await Promise.all(
        coolHandLukeMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Cop Movies
    else if (intent === 'recommend_cop_movies') {
      const copMoviesMedia = [
        "Training Day",
        "Heat",
        "End of Watch",
        "L.A. Confidential",
        "Zodiac",
        "Die Hard",
        "Bad Boys",
        "The Departed"
      ];
    
      const results = await Promise.all(
        copMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Cowboy Movies
    else if (intent === 'recommend_cowboy_movies') {
      const cowboyMoviesMedia = [
        "The Good, the Bad and the Ugly",
        "True Grit",
        "Unforgiven",
        "The Magnificent Seven",
        "Django Unchained",
        "No Country for Old Men",
        "The Searchers",
        "Once Upon a Time in the West",
        "Tombstone",
        "3:10 to Yuma"
      ];
    
      const results = await Promise.all(
        cowboyMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Crime Movies
    else if (intent === 'recommend_crime') {
      const crimeMovieMedia = [
        "The Godfather",
        "Heat",
        "The Departed",
        "Breaking Bad",
        "Scarface",
        "Goodfellas",
        "The Irishman",
        "Casino",
        "A Bronx Tale",
        "Donnie Brasco"
      ];
    
      const results = await Promise.all(
        crimeMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Critically Acclaimed Movies
    else if (intent === 'recommend_critically_acclaimed_movies') {
      const criticallyAcclaimedMoviesMedia = [
        "Parasite",
        "The Godfather",
        "Moonlight",
        "Schindler's List",
        "12 Years a Slave",
        "The Dark Knight",
        "The Social Network",
        "No Country for Old Men",
        "La La Land",
        "The Shape of Water"
      ];
    
      const results = await Promise.all(
        criticallyAcclaimedMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Critics' Choice Movies
    else if (intent === 'recommend_critics_choice') {
      const criticsChoiceMedia = [
        "Parasite",
        "Moonlight",
        "Nomadland",
        "The Shape of Water",
        "Roma",
        "12 Years a Slave",
        "Birdman",
        "Spotlight",
        "Boyhood",
        "Slumdog Millionaire"
      ];
    
      const results = await Promise.all(
        criticsChoiceMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Cult Movies
    else if (intent === 'recommend_cult_movies') {
      const cultMoviesMedia = [
        "Midsommar",
        "The Wicker Man",
        "Rosemary's Baby",
        "Hereditary",
        "The Sacrament",
        "The Invitation",
        "Martha Marcy May Marlene",
        "The Endless",
        "Children of the Corn",
        "Apostle"
      ];
    
      const results = await Promise.all(
        cultMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Daredevil Movies
    else if (intent === 'recommend_daredevils') {
      const daredevilMovieMedia = [
        "Mission: Impossible - Fallout",
        "Mad Max: Fury Road",
        "Baby Driver",
        "The Fast and the Furious",
        "Jackass",
        "Point Break",
        "Top Gun",
        "Drive",
        "Death Proof",
        "Unstoppable"
      ];
    
      const results = await Promise.all(
        daredevilMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Devil Movies
    else if (intent === 'recommend_devil_movies') {
      const devilMoviesMedia = [
        "The Devil's Advocate",
        "The Exorcist",
        "Rosemary's Baby",
        "Constantine",
        "The Omen",
        "Hellboy II: The Golden Army",
        "End of Days",
        "Devil",
        "The Ninth Gate",
        "Hellboy"
      ];
    
      const results = await Promise.all(
        devilMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Dinosaur Movies
    else if (intent === 'q_and_a_recommend_dinosaur_movies') {
      const dinosaurMedia = [
        "Jurassic Park",
        "Jurassic World",
        "The Land Before Time",
        "The Good Dinosaur",
        "Dinosaur",
        "Ice Age",
        "Walking with Dinosaurs",
        "The Valley of Gwangi",
        "King Kong",
        "Journey to the Center of the Earth"
      ];

      const results = await Promise.all(
        dinosaurMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Disaster Movies
    else if (intent === 'q_and_a_recommend_show_disaster_films') {
      const disasterMovies = [
        "The Day After Tomorrow",
        "Twister",
        "2012",
        "Armageddon",
        "Contagion",
        "Cloverfield",
        "Dante's Peak",
        "Deep Impact",
        "Greenland",
        "The Impossible",
        "Into the Storm",
        "The Perfect Storm",
        "The Poseidon Adventure",
        "San Andreas",
        "The Towering Inferno",
        "Twisters",
      ];

      const results = await Promise.all(
        disasterMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Drawing Movies and Shows
    else if (intent === 'q_and_a_drawing') {
      const drawingMedia = [
        "Loving Vincent",
        "Big Eyes",
        "Abstract: The Art of Design",
        "Persepolis",
        "Sketches of Frank Gehry",
        "Basquiat",
        "Frida",
        "Exit Through the Gift Shop",
        "The Animation Show",
        "Drawn Together",
        "Art Attack",
        "Ink Master"
      ];

      const results = await Promise.all(
        drawingMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Druglord Movies
    else if (intent === 'recommend_druglords') {
      const druglordMovieMedia = [
        "Narcos",
        "Scarface",
        "Breaking Bad",
        "Blow",
        "Traffic",
        "Sicario",
        "American Made",
        "Queen of the South",
        "The Infiltrator",
        "El Chapo"
      ];
    
      const results = await Promise.all(
        druglordMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Dysfunctional Family Movies and Shows
    else if (intent === 'recommend_dysfunctional') {
      const dysfunctionalMedia = [
        "Little Miss Sunshine",
        "The Royal Tenenbaums",
        "Knives Out",
        "Shameless",
        "August: Osage County",
        "The Family Stone",
        "This Is Where I Leave You",
        "The Squid and the Whale",
        "Succession",
        "The War of the Roses"
      ];
    
      const results = await Promise.all(
        dysfunctionalMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Dystopian Movies and Shows
    else if (intent === 'q_and_a_recommend_dystopian_futures') {
      const dystopianMedia = [
        "The Hunger Games",
        "Mad Max: Fury Road",
        "Blade Runner 2049",
        "The Matrix",
        "Children of Men",
        "V for Vendetta",
        "Divergent",
        "The Maze Runner",
        "Black Mirror",
        "The Handmaid's Tale",
        "The Last of Us",
        "Westworld",
        "The 100",
        "Altered Carbon",
        "Snowpiercer",
        "The Man in the High Castle",
        "Station Eleven",
        "Humans",
        "Falling Skies",
        "Years and Years",
        "The Leftovers",
        "Westworld",
        "Humans",
        "Futurama",
        "Black Mirror",
        "Terminator: The Sarah Connor Chronicles"
      ];
    
      const results = await Promise.all(
        dystopianMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Emmy Winners
    else if (intent === 'recommend_emmy_winners') {
      const emmyWinnerMedia = [
        "Game of Thrones",
        "Breaking Bad",
        "The Crown",
        "Succession",
        "The Handmaid's Tale",
        "Fleabag",
        "The Mandalorian",
        "Chernobyl",
        "The West Wing",
        "Veep"
      ];
    
      const results = await Promise.all(
        emmyWinnerMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // End of the World Movies
    else if (intent === 'q_and_a_recommend_end_of_world_movies') {
      const endOfTheWorldMovies = [
        "Armageddon",
        "Deep Impact",
        "The Day After Tomorrow",
        "2012",
        "Children of Men",
        "I Am Legend",
        "Contagion",
        "War of the Worlds",
        "Independence Day",
        "This Is the End"
      ];

      const results = await Promise.all(
        endOfTheWorldMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Faith-Based Movies
    else if (intent === 'recommend_faith_based_movies') {
      const faithBasedMoviesMedia = [
        "God's Not Dead",
        "Heaven Is for Real",
        "The Shack",
        "Courageous",
        "War Room",
        "I Can Only Imagine",
        "Fireproof",
        "Miracles from Heaven",
        "Facing the Giants",
        "Risen"
      ];
    
      const results = await Promise.all(
        faithBasedMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Fashion-Themed Movies
    else if (intent === 'recommend_fashion') {
      const fashionMovieMedia = [
        "The Devil Wears Prada",
        "Zoolander",
        "Cruella",
        "Phantom Thread",
        "The September Issue",
        "Confessions of a Shopaholic",
        "Coco Before Chanel",
        "The Neon Demon",
        "The Dressmaker",
        "Valentino: The Last Emperor"
      ];
    
      const results = await Promise.all(
        fashionMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Feel-Good Adventure Movies
    else if (intent === 'recommend_feel_good_adventure') {
      const feelGoodAdventureMedia = [
        "The Secret Life of Walter Mitty",
        "Up",
        "The Princess Bride",
        "Forrest Gump",
        "Amélie",
        "Life of Pi",
        "Little Miss Sunshine",
        "Paddington",
        "Secondhand Lions",
        "The Grand Budapest Hotel"
      ];
    
      const results = await Promise.all(
        feelGoodAdventureMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Feel-Good Movies
    else if (intent === 'recommend_feel_good_movies') {
      const feelGoodMoviesMedia = [
        "The Pursuit of Happyness",
        "Amélie",
        "Little Miss Sunshine",
        "La La Land",
        "The Secret Life of Walter Mitty",
        "Forrest Gump",
        "The Intouchables",
        "Paddington 2",
        "The Blind Side",
        "Wonder"
      ];
    
      const results = await Promise.all(
        feelGoodMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Female-Lead Movies
    else if (intent === 'recommend_female_lead_movies') {
      const femaleLeadMoviesMedia = [
        "Wonder Woman",
        "Little Women",
        "Captain Marvel",
        "The Hunger Games",
        "Atomic Blonde",
        "Erin Brockovich",
        "Lady Bird",
        "Mulan",
        "Hidden Figures",
        "The Devil Wears Prada"
      ];
    
      const results = await Promise.all(
        femaleLeadMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // A Few Good Men Movies
    else if (intent === 'quotes_cant_handle_truth') {
      const aFewGoodMenMovies = ['A Few Good Men', "The Verdict", '12 Angry Men', 'Primal Fear', 'The Firm', 'Philadelphia', 'Anatomy of a Murder', 'The Rainmaker', "My Cousin Vinny", 'Scent of a Woman', 'Runaway Jury', 'Erin Brockovich'];

      const results = await Promise.all(
        aFewGoodMenMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Finding Nemo Movies
    else if (intent === 'quotes_finding_nemo' || intent === 'recommend_movie_with_family') {
      const findingNemoMovies = ['Finding Nemo', "Finding Dory", 'The Lion King', 'Moana', 'The Little Mermaid', 'Frozen', 'Ratatouille', 'The Secret Life of Pets', "A Bug's Life", 'Over the Hedge', 'The Good Dinosaur'];

      const results = await Promise.all(
        findingNemoMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fishing Movies
    else if (intent === 'recommend_fishing') {
      const fishingMovieMedia = [
        "A River Runs Through It",
        "The Perfect Storm",
        "Jaws",
        "The Old Man and the Sea",
        "Big Fish",
        "The River Why",
        "Gone Fishin'",
        "Captain Phillips",
        "Into the Blue",
        "The Life Aquatic with Steve Zissou"
      ];
    
      const results = await Promise.all(
        fishingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Food Movies
    else if (intent === 'recommend_food_movies') {
      const foodMoviesMedia = [
        "Chef",
        "Julie & Julia",
        "Ratatouille",
        "Burnt",
        "The Hundred-Foot Journey",
        "Jiro Dreams of Sushi",
        "Eat Pray Love",
        "Spinning Plates",
        "Tortilla Soup",
        "No Reservations"
      ];
    
      const results = await Promise.all(
        foodMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Forrest Gump Movies
    else if (intent === 'quotes_life_box_of_chocolates' || intent === 'chitchat_im_glad') {
      const forrestGumpMovies = ['Forrest Gump', 'The Curious Case of Benjamin Button', 'Rain Man', 'The Green Mile', 'Cast Away', 'Big Fish', 'Life Is Beautiful', 'The Pursuit of Happyness', 'Slumdog Millionaire', 'Julie & Julia', 'The Secret Life of Walter Mitty', 'Good Will Hunting'];

      const results = await Promise.all(
        forrestGumpMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Frankenstein Movies
    else if (intent === 'quotes_frankenstein_alive') {
      const frankensteinMovies = ['Frankenstein', 'Dracula', 'The Wolf Man', 'Bride of Frankenstein', 'Frankenweenie', 'Dracula Untold', 'Hotel Transylvania', 'Victor Frankenstein'];

      const results = await Promise.all(
        frankensteinMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Futuristic Movies
    else if (intent === 'recommend_futuristic') {
      const futuristicMovieMedia = [
        "Blade Runner 2049",
        "The Matrix",
        "Minority Report",
        "Black Mirror",
        "Inception",
        "The Fifth Element",
        "Ready Player One",
        "Interstellar",
        "Ghost in the Shell",
        "Edge of Tomorrow"
      ];
    
      const results = await Promise.all(
        futuristicMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Gang Movies
    else if (intent === 'recommend_gang_movies') {
      const gangMovieMedia = [
        "The Godfather",
        "Goodfellas",
        "The Irishman",
        "Peaky Blinders",
        "Scarface",
        "The Departed",
        "The Untouchables",
        "Casino",
        "A Bronx Tale",
        "American Gangster"
      ];
    
      const results = await Promise.all(
        gangMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Gay Actress
    else if (intent === 'recommend_gay_actress') {
      const gayActressMedia = [
        "The Silence of the Lambs",
        "Panic Room",
        "The Brave One",
        "Elysium",
        "Flightplan",
        "Contact",
        "Nell",
        "The Accused"
      ];
    
      const results = await Promise.all(
        gayActressMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Gay Movies
    else if (intent === 'recommend_gay_movies') {
      const gayMoviesMedia = [
        "Love, Simon",
        "Brokeback Mountain",
        "Call Me by Your Name",
        "Moonlight",
        "The Boys in the Band",
        "God's Own Country",
        "Portrait of a Lady on Fire",
        "The Birdcage",
        "Prayers for Bobby",
        "Weekend"
      ];
    
      const results = await Promise.all(
        gayMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Gay Rom-Coms
    else if (intent === 'recommend_gay_rom_com') {
      const gayRomComMedia = [
        "Love, Simon",
        "The Half of It",
        "Schitt's Creek",
        "The Thing About Harry",
        "But I'm a Cheerleader",
        "Call Me by Your Name",
        "Happiest Season",
        "Imagine Me & You",
        "The Way He Looks",
        "Edge of Seventeen"
      ];
    
      const results = await Promise.all(
        gayRomComMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Genres - Various
    else if (intent === 'q_and_a_recommend_genres') {
      const genresMedia = [
        "The Dark Knight",
        "Inception",
        "The Avengers",
        "Harry Potter and the Sorcerer's Stone",
        "The Godfather",
        "The Matrix",
        "Pulp Fiction",
        "The Lord of the Rings: The Fellowship of the Ring",
        "The Exorcist",
        "Interstellar",
        "Titanic",
        "La La Land",
        "The Silence of the Lambs",
        "Schindler's List",
        "The Hangover",
        "Superbad",
        "Bridesmaids",
        "Dumb and Dumber",
        "The Notebook",
        "Love Actually",
        "Eternal Sunshine of the Spotless Mind",
        "Pride and Prejudice"
      ];

      const results = await Promise.all(
        genresMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Ghosts Movies and Shows
    else if (intent === 'q_and_a_recommend_media_ghosts' || intent === 'chitchat_believe_ghosts') {
      const ghostsMedia = [
        "The Others",
        "Crimson Peak",
        "Insidious",
        "Ghost",
        "Poltergeist",
        "The Conjuring",
        "The Changeling",
        "The Deveil's Backbone",
        "What Lies Beneath",
        "Ghost Hunters",
        "The Haunting of Bly Manor",
        "American Horror Story",
        "Supernatural",
        "The Enfield Haunting",
        "Penny Dreadful",
        "The Ghost Bride",
        "Locke & Key",
        "Ghost Wars"
      ];

      const results = await Promise.all(
        ghostsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Girl Power Movies
    else if (intent === 'recommend_girl_power_movies') {
      const girlPowerMoviesMedia = [
        "Wonder Woman",
        "Hidden Figures",
        "Mulan",
        "The Hunger Games",
        "Erin Brockovich",
        "Legally Blonde",
        "Brave",
        "Thelma & Louise",
        "The Devil Wears Prada"
      ];
    
      const results = await Promise.all(
        girlPowerMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // God Movies
    else if (intent === 'recommend_god_movies') {
      const godMoviesMedia = [
        "The Shack",
        "Bruce Almighty",
        "Evan Almighty",
        "God's Not Dead",
        "Heaven Is for Real",
        "The Ten Commandments",
        "The Prince of Egypt",
        "The Passion of the Christ",
        "Exodus: Gods and Kings"
      ];
    
      const results = await Promise.all(
        godMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Godfather Movies
    else if (intent === 'quotes_godfather_friends_enemies' || intent === 'quotes_godfather_offer') {
      const godfatherMovies = ['The Godfather', 'The Godfather Part II', 'The Godfather Part III', 'Goodfellas', 'Scarface', 'The Sopranos'];

      const results = await Promise.all(
        godfatherMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Godzilla Movies
    else if (intent === 'recommend_godzilla') {
      const godzillaMovieMedia = [
        "Godzilla: King of the Monsters",
        "Shin Godzilla",
        "Kong: Skull Island",
        "Pacific Rim",
        "Godzilla vs. Kong",
        "Godzilla (2014)",
        "Gamera: Guardian of the Universe",
        "Cloverfield",
        "The Host",
        "Destroy All Monsters"
      ];
    
      const results = await Promise.all(
        godzillaMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Golden Globe Winners
    else if (intent === 'recommend_golden_globe_winners') {
      const goldenGlobeWinnerMedia = [
        "La La Land",
        "The Revenant",
        "Green Book",
        "Bohemian Rhapsody",
        "Three Billboards Outside Ebbing, Missouri",
        "The Social Network",
        "A Star is Born",
        "The Shape of Water",
        "The King's Speech",
        "Birdman"
      ];
    
      const results = await Promise.all(
        goldenGlobeWinnerMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Good Storylines
    else if (intent === 'q_and_a_good_storylines') {
      const goodStorylineMedia = [
        "Breaking Bad",
        "Game of Thrones",
        "Inception",
        "The Godfather",
        "The Sopranos",
        "Westworld",
        "The Dark Knight",
        "The Wire",
        "Parasite",
        "The Shawshank Redemption"
      ];
    
      const results = await Promise.all(
        goodStorylineMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Greek Mythology Movies
    else if (intent === 'recommend_greek_mythology') {
      const greekMythologyMovieMedia = [
        "Clash of the Titans",
        "Troy",
        "Percy Jackson & the Olympians",
        "Immortals",
        "Wrath of the Titans",
        "Hercules",
        "Jason and the Argonauts",
        "Wonder Woman",
        "The Odyssey",
        "Gods of Egypt"
      ];
    
      const results = await Promise.all(
        greekMythologyMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Grimm’s Fairy Tales Movies
    else if (intent === 'recommend_grimms_fairy_tales_movies') {
      const grimmsFairyTalesMoviesMedia = [
        "Into the Woods",
        "The Brothers Grimm",
        "Snow White and the Huntsman",
        "Hansel & Gretel: Witch Hunters",
        "Maleficent",
        "Pan's Labyrinth",
        "Tangled"
      ];
    
      const results = await Promise.all(
        grimmsFairyTalesMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Guardians of the Galaxy
    else if (intent === 'quotes_i_am_groot') {
      const guardiansOfTheGalaxyMovie = ['Guardians of the Galaxy', 'Guardians of the Galaxy Vol. 3', 'Guardians of the Galaxy Vol. 2', 'The Guardians of the Galaxy Holiday Special', 'LEGO Marvel Super Heroes: Guardians of the Galaxy - The Thanos Threat', "Marvel's Guardians of the Galaxy"];

      const results = await Promise.all(
        guardiansOfTheGalaxyMovie.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Guitar Movies and Shows
    else if (intent === 'q_and_a_learning_guitar') {
      const guitarMedia = [
        "School of Rock",
        "Whiplash",
        "This Is Spinal Tap",
        "It Might Get Loud",
        "Crossroads",
        "August Rush",
        "La Bamba",
        "The Guitar",
        "Nashville",
        "Treme",
        "Roadies",
        "Austin City Limits"
      ];

      const results = await Promise.all(
        guitarMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Hacking Movies
    else if (intent === 'recommend_hacking') {
      const hackingMovieMedia = [
        "Mr. Robot",
        "The Matrix",
        "Hackers",
        "Snowden",
        "The Social Network",
        "Blackhat",
        "Eagle Eye",
        "The Girl with the Dragon Tattoo",
        "Swordfish",
        "Ghost in the Shell"
      ];
    
      const results = await Promise.all(
        hackingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Health Movies
    else if (intent === 'recommend_health_movies') {
      const healthMoviesMedia = [
        "The Pursuit of Happyness",
        "A Beautiful Mind",
        "Silver Linings Playbook",
        "The Theory of Everything",
        "Still Alice",
        "Patch Adams",
        "The Intouchables",
        "My Left Foot",
        "Dallas Buyers Club",
        "The Soloist"
      ];
    
      const results = await Promise.all(
        healthMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Heaven Movies
    else if (intent === 'recommend_heaven_movies') {
      const heavenMoviesMedia = [
        "What Dreams May Come",
        "Heaven Can Wait",
        "The Lovely Bones",
        "The Shack",
        "Defending Your Life",
        "Miracles from Heaven",
        "Meet Joe Black",
        "City of Angels",
        "Bruce Almighty",
        "Evan Almighty"
      ];
    
      const results = await Promise.all(
        heavenMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Heists Movies and Shows
    else if (intent === 'q_and_a_heists') {
      const heistMedia = [
        "Ocean's Eleven",
        "The Italian Job",
        "Money Heist",
        "Inside Man",
        "The Town",
        "Heat",
        "Logan Lucky",
        "Now You See Me",
        "Baby Driver",
        "Widows"
      ];
    
      const results = await Promise.all(
        heistMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // The Help Movies
    else if (intent === 'quotes_the_help_kind') {
      const theHelpMovies = ['The Help', '12 Years a Slave', 'Hidden Figures', 'The Color Purple', 'Selma', 'Fried Green Tomatoes', 'The Butler', 'The Secret Life of Bees', 'The Joy Luck Club'];

      const results = await Promise.all(
        theHelpMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Historical Drama Movies
    else if (intent === 'recommend_historical_drama_movies') {
      const historicalDramaMoviesMedia = [
        "12 Years a Slave",
        "Schindler's List",
        "The King's Speech",
        "Braveheart",
        "The Pianist",
        "Lincoln",
        "Dunkirk",
        "Atonement",
        "The Imitation Game",
        "Gandhi"
      ];
    
      const results = await Promise.all(
        historicalDramaMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Historical Movies and Shows
    else if (intent === 'q_and_a_historical') {
      const historicalMedia = ["The Crown", "Vikings", "The Last Kingdom", "Schindler's List", "Gladiator", "12 Years a Slave", "Dunkirk", "Lincoln", "The King's Speech", "The Pianist", "The Imitation Game", "The Last Samurai", "Braveheart"];

      const results = await Promise.all(
        historicalMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Hockey Movies and Shows
    else if (intent === 'q_and_a_hockey') {
      const hockeyMedia = [
        "The Mighty Ducks",
        "Goon",
        "Miracle",
        "Youngblood",
        "Slap Shot",
        "Mystery, Alaska",
        "The Rocket",
        "Indian Horse",
        "Red Army",
        "Ice Guardians"
      ];
    
      const results = await Promise.all(
        hockeyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Home Invasion Movies
    else if (intent === 'recommend_home_invasion_movies') {
      const homeInvasionMoviesMedia = [
        "The Purge",
        "Don't Breathe",
        "Funny Games",
        "The Strangers",
        "Panic Room",
        "The Collector",
        "The Last House on the Left",
        "Trespass"
      ];
    
      const results = await Promise.all(
        homeInvasionMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Inequality Movies
    else if (intent === 'recommend_inequality_movies') {
      const inequalityMoviesMedia = [
        "Parasite",
        "The Pursuit of Happyness",
        "The Florida Project",
        "Snowpiercer",
        "Sorry to Bother You",
        "Roma",
        "The Grapes of Wrath",
        "The Great Gatsby",
        "A Beautiful Mind",
        "Slumdog Millionaire"
      ];
    
      const results = await Promise.all(
        inequalityMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Korean Movies
    else if (intent === 'recommend_korean_films') {
      const koreanFilmsMedia = [
        "Parasite",
        "Oldboy",
        "Train to Busan",
        "The Handmaiden",
        "Memories of Murder",
        "Burning",
        "A Taxi Driver",
        "I Saw the Devil",
        "The Wailing",
        "Mother"
      ];
    
      const results = await Promise.all(
        koreanFilmsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Korean Zombie Films
    else if (intent === 'recommend_korean_zombie_films') {
      const koreanZombieFilmsMedia = [
        "Train to Busan",
        "Peninsula",
        "The Odd Family: Zombie On Sale",
        "Rampant",
        "Alive",
        "The Flu",
        "Seoul Station",
        "Zombie Detective",
        "Train to Busan Presents: Peninsula",
        "The Neighbor Zombie"
      ];
    
      const results = await Promise.all(
        koreanZombieFilmsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Legal Dramas
    else if (intent === 'recommend_legal_dramas') {
      const legalDramaMedia = [
        "A Few Good Men",
        "The Trial of the Chicago 7",
        "12 Angry Men",
        "Suits",
        "The Good Wife",
        "Philadelphia",
        "Erin Brockovich",
        "The Lincoln Lawyer",
        "The Judge",
        "Primal Fear"
      ];
    
      const results = await Promise.all(
        legalDramaMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // LOTR Movies
    else if (intent === 'quotes_lotr_pass' || intent === 'quotes_lotr_precious') {
      const lotrMedia = ['The Lord of the Rings: The Fellowship of the Ring', 'The Lord of the Rings: The Return of the King', 'The Lord of the Rings: The Two Towers', 'The Lord of the Rings: The Rings of Power', 'Game of Thrones', 'The Witcher'];

      const results = await Promise.all(
        lotrMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Mafia Movies
    else if (intent === 'recommend_mafia') {
      const mafiaMovieMedia = [
        "The Godfather",
        "The Godfather Part II",
        "The Godfather Part III",
        "Goodfellas",
        "The Sopranos",
        "Casino",
        "Scarface",
        "The Irishman",
        "The Departed",
        "Donnie Brasco",
        "A Bronx Tale",
        "Once Upon a Time in America"
      ];
    
      const results = await Promise.all(
        mafiaMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // The Mask
    else if (intent === 'quotes_the_mask') {
      const theMaskMovies = ['The Mask', 'Liar Liar', "Ace Ventura: Pet Detective", "Bruce Almighty", "The Addams Family", "Shazam!", "Ghostbusters", "The Mask of Zorro", "Beetlejuice", "The Nutty Professor"];

      const results = await Promise.all(
        theMaskMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Mental Health Movies
    else if (intent === 'recommend_mental_health_movies') {
      const mentalHealthMoviesMedia = [
        "Silver Linings Playbook",
        "A Beautiful Mind",
        "The Perks of Being a Wallflower",
        "Girl, Interrupted",
        "It's Kind of a Funny Story",
        "One Flew Over the Cuckoo's Nest",
        "The Skeleton Twins",
        "Shutter Island",
        "The Hours",
        "Requiem for a Dream"
      ];
    
      const results = await Promise.all(
        mentalHealthMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mercenary Movies
    else if (intent === 'recommend_mercenaries') {
      const mercenaryMovieMedia = [
        "The Expendables",
        "Mad Max: Fury Road",
        "Rambo",
        "Predator",
        "The A-Team",
        "Fury",
        "Black Hawk Down",
        "Tears of the Sun",
        "The Losers"
      ];
    
      const results = await Promise.all(
        mercenaryMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Midnight Cowboy Movies
    else if (intent === 'quotes_midnight_cowboy_walking') {
      const midnightCowboyMovies = ['Midnight Cowboy', "Taxi Driver", 'Requiem for a Dream', 'The Panic in Needle Park', 'The Wrestler', 'Paris, Texas', 'Dog Day Afternoon', 'Serpico'];

      const results = await Promise.all(
        midnightCowboyMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Mind-Bender Movies
    else if (intent === 'recommend_mind_bender_movies') {
      const mindBenderMoviesMedia = [
        "Inception",
        "Mulholland Drive",
        "Donnie Darko",
        "Memento",
        "The Matrix",
        "Shutter Island",
        "The Prestige",
        "Coherence",
        "Annihilation",
        "Eternal Sunshine of the Spotless Mind"
      ];
    
      const results = await Promise.all(
        mindBenderMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mockumentaries Movies and Shows
    else if (intent === 'q_and_a_mockumentaries') {
      const mockumentaryMedia = [
        "This Is Spinal Tap",
        "Best in Show",
        "The Office",
        "Parks and Recreation",
        "What We Do in the Shadows",
        "Borat",
        "Waiting for Guffman",
        "Popstar: Never Stop Never Stopping",
        "The Blair Witch Project",
        "The Ruttles: All You Need Is Cash"
      ];
    
      const results = await Promise.all(
        mockumentaryMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies Based on a Book
    else if (intent === 'recommend_movies_based_on_a_book' || intent === 'q_and_a_recommend_book') {
      const moviesBasedOnBookMedia = [
        "The Shawshank Redemption",
        "The Lord of the Rings: The Fellowship of the Ring",
        "Harry Potter and the Sorcerer's Stone",
        "The Hunger Games",
        "Pride and Prejudice",
        "Gone Girl",
        "Inkheart",
        "Eragon",
        "The Great Gatsby",
        "To Kill a Mockingbird",
        "The Girl with the Dragon Tattoo",
        "Divergent",
        "The Maze Runner"
      ];
    
      const results = await Promise.all(
        moviesBasedOnBookMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for Anniversary
    else if (intent === 'recommend_movie_anniversary') {
      const anniversaryMovieMedia = [
        "The Notebook",
        "La La Land",
        "A Walk to Remember",
        "Pride and Prejudice",
        "Titanic",
        "The Holiday",
        "The Time Traveler's Wife",
        "Sleepless in Seattle",
        "The Proposal",
        "About Time"
      ];
    
      const results = await Promise.all(
        anniversaryMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Movies for a Boss
    else if (intent === 'recommend_movie_boss') {
      const bossMovieMedia = [
        "The Social Network",
        "Moneyball",
        "The Wolf of Wall Street",
        "The Big Short",
        "Steve Jobs",
        "Wall Street",
        "The Pursuit of Happyness",
        "A Few Good Men",
        "The Founder",
        "The Aviator"
      ];
    
      const results = await Promise.all(
        bossMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Boyfriend
    else if (intent === 'recommend_movie_boyfriend') {
      const boyfriendMovieMedia = [
        "Mad Max: Fury Road",
        "John Wick",
        "Die Hard",
        "The Dark Knight",
        "The Matrix",
        "Gladiator",
        "Logan",
        "The Revenant",
        "Edge of Tomorrow",
        "Terminator 2: Judgment Day"
      ];
    
      const results = await Promise.all(
        boyfriendMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Coworker
    else if (intent === 'recommend_movie_coworker') {
      const coworkerMovieMedia = [
        "The Intern",
        "Office Space",
        "The Devil Wears Prada",
        "Up in the Air",
        "Horrible Bosses",
        "Moneyball",
        "The Pursuit of Happyness",
        "The Founder",
        "Chef",
        "The Social Network"
      ];
    
      const results = await Promise.all(
        coworkerMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Dog
    else if (intent === 'recommend_movie_dog') {
      const dogMovieMedia = [
        "The Secret Life of Pets",
        "A Dog's Purpose",
        "Homeward Bound",
        "Marley & Me",
        "Lady and the Tramp",
        "Beethoven",
        "101 Dalmatians",
        "Bolt",
        "Togo",
        "Balto"
      ];
    
      const results = await Promise.all(
        dogMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Friend
    else if (intent === 'recommend_movie_friend') {
      const friendMovieMedia = [
        "Inception",
        "The Social Network",
        "Scott Pilgrim vs. the World",
        "The Grand Budapest Hotel",
        "Superbad",
        "Guardians of the Galaxy",
        "The Matrix",
        "The Hangover",
        "Whiplash",
        "Fight Club"
      ];
    
      const results = await Promise.all(
        friendMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Girlfriend
    else if (intent === 'recommend_movie_girlfriend') {
      const girlfriendMovieMedia = [
        "La La Land",
        "Pride and Prejudice",
        "The Notebook",
        "10 Things I Hate About You",
        "Crazy Rich Asians",
        "The Fault in Our Stars",
        "Mamma Mia!",
        "To All the Boys I've Loved Before",
        "The Holiday",
        "A Star is Born"
      ];
    
      const results = await Promise.all(
        girlfriendMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Husband
    else if (intent === 'recommend_movie_husband') {
      const husbandMovieMedia = [
        "The Dark Knight",
        "Inception",
        "Gladiator",
        "Mad Max: Fury Road",
        "John Wick",
        "Interstellar",
        "The Revenant",
        "No Country for Old Men",
        "The Departed",
        "Casino Royale"
      ];
    
      const results = await Promise.all(
        husbandMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Sibling
    else if (intent === 'recommend_movie_sibling') {
      const siblingMovieMedia = [
        "The Incredibles",
        "Spider-Man: Into the Spider-Verse",
        "Shrek",
        "Jumanji: Welcome to the Jungle",
        "Lilo & Stitch",
        "Zootopia",
        "Harry Potter and the Sorcerer's Stone",
        "Kung Fu Panda",
        "Finding Nemo",
        "The LEGO Movie"
      ];
    
      const results = await Promise.all(
        siblingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies for a Wife
    else if (intent === 'recommend_movie_wife') {
      const wifeMovieMedia = [
        "Pride and Prejudice",
        "The Notebook",
        "Sense and Sensibility",
        "A Star is Born",
        "The Holiday",
        "La La Land",
        "Emma",
        "Love Actually",
        "Mamma Mia!"
      ];
    
      const results = await Promise.all(
        wifeMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies to Watch by Myself
    else if (intent === 'recommend_movie_by_myself') {
      const movieByMyselfMedia = [
        "Her",
        "Lost in Translation",
        "Into the Wild",
        "The Social Network",
        "Lady Bird",
        "Manchester by the Sea",
        "The Secret Life of Walter Mitty",
        "Whiplash",
        "Eternal Sunshine of the Spotless Mind"
      ];
    
      const results = await Promise.all(
        movieByMyselfMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Movies to Watch with Friends
    else if (intent === 'recommend_movie_with_friends') {
      const movieWithFriendsMedia = [
        "Superbad",
        "Bridesmaids",
        "The Hangover",
        "21 Jump Street",
        "Pineapple Express",
        "Scott Pilgrim vs. The World",
        "Zombieland",
        "Pitch Perfect",
        "Shaun of the Dead",
        "Anchorman: The Legend of Ron Burgundy"
      ];
    
      const results = await Promise.all(
        movieWithFriendsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Mulan Movies
    else if (intent === 'quotes_mulan') {
      const mulanMovies = ['Mulan', "Mulan II", 'Brave', 'Moana', 'The Princess and the Frog', 'Aladdin', 'The Hunger Games', 'Frozen II', "Raya and the Last Dragon", 'Pocahontas', 'The Legend of Hua Mulan'];

      const results = await Promise.all(
        mulanMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Mummy Movies and Shows
    else if (intent === 'q_and_a_mummies') {
      const mummyMedia = ["The Mummy", "The Mummy Returns", "The Pyramid", "Mummies Alive!", "The Mummy: The Animated Series", "Relic Hunter", "Night at the Museum", "The Scorpion King"];

      const results = await Promise.all(
        mummyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Murder Mystery Movies
    else if (intent === 'recommend_murder') {
      const murderMysteryMedia = [
        "Knives Out",
        "Gone Girl",
        "True Detective",
        "The Girl with the Dragon Tattoo",
        "Zodiac",
        "Murder on the Orient Express",
        "Sherlock",
        "Prisoners",
        "Se7en",
        "The Night Of"
      ];
    
      const results = await Promise.all(
        murderMysteryMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Nature Movies and Shows
    else if (intent === 'q_and_a_recommend_nature_media') {
      const natureMedia = ['Planet Earth II', "Our Planet", "The Cove", "An Inconvenient Truth", "Blue Planet II", "Frozen Planet", "The Green Planet", "The Blue Planet", "Cosmos", "March of the Penguins", "The Secret Life of Trees", "Life", "Chasing Ice",];

      const results = await Promise.all(
        natureMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Neurotypical Movies
    else if (intent === 'recommend_neurotypical_movies') {
      const neurotypicalMoviesMedia = [
        "The Intern",
        "The Proposal",
        "The Devil Wears Prada",
        "The Holiday",
        "Crazy, Stupid, Love",
        "Notting Hill",
        "Bridget Jones's Diary",
        "Legally Blonde",
        "Hitch",
        "The Wedding Planner"
      ];
    
      const results = await Promise.all(
        neurotypicalMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // News Movies
    else if (intent === 'recommend_news_movies') {
      const newsMoviesMedia = [
        "Spotlight",
        "The Post",
        "All the President's Men",
        "Bombshell",
        "Good Night, and Good Luck",
        "Broadcast News",
        "Network",
        "The Paper",
        "Shattered Glass",
        "The Insider"
      ];
    
      const results = await Promise.all(
        newsMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Nostalgic Movies
    else if (intent === 'recommend_nostalgic') {
      const nostalgicMovieMedia = [
        "Back to the Future",
        "The Goonies",
        "E.T.",
        "Stranger Things",
        "The NeverEnding Story",
        "Labyrinth",
        "Ghostbusters",
        "Stand by Me",
        "The Karate Kid",
        "Indiana Jones and the Raiders of the Lost Ark"
      ];
    
      const results = await Promise.all(
        nostalgicMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // OCD Movies
    else if (intent === 'recommend_ocd_movies') {
      const ocdMoviesMedia = [
        "As Good as It Gets",
        "The Aviator",
        "Matchstick Men",
        "What About Bob?",
        "The Hours",
        "Silver Linings Playbook",
        "Girl, Interrupted",
        "Melancholia"
      ];
    
      const results = await Promise.all(
        ocdMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Operas Movies and Shows
    else if (intent === 'q_and_a_operas') {
      const operaMedia = [
        "Amadeus",
        "The Phantom of the Opera",
        "Carmen",
        "La Traviata",
        "The Magic Flute",
        "Rigoletto",
        "Tosca",
        "Don Giovanni",
        "The Metropolitan Opera",
        "Aida"
      ];
    
      const results = await Promise.all(
        operaMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Oscar Movies and Shows
    else if (intent === 'q_and_a_oscar_films') {
      const oscarMedia = [
        "Parasite",
        "The Shape of Water",
        "Moonlight",
        "La La Land",
        "The Godfather",
        "No Country for Old Men",
        "Forrest Gump",
        "Titanic",
        "Gladiator",
        "The King's Speech"
      ];
    
      const results = await Promise.all(
        oscarMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Pansexual Movies
    else if (intent === 'recommend_pansexual_movies') {
      const pansexualMoviesMedia = [
        "Booksmart",
        "The Adventures of Priscilla, Queen of the Desert",
        "The Rocky Horror Picture Show",
        "But I'm a Cheerleader",
        "Velvet Goldmine",
        "The Handmaiden",
        "Blue Is the Warmest Color",
        "The Danish Girl",
        "Tangerine",
        "The Watermelon Woman"
      ];
    
      const results = await Promise.all(
        pansexualMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Paranormal Movies
    else if (intent === 'recommend_paranormal_movies') {
      const paranormalMoviesMedia = [
        "The Conjuring",
        "Insidious",
        "Poltergeist",
        "Paranormal Activity",
        "The Exorcist",
        "Sinister",
        "Hereditary",
        "The Others"
      ];
    
      const results = await Promise.all(
        paranormalMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Pet Movies
    else if (intent === 'q_and_a_recommend_pet_movies') {
      const petsMedia = ['The Secret Life of Pets', 'Marley & Me', "The Secret Life of Pets 2", "Lady and the Tramp", "101 Dalmatians", "Ace Ventura: Pet Detective", "A Dog's Purpose", "The Cat Returns", "Pets United", "DC League of Super-Pets", "Beethoven", "Beethoven's 2nd"];

      const results = await Promise.all(
        petsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // PG-rated movies and shows
    else if (intent === 'recommend_pg_rated_movies') {
      const pgRatedMoviesMedia = [
        "Finding Nemo",
        "The Lion King",
        "Toy Story",
        "The Incredibles",
        "Shrek",
        "Frozen",
        "The Secret Life of Pets",
        "Zootopia",
        "Moana",
        "Coco",
        "Kung Fu Panda",
        "Up",
        "How to Train Your Dragon",
        "Aladdin",
        "Inside Out"
      ];
    
      const results = await Promise.all(
        pgRatedMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Plays
    else if (intent === 'recommend_plays') {
      const playsMedia = [
        "A Raisin in the Sun",
        "Death of a Salesman",
        "The Glass Menagerie",
        "Waiting for Godot",
        "Macbeth",
        "Fences",
        "Othello"
      ];
    
      const results = await Promise.all(
        playsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Plays Turned into Movies
    else if (intent === 'recommend_plays_movies') {
      const playsMoviesMedia = [
        "Les Misérables",
        "Chicago",
        "West Side Story",
        "Fences",
        "Cats",
        "The Phantom of the Opera",
        "Sweeney Todd",
        "Hairspray",
        "The Producers"
      ];
    
      const results = await Promise.all(
        playsMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Podcast Movies and Shows
    else if (intent === 'q_and_a_podcast_recommendation') {
      const podcastMedia = [
        "A Prairie Home Companion",
        "Late Night",
        "Truth",
        "The Interview",
        "The Front Runner",
        "Radio Days",
        "Talk Radio",
        "Private Parts",
        "Corporate Animals",
        "Pump Up the Volume",
        "Limetown",
        "Dirty John",
        "StartUp",
        "Song Exploder",
        "Alex, Inc.",
        "The Truth Podcast"
      ];
    
      const results = await Promise.all(
        podcastMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Polyamory Movies
    else if (intent === 'recommend_polyamory_movies') {
      const polyamoryMoviesMedia = [
        "The Summer of Sangaile",
        "Professor Marston & the Wonder Women",
        "Three of Hearts",
        "The Dreamers",
        "Savages",
        "The Duke of Burgundy",
        "Bound",
        "Bandaged",
        "Imagine Me & You",
        "Vicky Cristina Barcelona"
      ];
    
      const results = await Promise.all(
        polyamoryMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Post-apocalyptic Movies
    else if (intent === 'q_and_a_recommend_post_apocalyptic') {
      const postApocalypticMovies = ["The Book of Eli", 'Children of Men', "Furiosa: A Mad Max Saga", "Mad Max: Fury Road", "I Am Legend", "28 Days Later", "A Boy and His Dog", "Oblivion", "12 Monkeys", "Cloverfield", "Reign of Fire"];

      const results = await Promise.all(
        postApocalypticMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Prequel Movies
    else if (intent === 'recommend_prequel_movies') {
      const prequelMoviesMedia = [
        "Rogue One: A Star Wars Story",
        "Fantastic Beasts and Where to Find Them",
        "The Hobbit: An Unexpected Journey",
        "X-Men: First Class",
        "Star Wars: Episode I - The Phantom Menace",
        "Rise of the Planet of the Apes",
        "Monsters University",
        "The Scorpion King",
        "Prometheus",
        "Indiana Jones and the Temple of Doom"
      ];
    
      const results = await Promise.all(
        prequelMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Prison Movies
    else if (intent === 'recommend_prison') {
      const prisonMovieMedia = [
        "The Shawshank Redemption",
        "Escape from Alcatraz",
        "Orange is the New Black",
        "The Green Mile",
        "American History X",
        "The Experiment",
        "A Prophet",
        "Bronson",
        "Cool Hand Luke",
        "Papillon"
      ];
    
      const results = await Promise.all(
        prisonMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Psychology Movies and Shows
    else if (intent === 'q_and_a_psychology') {
      const psychologyMedia = [
        "Mindhunter",
        "A Beautiful Mind",
        "Inside Out",
        "Good WIll Hunting",
        "Black Swan",
        "Shutter Island",
        "Girl, Interrupted",
        "Joker",
        "Hannibal",
        "In Treatment",
        "Mr. Robot",
        "Legion",
        "Monk"
      ];

      const results = await Promise.all(
        psychologyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Queer Actor Movies
    else if (intent === 'recommend_queer_actor_movies') {
      const queerActorMoviesMedia = [
        "Moonlight",
        "Call Me by Your Name",
        "Pride",
        "Brokeback Mountain",
        "The Birdcage",
        "The Danish Girl",
        "Love, Simon",
        "Rocketman",
        "Blue is the Warmest Color",
        "Carol"
      ];
    
      const results = await Promise.all(
        queerActorMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Queer Actress
    else if (intent === 'recommend_queer_actress') {
      const queerActressMedia = [
        "Twilight",
        "The Twilight Saga: New Moon",
        "Snow White and the Huntsman",
        "The Twilight Saga: Breaking Dawn - Part 1",
        "The Twilight Saga: Breaking Dawn - Part 2",
        "Happiest Season",
        "Clouds of Sils Maria",
        "Equals"
      ];
    
      const results = await Promise.all(
        queerActressMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Queer Movies
    else if (intent === 'recommend_queer_movies') {
      const queerMoviesMedia = [
        "Moonlight",
        "Call Me by Your Name",
        "Portrait of a Lady on Fire",
        "The Handmaiden",
        "Blue Is the Warmest Color",
        "Pride",
        "Brokeback Mountain",
        "Carol",
        "A Fantastic Woman",
        "The Danish Girl"
      ];
    
      const results = await Promise.all(
        queerMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // R-Rated Movies
    else if (intent === 'recommend_r_rated_movies') {
      const rRatedMoviesMedia = [
        "The Shawshank Redemption",
        "Pulp Fiction",
        "Deadpool",
        "Fight Club",
        "The Wolf of Wall Street",
        "Joker",
        "Inglourious Basterds",
        "The Matrix",
        "The Godfather",
        "Logan"
      ];
    
      const results = await Promise.all(
        rRatedMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Racing Movies
    else if (intent === 'recommend_racing') {
      const racingMovieMedia = [
        "Ford v Ferrari",
        "Rush",
        "Fast & Furious",
        "Days of Thunder",
        "Speed Racer",
        "Need for Speed",
        "Le Mans",
        "The Art of Racing in the Rain",
        "Senna",
        "The Fast and the Furious"
      ];
    
      const results = await Promise.all(
        racingMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Racism Movies
    else if (intent === 'recommend_racism_movies') {
      const racismMoviesMedia = [
        "12 Years a Slave",
        "Selma",
        "The Hate U Give",
        "Mississippi Burning",
        "Just Mercy",
        "Do the Right Thing",
        "BlacKkKlansman",
        "Malcolm X",
        "Fruitvale Station"
      ];
    
      const results = await Promise.all(
        racismMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Raunchy Comedies
    else if (intent === 'recommend_raunchy') {
      const raunchyComedyMedia = [
        "Superbad",
        "The Hangover",
        "American Pie",
        "Borat: Cultural Learnings of America for Make Benefit Glorious Nation of Kazakhstan",
        "Old School",
        "Pineapple Express",
        "Neighbors",
        "Sausage Party",
        "Ted",
        "Project X"
      ];
    
      const results = await Promise.all(
        raunchyComedyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Real Estate Movies
    else if (intent === 'recommend_real_estate') {
      const realEstateMovieMedia = [
        "Glengarry Glen Ross",
        "99 Homes",
        "The Money Pit",
        "The Big Short",
        "Pacific Heights",
        "The Founder",
        "The Queen of Versailles",
        "House of Sand and Fog",
        "A Civil Action",
        "Closing Escrow"
      ];
    
      const results = await Promise.all(
        realEstateMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Robbers 
    else if (intent === 'q_and_a_robbers') {
      const robberMedia = [
        "Heat",
        "Ocean's Eleven",
        "The Town",
        "The Italian Job",
        "Baby Driver",
        "Logan Lucky",
        "Now You See Me",
        "Inside Man",
        "Widows",
        "Dog Day Afternoon"
      ];
    
      const results = await Promise.all(
        robberMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Robot Movies
    else if (intent === 'q_and_a_recommend_robot_movies') {
      const robotMovies = ["I, Robot", 'Chappie', 'A.I. Artificial Intelligence', 'Transformers', "The Iron Giant", "Blade Runner", "RoboCop", "Automata", "Pacific Rim", "The Terminator"];

      const results = await Promise.all(
        robotMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sabrina Movies
    else if (intent === 'recommend_sabrina_movies') {
      const sabrinaMoviesMedia = [
        "Sabrina Down Under",
        "Sabrina Goes to Rome",
        "Sabrina the Teenage Witch",
        "Sabrina Friends Forever"
      ];
    
      const results = await Promise.all(
        sabrinaMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Salem Movies
    else if (intent === 'recommend_salem_movies') {
      const salemMoviesMedia = [
        "Hocus Pocus",
        "The Crucible",
        "Practical Magic",
        "The Lords of Salem",
        "The Covenant",
        "Sabrina Goes to Rome",
        "Warlock",
        "I Am Elizabeth Smart",
        "Burning of Bridget Cleary",
        "The Autopsy of Jane Doe"
      ];
    
      const results = await Promise.all(
        salemMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Samurai Movies and Shows
    else if (intent === 'recommend_samurai') {
      const samuraiMovieMedia = [
        "Seven Samurai",
        "13 Assassins",
        "The Last Samurai",
        "Samurai Champloo",
        "Yojimbo",
        "Harakiri",
        "Sword of the Stranger",
        "Samurai Rebellion",
        "Rurouni Kenshin",
        "The Hidden Fortress"
      ];
    
      const results = await Promise.all(
        samuraiMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Satan Movies
    else if (intent === 'recommend_satan_movies') {
      const satanMoviesMedia = [
        "The Exorcist",
        "Rosemary's Baby",
        "The Omen",
        "The Devil's Advocate",
        "Constantine",
        "The Ninth Gate",
        "End of Days",
        "The Witches of Eastwick",
        "Legend",
        "Hellboy"
      ];
    
      const results = await Promise.all(
        satanMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // School-Themed Movies
    else if (intent === 'recommend_school') {
      const schoolMovieMedia = [
        "Dead Poets Society",
        "The Breakfast Club",
        "Ferris Bueller's Day Off",
        "Superbad",
        "Clueless",
        "Mean Girls",
        "Rushmore",
        "Election",
        "10 Things I Hate About You",
        "School of Rock"
      ];
    
      const results = await Promise.all(
        schoolMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Sequel Movies
    else if (intent === 'recommend_sequel_movies') {
      const sequelMoviesMedia = [
        "Toy Story 3",
        "Mad Max: Fury Road",
        "The Dark Knight",
        "The Godfather Part II",
        "Star Wars: Episode V - The Empire Strikes Back",
        "Blade Runner 2049",
        "Avengers: Endgame",
        "Spider-Man: No Way Home",
        "Terminator 2: Judgment Day",
        "Shrek 2"
      ];
    
      const results = await Promise.all(
        sequelMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Serial Killer Movies and Shows
    else if (intent === 'q_and_a_serial_killers') {
      const serialKillerMedia = [
        "Mindhunter",
        "Zodiac",
        "Se7en",
        "Dexter",
        "The Silence of the Lambs",
        "American Psycho",
        "The Girl with the Dragon Tattoo",
        "Hannibal",
        "Nightcrawler"
      ];
    
      const results = await Promise.all(
        serialKillerMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Sexuality Movies
    else if (intent === 'recommend_sexuality_movies') {
      const sexualityMoviesMedia = [
        "Blue is the Warmest Color",
        "Call Me by Your Name",
        "Moonlight",
        "Carol",
        "Portrait of a Lady on Fire",
        "The Handmaiden",
        "Brokeback Mountain",
        "Disobedience",
        "The Danish Girl",
        "A Fantastic Woman"
      ];
    
      const results = await Promise.all(
        sexualityMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Shaolin Movies
    else if (intent === 'recommend_shaolin') {
      const shaolinMovieMedia = [
        "Shaolin",
        "36th Chamber of Shaolin",
        "Shaolin Soccer",
        "The Legend of Drunken Master",
        "Ip Man",
        "Fist of Legend",
        "The Prodigal Son",
        "Shaolin Temple",
        "Iron Monkey",
        "Once Upon a Time in China"
      ];
    
      const results = await Promise.all(
        shaolinMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Sharknado Movies - dislike
    else if (intent === 'q_and_a_sharknado_dislike') {
      const dislikeSharnadoMovies = [
        "The Impossible",
        "Deepwater Horizon",
        "Titanic",
        "Jaws",
        "The Poseidon Adventure",
        "2012",
        "Deep Impact",
        "San Andreas",
        "Geostorm",
        "Pacific Rim",
        "Melancholia",
        "The Day After Tomorrow"
      ];

      const results = await Promise.all(
        dislikeSharnadoMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Short and Light Movies
    else if (intent === 'recommend_short_light_movies') {
      const shortLightMoviesMedia = [
        "The Red Balloon",
        "Paperman",
        "Toy Story That Time Forgot",
        "For the Birds",
        "La Luna",
        "Presto",
        "Piper",
        "Lou",
        "Bao",
        "Lava"
      ];
    
      const results = await Promise.all(
        shortLightMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Silence of the Lambs
    else if (intent === 'quotes_silence_of_the_lambs' || intent === 'quotes_silence_of_the_lambs_fava') {
      const silenceOfTheLambsMovie = ['The Silence of the Lambs', 'Manhunter', 'Hannibal', 'Red Dragon', 'Hannibal Rising', 'Se7en', 'Dexter', 'Dexter: New Blood', 'Zodiac', 'Mindhunter'];

      const results = await Promise.all(
        silenceOfTheLambsMovie.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Singin' in the Rain
    else if (intent === 'recommend_singin_in_the_rain') {
      const singinInTheRainMedia = ["Singin' in the Rain"];
    
      const results = await Promise.all(
        singinInTheRainMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Snow White Movies
    else if (intent === 'quotes_snow_white_mirror') {
      const snowWhiteMovies = ['Snow White and the Huntsman', "The Huntsman: Winter's War", 'Once Upon A Time', 'Cinderella', 'Sleeping Beauty'];

      const results = await Promise.all(
        snowWhiteMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Social Media Movies
    else if (intent === 'recommend_social_media_movies') {
      const socialMediaMoviesMedia = [
        "The Social Network",
        "The Circle",
        "Ingrid Goes West",
        "Eighth Grade",
        "Searching",
        "Disconnect",
        "Unfriended",
        "Nerve",
        "Men, Women & Children",
        "The Hater"
      ];
    
      const results = await Promise.all(
        socialMediaMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Song and Dance Movies
    else if (intent === 'recommend_song_and_dance_movies') {
      const songAndDanceMoviesMedia = [
        "The Greatest Showman",
        "Mamma Mia!",
        "La La Land",
        "Singin' in the Rain",
        "Chicago",
        "Grease",
        "Pitch Perfect",
        "Les Misérables",
        "West Side Story",
        "Step Up"
      ];
    
      const results = await Promise.all(
        songAndDanceMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Soul Music and Shows
    else if (intent === 'q_and_a_soul') {
      const soulMusicMedia = [
        "Soul",
        "20 Feet from Stardom",
        "Ray",
        "Dreamgirls",
        "The Commitments",
        "Get on Up",
        "Respect",
        "Cadillac Records",
      ];
    
      const results = await Promise.all(
        soulMusicMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Soundtrack Movies
    else if (intent === 'recommend_soundtrack') {
      const soundtrackMovieMedia = [
        "Guardians of the Galaxy",
        "La La Land",
        "Baby Driver",
        "The Lion King",
        "Pulp Fiction",
        "Moulin Rouge!",
        "Amadeus",
        "A Star is Born",
        "Grease",
        "Purple Rain"
      ];
    
      const results = await Promise.all(
        soundtrackMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Space Movies and Shows
    else if (intent === 'q_and_a_recommend_movies_space' || intent === 'q_and_a_space_mission') {
      const spaceMedia = [
        "Interstellar",
        "Gravity",
        "The Martian",
        "The Expanse",
        "Apollo 13",
        "Alien",
        "Moon",
        "Contact",
        "Total Recall",
        "Event Horizon",
        "For All Mankind",
        "Space Force",
        "Battlestar Galactica",
        "Lost in Space"
      ];

      const results = await Promise.all(
        spaceMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Spartan Movies
    else if (intent === 'recommend_sparta') {
      const spartaMovieMedia = [
        "300",
        "Troy",
        "Alexander",
        "Spartacus",
        "Immortals",
        "The Last Legion",
        "Helen of Troy",
        "Clash of the Titans",
        "The Legend of Hercules",
        "The 300 Spartans"
      ];
    
      const results = await Promise.all(
        spartaMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Spy Movies and Shows
    else if (intent === 'q_and_a_spy' || intent === "recommend_spy_movies") {
      const spyMedia = [
        "Skyfall",
        "The Bourne Identity",
        "Mission: Impossible",
        "Mission: Impossible - Dead Reckoning Part One",
        "Mission: Impossible - Fallout",
        "Kingsman: The Secret Service",
        "Argo",
        "Bridge of Spies",
        "The Spy Who Came in from the Cold",
        "The Man from U.N.C.L.E.",
        "Atomic Blonde"
      ];

      const results = await Promise.all(
        spyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Stalker Movies
    else if (intent === 'recommend_stalker_movies') {
      const stalkerMoviesMedia = [
        "Fatal Attraction",
        "Single White Female",
        "Cape Fear",
        "Swimfan",
        "Obsessed",
        "The Gift",
        "The Boy Next Door",
        "Play Misty for Me",
        "Sleeping with the Enemy",
        "Unlawful Entry"
      ];
    
      const results = await Promise.all(
        stalkerMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Steve Carell Movies and Shows
    else if (intent === 'q_and_a_recommend_steve_carell') {
      const steveCarrelMedia = ['The Office', 'The Morning Show', 'Space Force', "The 40 Year Old Virgin", "Little Miss Sunshine", "Evan Almighty", "Crazy, Stupid, Love", "Despicable Me", "Dan in Real Life", "Date Night", "Foxcatcher", "Beautiful Boy"];

      const results = await Promise.all(
        steveCarrelMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Streetfighter Movies and Shows
    else if (intent === 'recommend_street_fighter') {
      const streetFighterMovieMedia = [
        "Street Fighter: Assassin's Fist",
        "Street Fighter II: The Animated Movie",
        "Enter the Dragon",
        "Bloodsport",
        "Mortal Kombat",
        "The Raid: Redemption",
        "Dragon Ball Z: Battle of Gods",
        "Tekken: Blood Vengeance",
        "Kung Fu Hustle",
        "Ip Man"
      ];
    
      const results = await Promise.all(
        streetFighterMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Supernatural Movies and Shows
    else if (intent === 'q_and_a_recommend_supernatural') {
      const supernaturalMedia = [
        "Supernatural",
        "The Witcher",
        "The Others",
        "Hereditary",
        "The Conjuring",
        "A Ghost Story",
        "Crimson Peak",
        "Poltergeist",
        "Sinister",
        "Ghost Adventures",
        "The Dead Files",
        "Chilling Adventures of Sabrina",
        "American Horror Story"
      ];

      const results = await Promise.all(
        supernaturalMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Tattoo Movies
    else if (intent === 'recommend_tattoo_movies') {
      const tattooMoviesMedia = [
        "The Girl with the Dragon Tattoo",
        "Tattoo",
        "Tattoo Nation",
        "Memento",
        "Tattoo Uprising",
        "The Illustrated Man",
        "Tattoo: A Love Story",
        "A Man Called Ove"
      ];
    
      const results = await Promise.all(
        tattooMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Tech Movies and Shows
    else if (intent === 'q_and_a_technology') {
      const techMedia = [
        "Black Mirror",
        "The Social Dilemma",
        "The Matrix",
        "Silicon Valley",
        "Ex Machina",
        "Her",
        "Steve Jobs",
        "Hackers",
        "Mr. Robot",
        "Startup",
        "Person of Interest",
        "The Big Bang Theory",
        "Altered Carbon"
      ];

      const results = await Promise.all(
        techMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Teen Choice Movies and TV Shows
    else if (intent === 'recommend_teen_choice') {
      const teenChoiceMedia = [
        "The Hunger Games",
        "The Fault in Our Stars",
        "Twilight",
        "Riverdale",
        "Euphoria",
        "To All the Boys I've Loved Before",
        "Divergent",
        "The Maze Runner",
        "13 Reasons Why",
        "The Kissing Booth"
      ];
    
      const results = await Promise.all(
        teenChoiceMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Titanic Movies
    else if (intent === 'quotes_king_of_world') {
      const titanicMovies = ['Titanic', 'The Notebook', 'Atonement', 'Pearl Harbor', 'The Great Gatsby', 'Cold Mountain', 'Legends of the Fall', 'The English Patient', 'Moulin Rouge!', "The Time Traveler's Wife", 'Australia', 'Ghost'];

      const results = await Promise.all(
        titanicMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Train Movies
    else if (intent === 'recommend_train_movies') {
      const trainMoviesMedia = [
        "Snowpiercer",
        "Murder on the Orient Express",
        "The Polar Express",
        "The Darjeeling Limited",
        "The Girl on the Train",
        "Unstoppable",
        "Train to Busan",
        "The Commuter",
        "Strangers on a Train",
        "The Taking of Pelham 123"
      ];
    
      const results = await Promise.all(
        trainMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Trans Woman Movies
    else if (intent === 'recommend_trans_woman_movies') {
      const transWomanMoviesMedia = [
        "Tangerine",
        "The Crying Game",
        "Paris Is Burning",
        "A Fantastic Woman",
        "The Death and Life of Marsha P. Johnson",
        "Gun Hill Road",
        "Boy Meets Girl",
        "Lingua Franca"
      ];
    
      const results = await Promise.all(
        transWomanMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Transman Movies
    else if (intent === 'recommend_transman_movies') {
      const transmanMoviesMedia = [
        "The Danish Girl",
        "Boys Don't Cry",
        "A Fantastic Woman",
        "Tomboy",
        "XXY",
        "By Hook or by Crook",
        "Saturday Church",
        "Lingua Franca",
        "The Brandon Teena Story",
        "The Skin I Live In"
      ];
    
      const results = await Promise.all(
        transmanMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Transphobia Movies
    else if (intent === 'recommend_transphobia_movies') {
      const transphobiaMoviesMedia = [
        "The Death and Life of Marsha P. Johnson",
        "Paris Is Burning",
        "A Fantastic Woman",
        "The Danish Girl",
        "Boys Don't Cry",
        "The Crying Game",
        "Disclosure",
        "Pose",
        "Stonewall",
        "Veneno"
      ];
    
      const results = await Promise.all(
        transphobiaMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // True Crime Movies
    else if (intent === 'recommend_true_crime_movies') {
      const trueCrimeMoviesMedia = [
        "Zodiac",
        "Goodfellas",
        "Catch Me If You Can",
        "Blow",
        "The Irishman",
        "The Wolf of Wall Street",
        "Donnie Brasco",
        "American Gangster"
      ];
    
      const results = await Promise.all(
        trueCrimeMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // True Stories Movies and Shows
    else if (intent === 'q_and_a_true_story') {
      const trueStoryMedia = [
        "The Social Network",
        "The Wolf of Wall Street",
        "12 Years a Slave",
        "Schindler's List",
        "Catch Me If You Can",
        "The Big Short",
        "Bohemian Rhapsody",
        "A Beautiful Mind",
        "The Pursuit of Happyness",
        "The Theory of Everything"
      ];
    
      const results = await Promise.all(
        trueStoryMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Vampire Movies
    else if (intent === 'recommend_vampire_movies') {
      const vampireMoviesMedia = [
        "Let the Right One In",
        "Blade",
        "Interview with the Vampire",
        "Underworld",
        "30 Days of Night",
        "Twilight",
        "Daybreakers",
        "The Lost Boys",
        "Only Lovers Left Alive",
        "Nosferatu"
      ];
    
      const results = await Promise.all(
        vampireMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Warrior Movies and Shows
    else if (intent === 'recommend_warriors') {
      const warriorMovieMedia = [
        "Gladiator",
        "300",
        "Braveheart",
        "Troy",
        "The Last Samurai",
        "Kingdom of Heaven",
        "Spartacus",
        "The 13th Warrior",
        "Conan the Barbarian",
        "Alexander"
      ];
    
      const results = await Promise.all(
        warriorMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Western Movies
    else if (intent === 'recommend_western') {
      const westernMovieMedia = [
        "The Good, The Bad and The Ugly",
        "Unforgiven",
        "Django Unchained",
        "True Grit",
        "Once Upon a Time in the West",
        "The Magnificent Seven",
        "No Country for Old Men",
        "3:10 to Yuma",
        "The Revenant",
        "The Hateful Eight"
      ];
    
      const results = await Promise.all(
        westernMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // When Harry Met Sally Movies
    else if (intent === 'quotes_when_harry_met_sally' || intent === 'chitchat_sweater_weather') {
      const whenHarryMetSallyMovies = ['When Harry Met Sally', "You've Got Mail", 'Sleepless in Seattle', 'Annie Hall', 'The Holiday', '500 Days of Summer', 'Before Sunrise', 'Love Actually'];

      const results = await Promise.all(
        whenHarryMetSallyMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // White-Collar Crime Movies
    else if (intent === 'recommend_white_collar') {
      const whiteCollarMovieMedia = [
        "Catch Me If You Can",
        "The Wolf of Wall Street",
        "The Big Short",
        "Wall Street",
        "American Made",
        "Enron: The Smartest Guys in the Room",
        "Boiler Room",
        "Rogue Trader",
        "Margin Call"
      ];
    
      const results = await Promise.all(
        whiteCollarMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Wizard of Oz Movies
    else if (intent === 'quotes_wizard_of_oz' || intent === 'quotes_wizard_of_oz_pretty' || intent === 'quotes_no_place_like_home') {
      const wizardOfOzMovies = ['The Wizard of Oz', 'Alice in Wonderland', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', 'The Chronicles of Narnia: Prince Caspian', 'The Chronicles of Narnia: The Voyage of the Dawn Treader', 'Labyrinth', 'Stardust'];

      const results = await Promise.all(
        wizardOfOzMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Woman Boss Movies
    else if (intent === 'recommend_woman_boss_movies') {
      const womanBossMoviesMedia = [
        "The Intern",
        "The Devil Wears Prada",
        "Hidden Figures",
        "Erin Brockovich",
        "Legally Blonde",
        "Ocean's 8",
        "The Proposal",
        "Legally Blonde 2: Red, White & Blonde"
      ];
    
      const results = await Promise.all(
        womanBossMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Yakuza Movies
    else if (intent === 'recommend_yakuza') {
      const yakuzaMovieMedia = [
        "Outrage",
        "The Yakuza",
        "Tokyo Drifter",
        "Sonatine",
        "Battles Without Honor and Humanity",
        "Ichi the Killer",
        "Graveyard of Honor",
        "Dead or Alive",
        "The Outsider",
        "First Love"
      ];
    
      const results = await Promise.all(
        yakuzaMovieMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // You've Got Mail Movies
    else if (intent === 'quotes_youve_got_mail') {
      const youveGotMailMovies = ["You've Got Mail", 'Sleepless in Seattle', "When Harry Met Sally", "Notting Hill", "The Holiday", "Love Actually", "One Fine Day", "Letters to Juliet", "Serendipity", "The Shop Around the Corner", "While You Were Sleeping"];

      const results = await Promise.all(
        youveGotMailMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Young Adult Movies
    else if (intent === 'recommend_young_adult_movies') {
      const youngAdultMoviesMedia = [
        "The Fault in Our Stars",
        "To All the Boys I've Loved Before",
        "The Perks of Being a Wallflower",
        "The Hunger Games",
        "Twilight",
        "Love, Simon",
        "Five Feet Apart",
        "The Spectacular Now",
        "The DUFF",
        "Divergent"
      ];
    
      const results = await Promise.all(
        youngAdultMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Shows

    // 18+ Shows
    else if (intent === 'recommend_18_plus_shows') {
      const eighteenPlusShowsMedia = [
        "Euphoria",
        "Game of Thrones",
        "The Boys",
        "Dexter",
        "True Blood",
        "Spartacus",
        "The Witcher",
        "Narcos",
        "Breaking Bad",
        "Californication",
        "The Handmaid's Tale",
        "Penny Dreadful",
        "The Walking Dead"
      ];
    
      const results = await Promise.all(
        eighteenPlusShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Abduction Shows
    else if (intent === 'recommend_abduction_tv') {
      const abductionTvMedia = [
        "The Missing",
        "Stranger Things",
        "The Capture",
        "The Blacklist",
        "Gone",
        "Without a Trace",
        "Mindhunter",
        "Criminal Minds",
        "Safe"
      ];
    
      const results = await Promise.all(
        abductionTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // ADHD Shows
    else if (intent === 'recommend_adhd_shows') {
      const adhdShowsMedia = [
        "Atypical",
        "Parenthood",
        "The Good Doctor",
        "Shameless",
        "Euphoria",
        "The Big Bang Theory",
        "Community",
        "The Queen's Gambit",
        "Speechless",
        "The Middle"
      ];
    
      const results = await Promise.all(
        adhdShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Adrenaline Rush Shows
    else if (intent === 'recommend_adrenaline_rush_tv') {
      const adrenalineRushTvMedia = [
        "Prison Break",
        "24",
        "Money Heist",
        "The Blacklist",
        "Strike Back",
        "Narcos",
        "The Walking Dead",
        "Homeland",
        "Jack Ryan",
        "Sons of Anarchy"
      ];
    
      const results = await Promise.all(
        adrenalineRushTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Afterlife Shows
    else if (intent === 'recommend_afterlife_shows') {
      const afterlifeShowsMedia = [
        "Dead Like Me",
        "The Good Place",
        "Supernatural",
        "Lucifer",
        "Forever",
        "Miracle Workers",
        "The OA",
        "Pushing Daisies",
        "Constantine",
        "Resurrection"
      ];
    
      const results = await Promise.all(
        afterlifeShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Amazon Shows
    else if (intent === 'recommend_amazons_tv') {
      const amazonsTvMedia = [
        "Wonder Woman",
        "Xena: Warrior Princess",
        "Themyscira",
        "Hercules: The Legendary Journeys",
        "Red Sonja",
        "Amazon Women on the Moon",
        "Zena the Warrior",
        "Atlantis",
        "Legend of the Seeker"
      ];
    
      const results = await Promise.all(
        amazonsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Angel Shows
    else if (intent === 'recommend_angel_shows') {
      const angelShowsMedia = [
        "Touched by an Angel",
        "Supernatural",
        "Lucifer",
        "Highway to Heaven",
        "Good Omens",
        "The Messengers",
        "Dominion",
        "Miracle Workers",
        "Angel",
        "The OA"
      ];
    
      const results = await Promise.all(
        angelShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Anime Shows
    else if (intent === 'recommend_anime_tv') {
      const animeTvMedia = [
        "Attack on Titan",
        "My Hero Academia",
        "Demon Slayer",
        "One Punch Man",
        "Naruto",
        "Death Note",
        "Dragon Ball Z",
        "Sword Art Online",
        "Fullmetal Alchemist: Brotherhood",
        "Hunter x Hunter"
      ];
    
      const results = await Promise.all(
        animeTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Anti-Hero Shows
    else if (intent === 'recommend_anti_hero_tv') {
      const antiHeroTvMedia = [
        "Breaking Bad",
        "Dexter",
        "The Punisher",
        "Daredevil",
        "Peaky Blinders",
        "The Boys",
        "House of Cards",
        "Mad Men",
        "Jessica Jones",
        "Boardwalk Empire"
      ];
    
      const results = await Promise.all(
        antiHeroTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Ape Shows
    else if (intent === 'recommend_ape_shows') {
      const apeShowsMedia = [
        "Kong: The Animated Series",
        "Tarzan",
        "King Kong: The Animated Series",
        "The Lost World",
        "Prehistoric Planet",
        "Walking with Beasts",
        "Primal"
      ];
    
      const results = await Promise.all(
        apeShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Archaeology Shows
    else if (intent === 'recommend_archaeology_tv') {
      const archaeologyTvMedia = [
        "The Curse of Oak Island",
        "Ancient Aliens",
        "Expedition Unknown",
        "Digging for Britain",
        "Unearthed",
        "Time Team",
        "Egypt's Unexplained Files",
        "Lost Worlds",
        "Cities of the Underworld",
        "Mysteries of the Abandoned"
      ];
    
      const results = await Promise.all(
        archaeologyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }   
    
    // Archie Comics Shows
    else if (intent === 'recommend_archie_comics_shows') {
      const archieComicsShowsMedia = [
        "Riverdale",
        "The Archie Show",
        "Archie's Weird Mysteries",
        "Josie and the Pussycats",
        "Sabrina the Teenage Witch",
        "Chilling Adventures of Sabrina",
        "The New Archies",
        "Sabrina's Secret Life"
      ];
    
      const results = await Promise.all(
        archieComicsShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Army Shows
    else if (intent === 'recommend_army_tv') {
      const armyTvMedia = [
        "Band of Brothers",
        "The Pacific",
        "SEAL Team",
        "Generation Kill",
        "Strike Back",
        "The Unit",
        "Tour of Duty",
        "Our Girl",
        "The Long Road Home",
        "Six"
      ];
    
      const results = await Promise.all(
        armyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Assassination Shows
    else if (intent === 'recommend_assassination_tv') {
      const assassinationTvMedia = [
        "Killing Eve",
        "Barry",
        "Narcos",
        "Dexter",
        "The Blacklist",
        "24",
        "The Punisher",
        "Hanna",
        "Person of Interest",
        "Queen of the South"
      ];
    
      const results = await Promise.all(
        assassinationTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Astronaut Shows
    else if (intent === 'recommend_astronaut_shows') {
      const astronautShowsMedia = [
        "The Right Stuff",
        "For All Mankind",
        "Mars",
        "Cosmos: A Spacetime Odyssey",
        "Star Trek: The Next Generation",
        "The Expanse",
        "Space: 1999",
        "Doctor Who",
        "Lost in Space",
        "Away"
      ];
    
      const results = await Promise.all(
        astronautShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Atypical Shows
    else if (intent === 'recommend_atypical_shows') {
      const atypicalShowsMedia = [
        "Atypical",
        "The Good Doctor",
        "Parenthood",
        "Speechless",
        "The A Word",
        "The Big Bang Theory",
        "Community",
        "Raising Dion",
        "Love on the Spectrum",
        "Everything's Gonna Be Okay"
      ];
    
      const results = await Promise.all(
        atypicalShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Band Shows
    else if (intent === 'recommend_band_tv') {
      const bandTvMedia = [
        "Glee",
        "Empire",
        "Mozart in the Jungle",
        "Smash",
        "Nashville",
        "The Get Down",
        "Treme",
        "Vinyl",
        "Crazy Ex-Girlfriend",
        "Daisy Jones & The Six"
      ];
    
      const results = await Promise.all(
        bandTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Baseball Shows
    else if (intent === 'recommend_baseball_tv') {
      const baseballTvMedia = [
        "Pitch",
        "The Battered Bastards of Baseball",
        "Eastbound & Down",
        "Brockmire",
        "The League",
        "Ken Burns: Baseball",
        "Catching Hell",
        "Prime 9",
        "Cubs: The Heart and Soul of Chicago"
      ];
    
      const results = await Promise.all(
        baseballTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Behind the Scenes Shows
    else if (intent === 'recommend_behind_the_scenes_tv') {
      const behindTheScenesTvMedia = [
        "30 Rock",
        "The Office",
        "Entourage",
        "Studio 60 on the Sunset Strip",
        "UnReal",
        "The Comeback",
        "Episodes",
        "Extras",
        "Saturday Night Live",
        "The Larry Sanders Show"
      ];
    
      const results = await Promise.all(
        behindTheScenesTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best Foreign Shows
    else if (intent === 'recommend_best_foreign_shows') {
      const bestForeignShowsMedia = [
        "Money Heist",
        "Dark",
        "Lupin",
        "Narcos",
        "Borgen",
        "Call My Agent!",
        "Babylon Berlin",
        "Fauda",
        "Elite"
      ];
    
      const results = await Promise.all(
        bestForeignShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Shows on Apple+
    else if (intent === 'recommend_top_shows_apple_tv') {
      const topShowsAppleTVMedia = [
        "Ted Lasso",
        "The Morning Show",
        "For All Mankind",
        "See",
        "Servant",
        "Defending Jacob",
        "Mythic Quest",
        "Foundation",
        "Truth Be Told",
        "Lisey's Story"
      ];
    
      const results = await Promise.all(
        topShowsAppleTVMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Shows on CBC
    else if (intent === 'recommend_top_shows_cbc_gem') {
      const topShowsCBCGemMedia = [
        "Schitt's Creek",
        "Kim's Convenience",
        "Anne with an E",
        "Heartland",
        "Workin' Moms",
        "Burden of Truth",
        "Murdoch Mysteries",
        "Frankie Drake Mysteries",
        "Diggstown",
        "Coroner"
      ];
    
      const results = await Promise.all(
        topShowsCBCGemMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Shows on Crave
    else if (intent === 'recommend_top_shows_crave') {
      const topShowsCraveMedia = [
        "Letterkenny",
        "The Undoing",
        "Succession",
        "Euphoria",
        "Killing Eve",
        "Game of Thrones",
        "Westworld",
        "Big Little Lies",
        "Sharp Objects",
        "True Detective"
      ];
    
      const results = await Promise.all(
        topShowsCraveMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Shows on Disney+
    else if (intent === 'recommend_top_shows_disney_plus') {
      const topShowsDisneyPlusMedia = [
        "The Mandalorian",
        "WandaVision",
        "The Falcon and the Winter Soldier",
        "Loki",
        "The Simpsons",
        "Star Wars: The Bad Batch",
        "The Clone Wars",
        "High School Musical: The Musical: The Series",
      ];
    
      const results = await Promise.all(
        topShowsDisneyPlusMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    } 

    // Best-Rated Shows on Google
    else if (intent === 'recommend_best_rated_shows_google') {
      const bestRatedShowsGoogleMedia = [
        "Breaking Bad",
        "Game of Thrones",
        "Stranger Things",
        "The Mandalorian",
        "The Queen's Gambit",
        "Sherlock",
        "The Crown",
        "Friends",
        "The Office",
        "The Witcher"
      ];
    
      const results = await Promise.all(
        bestRatedShowsGoogleMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Best-Rated Shows on IMDB
    else if (intent === 'recommend_best_rated_shows_imdb') {
      const bestRatedShowsIMDBMedia = [
        "Breaking Bad",
        "Chernobyl",
        "The Wire",
        "Game of Thrones",
        "Band of Brothers",
        "The Mandalorian",
        "The Sopranos",
        "Sherlock",
        "Fargo",
        "True Detective"
      ];
    
      const results = await Promise.all(
        bestRatedShowsIMDBMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Best-Rated Shows on Netflix
    else if (intent === 'recommend_top_shows_netflix') {
      const topShowsNetflixMedia = [
        "Stranger Things",
        "The Crown",
        "The Witcher",
        "Ozark",
        "Mindhunter",
        "Narcos",
        "Money Heist",
        "Bridgerton",
        "The Umbrella Academy",
        "Dark"
      ];
    
      const results = await Promise.all(
        topShowsNetflixMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Best-Rated Shows on Prime
    else if (intent === 'recommend_top_shows_prime') {
      const topShowsPrimeMedia = [
        "The Boys",
        "Fleabag",
        "The Marvelous Mrs. Maisel",
        "Jack Ryan",
        "The Man in the High Castle",
        "The Expanse",
        "Good Omens",
        "Invincible",
        "The Underground Railroad",
        "Hanna"
      ];
    
      const results = await Promise.all(
        topShowsPrimeMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best-Rated Shows on Rotten Tomatoes
    else if (intent === 'recommend_top_shows_rotten_tomatoes') {
      const topShowsRottenTomatoesMedia = [
        "The Mandalorian",
        "The Queen's Gambit",
        "Fleabag",
        "The Marvelous Mrs. Maisel",
        "Breaking Bad",
        "The Crown",
        "Stranger Things",
        "Succession",
        "Atlanta",
        "The Handmaid's Tale"
      ];
    
      const results = await Promise.all(
        topShowsRottenTomatoesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Best Score - Shows
    else if (intent === 'recommend_best_score_tv') {
      const bestScoreTvMedia = [
        "Game of Thrones",
        "Westworld",
        "Stranger Things",
        "The Mandalorian",
        "Chernobyl",
        "The Witcher",
        "Breaking Bad",
        "The Crown",
        "Dark",
        "Succession"
      ];
    
      const results = await Promise.all(
        bestScoreTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Big Bang Theory
    else if (intent === 'song_intro_big_bang_theory' || intent === 'q_and_a_recommend_sheldon_cooper' || intent === 'quotes_soft_kitty' || intent === 'quotes_big_bang_theory_knock_knock' || intent === 'quotes_big_bang_theory_spot' || intent === 'quotes_big_bang_theory_babies' || intent === 'quotes_bazinga') {
      const bigBangTheoryShow = ['The Big Bang Theory', 'Young Sheldon'];

      const results = await Promise.all(
        bigBangTheoryShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Binge-Worthy Action
    else if (intent === 'recommend_binge_worthy_action') {
      const bingeWorthyActionMedia = [
        "Daredevil",
        "The Witcher",
        "Vikings",
        "The Mandalorian",
        "Arrow",
        "The Punisher",
        "24",
        "Jack Ryan",
        "Cobra Kai",
        "Altered Carbon"
      ];
    
      const results = await Promise.all(
        bingeWorthyActionMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Binge-Worthy Adventure
    else if (intent === 'recommend_binge_worthy_adventure') {
      const bingeWorthyAdventureMedia = [
        "Stranger Things",
        "The Mandalorian",
        "The Witcher",
        "Game of Thrones",
        "The Expanse",
        "Lost",
        "Dark",
        "The Umbrella Academy",
        "The Boys",
        "Outlander"
      ];
    
      const results = await Promise.all(
        bingeWorthyAdventureMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Binge-Worthy Comedy
    else if (intent === 'recommend_binge_worthy_comedy') {
      const bingeWorthyComedyMedia = [
        "Brooklyn Nine-Nine",
        "Schitt's Creek",
        "The Office",
        "Parks and Recreation",
        "Friends",
        "The Good Place",
        "New Girl",
        "Ted Lasso",
        "Archer",
        "BoJack Horseman"
      ];
    
      const results = await Promise.all(
        bingeWorthyComedyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Binge-Worthy Drama
    else if (intent === 'recommend_binge_worthy_drama') {
      const bingeWorthyDramaMedia = [
        "This Is Us",
        "The Crown",
        "Breaking Bad",
        "The Handmaid's Tale",
        "The Queen's Gambit",
        "Succession",
        "Big Little Lies",
        "Ozark",
        "Peaky Blinders",
        "Westworld"
      ];
    
      const results = await Promise.all(
        bingeWorthyDramaMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Binge-Worthy Science Fiction
    else if (intent === 'recommend_binge_worthy_science_fiction') {
      const bingeWorthyScienceFictionMedia = [
        "The Expanse",
        "Black Mirror",
        "Westworld",
        "Stranger Things",
        "Altered Carbon",
        "The 100",
        "The Mandalorian",
        "Fringe",
        "The OA",
        "Doctor Who"
      ];
    
      const results = await Promise.all(
        bingeWorthyScienceFictionMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Biography Shows
    else if (intent === 'recommend_biography_shows') {
      const biographyShowsMedia = [
        "The Crown",
        "When They See Us",
        "Genius",
        "Band of Brothers",
        "Mad Men",
        "Selena: The Series",
        "Chernobyl",
        "Victoria",
        "John Adams"
      ];
    
      const results = await Promise.all(
        biographyShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Blockbuster Shows
    else if (intent === 'recommend_blockbusters_tv') {
      const blockbustersTvMedia = [
        "Stranger Things",
        "The Mandalorian",
        "Game of Thrones",
        "The Witcher",
        "Breaking Bad",
        "The Walking Dead",
        "The Boys",
        "Westworld",
        "Lost",
        "Vikings"
      ];
    
      const results = await Promise.all(
        blockbustersTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Body Positive Shows
    else if (intent === 'recommend_body_positive_shows') {
      const bodyPositiveShowsMedia = [
        "Shrill",
        "Dumplin'",
        "This Is Us",
        "The Bold Type",
        "My Mad Fat Diary",
        "The Mindy Project",
        "Big Mouth",
        "Dietland",
        "Insatiable",
        "Hairspray Live!"
      ];
    
      const results = await Promise.all(
        bodyPositiveShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // The Boys Shows
    else if (intent === 'quotes_the_boys') {
      const theBoysShows = ['The Boys', 'Doom Patrol', "Invincible", "Preacher", "Umbrella Academy", "Titans", "Powers", "Suicide Squad"];

      const results = await Promise.all(
        theBoysShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Broadway Shows
    else if (intent === 'recommend_broadway_shows') {
      const broadwayShowsMedia = [
        "Wicked",
        "The Phantom of the Opera",
        "Les Misérables",
        "Chicago",
        "Rent",
        "Dear Evan Hansen",
        "The Lion King",
        "Moulin Rouge! The Musical",
        "The Book of Mormon"
      ];
    
      const results = await Promise.all(
        broadwayShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Buffy Shows
    else if (intent === 'q_and_a_recommend_buffy' || intent === 'q_and_a_recommend_spike') {
      const buffyShows = [
        "Buffy the Vampire Slayer",
        "Angel",
        "Supernatural",
        "Charmed",
        "The Vampire Diaries",
        "Teen Wolf",
        "The Originals",
        "Veronica Mars",
        "Grimm",
        "The Magicians",
        "Shadowhunters",
        "Legacies"
      ];

      const results = await Promise.all(
        buffyShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Canadian Shows
    else if (intent === 'recommend_canadian_shows') {
      const canadianShowsMedia = [
        "Schitt's Creek",
        "Kim's Convenience",
        "Anne with an E",
        "Letterkenny",
        "Orphan Black",
        "Trailer Park Boys",
        "Corner Gas",
        "Being Erica",
        "Degrassi: The Next Generation",
        "Heartland"
      ];
    
      const results = await Promise.all(
        canadianShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Cat Lovers Shows
    else if (intent === 'recommend_cat_lovers_shows') {
      const catLoversShowsMedia = [
        "My Cat from Hell",
        "Cats 101",
        "Too Cute Crisis",
        "The Lion in Your Living Room",
        "The Secret Life of Cats",
        "Animal Planet's Cats Uncovered",
        "The Adventures of Milo and Otis",
        "Kitten Bowl",
        "Animal Planet: Must Love Cats",
        "The Cat People"
      ];
    
      const results = await Promise.all(
        catLoversShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Chess Shows
    else if (intent === 'recommend_chess_tv') {
      const chessTvMedia = [
        "The Queen's Gambit",
        "Magnus",
        "Pawn Sacrifice",
        "Searching for Bobby Fischer",
        "The Chess Players",
        "The Luzhin Defence",
        "Critical Thinking",
        "Bobby Fischer Against the World",
        "Endgame: Bobby Fischer's Remarkable Rise and Fall",
        "Queen to Play"
      ];
    
      const results = await Promise.all(
        chessTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Classic Shows
    else if (intent === 'q_and_a_recommend_classic_shows') {
      const classicShows = ['I Love Lucy', "The Twilight Zone", "The Andy Griffith Show", "The Honeymooners", "The Mary Tyler Moore Show", "Gilligan's Island", "Happy Days", "The Dick Van Dyke Show", "All in the Family", "Bewitched"];

      const results = await Promise.all(
        classicShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Coding Shows
    else if (intent === 'recommend_coding_tv') {
      const codingTvMedia = [
        "Silicon Valley",
        "Halt and Catch Fire",
        "DevOps",
        "The Code",
        "Mr. Robot",
        "Startup",
        "The IT Crowd",
        "Black Mirror",
        "Code Monkeys",
        "Westworld"
      ];
    
      const results = await Promise.all(
        codingTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Coming-of-Age Shows
    else if (intent === 'recommend_coming_of_age_shows') {
      const comingOfAgeShowsMedia = [
        "Euphoria",
        "The Wonder Years",
        "Sex Education",
        "Skins",
        "Freaks and Geeks",
        "13 Reasons Why",
        "My So-Called Life",
        "Stranger Things",
        "Derry Girls",
        "Riverdale"
      ];
    
      const results = await Promise.all(
        comingOfAgeShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Cooking Shows
    else if (intent === 'recommend_cooking_tv') {
      const cookingTvMedia = [
        "Chef's Table",
        "The Great British Bake Off",
        "MasterChef",
        "Hell's Kitchen",
        "Iron Chef",
        "Top Chef",
        "Ugly Delicious",
        "Somebody Feed Phil",
        "Salt Fat Acid Heat",
        "The Final Table"
      ];
    
      const results = await Promise.all(
        cookingTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Cop Shows
    else if (intent === 'recommend_cop_shows') {
      const copShowsMedia = [
        "Brooklyn Nine-Nine",
        "The Wire",
        "Law & Order: SVU",
        "True Detective",
        "The Shield",
        "Blue Bloods",
        "NCIS",
        "Southland",
        "CSI: Crime Scene Investigation",
        "Third Watch"
      ];
    
      const results = await Promise.all(
        copShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Cowboy Shows
    else if (intent === 'recommend_cowboy_shows') {
      const cowboyShowsMedia = [
        "Westworld",
        "Longmire",
        "Deadwood",
        "Justified",
        "The Mandalorian",
        "Yellowstone",
        "The Rifleman",
        "Bonanza",
        "Gunsmoke",
        "Hell on Wheels"
      ];
    
      const results = await Promise.all(
        cowboyShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Criminal Minds 
    else if (intent === 'q_and_a_recommend_criminal_minds') {
      const criminalMindsShows = [
        "Mindhunter",
        "Castle",
        "Bones",
        "Hannibal",
        "Scorpion",
        "Psych",
        "Cold Case",
        "Numb3rs",
        "Criminal Minds: Beyond Borders",
        "The Mentalist"
      ];

      const results = await Promise.all(
        criminalMindsShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Critically Acclaimed Shows
    else if (intent === 'recommend_critically_acclaimed_shows') {
      const criticallyAcclaimedShowsMedia = [
        "Breaking Bad",
        "The Crown",
        "The Handmaid's Tale",
        "Succession",
        "Fleabag",
        "Chernobyl",
        "Better Call Saul",
        "The Wire",
        "Stranger Things",
        "The Queen's Gambit"
      ];
    
      const results = await Promise.all(
        criticallyAcclaimedShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Critics' Choice Shows
    else if (intent === 'recommend_critics_choice_tv') {
      const criticsChoiceTvMedia = [
        "Fleabag",
        "The Crown",
        "Succession",
        "Breaking Bad",
        "The Queen's Gambit",
        "Better Call Saul",
        "Chernobyl",
        "The Mandalorian",
        "The Handmaid's Tale",
        "Ted Lasso"
      ];
    
      const results = await Promise.all(
        criticsChoiceTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Cult Shows
    else if (intent === 'recommend_cult_shows') {
      const cultShowsMedia = [
        "The Following",
        "Wild Wild Country",
        "The Path",
        "American Horror Story: Cult",
        "The Leftovers",
        "Waco",
        "The Vow",
        "The Family",
        "Helter Skelter: An American Myth",
        "The Cult"
      ];
    
      const results = await Promise.all(
        cultShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Daredevil Shows
    else if (intent === 'recommend_daredevils_tv') {
      const daredevilsTvMedia = [
        "Daredevil",
        "Jackass",
        "Nitro Circus",
        "The Punisher",
        "Luke Cage",
        "Arrow",
        "Gotham",
        "Jessica Jones",
        "The Defenders",
        "The Boys"
      ];
    
      const results = await Promise.all(
        daredevilsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Devil Shows
    else if (intent === 'recommend_devil_shows') {
      const devilShowsMedia = [
        "Lucifer",
        "Supernatural",
        "The Exorcist",
        "Good Omens",
        "The Sandman",
        "Chilling Adventures of Sabrina",
        "Angel",
        "Constantine",
        "Penny Dreadful",
        "Damien"
      ];
    
      const results = await Promise.all(
        devilShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Drug Lords Shows
    else if (intent === 'recommend_druglords_tv') {
      const druglordsTvMedia = [
        "Narcos",
        "Breaking Bad",
        "Queen of the South",
        "El Chapo",
        "Snowfall",
        "Weeds",
        "Power",
        "Ozark",
        "Drug Lords",
        "Better Call Saul"
      ];
    
      const results = await Promise.all(
        druglordsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Dysfunctional Shows
    else if (intent === 'recommend_dysfunctional_tv') {
      const dysfunctionalTvMedia = [
        "Shameless",
        "Arrested Development",
        "Succession",
        "The Simpsons",
        "Modern Family",
        "BoJack Horseman",
        "Family Guy",
        "The Righteous Gemstones",
        "This Is Us",
        "Six Feet Under"
      ];
    
      const results = await Promise.all(
        dysfunctionalTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Emmy Winners Shows
    else if (intent === 'recommend_emmy_winners_tv') {
      const emmyWinnersTvMedia = [
        "Breaking Bad",
        "Game of Thrones",
        "The Handmaid's Tale",
        "The Crown",
        "The Mandalorian",
        "Succession",
        "Fleabag",
        "Schitt's Creek",
        "Chernobyl",
        "Westworld"
      ];
    
      const results = await Promise.all(
        emmyWinnersTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // End of the World Shows
    else if (intent === 'q_and_a_recommend_end_of_world_shows') {
      const endOfTheWorldShows = [
        "Station Eleven",
        "The Last Man on Earth",
        "The Walking Dead",
        "The Last of Us",
        "The 100",
        "Snowpiercer",
        "The Stand",
        "Black Summer",
        "Sweet Tooth",
        "Fear the Walking Dead",
        "Z Nation",
        "The Leftovers"
      ];

      const results = await Promise.all(
        endOfTheWorldShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Faith-Based Shows
    else if (intent === 'recommend_faith_based_shows') {
      const faithBasedShowsMedia = [
        "Greenleaf",
        "7th Heaven",
        "Touched by an Angel",
        "The Chosen",
        "Joan of Arcadia",
        "Highway to Heaven",
        "Messiah",
        "God Friended Me",
        "The Bible",
        "A.D. The Bible Continues"
      ];
    
      const results = await Promise.all(
        faithBasedShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Fan fiction Shows
    else if (intent === 'q_and_a_fan_fiction') {
      const fanFictionShows = ["Good Omens", "Twilight", "Gotham", "Lucifer", "Doctor Who", "Supernatural", "Once Upon a Time", "Riverdale", "Sherlock", "Star Trek: Lower Decks", "Doctor Who", "The Mandalorian", "WandaVision"];

      const results = await Promise.all(
        fanFictionShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Fashion Shows
    else if (intent === 'recommend_fashion_tv') {
      const fashionTvMedia = [
        "Project Runway",
        "Next in Fashion",
        "The Bold Type",
        "Emily in Paris",
        "Making the Cut",
        "America's Next Top Model",
        "Styling Hollywood",
        "Queer Eye",
        "The Devil Wears Prada (Adaptation)",
        "Gossip Girl"
      ];
    
      const results = await Promise.all(
        fashionTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Feel-Good Adventure Shows
    else if (intent === 'recommend_feel_good_adventure_tv') {
      const feelGoodAdventureTvMedia = [
        "Parks and Recreation",
        "The Mandalorian",
        "Ted Lasso",
        "The Office",
        "Schitt's Creek",
        "The Good Place",
        "Firefly",
        "Adventure Time",
        "Star Trek: The Next Generation",
        "Brooklyn Nine-Nine"
      ];
    
      const results = await Promise.all(
        feelGoodAdventureTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Female-Lead Shows
    else if (intent === 'recommend_female_lead_shows') {
      const femaleLeadShowsMedia = [
        "The Queen's Gambit",
        "Fleabag",
        "Killing Eve",
        "Big Little Lies",
        "The Marvelous Mrs. Maisel",
        "Jessica Jones",
        "The Handmaid's Tale",
        "I May Destroy You",
        "Orphan Black",
        "Buffy the Vampire Slayer"
      ];
    
      const results = await Promise.all(
        femaleLeadShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Fishing Shows
    else if (intent === 'recommend_fishing_tv') {
      const fishingTvMedia = [
        "River Monsters",
        "Deadliest Catch",
        "Wicked Tuna",
        "Fishing with John",
        "Alaska: The Last Frontier",
        "Battlefish",
        "Expedition Unknown",
        "Fishing Adventurer",
        "Ultimate Catch",
        "Monster Fish"
      ];
    
      const results = await Promise.all(
        fishingTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Food Shows
    else if (intent === 'recommend_food_shows') {
      const foodShowsMedia = [
        "The Great British Bake Off",
        "Chef's Table",
        "Salt, Fat, Acid, Heat",
        "MasterChef",
        "Ugly Delicious",
        "Street Food",
        "The Final Table",
        "Nailed It!",
        "The Chef Show",
        "Somebody Feed Phil"
      ];
    
      const results = await Promise.all(
        foodShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Friends
    else if (intent === 'song_intro_friends' || intent === 'quotes_my_sandwich' || intent === 'quotes_we_were_on_a_break' || intent === 'q_and_a_recommend_shows_like_friends' || intent === 'quotes_friends_feet' || intent === 'chitchat_friends_char' || intent === 'quotes_friends_moo_point' || intent === 'quotes_friends_seven' || intent === 'quotes_friends_pivot') {
      const friendsShow = ['Friends', "How I Met Your Mother", "New Girl", "Brooklyn Nine-Nine", "Parks and Recreation", "The Big Bang Theory", "Happy Endings", "Cougar Town", "Scrubs", "The Good Place", "Seinfeld", "The Office", "Golden Girls"];

      const results = await Promise.all(
        friendsShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // The Fresh Prince of Bel-Air
    else if (intent === 'song_intro_fresh_prince') {
      const freshPrinceShow = [
        'The Fresh Prince of Bel-Air',
        'The Fresh Prince of Bel-Air Reunion',
      ];

      const results = await Promise.all(
        freshPrinceShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Full House
    else if (intent === 'song_intro_full_house') {
      const fullHouseShow = ['Full House', 'Fuller House'];

      const results = await Promise.all(
        fullHouseShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Futuristic Shows
    else if (intent === 'recommend_futuristic_tv') {
      const futuristicTvMedia = [
        "Black Mirror",
        "The Expanse",
        "Westworld",
        "Altered Carbon",
        "The 100",
        "Snowpiercer",
        "Star Trek: Discovery",
        "Battlestar Galactica",
        "The Mandalorian",
        "Love, Death & Robots"
      ];
    
      const results = await Promise.all(
        futuristicTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Gangs Shows
    else if (intent === 'recommend_gang_tv') {
      const gangTvMedia = [
        "Peaky Blinders",
        "Sons of Anarchy",
        "The Sopranos",
        "Boardwalk Empire",
        "Narcos",
        "Animal Kingdom",
        "Power",
        "Gomorrah",
        "Breaking Bad",
        "El Chapo"
      ];
    
      const results = await Promise.all(
        gangTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Gay Shows
    else if (intent === 'recommend_gay_shows') {
      const gayShowsMedia = [
        "Schitt's Creek",
        "Will & Grace",
        "Queer as Folk",
        "Pose",
        "RuPaul's Drag Race",
        "The L Word",
        "Looking",
        "Orange Is the New Black",
        "It's a Sin",
        "Euphoria"
      ];
    
      const results = await Promise.all(
        gayShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Girl Power Shows
    else if (intent === 'recommend_girl_power_shows') {
      const girlPowerShowsMedia = [
        "The Bold Type",
        "Dark Angel",
        "Killing Eve",
        "The Queen's Gambit",
        "Buffy the Vampire Slayer",
        "Fleabag",
        "Orange Is the New Black",
        "Jane the Virgin",
        "Supergirl",
        "Alias",
        "Veronica Mars"
      ];
    
      const results = await Promise.all(
        girlPowerShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // God Shows
    else if (intent === 'recommend_god_shows') {
      const godShowsMedia = [
        "The Bible",
        "God Friended Me",
        "Joan of Arcadia",
        "Touched by an Angel",
        "Messiah",
        "The Chosen",
        "Highway to Heaven",
        "The Path",
        "Superbook",
        "A.D. The Bible Continues"
      ];
    
      const results = await Promise.all(
        godShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Godzilla Shows
    else if (intent === 'recommend_godzilla_tv') {
      const godzillaTvMedia = [
        "Godzilla: The Series",
        "Godzilla Singular Point",
        "Godzilla: Planet of the Monsters",
        "Godzilla vs. Mechagodzilla",
        "Kaiju No. 8",
        "Godzilla Island",
        "Ultraman",
        "Pacific Rim: The Black",
        "King Kong vs. Godzilla"
      ];
    
      const results = await Promise.all(
        godzillaTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Golden Globe Shows
    else if (intent === 'recommend_golden_globe_winners_tv') {
      const goldenGlobeWinnersTvMedia = [
        "Schitt's Creek",
        "The Crown",
        "The Marvelous Mrs. Maisel",
        "Big Little Lies",
        "Fleabag",
        "Succession",
        "The Queen's Gambit",
        "Killing Eve",
        "Glee",
        "Homeland"
      ];
    
      const results = await Promise.all(
        goldenGlobeWinnersTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Greek Mythology Shows
    else if (intent === 'recommend_greek_mythology_tv') {
      const greekMythologyTvMedia = [
        "Blood of Zeus",
        "Clash of the Gods",
        "Troy: Fall of a City",
        "Olympus",
        "Hercules: The Legendary Journeys",
        "Xena: Warrior Princess",
        "The Odyssey",
        "Gods of Egypt",
        "Jason and the Argonauts",
        "Atlantis"
      ];
    
      const results = await Promise.all(
        greekMythologyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Grimm's Fairy Tales Shows
    else if (intent === 'recommend_grimms_fairy_tales_shows') {
      const grimmsFairyTalesShowsMedia = [
        "Grimm",
        "Once Upon a Time",
        "The Brothers Grimm",
        "Into the Woods",
        "Faerie Tale Theatre",
        "The Witcher",
        "Fairy Tale Police Department"
      ];
    
      const results = await Promise.all(
        grimmsFairyTalesShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Hacking Shows
    else if (intent === 'recommend_hacking_tv') {
      const hackingTvMedia = [
        "Mr. Robot",
        "Silicon Valley",
        "Person of Interest",
        "Halt and Catch Fire",
        "Scorpion",
        "The IT Crowd",
        "The Matrix (animated series)",
        "The Code",
        "Black Mirror",
        "CSI: Cyber"
      ];
    
      const results = await Promise.all(
        hackingTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Health Shows
    else if (intent === 'recommend_health_shows') {
      const healthShowsMedia = [
        "Miracle Doctor",
        "My 600-lb Life",
        "Dr. Pimple Popper",
        "Intervention",
        "Botched",
        "Fit to Fat to Fit",
        "What the Health",
        "The Dr. Oz Show",
        "Super Size Me",
        "Extreme Weight Loss"
      ];
    
      const results = await Promise.all(
        healthShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Heaven Shows
    else if (intent === 'recommend_heaven_shows') {
      const heavenShowsMedia = [
        "The Good Place",
        "Touched by an Angel",
        "Highway to Heaven",
        "Supernatural",
        "Lucifer",
        "Dead Like Me",
        "God Friended Me",
        "Miracle Workers",
        "Forever",
        "7th Heaven",
        "Angels in America"
      ];
    
      const results = await Promise.all(
        heavenShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Historical Drama Shows
    else if (intent === 'recommend_historical_drama_shows') {
      const historicalDramaShowsMedia = [
        "The Crown",
        "Chernobyl",
        "Band of Brothers",
        "The Last Kingdom",
        "Outlander",
        "Downton Abbey",
        "Peaky Blinders",
        "The Spanish Princess",
        "The Tudors",
        "Medici: Masters of Florence"
      ];
    
      const results = await Promise.all(
        historicalDramaShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Home Invasion Shows
    else if (intent === 'recommend_home_invasion_shows') {
      const homeInvasionShowsMedia = [
        "The Strangers",
        "American Horror Story",
        "Castle Rock",
        "Them",
        "Haunting of Hill House",
        "True Nightmares",
        "Slasher"
      ];
    
      const results = await Promise.all(
        homeInvasionShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // How I Met Your Mother
    else if (intent === 'quotes_legendary' || intent === 'quotes_barney_suit_up') {
      const howIMetYourMotherShow = ['How I Met Your Mother', 'Friends', 'New Girl', 'Happy Endings', 'The Office', "Parks and Recreation", "Cougar Town", "Scrubs", "The Mindy Project", "That '70s Show"];

      const results = await Promise.all(
        howIMetYourMotherShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Inequality Shows
    else if (intent === 'recommend_inequality_shows') {
      const inequalityShowsMedia = [
        "The Handmaid's Tale",
        "Black Mirror",
        "GLOW",
        "Succession",
        "Snowpiercer",
        "Orange Is the New Black",
        "The Good Fight",
        "Dear White People",
        "Big Little Lies",
        "The Plot Against America"
      ];
    
      const results = await Promise.all(
        inequalityShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // International Shows
    else if (intent === 'recommend_international_shows') {
      const internationalShowsMedia = [
        "Money Heist",
        "Dark",
        "Lupin",
        "Elite",
        "Borgen",
        "Narcos",
        "Call My Agent!",
        "The Bridge",
        "Babylon Berlin"
      ];
    
      const results = await Promise.all(
        internationalShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // The IT Crowd
    else if (intent === 'quotes_it_crowd_off_and_on' || intent === 'q_and_a_recommend_nerd') {
      const theITCrowdShows = [
        'Stranger Things',
        'The IT Crowd',
        'Silicon Valley',
        'Parks and Recreation',
        'The Office',
        'Community',
        'The Big Bang Theory',
        'Black Books',
        'Brooklyn Nine-Nine'
      ];

      const results = await Promise.all(
        theITCrowdShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Korean Shows
    else if (intent === 'recommend_korean_shows') {
      const koreanShowsMedia = [
        "Crash Landing on You",
        "Squid Game",
        "Itaewon Class",
        "Kingdom",
        "Vincenzo",
        "My Name",
        "Start-Up",
        "The Heirs",
        "Goblin",
        "Reply 1988"
      ];
    
      const results = await Promise.all(
        koreanShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Korean Zombie Shows
    else if (intent === 'recommend_korean_zombie_shows') {
      const koreanZombieShowsMedia = [
        "Kingdom",
        "All of Us Are Dead",
        "Sweet Home",
        "Zombie Detective",
        "Train to Busan: Seoul Station",
        "Zombie Apocalypse",
        "Night of the Undead",
        "Dark Hole",
        "Hellbound",
        "The Cursed"
      ];
    
      const results = await Promise.all(
        koreanZombieShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Legal Dram Shows
    else if (intent === 'recommend_legal_dramas_tv') {
      const legalDramasTvMedia = [
        "Suits",
        "The Good Wife",
        "How to Get Away with Murder",
        "Boston Legal",
        "Law & Order",
        "Better Call Saul",
        "The Practice",
        "Damages",
        "Rake"
      ];
    
      const results = await Promise.all(
        legalDramasTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mafia Shows
    else if (intent === 'recommend_mafia_tv') {
      const mafiaTvMedia = [
        "The Sopranos",
        "Gomorrah",
        "Boardwalk Empire",
        "Peaky Blinders",
        "Narcos",
        "Power",
        "The Godfather of Harlem",
        "The Irishman",
        "Goodfellas",
        "Mob City"
      ];
    
      const results = await Promise.all(
        mafiaTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Marines Shows
    else if (intent === 'recommend_marines_tv') {
      const marinesTvMedia = [
        "Generation Kill",
        "The Unit",
        "SEAL Team",
        "Band of Brothers",
        "The Pacific",
        "Tour of Duty",
        "Strike Back",
        "Our Girl",
        "Six",
        "Valor"
      ];
    
      const results = await Promise.all(
        marinesTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Medical Shows
    else if (intent === 'q_and_a_medical_shows') {
      const medicalShowsMedia = [
        "Grey's Anatomy",
        "House",
        "The Good Doctor",
        "ER",
        "Scrubs",
        "The Resident",
        "Chicago Med",
        "Nurse Jackie",
        "New Amsterdam",
        "Private Practice"
      ];
    
      const results = await Promise.all(
        medicalShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mental Health Shows
    else if (intent === 'recommend_mental_health_shows') {
      const mentalHealthShowsMedia = [
        "Crazy Ex-Girlfriend",
        "Atypical",
        "BoJack Horseman",
        "Euphoria",
        "My Mad Fat Diary",
        "13 Reasons Why",
        "Please Like Me",
        "This Is Us",
        "Shameless",
        "Skins"
      ];
    
      const results = await Promise.all(
        mentalHealthShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mercenaries Shows
    else if (intent === 'recommend_mercenaries_tv') {
      const mercenariesTvMedia = [
        "Strike Back",
        "The Punisher",
        "The A-Team",
        "The Expendables",
        "Burn Notice",
        "The Unit",
        "Hanna",
        "Bodyguard",
        "Warrior",
        "Shooter"
      ];
    
      const results = await Promise.all(
        mercenariesTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Mind-Bender Shows
    else if (intent === 'recommend_mind_bender_shows') {
      const mindBenderShowsMedia = [
        "Dark",
        "Westworld",
        "The OA",
        "Twin Peaks",
        "Stranger Things",
        "Legion",
        "The Leftovers",
        "Fringe",
        "Sense8",
        "Mr. Robot"
      ];
    
      const results = await Promise.all(
        mindBenderShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Monsters Shows
    else if (intent === 'recommend_monsters_tv') {
      const monstersTvMedia = [
        "Stranger Things",
        "The Witcher",
        "Supernatural",
        "The X-Files",
        "Penny Dreadful",
        "Buffy the Vampire Slayer",
        "Lovecraft Country",
        "Grimm",
        "Van Helsing",
        "The Haunting of Hill House"
      ];
    
      const results = await Promise.all(
        monstersTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Murder Mystery Shows
    else if (intent === 'recommend_murder_tv') {
      const murderTvMedia = [
        "True Detective",
        "Broadchurch",
        "Mindhunter",
        "Sherlock",
        "The Killing",
        "Criminal Minds",
        "Hannibal",
        "Dexter",
        "The Sinner"
      ];
    
      const results = await Promise.all(
        murderTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Navy Shows
    else if (intent === 'recommend_navy_tv') {
      const navyTvMedia = [
        "NCIS",
        "The Last Ship",
        "JAG",
        "SEAL Team",
        "The Enemy Within",
        "Valor",
        "Six",
        "Hunter Killer",
        "Greyhound"
      ];
    
      const results = await Promise.all(
        navyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Neurotypical Shows
    else if (intent === 'recommend_neurotypical_shows') {
      const neurotypicalShowsMedia = [
        "Friends",
        "The Office",
        "How I Met Your Mother",
        "Parks and Recreation",
        "Brooklyn Nine-Nine",
        "The Big Bang Theory",
        "New Girl",
        "Modern Family",
        "Schitt's Creek",
        "Community"
      ];
    
      const results = await Promise.all(
        neurotypicalShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // New Girl
    else if (intent === 'song_intro_new_girl') {
      const newGirlShow = ['New Girl'];

      const results = await Promise.all(
        newGirlShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Nostalgic Shows
    else if (intent === 'recommend_nostalgic_tv') {
      const nostalgicTvMedia = [
        "Stranger Things",
        "Friends",
        "The Fresh Prince of Bel-Air",
        "That '70s Show",
        "Full House",
        "Boy Meets World",
        "Cheers",
        "The Wonder Years",
        "Seinfeld",
        "Happy Days"
      ];
    
      const results = await Promise.all(
        nostalgicTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // The Office
    else if (intent === 'quotes_the_office_twss' || intent === 'quotes_the_office_bankruptcy') {
      const theOfficeShow = ['The Office', 'Superstore', '30 Rock', 'Brooklyn Nine-Nine', 'Archer'];

      const results = await Promise.all(
        theOfficeShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // OCD Shows
    else if (intent === 'recommend_ocd_shows') {
      const ocdShowsMedia = [
        "Monk",
        "Crazy Ex-Girlfriend",
        "Pure",
        "The Big Bang Theory",
        "Obsessive Compulsive Cleaners",
        "Girls",
        "Jessica Jones",
        "Atypical",
        "Friends",
        "The Good Doctor"
      ];
    
      const results = await Promise.all(
        ocdShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Olympics Shows
    else if (intent === 'recommend_olympics_tv') {
      const olympicsTvMedia = [
        "The Weight of Gold",
        "Olympic Dreams",
        "Miracle",
        "Race",
        "Icarus",
        "Chariots of Fire",
        "The Olympic Games: Tokyo 2020",
        "Rising Phoenix",
        "Cool Runnings",
        "The Bronze"
      ];
    
      const results = await Promise.all(
        olympicsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Pansexual Shows
    else if (intent === 'recommend_pansexual_shows') {
      const pansexualShowsMedia = [
        "Sex Education",
        "Steven Universe",
        "Schitt's Creek",
        "Pose",
        "The L Word",
        "RuPaul's Drag Race",
        "Looking",
        "Dear White People",
        "The Bisexual",
        "The Umbrella Academy"
      ];
    
      const results = await Promise.all(
        pansexualShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Paranormal Shows
    else if (intent === 'recommend_paranormal_shows') {
      const paranormalShowsMedia = [
        "Ghost Adventures",
        "The Haunting of Hill House",
        "Paranormal Witness",
        "Supernatural",
        "Ghost Hunters",
        "The X-Files",
        "The Haunting of Bly Manor",
        "Stranger Things",
        "Locke & Key",
        "Charmed"
      ];
    
      const results = await Promise.all(
        paranormalShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // PG-Rated Shows
    else if (intent === 'recommend_pg_rated_shows') {
      const pgRatedShowsMedia = [
        "Avatar: The Last Airbender",
        "Anne with an E",
        "Bluey",
        "The Mandalorian",
        "Stranger Things",
        "Once Upon a Time",
        "The Flash",
        "Doctor Who",
        "My Little Pony: Friendship is Magic",
        "The Simpsons"
      ];
    
      const results = await Promise.all(
        pgRatedShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Polyamory Shows
    else if (intent === 'recommend_polyamory_shows') {
      const polyamoryShowsMedia = [
        "You Me Her",
        "Wanderlust",
        "Sense8",
        "The Bisexual",
        "Big Love",
        "Polyamory: Married & Dating",
        "Grace and Frankie",
        "The L Word",
        "Schitt's Creek"
      ];
    
      const results = await Promise.all(
        polyamoryShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Prison Shows
    else if (intent === 'recommend_prison_tv') {
      const prisonTvMedia = [
        "Orange is the New Black",
        "Prison Break",
        "Oz",
        "Escape at Dannemora",
        "Wentworth",
        "The Night Of",
        "Locked Up",
        "The Shawshank Redemption",
        "Banshee",
        "Alcatraz"
      ];
    
      const results = await Promise.all(
        prisonTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Puzzle Shows
    else if (intent === 'recommend_puzzles_tv') {
      const puzzlesTvMedia = [
        "Sherlock",
        "The Crystal Maze",
        "Escape Room",
        "The Mentalist",
        "Death in Paradise",
        "Jonathan Creek",
        "Lupin",
        "Escape the Night",
        "Taskmaster"
      ];
    
      const results = await Promise.all(
        puzzlesTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Queer Actor Shows
    else if (intent === 'recommend_queer_actor_shows') {
      const queerActorShowsMedia = [
        "Pose",
        "Schitt's Creek",
        "It's a Sin",
        "RuPaul's Drag Race",
        "Queer Eye",
        "Euphoria",
        "The L Word: Generation Q",
        "Orange Is the New Black",
        "Transparent",
        "Will & Grace"
      ];
    
      const results = await Promise.all(
        queerActorShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Queer Shows
    else if (intent === 'recommend_queer_shows') {
      const queerShowsMedia = [
        "Pose",
        "Queer Eye",
        "RuPaul's Drag Race",
        "The L Word",
        "Euphoria",
        "Orange Is the New Black",
        "Sense8",
        "Veneno",
        "It's a Sin",
        "Transparent"
      ];
    
      const results = await Promise.all(
        queerShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // R-rated Shows
    else if (intent === 'recommend_r_rated_shows') {
      const rRatedShowsMedia = [
        "The Boys",
        "Dexter",
        "Breaking Bad",
        "The Witcher",
        "True Blood",
        "American Horror Story",
        "The Walking Dead",
        "Spartacus",
        "The Handmaid's Tale",
        "Game of Thrones",
        "Sons of Anarchy",
        "Ozark",
        "Westworld",
        "Hannibal",
        "Penny Dreadful"
      ];
    
      const results = await Promise.all(
        rRatedShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Racing Shows
    else if (intent === 'recommend_racing_tv') {
      const racingTvMedia = [
        "Drive to Survive",
        "Initial D",
        "Hyperdrive",
        "The Grand Tour",
        "Top Gear",
        "Formula 1: The Official Review",
        "Le Mans: Racing is Everything",
        "Fastest Car",
        "Speed Racer",
        "Street Outlaws"
      ];
    
      const results = await Promise.all(
        racingTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Racism Shows
    else if (intent === 'recommend_racism_shows') {
      const racismShowsMedia = [
        "Dear White People",
        "When They See Us",
        "The Watchmen",
        "Lovecraft Country",
        "Roots",
        "The Good Fight",
        "Them",
        "Atlanta",
        "Orange Is the New Black",
        "Queen Sugar"
      ];
    
      const results = await Promise.all(
        racismShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Raunchy Shows
    else if (intent === 'recommend_raunchy_tv') {
      const raunchyTvMedia = [
        "It's Always Sunny in Philadelphia",
        "South Park",
        "Big Mouth",
        "The Boys",
        "Archer",
        "Rick and Morty",
        "Family Guy",
        "Shameless",
        "The League",
        "F is for Family"
      ];
    
      const results = await Promise.all(
        raunchyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Real Estate Shows
    else if (intent === 'recommend_real_estate_tv') {
      const realEstateTvMedia = [
        "Selling Sunset",
        "Million Dollar Listing",
        "Flip or Flop",
        "Property Brothers",
        "Fixer Upper",
        "Love It or List It",
        "The Real Housewives of Beverly Hills",
        "House Hunters",
        "Beachfront Bargain Hunt",
        "Grand Designs"
      ];
    
      const results = await Promise.all(
        realEstateTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Rick and Morty
    else if (intent === 'quotes_rick_and_morty_pickle') {
      const rickAndMortyShows = [
        'Rick and Morty',
        'Rick and Morty: The Anime',
        'Bojack Horseman',
        'Futurama',
        'Solar Opposites',
        'Final Space',
        'Disenchantment',
        'Archer',
        'The Venture Bros.'
      ];

      const results = await Promise.all(
        rickAndMortyShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sabrina Shows
    else if (intent === 'recommend_sabrina_shows') {
      const sabrinaShowsMedia = [
        "Sabrina the Teenage Witch",
        "Chilling Adventures of Sabrina",
        "Sabrina's Secret Life",
        "Sabrina the Animated Series",
        "The New Archies"
      ];
    
      const results = await Promise.all(
        sabrinaShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Sailor Moon
    else if (intent === 'song_intro_sailor_moon') {
      const sailorMoonMedia = [
        'Sailor Moon',
        'Pretty Guardian Sailor Moon',
        'Sailor Moon Crystal',
        'Sailor Moon Musical',
      ];

      const results = await Promise.all(
        sailorMoonMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Salem Shows
    else if (intent === 'recommend_salem_shows') {
      const salemShowsMedia = [
        "Salem",
        "American Horror Story: Coven",
        "The Crucible",
        "Witches of East End",
        "Bewitched",
        "Charmed"
      ];
    
      const results = await Promise.all(
        salemShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Samurai Shows
    else if (intent === 'recommend_samurai_tv') {
      const samuraiTvMedia = [
        "BLUE EYE SAMURAI",
        "Samurai Champloo",
        "Yasuke",
        "Rurouni Kenshin",
        "Shigurui: Death Frenzy",
        "Afro Samurai",
        "Blade of the Immortal",
        "The Samurai",
        "Ninja Scroll",
        "Samurai Jack",
        "Sengoku Basara: Samurai Kings"
      ];
    
      const results = await Promise.all(
        samuraiTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Satan Shows
    else if (intent === 'recommend_satan_shows') {
      const satanShowsMedia = [
        "American Horror Story: Coven",
        "Lucifer",
        "The Exorcist",
        "Supernatural",
        "Chilling Adventures of Sabrina",
        "Damien",
        "The Omen",
        "Preacher",
        "Penny Dreadful",
        "Constantine"
      ];
    
      const results = await Promise.all(
        satanShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Scary Shows
    else if (intent === 'recommend_scary_shows') {
      const scaryShowsMedia = [
        "The Haunting of Hill House",
        "American Horror Story",
        "Stranger Things",
        "The Walking Dead",
        "Penny Dreadful",
        "Bates Motel",
        "The Exorcist",
        "The X-Files",
        "Lovecraft Country",
        "Supernatural"
      ];
    
      const results = await Promise.all(
        scaryShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // School Shows
    else if (intent === 'recommend_school_tv') {
      const schoolTvMedia = [
        "Saved by the Bell",
        "Glee",
        "Euphoria",
        "Riverdale",
        "Freaks and Geeks",
        "Dawson's Creek",
        "13 Reasons Why",
        "Degrassi: The Next Generation",
        "Sex Education",
        "My So-Called Life"
      ];
    
      const results = await Promise.all(
        schoolTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Sci-fi Shows
    else if (intent === 'q_and_a_recommend_show_sci_fi') {
      const scifiShowsMedia = [
        "Stranger Things",
        "The Expanse",
        "Orphan Black",
        "The Mandalorian",
        "Travelers",
        "Love, Death & Robots",
        "Fringe",
        "The 100",
        "Westworld",
        "Black Mirror",
        "Altered Carbon",
        "Firefly",
        "Doctor Who",
        "Star Trek: Deep Space Nine",
        "Star Trek: Discovery",
        "Star Trek: The Next Generation"
      ];

      const results = await Promise.all(
        scifiShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Seinfeld
    else if (intent === 'quotes_yada_yada_yada' || intent === 'quotes_seinfeld_pretzels' || intent === 'quotes_seinfeld_cant_stand_ya' || intent === 'quotes_seinfeld_bisque' || intent === 'quotes_seinfeld_pretzels_repeat' || intent === 'quotes_seinfeld_soup') {
      const seinfeldShow = ['Seinfeld', 'Friends', 'How I Met Your Mother', 'Curb Your Enthusiasm', 'Arrested Development', 'Parks and Recreation'];

      const results = await Promise.all(
        seinfeldShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sexuality Shows
    else if (intent === 'recommend_sexuality_shows') {
      const sexualityShowsMedia = [
        "Sex Education",
        "Pose",
        "Orange Is the New Black",
        "Transparent",
        "Euphoria",
        "Looking",
        "Please Like Me",
        "The L Word",
        "GLOW",
        "Veneno"
      ];
    
      const results = await Promise.all(
        sexualityShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Shaolin Shows
    else if (intent === 'recommend_shaolin_tv') {
      const shaolinTvMedia = [
        "Kung Fu: The Legend Continues",
        "Kung Fu (2021 reboot)",
        "Into the Badlands",
        "Wu Assassins",
        "The Legend of Bruce Lee",
        "Iron Fist",
        "Kung Fu Panda",
        "Cobra Kai",
        "Karate Kid",
        "The Warrior's Way",
        "Rurouni Kenshin"
      ];
    
      const results = await Promise.all(
        shaolinTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Short Light Shows
    else if (intent === 'recommend_short_light_shows') {
      const shortLightShowsMedia = [
        "Bluey",
        "High Maintenance",
        "The Office",
        "Brooklyn Nine-Nine",
        "Parks and Recreation",
        "Schitt's Creek",
        "Adventure Time",
        "We Bare Bears",
        "The Amazing World of Gumball",
        "Ted Lasso"
      ];
    
      const results = await Promise.all(
        shortLightShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for Anniversary
    else if (intent === 'recommend_show_anniversary') {
      const anniversaryShowMedia = [
        "Outlander",
        "Bridgerton",
        "Pride and Prejudice",
        "The Time Traveler's Wife",
        "Sense and Sensibility",
        "The Notebook",
        "Love Actually",
        "A Walk to Remember",
        "Downton Abbey",
        "The Age of Adaline"
      ];
    
      const results = await Promise.all(
        anniversaryShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Show for a Boss
    else if (intent === 'recommend_show_boss') {
      const bossShowMedia = [
        "Suits",
        "Billions",
        "Mad Men",
        "House of Cards",
        "The West Wing",
        "The Good Fight",
        "The Crown",
        "Succession",
        "Industry",
        "Silicon Valley"
      ];
    
      const results = await Promise.all(
        bossShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Boyfriend
    else if (intent === 'recommend_show_boyfriend') {
      const boyfriendShowMedia = [
        "The Witcher",
        "The Mandalorian",
        "Breaking Bad",
        "Vikings",
        "Peaky Blinders",
        "Narcos",
        "The Expanse",
        "The Boys",
        "Daredevil",
        "The Punisher"
      ];
    
      const results = await Promise.all(
        boyfriendShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Coworker
    else if (intent === 'recommend_show_coworker') {
      const coworkerShowMedia = [
        "The Office",
        "Parks and Recreation",
        "Brooklyn Nine-Nine",
        "Silicon Valley",
        "Superstore",
        "Mythic Quest",
        "30 Rock",
        "Archer",
        "Veep",
        "Scrubs"
      ];
    
      const results = await Promise.all(
        coworkerShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Dpg
    else if (intent === 'recommend_show_dog') {
      const dogShowMedia = [
        "Dogs",
        "Pick of the Litter",
        "The Secret Life of Pets",
        "Beethoven",
        "Marley & Me",
        "A Dog's Purpose",
        "Homeward Bound",
        "Benji",
        "Togo",
        "Lady and the Tramp"
      ];
    
      const results = await Promise.all(
        dogShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Friend
    else if (intent === 'recommend_show_friend') {
      const friendShowMedia = [
        "Stranger Things",
        "The Mandalorian",
        "Sherlock",
        "The Boys",
        "Brooklyn Nine-Nine",
        "Ted Lasso",
        "Friends",
        "Schitt's Creek",
        "The Good Place",
        "Rick and Morty"
      ];
    
      const results = await Promise.all(
        friendShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }  
    
    // Show for a Girlfriend
    else if (intent === 'recommend_show_girlfriend') {
      const girlfriendShowMedia = [
        "The Marvelous Mrs. Maisel",
        "Fleabag",
        "Sex Education",
        "Bridgerton",
        "Outlander",
        "Emily in Paris",
        "Jane the Virgin",
        "Big Little Lies",
        "Gilmore Girls",
        "The Crown"
      ];
    
      const results = await Promise.all(
        girlfriendShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Husband
    else if (intent === 'recommend_show_husband') {
      const husbandShowMedia = [
        "Breaking Bad",
        "Better Call Saul",
        "The Mandalorian",
        "Peaky Blinders",
        "Narcos",
        "Jack Ryan",
        "The Boys",
        "Game of Thrones",
        "Ozark",
        "The Sopranos"
      ];
    
      const results = await Promise.all(
        husbandShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Sibling
    else if (intent === 'recommend_show_sibling') {
      const siblingShowMedia = [
        "The Umbrella Academy",
        "Stranger Things",
        "The Mandalorian",
        "Supernatural",
        "Avatar: The Last Airbender",
        "Teen Titans",
        "The Flash",
        "The 100",
        "Young Justice",
        "Gravity Falls"
      ];
    
      const results = await Promise.all(
        siblingShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Show for a Wife
    else if (intent === 'recommend_show_wife') {
      const wifeShowMedia = [
        "Big Little Lies",
        "Outlander",
        "The Crown",
        "The Handmaid's Tale",
        "Bridgerton",
        "This Is Us",
        "Fleabag",
        "The Marvelous Mrs. Maisel",
        "Grey's Anatomy",
        "Downton Abbey"
      ];
    
      const results = await Promise.all(
        wifeShowMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
    
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Shows Based on a Book
    else if (intent === 'recommend_shows_based_on_a_book') {
      const showsBasedOnBookMedia = [
        "The Handmaid's Tale",
        "Big Little Lies",
        "Game of Thrones",
        "Outlander",
        "The Witcher",
        "Sharp Objects",
        "The Queen's Gambit",
        "His Dark Materials",
        "A Series of Unfortunate Events",
        "The Man in the High Castle"
      ];
    
      const results = await Promise.all(
        showsBasedOnBookMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Shows to Watch by Myself
    else if (intent === 'recommend_show_by_myself') {
      const showByMyselfMedia = [
        "The Queen's Gambit",
        "Fleabag",
        "Mindhunter",
        "The Crown",
        "Sharp Objects",
        "Breaking Bad",
        "Big Little Lies",
        "The Marvelous Mrs. Maisel",
        "BoJack Horseman",
        "The Morning Show"
      ];
    
      const results = await Promise.all(
        showByMyselfMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Shows to Watch with Family
    else if (intent === 'recommend_shows_with_family') {
      const showsWithFamilyMedia = [
        "The Great British Bake Off",
        "Bluey",
        "MasterChef",
        "The Mandalorian",
        "Anne with an E",
        "Stranger Things",
        "Gilmore Girls",
        "Full House",
        "Modern Family",
        "Little House on the Prairie"
      ];
    
      const results = await Promise.all(
        showsWithFamilyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Shows to Watch with Friends
    else if (intent === 'recommend_shows_with_friends') {
      const showsWithFriendsMedia = [
        "Brooklyn Nine-Nine",
        "Parks and Recreation",
        "Friends",
        "How I Met Your Mother",
        "The Office",
        "Schitt's Creek",
        "The Big Bang Theory",
        "New Girl",
        "It's Always Sunny in Philadelphia",
        "Archer"
      ];
    
      const results = await Promise.all(
        showsWithFriendsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Singers Shows
    else if (intent === 'recommend_singers_tv') {
      const singersTvMedia = [
        "Glee",
        "The Voice",
        "American Idol",
        "The Masked Singer",
        "The X Factor",
        "Empire",
        "Nashville",
        "Zoey's Extraordinary Playlist",
        "Sing On!"
      ];
    
      const results = await Promise.all(
        singersTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Social Media Shows
    else if (intent === 'recommend_social_media_shows') {
      const socialMediaShowsMedia = [
        "Black Mirror",
        "The Circle",
        "You",
        "Clickbait",
        "Haters Back Off",
        "Fake Famous",
        "The Social Dilemma",
        "Catfish: The TV Show",
        "The Great Hack",
        "Love Is Blind"
      ];
    
      const results = await Promise.all(
        socialMediaShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Soundtrack Shows
    else if (intent === 'recommend_soundtrack_tv') {
      const soundtrackTvMedia = [
        "Stranger Things",
        "Euphoria",
        "Atlanta",
        "Insecure",
        "The O.C.",
        "Glee",
        "Fargo",
        "Westworld",
        "The Mandalorian",
        "13 Reasons Why"
      ];
    
      const results = await Promise.all(
        soundtrackTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // South Park
    else if (intent === 'quotes_south_park_kenny') {
      const southParkShows = [
        'South Park',
        'Family Guy',
        'The Simpsons',
        'American Dad!',
        'F Is for Family',
        'Archer',
        'BoJack Horseman',
        'Robot Chicken'
      ];

      const results = await Promise.all(
        southParkShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Sparta Shows
    else if (intent === 'recommend_sparta_tv') {
      const spartaTvMedia = [
        "Spartacus",
        "Troy: Fall of a City",
        "Rome",
        "300: Rise of an Empire",
        "The Last Kingdom",
        "Vikings",
        "Knightfall",
        "Gladiators",
        "Atlantis",
        "Immortals"
      ];
    
      const results = await Promise.all(
        spartaTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Spy Shows
    else if (intent === 'recommend_spy_shows') {
      const spyShowsMedia = [
        "Killing Eve",
        "The Americans",
        "Homeland",
        "Alias",
        "24",
        "Tinker Tailor Soldier Spy",
        "Tom Clancy's Jack Ryan",
        "Chuck",
        "The Spy",
        "Spooks"
      ];
    
      const results = await Promise.all(
        spyShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Stalker Shows
    else if (intent === 'recommend_stalker_shows') {
      const stalkerShowsMedia = [
        "You",
        "Bates Motel",
        "Dexter",
        "Killing Eve",
        "Mindhunter",
        "Dirty John",
        "Stalker",
        "Hannibal"
      ];
    
      const results = await Promise.all(
        stalkerShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Stand-up Comedy
    else if (intent === 'q_and_a_recommend_standup_comedy') {
      const standUpComedyMedia = ["Ali Wong: Hard Knock Wife", "Iliza Shlesinger: Elder Millennial", "Dave Chappelle: The Dreamer", "Iliza Shlesinger: Unveiled", "Taylor Tomlinson: Look at You", "Taylor Tomlinson: Quarter-Life Crisis", "Jo Koy: Comin' In Hot", "Jo Koy: Live from Brooklyn"];

      const results = await Promise.all(
        standUpComedyMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Strategy Shows
    else if (intent === 'recommend_strategy_tv') {
      const strategyTvMedia = [
        "Survivor",
        "Game of Thrones",
        "The Expanse",
        "House of Cards",
        "The 100",
        "Narcos",
        "The Blacklist",
        "Homeland",
        "Peaky Blinders",
        "The Wire"
      ];
    
      const results = await Promise.all(
        strategyTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Street Fighter Shows
    else if (intent === 'recommend_street_fighter_tv') {
      const streetFighterTvMedia = [
        "Street Fighter II V",
        "Into the Badlands",
        "Mortal Kombat: Conquest",
        "The Legend of Bruce Lee",
        "Fist of the North Star",
        "Cobra Kai",
        "Baki",
        "Fight Quest",
        "Tekken: Bloodline",
        "The Warrior's Way"
      ];
    
      const results = await Promise.all(
        streetFighterTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Tattoo Shows
    else if (intent === 'recommend_tattoo_shows') {
      const tattooShowsMedia = [
        "Ink Master",
        "Tattoo Fixers",
        "LA Ink",
        "Miami Ink",
        "Tattoo Nightmares",
        "Black Ink Crew",
        "Best Ink",
        "How Far Is Tattoo Far?",
        "Tattoo Age",
        "Just Tattoo of Us"
      ];
    
      const results = await Promise.all(
        tattooShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    
    
    // Teen Choice Shows
    else if (intent === 'recommend_teen_choice_tv') {
      const teenChoiceTvMedia = [
        "Riverdale",
        "Euphoria",
        "13 Reasons Why",
        "The Vampire Diaries",
        "Teen Wolf",
        "Outer Banks",
        "Pretty Little Liars",
        "The 100",
        "Gossip Girl",
        "Sex Education"
      ];
    
      const results = await Promise.all(
        teenChoiceTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Time Travel Shows
    else if (intent === 'q_and_a_recommend_show_time_travel') {
      const timeTravelShows = [
        "Dark",
        "Doctor Who",
        "12 Monkeys",
        "Outlander",
        "Timeless",
        "The Umbrella Academy",
        "The Time Traveler's Wife",
        "Travelers",
        "Legends of Tomorrow",
        "Quantum Leap",
        "Continuum",
        "The Flash",
        "Terra Nova",
        "Russian Doll",
        "Loki"
      ];

      const results = await Promise.all(
        timeTravelShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Train Shows
    else if (intent === 'recommend_train_shows') {
      const trainShowsMedia = [
        "The Great Train Robbery",
        "The Last Train",
        "Snowpiercer",
        "Hell on Wheels",
        "Murder on the Orient Express",
        "Into the Night",
        "Infinity Train",
        "The Wild Wild West",
        "Transsiberian"
      ];
    
      const results = await Promise.all(
        trainShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Trans Actor Shows
    else if (intent === 'recommend_trans_actor_shows') {
      const transActorShowsMedia = [
        "Pose",
        "Sense8",
        "Euphoria",
        "Transparent",
        "The L Word: Generation Q",
        "Veneno",
        "RuPaul's Drag Race",
        "Hollywood",
        "Tales of the City"
      ];
    
      const results = await Promise.all(
        transActorShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Trans Woman Shows
    else if (intent === 'recommend_trans_woman_shows') {
      const transWomanShowsMedia = [
        "Pose",
        "Transparent",
        "Euphoria",
        "Orange Is the New Black",
        "Sense8",
        "The Fosters",
        "RuPaul's Drag Race",
        "Work in Progress",
        "The L Word: Generation Q",
        "Veneno"
      ];
    
      const results = await Promise.all(
        transWomanShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Transman Shows
    else if (intent === 'recommend_transman_shows') {
      const transmanShowsMedia = [
        "Billions",
        "The Fosters",
        "Orange Is the New Black",
        "Transparent",
        "Work in Progress",
        "Sense8",
        "The L Word: Generation Q",
        "Pose",
        "Shameless",
        "Degrassi: Next Class"
      ];
    
      const results = await Promise.all(
        transmanShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Transphobia Shows
    else if (intent === 'recommend_transphobia_shows') {
      const transphobiaShowsMedia = [
        "Disclosure",
        "Pose",
        "Orange Is the New Black",
        "Transparent",
        "Euphoria",
        "RuPaul's Drag Race",
        "Hollywood",
        "Sense8",
        "The L Word: Generation Q",
        "Veneno"
      ];
    
      const results = await Promise.all(
        transphobiaShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Trash TV Shows
    else if (intent === 'q_and_a_recommend_trash_tv') {
      const trashTvShows = [
        "The Real Housewives",
        "Too Hot to Handle",
        "Keeping Up with the Kardashians",
        "Love Island",
        "Jersey Shore",
        "The Bachelor",
        "The Bachelorette",
        "The Hills",
        "Big Brother",
        "Love is Blind",
        "Bachelor in Paradise"
      ];

      const results = await Promise.all(
        trashTvShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // True Crime Shows
    else if (intent === 'recommend_true_crime_shows') {
      const trueCrimeShowsMedia = [
        "Making a Murderer",
        "The Jinx",
        "Mindhunter",
        "The Staircase",
        "The Keepers",
        "Tiger King",
        "The Act",
        "Unsolved Mysteries",
        "American Crime Story",
        "Night Stalker: The Hunt for a Serial Killer"
      ];
    
      const results = await Promise.all(
        trueCrimeShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Vampire Shows
    else if (intent === 'recommend_vampire_shows') {
      const vampireShowsMedia = [
        "The Vampire Diaries",
        "What We Do in the Shadows",
        "True Blood",
        "Buffy the Vampire Slayer",
        "Dracula",
        "Van Helsing",
        "The Originals",
        "Legacies",
        "Castlevania",
        "Being Human"
      ];
    
      const results = await Promise.all(
        vampireShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }
    
    // Video Game Shows and Movies
    else if (intent === 'q_and_a_recommend_show_video_games' || intent === 'chitchat_are_you_a_gamer' || intent === 'q_and_a_video_games' || intent === 'recommend_games' || intent === 'recommend_games_tv' || intent === 'chitchat_play_game') {
      const videoGameShows = [
        "Super Mario World",
        "Fallout",
        "Cyberpunk: Edgerunners",
        "The Adventures of Super Mario Bros. 3",
        "The Super Mario Bros. Super Show!",
        "The Witcher",
        "The Last of Us",
        "Arcane",
        "Castlevania",
        "Halo",
        "Sonic the Hedgehog",
        "Pokémon",
        "The Story of Nintendo",
        "Dragon's Dogma",
        "Resident Evil",
        "Super Mario Bros.",
        "Mortal Kombat"
      ];

      const results = await Promise.all(
        videoGameShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Vikings Shows
    else if (intent === 'recommend_vikings_tv') {
      const vikingsTvMedia = [
        "Vikings",
        "The Last Kingdom",
        "Norsemen",
        "Vikings: Valhalla",
        "Knightfall",
        "Barbarians",
        "The Witcher",
        "Rome",
        "Beowulf: Return to the Shieldlands",
        "Britannia"
      ];
    
      const results = await Promise.all(
        vikingsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Villains Shows
    else if (intent === 'recommend_villains_tv') {
      const villainsTvMedia = [
        "Breaking Bad",
        "Gotham",
        "Lucifer",
        "The Boys",
        "Dexter",
        "The Punisher",
        "Daredevil",
        "House of Cards",
        "Game of Thrones",
        "Peaky Blinders"
      ];
    
      const results = await Promise.all(
        villainsTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Warrior Shows
    else if (intent === 'recommend_warriors_tv') {
      const warriorTvMedia = [
        "Warrior",
        "Spartacus",
        "Vikings",
        "The Last Kingdom",
        "Rome",
        "The Mandalorian",
        "Knightfall",
        "Marco Polo",
        "Barbarians",
        "Into the Badlands"
      ];
    
      const results = await Promise.all(
        warriorTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // White Collar Shows
    else if (intent === 'recommend_white_collar_tv') {
      const whiteCollarTvMedia = [
        "White Collar",
        "Billions",
        "Suits",
        "Mad Men",
        "The Blacklist",
        "Damages",
        "The Good Wife",
        "Better Call Saul",
        "Boston Legal",
        "Breaking Bad"
      ];
    
      const results = await Promise.all(
        whiteCollarTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Witches Shows
    else if (intent === 'q_and_a_recommend_witches') {
      const witchesShow = ['The Chilling Adventures of Sabrina', 'American Horror Story', "The Witcher", "A Discovery of Witches", "Witches of East End", "The Originals", "Salem", "Charmed", "The Magicians", "Once Upon A Time", "Luna Nera"];

      const results = await Promise.all(
        witchesShow.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Wizards Shows
    else if (intent === 'q_and_a_recommend_wizards') {
      const wizardShows = ['The Magicians', "Merlin", "The Wicher", "The Worst Witch", "The Shannara Chronicles", "Legend of the Seeker", "Wizards: Tales of Arcadia", "Once Upon a Time", "Wizards of Waverly Place"];

      const results = await Promise.all(
        wizardShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Woman Boss Shows
    else if (intent === 'recommend_woman_boss_shows') {
      const womanBossShowsMedia = [
        "The Devil Wears Prada",
        "Scandal",
        "The Bold Type",
        "Madam Secretary",
        "30 Rock",
        "How to Get Away with Murder",
        "Veep",
        "Supergirl"
      ];
    
      const results = await Promise.all(
        womanBossShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Yakuza Shows
    else if (intent === 'recommend_yakuza_tv') {
      const yakuzaTvMedia = [
        "Giri/Haji",
        "Tokyo Vice",
        "Sanctuary",
        "Yakuza Apocalypse",
        "Deadly Class",
        "The Outsider",
        "Outrage",
        "Brother",
        "Black Rain",
        "First Love"
      ];
    
      const results = await Promise.all(
        yakuzaTvMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Young Adult Shows
    else if (intent === 'recommend_young_adult_shows') {
      const youngAdultShowsMedia = [
        "Riverdale",
        "The Chilling Adventures of Sabrina",
        "Sex Education",
        "Euphoria",
        "13 Reasons Why",
        "Never Have I Ever",
        "The Society",
        "Elite",
        "Outer Banks"
      ];
    
      const results = await Promise.all(
        youngAdultShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });
    
          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];
            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);
    
            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average: media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );
    
      const filteredResults = results.filter((result) => result !== null);
    
      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }    

    // Zombie Shows
    else if (intent === 'q_and_a_recommend_zombie_shows') {
      const zombieShows = ["iZombie", 'All of Us Are Dead', "Santa Clarita Diet", 'The Last of Us', "Z Nation", "The Walking Dead", "Fear the Walking Dead", "In the Flesh", "Dead Set", "Black Summer"];

      const results = await Promise.all(
        zombieShows.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Quotes
    // Handle Quotes Apollo 13 movie intent
    else if (intent === 'quotes_apollo13') {
      const quotesApollo13Movies = [
        'Apollo 13',
        'Gravity',
        'The Martian',
        'First Man',
        'Interstellar',
        'Hidden Figures',
        'The Right Stuff',
        'Armageddon',
        'Ad Astra',
      ];

      const results = await Promise.all(
        quotesApollo13Movies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Bridesmaids movie intent
    else if (intent === 'quotes_bridesmaids') {
      const quotesBridesmaidsMovies = [
        'Bridesmaids',
        'The Hangover',
        'Mean Girls',
        'The Heat',
        'Pitch Perfect',
        'Trainwreck',
        'Superbad',
        'Girls Trip',
        '27 Dresses',
        'Bad Moms',
      ];

      const results = await Promise.all(
        quotesBridesmaidsMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Casablanca movie intent
    else if (intent === 'quotes_casablanca') {
      const quotesCasablancaMovies = [
        'Casablanca',
        'The Shawshank Redemption',
        'Stand by Me',
        'The Intouchables',
        'Thelma & Louise',
        'Dead Poets Society',
        'Butch Cassidy and the Sundance Kid',
        'A River Runs Through It',
        'Good Will Hunting',
        'Fried Green Tomatoes',
      ];

      const results = await Promise.all(
        quotesCasablancaMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Devil Wears Prada movie intent
    else if (intent === 'quotes_devil_wears_prada') {
      const quotesDevilWearsPradaMovies = [
        'The Devil Wears Prada',
        'Confessions of a Shopaholic',
        'Julie & Julia',
        'Legally Blonde',
        'Coco Before Chanel',
        'Morning Glory',
        'Working Girl',
        'The Intern',
      ];

      const results = await Promise.all(
        quotesDevilWearsPradaMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Dirty Dancing movie intent
    else if (intent === 'quotes_dirty_dancing') {
      const quotesDirtyDancingMovies = [
        'Dirty Dancing',
        'Footloose',
        'Grease',
        'Saturday Night Fever',
        'Flashdance',
        'Fame',
        'Step Up',
        'Save the Last Dance',
        'Shall We Dance',
        'Center Stage',
      ];

      const results = await Promise.all(
        quotesDirtyDancingMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Doctor Who intent
    else if (intent === 'quotes_doctor_who') {
      const quotesDoctorWhoMedia = [
        'Doctor Who',
        'Torchwood',
        'The Sarah Jane Adventures',
        'The Time Machine',
        'Star Trek',
        "The Hitchhiker's Guide to the Galaxy",
        'The Twilight Zone',
        'Black Mirror',
        'The Expanse',
        'Rick and Morty',
      ];

      const results = await Promise.all(
        quotesDoctorWhoMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const show = response.data.results[0];

            const trailerUrl = await getMediaTrailer(show.id, 'tv');
            const credits = await getMediaCredits(show.id, 'tv');

            return {
              id: show.id,
              title: show.title || show.name,
              media_type: 'tv',
              poster_path: show.poster_path,
              vote_average:
                show.vote_average !== undefined ? show.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Gone with the Wind movie intent
    else if (intent === 'quotes_gone_with_the_wind') {
      const quotesGoneWithTheWindMovies = [
        'Gone with the Wind',
        'Doctor Zhivago',
        'Out of Africa',
        'The Age of Innocence',
        'Atonement',
        'The English Patient',
        'Cold Mountain',
        'The Painted Veil',
        'The Other Boleyn Girl',
        'Anna Karenina',
      ];

      const results = await Promise.all(
        quotesGoneWithTheWindMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Harry Potter Spells intent
    else if (
      intent === 'quotes_harry_potter' ||
      intent === 'chitchat_hp_movies' ||
      intent === 'chitchat_hp_books'
    ) {
      const quotesHarryPotterMovies = [
        "Harry Potter and the Philosopher's Stone",
        'Harry Potter and the Chamber of Secrets',
        'Harry Potter and the Prisoner of Azkaban',
        'Fantastic Beasts and Where to Find Them',
        'The Chronicles of Narnia',
        'Percy Jackson & the Olympians',
        "The Sorcerer's Apprentice",
        'The Golden Compass',
        'Doctor Strange',
        'The Lord of the Rings: The Fellowship of the Ring',
      ];

      const results = await Promise.all(
        quotesHarryPotterMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title || movie.name,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Jaws movie intent
    else if (intent === 'quotes_jaws') {
      const quotesJawsMovies = [
        'Jaws',
        'The Meg',
        'Deep Blue Sea',
        'The Shallows',
        '47 Meters Down',
        'Open Water',
        'Anaconda',
        'Sharknado',
        'Lake Placid',
        'The Reef',
      ];

      const results = await Promise.all(
        quotesJawsMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Jerry Maguire movie intent
    else if (intent === 'quotes_jerry_maguire') {
      const quotesJerryMaguireMovies = [
        'Jerry Maguire',
        'The Pursuit of Happyness',
        'Moneyball',
        'For Love of the Game',
        'Up in the Air',
        'Crazy, Stupid, Love',
      ];

      const results = await Promise.all(
        quotesJerryMaguireMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Mandalorian movie intent
    else if (intent === 'quotes_mandalorian') {
      const quotesMandalorianMovies = [
        'The Mandalorian',
        'Star Wars: The Clone Wars',
        'The Book of Boba Fett',
        'The Bad Batch',
        'Obi-Wan Kenobi',
        'Andor',
        'Rogue One: A Star Wars Story',
        'The Expanse',
        'Firefly',
        'The Witcher',
      ];

      const results = await Promise.all(
        quotesMandalorianMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const tvShow = response.data.results[0];

            const trailerUrl = await getMediaTrailer(tvShow.id, 'tv');
            const credits = await getMediaCredits(tvShow.id, 'tv');

            return {
              id: tvShow.id,
              title: tvShow.title || tvShow.name,
              media_type: 'tv',
              poster_path: tvShow.poster_path,
              vote_average:
                tvShow.vote_average !== undefined ? tvShow.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Notting Hill movie intent
    else if (intent === 'quotes_notting_hill') {
      const quotesNottingHillMovies = [
        'Notting Hill',
        'Love Actually',
        'Four Weddings and a Funeral',
        'The Holiday',
        "Bridget Jones's Diary",
        'About Time',
        "You've Got Mail",
        'Sleepless in Seattle',
        '500 Days of Summer',
        "My Best Friend's Wedding",
      ];

      const results = await Promise.all(
        quotesNottingHillMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle Quotes Rocky movie intent
    else if (intent === 'quotes_rocky') {
      const quotesRockyMovies = [
        'Rocky',
        'Rocky Balboa',
        'Rocky II',
        'Rocky III',
        'Rocky IV',
        'Rocky V',
        'Rocky VI',
      ];

      const results = await Promise.all(
        quotesRockyMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];

            const trailerUrl = await getMediaTrailer(movie.id, 'movie');
            const credits = await getMediaCredits(movie.id, 'movie');

            return {
              id: movie.id,
              title: movie.title,
              media_type: 'movie',
              poster_path: movie.poster_path,
              vote_average:
                movie.vote_average !== undefined ? movie.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Recommendations

    // Dragons 
    else if (intent === 'q_and_a_recommend_show_dragons') {
      const dragonsMedia = [
        'How to Train Your Dragon',
        'Game of Thrones',
        'The Hobbit',
        'Dragonheart',
        'Eragon',
        'Reign of Fire',
        "Pete's Dragon",
        "The NeverEnding Story",
        "House of the Dragon",
        "Dragon Ball Z",
        "Dragon Ball Z Kai",
        "Merlin",
        "American Dragon: Jake Long",
        "Wizards: Tales of Arcadia"
      ];

      const results = await Promise.all(
        dragonsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Inception 
    else if (intent === 'q_and_a_recent_movies') {
      const inceptionLikeMovies = [
        'Inception',
        'Interstellar',
        'The Matrix',
        'Shutter Island',
        'Memento',
        'The Prestige',
        'Donnie Darko',
        'Coherence',
        'The Thirteenth Floor',
        'Paprika',
        'Source Code',
        'Eternal Sunshine of the Spotless Mind',
        'Predestination',
        'Dark City'
      ];

      const results = await Promise.all(
        inceptionLikeMovies.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // LGBTQ Movies
    else if (intent === 'q_and_a_recommend_lgbtq_movies') {
      const lgbtqMoviesMedia = [
        'All of Us Strangers',
        'The Birdcage',
        'Booksmart',
        'Bottoms',
        'The Boys in the Band',
        'Brokeback Mountain',
        "But I'm a Cheerleader",
        'Call Me by Your Name',
        'The Danish Girl',
        "The Death and Life of Marsha P. Johnson",
        'A Fantastic Woman',
        'Fire Island',
        'The Half of It',
        'The Handmaiden',
        'Happiest Season',
        'The Kids Are All Right',
        'Lingua Franca',
        'Love, Simon',
        'The Miseducation of Cameron Post',
        'Moonlight',
        'Paris Is Burning',
        'Pride',
        'The Prom',
        'Rotting in the Sun',
        'The Way He Looks'
      ];

      const results = await Promise.all(
        lgbtqMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // LGBTQ Shows
    else if (intent === 'q_and_a_recommend_lgbtq_shows') {
      const lgbtqShowsMedia = [
        'AJ and the Queen',
        'Feel Good',
        'The Fosters',
        'Gentleman Jack',
        'Heartstopper',
        'The L Word',
        'The L Word: Generation Q',
        'Love, Victor',
        'One Day at a Time',
        'Pose',
        'Queer Eye',
        'Queer Eye for the Straight Guy',
        "Schitt's Creek",
        'Sex Education',
        'The Umbrella Academy'
      ];

      const results = await Promise.all(
        lgbtqShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Magic
    else if (intent === 'q_and_a_recommend_show_magic') {
      const magicMedia = [
        "Harry Potter and the Philosopher's Stone",
        'The Magicians',
        "Doctor Strange",
        "Stardust",
        "Maleficent",
        "The Illusionist",
        "The Craft",
        'The Lord of the Rings: The Rings of Power',
        "The Lord of the Rings: The Return of the King",
        "The Lord of the Rings: The Fellowship of the Ring",
        "The Lord of the Rings: The Two Towers",
        "Harry Potter and the Prisoner of Azkaban",
        "Harry Potter and the Chamber of Secrets",
        "Harry Potter and the Half-Blood Prince",
        "Harry Potter and the Goblet of Fire",
        "Harry Potter and the Deathly Hallows: Part 2",
        "Harry Potter and the Order of the Phoenix",
        "Harry Potter and the Deathly Hallows: Part 1",
        "Fantastic Beasts: The Secrets of Dumbledore",
        "Fantastic Beasts and Where to Find Them",
        "Fantastic Beasts: The Crimes of Grindelwald"
      ];

      const results = await Promise.all(
        magicMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Poly Movies
    else if (intent === 'recommend_polyamory_movies') {
      const polyMoviesMedia = [
        "Bandits",
        "The Dreamers",
        "The Freebie",
        "The Last",
        "Professor Marston and the Wonder Women",
        "Savages",
        "The Secret Lives of Dentists",
        "Shortbus",
        "Three",
        "The Unicorn",
        "Vicky Cristina Barcelona"
      ];

      const results = await Promise.all(
        polyMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Poly Shows
    else if (intent === 'recommend_polyamory_shows') {
      const polyShowsMedia = [
        "Big Love",
        "Easy",
        "House of Cards",
        "Polyamory",
        "Sense8",
        "Sister Wives",
        "Trigonometry",
        "Wanderlust",
        "You Me Her",    
      ];

      const results = await Promise.all(
        polyShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Superheroes
    else if (intent === 'q_and_a_recommend_show_superheroes') {
      const superheroesMedia = [
        "The Avengers",
        "The Dark Knight",
        "Man of Steel",
        "Wonder Woman",
        "Deadpool",
        "Shazam!",
        "Black Panther",
        "The Incredibles",
        "The Boys",
        "Kick-Ass",
        "Watchmen",
        "The Suicide Squad",
        "Doctor Strange",
        "WandaVision",
        "Daredevil",
        "The Flash",
        "Jessica Jones",
        "Supergirl",
        "Titans",
        "Legends of Tomorrow",
        "Loki",
        "The Umbrella Academy",
        "Smallville",
        "Gotham"
      ];

      const results = await Promise.all(
        superheroesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Trans Movies
    else if (intent === 'recommend_trans_woman_movies' || intent === 'recommend_transphobia_movies' || intent === 'recommend_trans_actor_movies') {
      const transMoviesMedia = [
        "Boys Don't Cry",
        "Cowboys",
        'The Danish Girl',
        'Disclosure',
        'A Fantastic Woman',
        'The Garden Left Behind',
        'Lingua Franca',
        'Paris is Burning',
        'Something Must Break',
        'Tangerine',
        'Transamerica',
      ];

      const results = await Promise.all(
        transMoviesMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Trans Shows
    else if (intent === 'recommend_transman_shows' || intent === 'q_and_a_recommend_trans_shows' || intent === 'recommend_transphobia_shows') {
      const transShowsMedia = [
        "Euphoria",
        "First Day",
        "Her Story",
        "The L Word: Generation Q",
        "Orange is the New Black",
        "Pose",
        "Star Trek: Discovery",
        "Transparent",
        "Veneno",
        "Work in Progress",
      ];

      const results = await Promise.all(
        transShowsMedia.map(async (title) => {
          const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
              api_key: TMDB_API_KEY,
              query: title,
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const media = response.data.results[0];

            const mediaType = media.media_type;
            const trailerUrl = await getMediaTrailer(media.id, mediaType);
            const credits = await getMediaCredits(media.id, mediaType);

            return {
              id: media.id,
              title: media.title || media.name,
              media_type: mediaType,
              poster_path: media.poster_path,
              vote_average:
                media.vote_average !== undefined ? media.vote_average : 0,
              trailerUrl,
              credits,
            };
          }
          return null;
        })
      );

      const filteredResults = results.filter((result) => result !== null);

      return res.json({
        message: nlpResult.answer,
        media: filteredResults,
      });
    }

    // Handle the unified search intent for movies, TV shows, and persons
    else if (intent === 'search_movie_or_tv_or_person') {
      if (title && title.length > 0) {
        for (const singleTitle of title) {
          const movieResults = await searchMediaByTitle(
            singleTitle,
            'search_movie'
          );
          const tvResults = await searchMediaByTitle(singleTitle, 'search_tv');

          combinedResults = [...combinedResults, ...movieResults, ...tvResults];
        }
      }

      if (person && person.length > 0) {
        for (const singlePerson of person) {
          const personResults = await searchPersonByName(singlePerson);
          combinedResults = [...combinedResults, ...personResults];
        }
      }

      const uniqueResults = removeDuplicates(combinedResults);

      console.log(
        'Combined and deduplicated movie, TV, and person results:',
        uniqueResults
      );

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
    }

    // Handle category-based movie or TV requests (added here)
    else if (intent in categoryMap) {
      const { type, url } = categoryMap[intent];
      const apiUrl = `${TMDB_BASE_URL}${url}?api_key=${TMDB_API_KEY}`;

      const categoryResponse = await axios.get(apiUrl);
      console.log(`TMDB ${intent} response:`, categoryResponse.data);

      if (categoryResponse.data.results.length > 0) {
        const mediaResults = categoryResponse.data.results.map((item) => ({
          id: item.id,
          title: item.title || item.name,
          media_type: type,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
        }));

        return res.json({
          message:
            nlpResult.answer || `Here are the ${intent.replace('_', ' ')}:`,
          media: mediaResults,
        });
      } else {
        return res.json({
          message: `No results found for ${intent.replace('_', ' ')}.`,
        });
      }
    }

    // General fallback if no intent or unhandled intent is found
    else {
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
  const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
    query
  )}`;

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
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await axios.get(url);

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
        poster_path: media.poster_path
          ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
          : null,
        vote_average: media.vote_average !== undefined ? media.vote_average : 0,
      })),
    }));
  } catch (error) {
    console.error('Error fetching person from TMDB:', error);
    throw new Error('Failed to fetch person');
  }
}

async function getMediaTrailer(media_id, media_type) {
  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}/videos?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);

    const videoTypesChecked = [];
    let video = response.data.results.find((video) => {
      videoTypesChecked.push('YouTube Trailer');
      return video.type === 'Trailer' && video.site === 'YouTube';
    });

    if (!video) {
      video = response.data.results.find((video) => {
        videoTypesChecked.push('Featurette');
        return (
          video.type === 'Featurette' &&
          (video.site === 'YouTube' || video.site === 'Vimeo')
        );
      });
    }

    if (!video) {
      video = response.data.results.find((video) => {
        videoTypesChecked.push('Teaser');
        return (
          video.type === 'Teaser' &&
          (video.site === 'YouTube' || video.site === 'Vimeo')
        );
      });
    }

    if (video) {
      const embedUrl =
        video.site === 'YouTube'
          ? `https://www.youtube.com/embed/${video.key}`
          : `https://player.vimeo.com/video/${video.key}`;
      return embedUrl;
    } else {
      console.log(
        `No video found. Types checked: ${videoTypesChecked.join(', ')}`
      );
      return null;
    }
  } catch (error) {
    console.error(`Error fetching video for ${media_type} ${media_id}:`, error);
    return null;
  }
}

async function getMediaCredits(media_id, media_type) {
  try {
    const url = `${TMDB_BASE_URL}/${media_type}/${media_id}/credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data.cast.slice(0, 10);
  } catch (error) {
    console.error(
      `Error fetching credits for ${media_type} ${media_id}:`,
      error.message
    );
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

    if (response.data.results.length === 0) {
      return [{ message: `No ${mediaType} found in this genre.` }];
    }

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