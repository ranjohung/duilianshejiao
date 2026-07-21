const router = require('express').Router();
const membershipController = require('../controllers/membership.controller');
const auth = require('../middleware/auth');

router.get('/plans', auth, membershipController.listPlans);
router.get('/status', auth, membershipController.getStatus);
router.post('/subscribe', auth, membershipController.subscribe);
router.get('/comparison', auth, membershipController.getComparison);

module.exports = router;
