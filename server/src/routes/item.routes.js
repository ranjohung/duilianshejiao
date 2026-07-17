const router = require('express').Router();
const itemController = require('../controllers/item.controller');
const auth = require('../middleware/auth');

router.get('/', auth, itemController.getItemList);
router.post('/use', auth, itemController.useItem);

module.exports = router;
