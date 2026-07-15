const pool = require('../config/database');

const TABLE = 'learning_cards';

module.exports = {
  TABLE,
  async findByUserId(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, title, content, category) VALUES (?, ?, ?, ?)`,
      [data.userId, data.title, data.content, data.category]
    );
    return result.insertId;
  },
};
