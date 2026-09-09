const router = require('express').Router();
const challengeController = require('../controllers/challenge.controller');
const auth = require('../middleware/auth');

router.get('/', auth, challengeController.listChallenges);
router.get('/categories', auth, challengeController.getChallengeCategories);
// 固定路径必须位于 /:challengeId 之前，否则 "my" 会被当作 challengeId。
router.get('/my/completed', auth, challengeController.getUserCompletedChallenges);
router.get('/:challengeId', auth, challengeController.getChallengeDetail);
router.post('/:challengeId/start', auth, challengeController.startChallenge);
router.put('/:challengeId/progress', auth, challengeController.updateChallengeProgress);
router.post('/:challengeId/complete', auth, challengeController.completeChallenge);

module.exports = router;
