const pool = require('../config/database');

const TABLE = 'real_challenges';

module.exports = {
  TABLE,
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
};
