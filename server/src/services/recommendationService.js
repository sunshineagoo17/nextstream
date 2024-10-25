const axios = require('axios');
const knex = require('../config/db');
const { sendRecommendationNotifications } = require('../utils/recommendationNotifications');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const fetchPopularMedia = async (page = 1) => {
  const axiosInstance = axios.create({
    timeout: 5000, // Set timeout to 5 seconds
  });

  const retryFetch = async (url, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await axiosInstance.get(url);
      } catch (error) {
        if (attempt === retries) throw error;
      }
    }
  };

  const moviesUrl = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  const showsUrl = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;

  const [moviesResponse, showsResponse] = await Promise.all([
    retryFetch(moviesUrl),
    retryFetch(showsUrl)
  ]);

  return [
    ...moviesResponse.data.results.map(item => ({ ...item, media_type: 'movie' })),
    ...showsResponse.data.results.map(item => ({ ...item, media_type: 'tv' }))
  ];
};

const getRecommendationsForUser = async (userId) => {
  try {

    const likedMedia = await knex('interactions').select('media_id').where('userId', userId).andWhere('interaction', 1);
    const viewedMedia = await knex('viewed_media').select('media_id').where('userId', userId);
    const sentRecommendations = await knex('sent_recommendations').select('recommendationId').where('userId', userId);

    const interactedMediaIds = [
      ...likedMedia.map(media => media.media_id),
      ...viewedMedia.map(media => media.media_id),
      ...sentRecommendations.map(rec => rec.recommendationId)
    ];

    let popularMedia = [];
    let page = 1;
    while (popularMedia.length < 5) {
      const fetchedMedia = await fetchPopularMedia(page);
      const newMedia = fetchedMedia.filter(media => !interactedMediaIds.includes(media.id));
      popularMedia = [...popularMedia, ...newMedia];
      page += 1;
    }

    const recommendations = popularMedia.slice(0, 5);

    return recommendations.map(rec => ({ id: rec.id, title: rec.title || rec.name }));
  } catch (error) {
    throw error;
  }
};

const notifyUserWithRecommendations = async (userId) => {
  try {
    const user = await knex('users').where({ id: userId }).first();
    if (user && user.receiveNotifications) {
      const recommendations = await getRecommendationsForUser(userId);
      if (recommendations.length > 0) {
        const recommendationTitles = recommendations.map(rec => rec.title);
        await sendRecommendationNotifications(user.email, recommendationTitles);

        const sentRecommendations = recommendations.map(rec => ({
          userId,
          recommendationId: rec.id,
        }));
        await knex('sent_recommendations').insert(sentRecommendations);
      } else {
        console.log('No new recommendations to send.');
      }
    } else {
      console.log(`User does not have notifications enabled or does not exist.`);
    }
  } catch (error) {
    console.error('Error notifying user with recommendations.');
  }
};

const generateAndNotifyRecommendations = async (userId) => {
  await notifyUserWithRecommendations(userId);
};

module.exports = { generateAndNotifyRecommendations };