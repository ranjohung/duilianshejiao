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

// GET /api/training/records - 训练历史
router.get('/records', auth, trainingController.getHistory);

// GET /api/training/records/:id - 训练详情
router.get('/records/:id', auth, trainingController.getDetail);

// POST /api/training/item/use - 使用道具
router.post('/item/use', auth, trainingController.useItem);

module.exports = router;
