const router = require('express').Router();
const goodnightController = require('../controllers/goodnight.controller');
const auth = require('../middleware/auth');

// POST /api/goodnight/plan
router.post('/plan', auth, goodnightController.createPlan);

// GET /api/goodnight/plan
router.get('/plan', auth, goodnightController.getPlan);

// PUT /api/goodnight/plan
router.put('/plan', auth, goodnightController.updatePlan);

// POST /api/goodnight/execute
router.post('/execute', auth, goodnightController.execute);

module.exports = router;
