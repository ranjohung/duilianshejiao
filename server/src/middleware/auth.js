const jwt = require('jsonwebtoken');
const config = require('../config');
const { errorResponse } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return errorResponse(res, 401, '未提供认证令牌');

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.userId, memberLevel: decoded.memberLevel };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return errorResponse(res, 401, '令牌已过期');
    return errorResponse(res, 401, '无效的认证令牌');
  }
};

module.exports = auth;
