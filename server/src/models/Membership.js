const pool = require('../config/database');

const TABLE = 'memberships';

module.exports = {
  TABLE,
  async findByUserId(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, level, start_date, end_date) VALUES (?, ?, ?, ?)`,
      [data.userId, data.level, data.startDate, data.endDate]
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
