const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'duilian_jwt_secret_key';
const JWT_EXPIRES_IN = '7d';

const sign = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verify = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  sign,
  verify
};