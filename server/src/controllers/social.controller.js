const { successResponse, errorResponse } = require('../utils/response');
const SocialPost = require('../models/SocialPost');
const User = require('../models/User');
const Talent = require('../models/Talent');
const RealChallenge = require('../models/RealChallenge');
const Item = require('../models/Item');

async function listPosts(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    let result;
    if (userId) {
      result = await SocialPost.getPostsWithLikeStatus(userId, { page: parseInt(page), pageSize: parseInt(pageSize) });
    } else {
      result = await SocialPost.findAll({ page: parseInt(page), pageSize: parseInt(pageSize) });
    }

    const posts = result.items.map(post => {
      if (post.images && typeof post.images === 'string') {
        try { post.images = JSON.parse(post.images); } catch {}
      }
      if (post.tags && typeof post.tags === 'string') {
        try { post.tags = JSON.parse(post.tags); } catch {}
      }
      return post;
    });

    successResponse(res, { posts, total: result.total }, '获取动态列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user?.id;
    const { content, images, tags } = req.body;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, 400, '内容不能为空');
    }

    const postId = await SocialPost.create({
      userId,
      content: content.trim(),
      images,
      tags,
    });

    const post = await SocialPost.findById(postId);
    successResponse(res, post, '发布成功');
  } catch (error) {
    errorResponse(res, 500, '发布失败', error.message);
  }
}

async function likePost(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const post = await SocialPost.findById(id);
    if (!post) {
      return errorResponse(res, 404, '动态不存在');
    }

    const isLiked = await SocialPost.isLiked(id, userId);
    
    if (isLiked) {
      await SocialPost.removeLikeRecord(id, userId);
      await SocialPost.decrementLikes(id);
      successResponse(res, { liked: false, likeCount: post.like_count - 1 }, '取消点赞成功');
    } else {
      await SocialPost.addLikeRecord(id, userId);
      await SocialPost.incrementLikes(id);
      successResponse(res, { liked: true, likeCount: post.like_count + 1 }, '点赞成功');
    }
  } catch (error) {
    errorResponse(res, 500, '操作失败', error.message);
  }
}

