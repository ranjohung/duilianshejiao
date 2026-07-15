const pool = require('../config/database');

const TABLE = 'talents';

module.exports = {
  TABLE,
  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE}`);
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
  },
  async findByUserId(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows;
  },
};
