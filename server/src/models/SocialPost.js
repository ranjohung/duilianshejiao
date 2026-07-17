const pool = require('../config/database');

const TABLE = 'social_posts';

module.exports = {
  TABLE,

  async findAll({ page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar FROM ${TABLE} p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE}`);
    return { items: rows, total: countRows[0].total };
  },

  async findByUserId(userId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar FROM ${TABLE} p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return { items: rows, total: countRows[0].total };
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar FROM ${TABLE} p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create({ userId, content, images, tags }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, content, images, tags, like_count, created_at) VALUES (?, ?, ?, ?, 0, NOW())`,
      [userId, content, images ? JSON.stringify(images) : null, tags ? JSON.stringify(tags) : null]
    );
    return result.insertId;
  },

  async update(id, { content, images, tags }) {
    const updateFields = [];
    const values = [];

    if (content !== undefined) { updateFields.push('content = ?'); values.push(content); }
    if (images !== undefined) { updateFields.push('images = ?'); values.push(JSON.stringify(images)); }
    if (tags !== undefined) { updateFields.push('tags = ?'); values.push(JSON.stringify(tags)); }

    if (updateFields.length === 0) return false;

    const [result] = await pool.execute(
      `UPDATE ${TABLE} SET ${updateFields.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    await pool.execute(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  },

  async incrementLikes(id) {
    await pool.execute(`UPDATE ${TABLE} SET like_count = like_count + 1 WHERE id = ?`, [id]);
  },

  async decrementLikes(id) {
    await pool.execute(`UPDATE ${TABLE} SET like_count = GREATEST(0, like_count - 1) WHERE id = ?`, [id]);
  },

  async addLikeRecord(postId, userId) {
    const [result] = await pool.execute(
      `INSERT IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())`,
      [postId, userId]
    );
    return result.affectedRows > 0;
  },

  async removeLikeRecord(postId, userId) {
    await pool.execute(`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`, [postId, userId]);
  },

  async isLiked(postId, userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, userId]
    );
    return rows[0].cnt > 0;
  },

  async getLikeCount(postId) {
    const [rows] = await pool.execute(`SELECT like_count FROM ${TABLE} WHERE id = ?`, [postId]);
    return rows[0]?.like_count || 0;
  },

  async getPostsWithLikeStatus(userId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar, 
              EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as is_liked
       FROM ${TABLE} p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE}`);
    return { items: rows, total: countRows[0].total };
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