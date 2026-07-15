const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId, memberLevel) => {
  return jwt.sign({ userId, memberLevel }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = { generateToken, verifyToken };
