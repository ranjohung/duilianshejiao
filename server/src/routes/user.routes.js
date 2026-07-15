const router = require('express').Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

// GET /api/users/profile
router.get('/profile', auth, userController.getProfile);

// PUT /api/users/profile
router.put('/profile', auth, validate(Joi.object({
  nickname: Joi.string().min(2).max(20),
  avatar: Joi.string().uri(),
  gender: Joi.string().valid('male', 'female', 'other'),
  age: Joi.number().integer().min(1).max(150),
})), userController.updateProfile);

// GET /api/users/growth-stats
router.get('/growth-stats', auth, userController.getGrowthStats);

module.exports = router;
