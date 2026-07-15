const pool = require('../config/database');

const TABLE = 'scenes';

module.exports = {
  TABLE,
  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
  },
  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE}`);
    return rows;
  },
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (name, description, category, difficulty, coach_id, system_prompt) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.description, data.category, data.difficulty, data.coachId, data.systemPrompt]
    );
    return result.insertId;
  },
};
