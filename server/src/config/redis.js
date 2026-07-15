const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis连接错误:', err.message));

module.exports = redis;
