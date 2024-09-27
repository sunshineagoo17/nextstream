const express = require('express');
const axios = require('axios');
const { processInput } = require('../services/nlpService');
const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
    const nlpResult = await processInput(userInput);
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
    else if (intent === 'char_arya_stark' || intent === 'char_jon_snow' || intent === 'char_ned_stark' || intent === 'chitchat_fave_tv_show_character') {
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
    else if (intent === 'char_joker') {
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
    else if (intent === 'chitchat_fave_movie') {
      const aiMoviesMedia = [
        'Blade Runner',
        "Ex Machina",
        "Her",
        "The Matrix",
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
    else if (intent === 'chitchat_in_tv_show' || intent === 'recommend_viral_shows' || intent === 'recommend_social_media_shows') {
      const blackMirrorShowsMedia = [
        "Black Mirror",
        "3%",
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

    // Handle Christmas movie intent
    else if (intent === 'celebrate_merry_christmas') {
      const christmasMovies = [
        'Klaus',
        'Elf',
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

    // Handle Mother's Day movie intent
    else if (intent === 'celebrate_mothers_day') {
      const mothersDayMovies = [
        'Stepmom',
        'The Joyluck Club',
        'Little Women',
        'Freaky Friday',
        'Brave',
        'Terms of Endearment',
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

    // Shows

    // Big Bang Theory
    else if (
      intent === 'song_intro_big_bang_theory' ||
      intent === 'quotes_soft_kitty' ||
      intent === 'quotes_big_bang_theory_knock_knock' ||
      intent === 'quotes_big_bang_theory_spot' ||
      intent === 'quotes_big_bang_theory_babies' ||
      intent === 'quotes_bazinga'
    ) {
      const bigBangTheoryShow = ['The Big Bang Theory'];

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

    // Friends
    else if (
      intent === 'song_intro_friends' ||
      intent === 'quotes_my_sandwich' ||
      intent === 'quotes_we_were_on_a_break' ||
      intent === 'q_and_a_recommend_shows_like_friends' ||
      intent === 'quotes_friends_feet' ||
      intent === 'chitchat_friends_char' ||
      intent === 'quotes_friends_moo_point' ||
      intent === 'quotes_friends_seven' ||
      intent === 'quotes_friends_pivot'
    ) {
      const friendsShow = ['Friends'];

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
      const quotesDoctorWhoMovies = [
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
        quotesDoctorWhoMovies.map(async (title) => {
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

    // Trans Movies
    else if (intent === 'recommend_transman_movies' || intent === 'recommend_trans_woman_movies' || intent === 'recommend_transphobia_movies' || intent === 'recommend_trans_actor_movies') {
      const transMoviesMedia = [
        "Boys Don't Cry",
        "By Hook or by Crook",
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
    else if (intent === 'recommend_transman_shows' || intent === 'recommend_trans_woman_shows' || intent === 'q_and_a_recommend_trans_shows' || intent === 'recommend_trans_actor_shows' || intent === 'recommend_transphobia_shows') {
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
