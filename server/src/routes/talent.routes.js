const router = require('express').Router();
const talentController = require('../controllers/talent.controller');
const auth = require('../middleware/auth');

// GET /api/talents - 获取用户才艺列表
router.get('/', auth, talentController.getTalents);

// GET /api/talents/levels - 获取才艺等级定义
router.get('/levels', auth, talentController.getTalentLevels);

// POST /api/talents/exp - 更新才艺经验值
router.post('/exp', auth, talentController.updateTalentExp);

module.exports = router;
