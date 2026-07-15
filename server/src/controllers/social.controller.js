const SocialPost = require('../models/SocialPost');
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
