const pool = require('../config/database');

const TABLE = 'talents';

const PRESET_TALENTS = [
  { name: '天生健谈', description: '社交自信度加成10%', base_effect: { social_confidence: 1.1 } },
  { name: '逻辑清晰', description: '表达能力加成10%', base_effect: { expression_ability: 1.1 } },
  { name: '敏锐感知', description: '情绪智力加成10%', base_effect: { emotional_intelligence: 1.1 } },
  { name: '温暖共情', description: '共情能力加成10%', base_effect: { empathy_score: 1.1 } },
  { name: '随机应变', description: '应变能力加成10%', base_effect: { adaptability: 1.1 } },
];

module.exports = {
  TABLE,

  async findByUserId(userId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${TABLE} WHERE user_id = ?`, [userId]);
    return { items: rows, total: countRows[0].total };
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return rows[0];
  },

  async create({ userId, name, description, level = 1 }) {
    const [result] = await pool.execute(
      `INSERT INTO ${TABLE} (user_id, name, description, level, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [userId, name, description, level]
    );
    return result.insertId;
  },

  async upgrade(id) {
    const [result] = await pool.execute(
      `UPDATE ${TABLE} SET level = level + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    await pool.execute(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  },

  async getPresetTalents() {
    return PRESET_TALENTS;
  },

  async unlockRandomTalent(userId) {
    const [existing] = await pool.execute(`SELECT COUNT(*) as cnt FROM ${TABLE} WHERE user_id = ?`, [userId]);
    const existingCount = existing[0].cnt;

    if (existingCount >= PRESET_TALENTS.length) {
      return null;
    }

    const existingNames = await pool.execute(
      `SELECT name FROM ${TABLE} WHERE user_id = ?`,
      [userId]
    );
    const existingNamesList = existingNames[0].map(t => t.name);

    const available = PRESET_TALENTS.filter(t => !existingNamesList.includes(t.name));
    if (available.length === 0) return null;

    const selected = available[Math.floor(Math.random() * available.length)];
    const talentId = await this.create({ userId, name: selected.name, description: selected.description });

    return { id: talentId, ...selected, level: 1 };
  },

  async getTalentEffects(userId) {
    const [rows] = await pool.execute(`SELECT name, level FROM ${TABLE} WHERE user_id = ?`, [userId]);

    const effects = {};
    for (const talent of rows) {
      const preset = PRESET_TALENTS.find(t => t.name === talent.name);
      if (preset && preset.base_effect) {
        for (const [key, value] of Object.entries(preset.base_effect)) {
          effects[key] = (effects[key] || 1) * Math.pow(value, talent.level);
        }
      }
    }

    return effects;
  },
};
