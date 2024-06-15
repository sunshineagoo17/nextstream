const db = require('../config/db');

const getAll = () => {
  return db('users').select('*');
};

module.exports = {
  getAll,
};
