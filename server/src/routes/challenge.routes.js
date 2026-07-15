const router = require('express').Router();
const challengeController = require('../controllers/challenge.controller');
const auth = require('../middleware/auth');

// GET /api/real-challenges - 获取本周挑战列表
router.get('/', auth, challengeController.getChallenges);

// GET /api/real-challenges/my - 获取我的挑战记录
router.get('/my', auth, challengeController.getMyChallenges);

// POST /api/real-challenges/start - 开始挑战
router.post('/start', auth, challengeController.startChallenge);

// POST /api/real-challenges/:id/complete - 完成挑战（打卡+AI验证）
router.post('/:id/complete', auth, challengeController.completeChallenge);

module.exports = router;
