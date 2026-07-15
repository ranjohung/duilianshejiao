const router = require('express').Router();
const itemController = require('../controllers/item.controller');
const auth = require('../middleware/auth');

// GET /api/items
router.get('/', auth, itemController.listItems);

// POST /api/items/:id/purchase
router.post('/:id/purchase', auth, itemController.purchase);

// GET /api/items/bag
router.get('/bag', auth, itemController.getBag);

module.exports = router;
