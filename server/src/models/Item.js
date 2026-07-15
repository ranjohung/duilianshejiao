const pool = require('../config/database');

const TABLE = 'items';

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
    const [rows] = await pool.execute(
      `SELECT ui.*, i.name, i.description, i.icon FROM user_items ui JOIN ${TABLE} i ON ui.item_id = i.id WHERE ui.user_id = ?`,
      [userId]
    );
    return rows;
  },
};
