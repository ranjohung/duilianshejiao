const pool = require('../config/database');

const TABLE = 'talents';

// 才艺类型定义
const TALENT_TYPES = [
  { key: 'speech', label: '演讲', icon: 'mic' },
  { key: 'writing', label: '写作', icon: 'edit' },
  { key: 'negotiation', label: '谈判', icon: 'handshake' },
  { key: 'humor', label: '幽默', icon: 'smile' },
  { key: 'empathy', label: '共情', icon: 'heart' },
];

// 才艺等级定义
const TALENT_LEVELS = [
  { name: '新手', minExp: 0 },
  { name: '入门', minExp: 100 },
  { name: '熟练', minExp: 300 },
  { name: '精通', minExp: 600 },
];

function getTalentLevel(exp) {
  let level = TALENT_LEVELS[0];
  for (const l of TALENT_LEVELS) {
    if (exp >= l.minExp) level = l;
  }
  return level;
}

module.exports = {
  TABLE,
  TALENT_TYPES,
  TALENT_LEVELS,

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

  async findByUserAndType(userId, talentType) {
    const [rows] = await pool.execute(
      `SELECT * FROM ${TABLE} WHERE user_id = ? AND talent_type = ?`,
      [userId, talentType]
    );
    return rows[0] || null;
  },

  // 增加才艺经验值
  async addExperience(userId, talentType, exp) {
    const existing = await this.findByUserAndType(userId, talentType);
    if (existing) {
      await pool.execute(
        'UPDATE talents SET experience = experience + ?, updated_at = NOW() WHERE id = ?',
        [exp, existing.id]
      );
      return { ...existing, experience: existing.experience + exp };
    } else {
      const [result] = await pool.execute(
        'INSERT INTO talents (user_id, talent_type, experience, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userId, talentType, exp]
      );
      return { id: result.insertId, user_id: userId, talent_type: talentType, experience: exp };
    }
  },

  // 获取用户才艺列表（含等级信息）
  async getTalentListWithLevels(userId) {
    const rows = await this.findByUserId(userId);
    const expMap = {};
    for (const row of rows) {
      expMap[row.talent_type] = row.experience;
    }
    return TALENT_TYPES.map(t => {
      const exp = expMap[t.key] || 0;
      const level = getTalentLevel(exp);
      const nextLevel = TALENT_LEVELS.find(l => l.minExp > exp);
      return {
        ...t,
        experience: exp,
        level: level.name,
        nextLevelExp: nextLevel ? nextLevel.minExp : null,
        progress: nextLevel ? (exp - level.minExp) / (nextLevel.minExp - level.minExp) : 1,
      };
    });
  },

  getTalentLevel,
};
