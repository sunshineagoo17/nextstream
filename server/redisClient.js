const Redis = require('ioredis');

const redis = new Redis({
  port: 6379, // Default Redis port
  host: '127.0.0.1', // Default Redis host
});

module.exports = redis;