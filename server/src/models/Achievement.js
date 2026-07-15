const pool = require('../config/database');

const TABLE = 'achievements';

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
};
