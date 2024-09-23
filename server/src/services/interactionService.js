const knex = require('../config/db');

// Fetch interactions for TensorFlow model
const fetchAllInteractions = async (userId) => {
  try {
    const results = await knex('interactions')
      .select('media_id', 'interaction', 'media_type')
      .where('userId', userId);
    return results;
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return [];
  }
};

module.exports = { fetchAllInteractions };
