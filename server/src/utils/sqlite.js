const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'duilian_data.json');

let data = {
  users: {},
  items: [],
  milestones: [],
  checkIns: {},
  growthProfiles: {},
  smsCodes: {}
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, { encoding: 'utf8' });
      const loaded = JSON.parse(content);
      data = { ...data, ...loaded };
    }
  } catch (e) {
    console.error('Failed to load data file:', e.message);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), { encoding: 'utf8' });
  } catch (e) {
    console.error('Failed to save data file:', e.message);
  }
}

loadData();
setInterval(saveData, 5000);

function setSmsCode(phone, code) {
  data.smsCodes[phone] = code;
  saveData();
  setTimeout(() => {
    delete data.smsCodes[phone];
    saveData();
  }, 60000 * 5);
}

function getSmsCode(phone) {
  return data.smsCodes[phone];
}

async function initDemoData() {
  if (!data.users['13800138000']) {
    data.users['13800138000'] = {
      id: 1,
      phone: '13800138000',
      nickname: '演示用户',
      password: null,
      coins: 650,
      total_points: 650,
      student_level: '钻石学员',
      member_level: 'free',
      is_real_name_verified: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.growthProfiles[1] = {
      id: 1,
      user_id: 1,
      social_confidence: 50,
      expression_ability: 50,
      emotional_intelligence: 50,
      empathy_score: 50,
      total_training_time: 0,
      total_sessions: 0,
      updated_at: new Date().toISOString()
    };
    saveData();
  }
  
  if (data.items.length === 0) {
    data.items = [
      { id: 1, name: '时空穿梭券', item_type: 'time_shuttle', description: '重新选择对话分支', icon: '🕐', category: 'utility', price_coins: 50 },
      { id: 2, name: '提示卡', item_type: 'hint_card', description: '获取教练提示', icon: '💡', category: 'utility', price_coins: 30 },
      { id: 3, name: '护盾', item_type: 'shield', description: '保护评分', icon: '🛡️', category: 'protection', price_coins: 40 },
      { id: 4, name: '双倍积分卡', item_type: 'double_points', description: '双倍积分', icon: '✨', category: 'boost', price_coins: 60 }
    ];
    saveData();
  }
  
  if (data.milestones.length === 0) {
    data.milestones = [
      { id: 1, name: '初出茅庐', description: '完成第一次训练', icon: '🌱', category: 'training', condition_type: 'total_sessions', condition_value: 1, reward_points: 10 },
      { id: 2, name: '勤学苦练', description: '累计完成5次训练', icon: '📚', category: 'training', condition_type: 'total_sessions', condition_value: 5, reward_points: 30 },
      { id: 3, name: '小有所成', description: '累计完成20次训练', icon: '🎯', category: 'training', condition_type: 'total_sessions', condition_value: 20, reward_points: 80 },
      { id: 4, name: '社交新手', description: '社交自信度达到60', icon: '🤝', category: 'dimension', condition_type: 'social_confidence', condition_value: 60, reward_points: 20 },
      { id: 5, name: '青铜之路', description: '总积分达到100', icon: '🥉', category: 'points', condition_type: 'total_points', condition_value: 100, reward_points: 15 },
      { id: 6, name: '连续签到3天', description: '连续签到3天', icon: '🔥', category: 'checkin', condition_type: 'streak_days', condition_value: 3, reward_points: 10 }
    ];
    saveData();
  }
}

const query = async (sql, params = []) => {
  await initDemoData();
  
  if (sql.includes('COUNT(*)')) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];
    
    const table = tableMatch[1].toLowerCase();
    let count = 0;
    
    if (table === 'users') count = Object.keys(data.users).length;
    else if (table === 'items') count = data.items.length;
    else if (table === 'milestones') count = data.milestones.length;
    else if (table === 'growth_profiles') count = Object.keys(data.growthProfiles).length;
    
    return [{ cnt: count }];
  }
  
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (!tableMatch) return [];
  
  const table = tableMatch[1].toLowerCase();
  
  if (table === 'users') {
    const whereMatch = sql.match(/WHERE\s+phone\s*=\s*['"]([^'"]+)['"]/i);
    if (whereMatch) {
      const phone = whereMatch[1];
      if (data.users[phone]) {
        return [data.users[phone]];
      }
      return [];
    }
    return Object.values(data.users);
  }
  
  if (table === 'items') {
    return data.items;
  }
  
  if (table === 'milestones') {
    return data.milestones;
  }
  
  if (table === 'growth_profiles') {
    const whereMatch = sql.match(/WHERE\s+user_id\s*=\s*(\d+)/i);
    if (whereMatch) {
      const userId = parseInt(whereMatch[1]);
      const profile = data.growthProfiles[userId];
      return profile ? [profile] : [];
    }
    return Object.values(data.growthProfiles);
  }
  
  return [];
};

