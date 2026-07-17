const router = require('express').Router();
const talentController = require('../controllers/talent.controller');
const auth = require('../middleware/auth');

router.get('/', auth, talentController.getUserTalents);
router.post('/unlock', auth, talentController.unlockTalent);
router.put('/:talentId/upgrade', auth, talentController.upgradeTalent);
router.get('/effects', auth, talentController.getTalentEffects);
router.get('/available', auth, talentController.getAvailableTalents);

module.exports = router;