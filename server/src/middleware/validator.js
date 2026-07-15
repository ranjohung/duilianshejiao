const Joi = require('joi');
const { errorResponse } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) return errorResponse(res, 400, '参数校验失败', error.details);
  req.body = value;
  next();
};

module.exports = { validate };
