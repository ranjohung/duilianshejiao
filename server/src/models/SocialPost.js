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
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, content, images, tags) VALUES (?, ?, ?, ?)`,
      [data.userId, data.content, JSON.stringify(data.images || []), JSON.stringify(data.tags || [])]
    );
    return result.insertId;
  },
  async like(postId, userId) {
    await pool.execute(
      `INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId]
    );
  },
};
