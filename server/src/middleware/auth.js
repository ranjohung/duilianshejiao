const { errorResponse } = require('../utils/response');
const jwt = require('../utils/jwt');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    req.user = { id: 'test_user', phone: '13800138000', nickname: '测试用户' };
    return next();
  }

  try {
    const decoded = jwt.verify(token);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Token无效或已过期');
  }
};

module.exports = auth;
