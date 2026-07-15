const router = require('express').Router();
const socialController = require('../controllers/social.controller');
const auth = require('../middleware/auth');

// GET /api/social/posts
router.get('/posts', auth, socialController.listPosts);

// POST /api/social/posts
router.post('/posts', auth, socialController.createPost);

// POST /api/social/posts/:id/like
router.post('/posts/:id/like', auth, socialController.likePost);

// GET /api/social/talents
router.get('/talents', auth, socialController.listTalents);

// GET /api/social/challenges
router.get('/challenges', auth, socialController.listChallenges);

// GET /api/social/leaderboard
router.get('/leaderboard', auth, socialController.getLeaderboard);

module.exports = router;
