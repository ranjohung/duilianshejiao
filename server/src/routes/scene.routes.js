const router = require('express').Router();
const sceneController = require('../controllers/scene.controller');
const auth = require('../middleware/auth');

// GET /api/scenes/presets - 获取预设场景（放在 /:id 之前避免被匹配）
router.get('/presets', auth, sceneController.getPresets);

// GET /api/scenes/grouped - 按阶段分组获取场景
router.get('/grouped', auth, sceneController.getGroupedByStage);

// GET /api/scenes
router.get('/', auth, sceneController.listScenes);

// GET /api/scenes/:id/check-unlock - 检查场景解锁状态（放在 /:id 之前避免被匹配）
router.get('/:sceneId/check-unlock', auth, sceneController.checkUnlock);

// GET /api/scenes/:id
router.get('/:id', auth, sceneController.getScene);

// POST /api/scenes/:id/start
router.post('/:id/start', auth, sceneController.startScene);

module.exports = router;
