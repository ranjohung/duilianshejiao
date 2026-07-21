const successResponse = (res, data = null, message = '成功', code = 0) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ code, message, data, success: code === 0 });
};

const errorResponse = (res, statusCode = 500, message = '错误', details = null) => {
  const errorCode = statusCode >= 400 && statusCode < 500
    ? 40000 + statusCode
    : statusCode === 500 ? 50000 : statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(statusCode).json({
    code: errorCode,
    message,
    data: details,
    details,
  });
};

const paginate = (items, total, page, pageSize) => ({
  items,
  total,
  page,
  pageSize,
  hasMore: page * pageSize < total,
});

module.exports = { successResponse, errorResponse, paginate };
