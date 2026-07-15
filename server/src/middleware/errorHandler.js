const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`, err.message);

  if (err.isJoi) return errorResponse(res, 400, '参数校验失败', err.details);
  if (err.statusCode) return errorResponse(res, err.statusCode, err.message);

  return errorResponse(res, 500, '服务器内部错误');
};

module.exports = { errorHandler };
