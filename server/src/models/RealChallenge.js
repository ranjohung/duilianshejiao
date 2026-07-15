const pool = require('../config/database');

const TABLE = 'real_challenges';

// 挑战类型定义
const CHALLENGE_TYPES = [
  { key: 'social_greeting', label: '主动和陌生人打招呼', category: 'social', talentReward: 'speech', expReward: 30 },
  { key: 'public_speak', label: '在3人以上的场合发言', category: 'social', talentReward: 'speech', expReward: 50 },
  { key: 'negotiate_price', label: '在购物时尝试砍价', category: 'negotiation', talentReward: 'negotiation', expReward: 30 },
  { key: 'complaint_service', label: '有效投诉一次服务问题', category: 'negotiation', talentReward: 'negotiation', expReward: 40 },
  { key: 'comfort_friend', label: '安慰一个难过的朋友', category: 'empathy', talentReward: 'empathy', expReward: 30 },
  { key: 'humor_joke', label: '讲一个笑话逗笑别人', category: 'humor', talentReward: 'humor', expReward: 30 },
  { key: 'write_diary', label: '写一篇500字以上的情绪日记', category: 'writing', talentReward: 'writing', expReward: 30 },
  { key: 'salary_talk', label: '和领导谈一次加薪', category: 'negotiation', talentReward: 'negotiation', expReward: 50 },
];

module.exports = {
  TABLE,
  CHALLENGE_TYPES,

  async findAll({ page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  // 返回本周挑战列表
  async findWeekly() {
    return CHALLENGE_TYPES.map(c => ({
      ...c,
      id: c.key,
    }));
  },

  // 获取用户的挑战记录
  async findByUser(userId, { page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    return rows;
  },

  // 创建挑战记录
  async create({ userId, challengeType, description, evidence }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, challenge_type, description, evidence, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [userId, challengeType, description, evidence || null]
    );
    return result.insertId;
  },

  // 验证挑战（通过/拒绝）
  async verify(id, passed) {
    const status = passed ? 'verified' : 'rejected';
    await pool.execute(
      `UPDATE ${TABLE} SET status = ?, verified_at = NOW() WHERE id = ?`,
      [status, id]
    );
  },

  // 获取挑战类型信息
  getChallengeType(key) {
    return CHALLENGE_TYPES.find(c => c.key === key) || null;
  },
};
