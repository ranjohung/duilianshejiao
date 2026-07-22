const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validator');
const { smsLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');
const Joi = require('joi');

// POST /api/auth/register
router.post('/register', validate(Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  nickname: Joi.string().min(2).max(20).required(),
  password: Joi.string().min(6).max(32).allow(null, ''),
})), authController.register);

// POST /api/auth/login
router.post('/login', validate(Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  code: Joi.string().length(6).allow(null, ''),
  password: Joi.string().min(6).max(32).allow(null, ''),
})), authController.login);

// POST /api/auth/send-code
router.post('/send-code', smsLimiter, validate(Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
})), authController.sendCode);

// POST /api/auth/verify-real-name
router.post('/verify-real-name', auth, validate(Joi.object({
  realName: Joi.string().required(),
  idCard: Joi.string().length(18).required(),
})), authController.verifyRealName);

// POST /api/auth/refresh
router.post('/refresh', validate(Joi.object({
  refreshToken: Joi.string().required(),
})), authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', auth, authController.logout);

module.exports = router;
