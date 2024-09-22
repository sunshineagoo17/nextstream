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

    // Handle April Fools movie intent
    if (intent === 'celebrate_april_fools') {
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
  const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

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
        poster_path: media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : null,
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
