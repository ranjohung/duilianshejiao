const pool = require('../config/database');

const TABLE = 'real_challenges';

const PRESET_CHALLENGES = [
  {
    title: '主动打招呼',
    description: '在现实生活中主动向3个陌生人打招呼',
    category: 'social',
    difficulty: 'easy',
    target_count: 3,
    reward_points: 20,
  },
  {
    title: '深度对话',
    description: '与他人进行一次超过10分钟的深度对话',
    category: 'social',
    difficulty: 'medium',
    target_count: 1,
    reward_points: 30,
  },
  {
    title: '公开表达',
    description: '在至少5人面前进行一次公开表达',
    category: 'expression',
    difficulty: 'hard',
    target_count: 1,
    reward_points: 50,
  },
  {
    title: '倾听练习',
    description: '完整倾听他人倾诉一次，不打断',
    category: 'empathy',
    difficulty: 'medium',
    target_count: 1,
    reward_points: 25,
  },
  {
    title: '赞美他人',
    description: '真诚地赞美5个人',
    category: 'social',
    difficulty: 'easy',
    target_count: 5,
    reward_points: 15,
  },
  {
    title: '拒绝练习',
    description: '在合适的场合拒绝一次不合理的请求',
    category: 'confidence',
    difficulty: 'medium',
    target_count: 1,
    reward_points: 35,
  },
];

module.exports = {
  TABLE,

  async findAll({ page = 1, pageSize = 20, category } = {}) {
    let query = `SELECT * FROM ${TABLE} WHERE is_active = 1`;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);

    const [rows] = await pool.execute(query, params);
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE} WHERE is_active = 1`, category ? [category] : []);
    return { items: rows, total: countRows[0].total };
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ? AND is_active = 1`, [id]);
    return rows[0];
  },

  async findByCategory(category, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE category = ? AND is_active = 1 ORDER BY sort_order ASC LIMIT ? OFFSET ?`,
      [category, pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE} WHERE category = ? AND is_active = 1`, [category]);
    return { items: rows, total: countRows[0].total };
  },

  async create(challengeData) {
    const { title, description, category, difficulty, target_count, reward_points } = challengeData;
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (title, description, category, difficulty, target_count, reward_points, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [title, description, category, difficulty, target_count, reward_points]
    );
    return result.insertId;
  },

  async update(id, updateData) {
    const { title, description, category, difficulty, target_count, reward_points, is_active } = updateData;
    const updateFields = [];
    const values = [];

    if (title !== undefined) { updateFields.push('title = ?'); values.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); values.push(description); }
    if (category !== undefined) { updateFields.push('category = ?'); values.push(category); }
    if (difficulty !== undefined) { updateFields.push('difficulty = ?'); values.push(difficulty); }
    if (target_count !== undefined) { updateFields.push('target_count = ?'); values.push(target_count); }
    if (reward_points !== undefined) { updateFields.push('reward_points = ?'); values.push(reward_points); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); values.push(is_active); }

    if (updateFields.length === 0) return false;

    const [result] = await pool.execute(
      `UPDATE ${TABLE} SET ${updateFields.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    await pool.execute(`UPDATE ${TABLE} SET is_active = 0 WHERE id = ?`, [id]);
  },

  async getPresetChallenges() {
    return PRESET_CHALLENGES;
  },

  async getUserChallengeStatus(userId, challengeId) {
    const [rows] = await pool.execute(
      `SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId, challengeId]
    );
    return rows[0] || null;
  },

  async startChallenge(userId, challengeId) {
    const [result] = await pool.execute(
      `INSERT INTO user_challenges (user_id, challenge_id, progress, status, created_at) VALUES (?, ?, 0, 'in_progress', NOW())`,
      [userId, challengeId]
    );
    return result.insertId;
  },

  async updateProgress(userId, challengeId, increment = 1) {
    const [result] = await pool.execute(
      `UPDATE user_challenges SET progress = progress + ?, updated_at = NOW() WHERE user_id = ? AND challenge_id = ? AND status = 'in_progress'`,
      [increment, userId, challengeId]
    );
    return result.affectedRows > 0;
  },

  async completeChallenge(userId, challengeId) {
    const challenge = await this.findById(challengeId);
    if (!challenge) return null;

    const [statusRows] = await pool.execute(
      `SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1`,
      [userId, challengeId]
    );

    if (statusRows.length === 0) return null;

    await pool.execute(
      `UPDATE user_challenges SET status = 'completed', updated_at = NOW() WHERE id = ?`,
      [statusRows[0].id]
    );

    return { challenge, reward_points: challenge.reward_points };
  },

  async getUserCompletedChallenges(userId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT c.*, uc.completed_at FROM ${TABLE} c
       JOIN user_challenges uc ON c.id = uc.challenge_id
       WHERE uc.user_id = ? AND uc.status = 'completed'
       ORDER BY uc.completed_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM user_challenges WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    return { items: rows, total: countRows[0].total };
  },
};
