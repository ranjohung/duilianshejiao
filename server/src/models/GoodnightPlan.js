const pool = require('../config/database');

const TABLE = 'goodnight_plans';

module.exports = {
  TABLE,
  async findByUserId(userId) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return rows[0] || null;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, bed_time, wake_time, routine_steps) VALUES (?, ?, ?, ?)`,
      [data.userId, data.bedTime, data.wakeTime, JSON.stringify(data.routineSteps || [])]
    );
    return result.insertId;
  },
  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
    values.push(id);
    await pool.execute(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  },
};
