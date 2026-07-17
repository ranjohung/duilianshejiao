const router = require('express').Router();
const challengeController = require('../controllers/challenge.controller');
const auth = require('../middleware/auth');

router.get('/', auth, challengeController.listChallenges);
router.get('/categories', auth, challengeController.getChallengeCategories);
router.get('/:challengeId', auth, challengeController.getChallengeDetail);
router.post('/:challengeId/start', auth, challengeController.startChallenge);
router.put('/:challengeId/progress', auth, challengeController.updateChallengeProgress);
router.post('/:challengeId/complete', auth, challengeController.completeChallenge);
router.get('/my/completed', auth, challengeController.getUserCompletedChallenges);

module.exports = router;