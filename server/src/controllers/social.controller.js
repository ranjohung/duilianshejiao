const SocialPost = require('../models/SocialPost');
const User = require('../models/User');
const Item = require('../models/Item');
const { filterContent, maskContent } = require('../services/contentFilter');
const { successResponse, errorResponse, paginate } = require('../utils/response');

// 获取教练朋友圈（分页）
exports.listPosts = async (req, res) => {
  try {
    const { coachId, page = 1, pageSize = 10 } = req.query;
    const result = coachId
      ? await SocialPost.findByCoach(coachId, { page: Number(page), pageSize: Number(pageSize) })
      : await SocialPost.findAll({ page: Number(page), pageSize: Number(pageSize) });
    successResponse(res, paginate(result.items, result.total, Number(page), Number(pageSize)));
  } catch (err) {
    errorResponse(res, 500, '获取动态列表失败');
  }
};

// 教练自动发朋友圈（系统内部调用）
exports.createPost = async (req, res) => {
  try {
    const { coachId, content, imageUrl, postType } = req.body;
    if (!coachId || !content) {
      return errorResponse(res, 400, '教练ID和内容不能为空');
    }
    const postId = await SocialPost.create({ coachId, content, imageUrl, postType });
    successResponse(res, { id: postId }, '发布动态成功');
  } catch (err) {
    errorResponse(res, 500, '发布动态失败');
  }
};

// 点赞朋友圈
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await SocialPost.incrementLikes(id);
    await SocialPost.addLikeRecord(id, userId);
    successResponse(res, null, '点赞成功');
  } catch (err) {
    errorResponse(res, 500, '点赞失败');
  }
};

// 获取天赋列表
exports.listTalents = async (req, res) => {
  try {
    // TODO: 实现天赋列表查询
    successResponse(res, [], '获取天赋列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 获取真实挑战列表
exports.listChallenges = async (req, res) => {
  try {
    // TODO: 实现真实挑战列表查询
    successResponse(res, [], '获取真实挑战列表成功');
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
};

// 好友排行榜
exports.getLeaderboard = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await SocialPost.getLeaderboard({ page: Number(page), pageSize: Number(pageSize) });
    successResponse(res, paginate(result.items, result.total, Number(page), Number(pageSize)));
  } catch (err) {
    errorResponse(res, 500, '获取排行榜失败');
  }
};

// ============ 社交裂变：邀请好友 ============

// 邀请好友（生成邀请码/链接）
exports.inviteFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    let inviteCode = user.invite_code;
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // 保存邀请码到用户表
      const pool = require('../config/database');
      await pool.execute('UPDATE users SET invite_code = ? WHERE id = ?', [inviteCode, userId]);
    }
    // 查询已邀请人数
    const pool = require('../config/database');
    const [invites] = await pool.execute(
      'SELECT COUNT(*) as count FROM invite_records WHERE inviter_id = ?',
      [userId]
    );
    successResponse(res, {
      inviteCode,
      inviteLink: `https://duilian.app/invite/${inviteCode}`,
      invitedCount: invites[0].count,
      reward: '邀请成功后双方各获1张时空穿梭券',
    });
  } catch (err) {
    errorResponse(res, 500, '获取邀请信息失败');
  }
};

// 使用邀请码
exports.useInviteCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) return errorResponse(res, 400, '邀请码不能为空');

    // 查找邀请码对应的邀请人
    const [inviters] = await pool.execute(
      'SELECT id FROM users WHERE invite_code = ? AND id != ?',
      [code, userId]
    );
    if (inviters.length === 0) return errorResponse(res, 404, '邀请码无效');

    const inviterId = inviters[0].id;

    // 检查是否已使用过邀请码
    const [existing] = await pool.execute(
      'SELECT id FROM invite_records WHERE invitee_id = ?',
      [userId]
    );
    if (existing.length > 0) return errorResponse(res, 400, '您已使用过邀请码');

    // 记录邀请关系
    await pool.execute(
      'INSERT INTO invite_records (inviter_id, invitee_id, reward_granted, created_at) VALUES (?, ?, 1, NOW())',
      [inviterId, userId]
    );

    // 双方各发1张穿梭券
    await Item.grantItem(inviterId, 'time_travel');
    await Item.grantItem(userId, 'time_travel');

    successResponse(res, { reward: '双方各获1张时空穿梭券' }, '邀请码使用成功');
  } catch (err) {
    errorResponse(res, 500, '邀请码使用失败');
  }
};

// 获取邀请信息
exports.getInviteInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    let inviteCode = user.invite_code;
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const pool = require('../config/database');
      await pool.execute('UPDATE users SET invite_code = ? WHERE id = ?', [inviteCode, userId]);
    }
    const pool = require('../config/database');
    const [invites] = await pool.execute(
      'SELECT COUNT(*) as count FROM invite_records WHERE inviter_id = ?',
      [userId]
    );
    successResponse(res, {
      inviteCode,
      inviteLink: `https://duilian.app/invite/${inviteCode}`,
      invitedCount: invites[0].count,
      reward: '邀请成功后双方各获1张时空穿梭券',
    });
  } catch (err) {
    errorResponse(res, 500, '获取邀请信息失败');
  }
};

// ============ 社交裂变：分享成就 ============

// 分享成就卡片
exports.shareAchievement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.body;
    if (!achievementId) return errorResponse(res, 400, '成就ID不能为空');

    // 生成分享图信息（实际项目中可调用图片生成服务）
    const shareData = {
      shareUrl: `https://duilian.app/share/achievement/${achievementId}?u=${userId}`,
      shareTitle: '我在对练社交中获得了新成就！',
      shareDesc: '快来看看我的成长记录',
      imageUrl: `https://duilian.app/assets/achievements/${achievementId}.png`,
    };
    successResponse(res, shareData, '分享信息生成成功');
  } catch (err) {
    errorResponse(res, 500, '分享成就失败');
  }
};

// ============ 社交裂变：组队训练 ============

// 组队训练（旁观者可发表情/简短评论，评论经违禁词过滤）
exports.teamTraining = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trainingId, comment, emoji } = req.body;

    // 如果有评论文字，进行内容安全过滤
    if (comment) {
      const filterResult = filterContent(comment);
      if (!filterResult.passed) {
        return errorResponse(res, 400, '评论包含违禁内容，请修改后重试', {
          matchedWords: filterResult.matchedWords,
        });
      }
    }

    const pool = require('../config/database');
    const maskedComment = comment ? maskContent(comment) : null;

    // 保存组队训练互动记录
    const [result] = await pool.execute(
      'INSERT INTO team_training_interactions (training_id, user_id, comment, emoji, created_at) VALUES (?, ?, ?, ?, NOW())',
      [trainingId, userId, maskedComment || '', emoji || '']
    );

    successResponse(res, { id: result.insertId }, '互动成功');
  } catch (err) {
    errorResponse(res, 500, '组队训练互动失败');
  }
};

// 获取组队训练状态
exports.getTeamTrainingStatus = async (req, res) => {
  try {
    const { trainingId } = req.params;
    const pool = require('../config/database');

    // 获取互动记录（最新20条）
    const [interactions] = await pool.execute(
      `SELECT tti.*, u.nickname, u.avatar FROM team_training_interactions tti
       JOIN users u ON tti.user_id = u.id
       WHERE tti.training_id = ?
       ORDER BY tti.created_at DESC LIMIT 20`,
      [trainingId]
    );

    successResponse(res, { interactions }, '获取组队训练状态成功');
  } catch (err) {
    errorResponse(res, 500, '获取组队训练状态失败');
  }
};
