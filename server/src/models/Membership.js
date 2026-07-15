const pool = require('../config/database');

const TABLE = 'memberships';

module.exports = {
  TABLE,

  async findActiveByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, level, price, start_date, expires_at, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [data.userId, data.level, data.price, data.startDate, data.expiresAt, data.paymentMethod || 'wechat']
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  },
};
