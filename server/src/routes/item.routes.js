const router = require('express').Router();
const itemController = require('../controllers/item.controller');
const auth = require('../middleware/auth');

// GET /api/items - 道具目录
router.get('/', auth, itemController.listItems);

// GET /api/items/bag - 用户背包（放在 /:id 之前避免冲突）
router.get('/bag', auth, itemController.getBag);

// POST /api/items/use - 使用道具
router.post('/use', auth, itemController.useItem);

// POST /api/items/grant - 发放道具（内部接口）
router.post('/grant', auth, itemController.grantItem);

// POST /api/items/:id/purchase - 购买道具
router.post('/:id/purchase', auth, itemController.purchase);

module.exports = router;
