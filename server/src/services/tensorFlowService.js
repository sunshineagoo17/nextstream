const { trainModel } = require('../models/recommendationModel');

const trainUserModel = async (userId) => {
  return await trainModel(userId);
};

module.exports = { trainUserModel };
