const router = require('express').Router();
const checkinController = require('../controllers/checkin.controller');
const auth = require('../middleware/auth');

// POST /api/check-in
router.post('/', auth, checkinController.checkIn);

// GET /api/check-in/today
router.get('/today', auth, checkinController.getToday);

// GET /api/check-in/calendar
router.get('/calendar', auth, checkinController.getCalendar);

module.exports = router;
