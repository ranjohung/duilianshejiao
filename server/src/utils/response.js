const successResponse = (res, data = null, message = '成功', code = 0) => {
  res.json({ code, message, data });
};

const errorResponse = (res, statusCode = 500, message = '错误', details = null) => {
  const errorCode = statusCode >= 400 && statusCode < 500
    ? 40000 + statusCode
    : statusCode === 500 ? 50000 : statusCode;
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
