const router = require('express').Router();
const trainingController = require('../controllers/training.controller');
const auth = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { antiAddictionCheck } = require('../middleware/antiAddiction');

// POST /api/training/start - 开始训练
router.post('/start', auth, antiAddictionCheck, chatLimiter, trainingController.startTraining);

// POST /api/training/message - 发送消息（SSE流式）
router.post('/message', auth, antiAddictionCheck, chatLimiter, trainingController.sendMessage);

// POST /api/training/end - 结束训练
router.post('/end', auth, trainingController.endTraining);

// GET /api/training/history - 训练历史
router.get('/history', auth, trainingController.getHistory);

// GET /api/training/:id - 训练详情
router.get('/:id', auth, trainingController.getDetail);

module.exports = router;
