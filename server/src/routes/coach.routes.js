const router = require('express').Router();
const coachController = require('../controllers/coach.controller');
const auth = require('../middleware/auth');

// GET /api/coaches - 获取教练列表
router.get('/', auth, coachController.list);

// GET /api/coaches/presets - 获取预设教练
router.get('/presets', auth, coachController.getPresets);

// GET /api/coaches/:id - 获取教练详情
router.get('/:id', auth, coachController.getDetail);

// POST /api/coaches/:id/chat - 兼容旧对话接口
router.post('/:id/chat', auth, coachController.chat);

module.exports = router;
