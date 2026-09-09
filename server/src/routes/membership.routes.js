const router = require('express').Router();
const membershipController = require('../controllers/membership.controller');
const auth = require('../middleware/auth');

router.get('/plans', auth, membershipController.listPlans);
router.get('/status', auth, membershipController.getStatus);
router.post('/subscribe', auth, membershipController.subscribe);
// 与旧版文档兼容；两条路径都只创建支付意向，未配置支付时不会开通会员。
router.post('/purchase', auth, membershipController.subscribe);
router.get('/comparison', auth, membershipController.getComparison);

module.exports = router;