const run = async (sql, params = []) => {
  await initDemoData();
  
  if (sql.startsWith('CREATE TABLE') || sql.startsWith('CREATE INDEX')) {
    return { lastID: 0, changes: 0 };
  }
  
  if (sql.startsWith('INSERT INTO users')) {
    const phone = params[0];
    const nickname = params[1];
    const password = params[2];
    
    let nextId = Object.keys(data.users).length + 1;
    Object.values(data.users).forEach(u => {
      if (u.id >= nextId) nextId = u.id + 1;
    });
    
    data.users[phone] = {
      id: nextId,
      phone,
      nickname,
      password,
      coins: params[3] || 0,
      total_points: params[4] || 0,
      student_level: params[5] || 'bronze',
      member_level: 'free',
      is_real_name_verified: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    saveData();
    return { lastID: nextId, changes: 1 };
  }
  
  if (sql.startsWith('INSERT INTO growth_profiles')) {
    const userId = params[0];
    data.growthProfiles[userId] = {
      id: userId,
      user_id: userId,
      social_confidence: 50,
      expression_ability: 50,
      emotional_intelligence: 50,
      empathy_score: 50,
      total_training_time: 0,
      total_sessions: 0,
      updated_at: new Date().toISOString()
    };
    saveData();
    return { lastID: userId, changes: 1 };
  }
  
  if (sql.startsWith('INSERT INTO items')) {
    data.items = [
      { id: 1, name: '时空穿梭券', item_type: 'time_shuttle', description: '重新选择对话分支', icon: '🕐', category: 'utility', price_coins: 50 },
      { id: 2, name: '提示卡', item_type: 'hint_card', description: '获取教练提示', icon: '💡', category: 'utility', price_coins: 30 },
      { id: 3, name: '护盾', item_type: 'shield', description: '保护评分', icon: '🛡️', category: 'protection', price_coins: 40 },
      { id: 4, name: '双倍积分卡', item_type: 'double_points', description: '双倍积分', icon: '✨', category: 'boost', price_coins: 60 }
    ];
    saveData();
    return { lastID: 4, changes: 4 };
  }
  
  if (sql.startsWith('INSERT INTO milestones')) {
    data.milestones = [
      { id: 1, name: '初出茅庐', description: '完成第一次训练', icon: '🌱', category: 'training', condition_type: 'total_sessions', condition_value: 1, reward_points: 10 },
      { id: 2, name: '勤学苦练', description: '累计完成5次训练', icon: '📚', category: 'training', condition_type: 'total_sessions', condition_value: 5, reward_points: 30 },
      { id: 3, name: '小有所成', description: '累计完成20次训练', icon: '🎯', category: 'training', condition_type: 'total_sessions', condition_value: 20, reward_points: 80 },
      { id: 4, name: '社交新手', description: '社交自信度达到60', icon: '🤝', category: 'dimension', condition_type: 'social_confidence', condition_value: 60, reward_points: 20 },
      { id: 5, name: '青铜之路', description: '总积分达到100', icon: '🥉', category: 'points', condition_type: 'total_points', condition_value: 100, reward_points: 15 },
      { id: 6, name: '连续签到3天', description: '连续签到3天', icon: '🔥', category: 'checkin', condition_type: 'streak_days', condition_value: 3, reward_points: 10 }
    ];
    saveData();
    return { lastID: 6, changes: 6 };
  }
  
  return { lastID: 0, changes: 0 };
};

const get = async (sql, params = []) => {
  const results = await query(sql, params);
  return results[0] || null;
};

module.exports = {
  query,
  run,
  get,
  setSmsCode,
  getSmsCode
};