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

// ============ 邀请好友 ============

// GET /api/social/invite - 获取邀请信息
router.get('/invite', auth, socialController.getInviteInfo);

// POST /api/social/invite - 邀请好友（生成邀请码/链接）
router.post('/invite', auth, socialController.inviteFriend);

// POST /api/social/invite/use - 使用邀请码
router.post('/invite/use', auth, socialController.useInviteCode);

// ============ 分享成就 ============

// POST /api/social/share/achievement - 分享成就卡片
router.post('/share/achievement', auth, socialController.shareAchievement);

// ============ 组队训练 ============

// POST /api/social/team-training - 组队训练互动
router.post('/team-training', auth, socialController.teamTraining);

// GET /api/social/team-training/:trainingId - 获取组队训练状态
router.get('/team-training/:trainingId', auth, socialController.getTeamTrainingStatus);

module.exports = router;
