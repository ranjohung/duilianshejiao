const pool = require('../config/database');

const TABLE = 'social_posts';

module.exports = {
  TABLE,

  async findAll({ page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE}`);
    return { items: rows, total: countRows[0].total };
  },

  async findByCoach(coachId, { page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE coach_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [coachId, pageSize, offset]
    );
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM ${TABLE} WHERE coach_id = ?`,
      [coachId]
    );
    return { items: rows, total: countRows[0].total };
  },

  async create({ coachId, content, imageUrl, postType }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (coach_id, content, image_url, post_type, likes_count, created_at) VALUES (?, ?, ?, ?, 0, NOW())`,
      [coachId, content, imageUrl || null, postType || 'daily']
    );
    return result.insertId;
  },

  async incrementLikes(id) {
    await pool.execute(`UPDATE ${TABLE} SET likes_count = likes_count + 1 WHERE id = ?`, [id]);
  },

  async addLikeRecord(postId, userId) {
    await pool.execute(
      `INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId]
    );
  },

  async like(postId, userId) {
    await pool.execute(
      `INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId]
    );
  },

  async getLeaderboard({ page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT u.id, u.nickname, u.avatar, u.total_points, u.student_level
       FROM users u
       WHERE u.total_points > 0
       ORDER BY u.total_points DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM users WHERE total_points > 0`);
    return { items: rows, total: countRows[0].total };
  },
};
