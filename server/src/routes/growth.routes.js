const router = require('express').Router();
const growthController = require('../controllers/growth.controller');
const auth = require('../middleware/auth');

// GET /api/growth/profile
router.get('/profile', auth, growthController.getProfile);

// GET /api/growth/milestones
router.get('/milestones', auth, growthController.getMilestones);

// PUT /api/growth/dimensions
router.put('/dimensions', auth, growthController.updateDimensions);

// GET /api/growth/diary
router.get('/diary', auth, growthController.getDiary);

// POST /api/growth/diary
router.post('/diary', auth, growthController.createDiary);

// GET /api/growth/learning-cards
router.get('/learning-cards', auth, growthController.getLearningCards);

// GET /api/growth/weekly-progress
router.get('/weekly-progress', auth, growthController.getWeeklyProgress);

// GET /api/growth/progress-curve
router.get('/progress-curve', auth, growthController.getProgressCurve);

module.exports = router;