async function listTalents(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20 } = req.query;

    const userTalents = await Talent.findByUserId(userId, { page: parseInt(page), pageSize: parseInt(pageSize) });
    const presetTalents = await Talent.getPresetTalents();

    const talents = userTalents.items.map(talent => {
      const preset = presetTalents.find(t => t.name === talent.name);
      return {
        ...talent,
        base_effect: preset?.base_effect || {},
      };
    });

    successResponse(res, { talents, total: userTalents.total }, '获取天赋列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function listChallenges(req, res) {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20, category } = req.query;

    const challenges = await RealChallenge.findAll({ 
      page: parseInt(page), 
      pageSize: parseInt(pageSize),
      category,
    });

    const itemsWithStatus = await Promise.all(challenges.items.map(async (challenge) => {
      const status = userId ? await RealChallenge.getUserChallengeStatus(userId, challenge.id) : null;
      return {
        ...challenge,
        userStatus: status,
      };
    }));

    successResponse(res, { challenges: itemsWithStatus, total: challenges.total }, '获取挑战列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getLeaderboard(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await SocialPost.getLeaderboard({ page: parseInt(page), pageSize: parseInt(pageSize) });
    
    successResponse(res, { users: result.items, total: result.total }, '获取排行榜成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function getInviteInfo(req, res) {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    const inviteCode = user.invite_code || 'INVITE_' + userId.toString(36).toUpperCase();
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${inviteCode}`;

    const [inviteeRows] = await User.pool.execute(
      `SELECT COUNT(*) as cnt FROM users WHERE invited_by = ?`,
      [userId]
    );
    const inviteeCount = inviteeRows[0].cnt;

    const rewardRecords = await User.pool.execute(
      `SELECT * FROM invite_rewards WHERE inviter_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    successResponse(res, {
      inviteCode,
      inviteLink,
      inviteeCount,
      rewards: rewardRecords[0] || [],
    }, '获取邀请信息成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

async function inviteFriend(req, res) {
  try {
    const userId = req.user?.id;

    const inviteCode = 'INVITE_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4);
    
    await User.pool.execute(
      `UPDATE users SET invite_code = ? WHERE id = ?`,
      [inviteCode, userId]
    );

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${inviteCode}`;

    successResponse(res, { inviteCode, inviteLink }, '生成邀请码成功');
  } catch (error) {
    errorResponse(res, 500, '生成失败', error.message);
  }
}

async function useInviteCode(req, res) {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!code) {
      return errorResponse(res, 400, '邀请码不能为空');
    }

    const [inviterRows] = await User.pool.execute(
      `SELECT id FROM users WHERE invite_code = ?`,
      [code]
    );

    if (inviterRows.length === 0) {
      return errorResponse(res, 404, '邀请码无效');
    }

    const inviterId = inviterRows[0].id;

    if (inviterId === userId) {
      return errorResponse(res, 400, '不能使用自己的邀请码');
    }

    const [existingRows] = await User.pool.execute(
      `SELECT COUNT(*) as cnt FROM users WHERE id = ? AND invited_by = ?`,
      [userId, inviterId]
    );

    if (existingRows[0].cnt > 0) {
      return errorResponse(res, 400, '已经使用过该邀请码');
    }

    await User.pool.execute(
      `UPDATE users SET invited_by = ? WHERE id = ?`,
      [inviterId, userId]
    );

    await User.updatePoints(inviterId, 50);
    await Item.addItem(inviterId, 'time_shuttle', 1);

    await User.pool.execute(
      `INSERT INTO invite_rewards (inviter_id, invitee_id, reward_points, reward_item_type, reward_item_quantity, created_at) VALUES (?, ?, 50, 'time_shuttle', 1, NOW())`,
      [inviterId, userId]
    );

    await User.updatePoints(userId, 20);
    await Item.addItem(userId, 'hint_card', 1);

    successResponse(res, {
      inviterId,
      rewards: {
        points: 20,
        items: [{ type: 'hint_card', quantity: 1 }],
      },
    }, '使用邀请码成功，获得奖励');
  } catch (error) {
    errorResponse(res, 500, '使用失败', error.message);
  }
}

async function shareAchievement(req, res) {
  try {
    const userId = req.user?.id;
    const { achievementId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    successResponse(res, {
      shared: true,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/achievement/${achievementId}`,
      shareImage: '',
    }, '分享成功');
  } catch (error) {
    errorResponse(res, 500, '分享失败', error.message);
  }
}

async function teamTraining(req, res) {
  try {
    const userId = req.user?.id;
    const { partnerId, sceneId } = req.body;

    if (!partnerId) {
      return errorResponse(res, 400, '请选择组队伙伴');
    }

    const partner = await User.findById(partnerId);
    if (!partner) {
      return errorResponse(res, 404, '伙伴不存在');
    }

    const trainingId = 'team_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    successResponse(res, {
      trainingId,
      partner: { id: partner.id, nickname: partner.nickname, avatar: partner.avatar },
      sceneId,
      status: 'waiting',
    }, '组队训练成功');
  } catch (error) {
    errorResponse(res, 500, '组队失败', error.message);
  }
}

async function getTeamTrainingStatus(req, res) {
  try {
    const { trainingId } = req.params;

    successResponse(res, {
      trainingId,
      status: 'completed',
      participants: [],
      score: 0,
    }, '获取组队训练状态成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
}

module.exports = { 
  listPosts, 
  createPost, 
  likePost, 
  listTalents, 
  listChallenges, 
  getLeaderboard,
  getInviteInfo,
  inviteFriend,
  useInviteCode,
  shareAchievement,
  teamTraining,
  getTeamTrainingStatus,
};