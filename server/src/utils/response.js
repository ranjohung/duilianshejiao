const successResponse = (res, data = null, message = '成功', code = 0) => {
  res.json({ code, message, data });
};

const errorResponse = (res, statusCode = 500, message = '错误', details = null) => {
  res.status(statusCode).json({ code: statusCode, message, data: details });
};

const paginate = (items, total, page, pageSize) => ({
  items,
  total,
  page,
  pageSize,
  hasMore: page * pageSize < total,
});

module.exports = { successResponse, errorResponse, paginate };
