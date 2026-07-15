const router = require('express').Router();
const membershipController = require('../controllers/membership.controller');
const auth = require('../middleware/auth');

// GET /api/membership/plans
router.get('/plans', auth, membershipController.listPlans);

// GET /api/membership/status
router.get('/status', auth, membershipController.getStatus);

// POST /api/membership/subscribe
router.post('/subscribe', auth, membershipController.subscribe);

// GET /api/membership/comparison
router.get('/comparison', auth, membershipController.getComparison);

module.exports = router;
