const pool = require('../config/database');

const TABLE = 'emotion_diaries';

module.exports = {
  TABLE,
  async findByUserId(userId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    return rows;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, emotion, content, tags) VALUES (?, ?, ?, ?)`,
      [data.userId, data.emotion, data.content, JSON.stringify(data.tags || [])]
    );
    return result.insertId;
  },
};
