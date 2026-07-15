const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/coaches', require('./coach.routes'));
router.use('/scenes', require('./scene.routes'));
router.use('/training', require('./training.routes'));
router.use('/growth', require('./growth.routes'));
router.use('/check-in', require('./checkin.routes'));
router.use('/goodnight', require('./goodnight.routes'));
router.use('/social', require('./social.routes'));
router.use('/items', require('./item.routes'));
router.use('/membership', require('./membership.routes'));
router.use('/talents', require('./talent.routes'));
router.use('/real-challenges', require('./challenge.routes'));

module.exports = router;
