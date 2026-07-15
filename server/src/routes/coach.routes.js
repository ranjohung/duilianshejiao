const router = require('express').Router();
const coachController = require('../controllers/coach.controller');
const auth = require('../middleware/auth');

// GET /api/coaches - 获取教练列表
router.get('/', auth, coachController.list);

// GET /api/coaches/presets - 获取预设教练
router.get('/presets', auth, coachController.getPresets);

// GET /api/coaches/custom - 获取用户的自定义教练列表
router.get('/custom', auth, coachController.getCustomCoaches);

// POST /api/coaches/custom - 创建自定义教练
router.post('/custom', auth, coachController.createCustomCoach);

// PUT /api/coaches/:id/custom - 更新自定义教练
router.put('/:id/custom', auth, coachController.updateCustomCoach);

// GET /api/coaches/:id - 获取教练详情
router.get('/:id', auth, coachController.getDetail);

// POST /api/coaches/:id/chat - 兼容旧对话接口
router.post('/:id/chat', auth, coachController.chat);

module.exports = router;
