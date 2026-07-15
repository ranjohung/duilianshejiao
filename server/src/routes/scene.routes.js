const router = require('express').Router();
const sceneController = require('../controllers/scene.controller');
const auth = require('../middleware/auth');

// GET /api/scenes/presets - 获取预设场景（放在 /:id 之前避免被匹配）
router.get('/presets', auth, sceneController.getPresets);

// GET /api/scenes
router.get('/', auth, sceneController.listScenes);

// GET /api/scenes/:id
router.get('/:id', auth, sceneController.getScene);

// POST /api/scenes/:id/start
router.post('/:id/start', auth, sceneController.startScene);

module.exports = router;
