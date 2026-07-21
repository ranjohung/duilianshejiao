const express = require('express');
const router = express.Router();
const { run, query, get } = require('../utils/sqlite');
const path = require('path');
const fs = require('fs');

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password TEXT,
    nickname TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    gender TEXT DEFAULT 'other',
    age INTEGER,
    real_name TEXT,
    id_card TEXT,
    is_real_name_verified INTEGER DEFAULT 0,
    member_level TEXT DEFAULT 'free',
    experience_used INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    training_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    student_level TEXT DEFAULT 'bronze',
    weekly_trainings_used INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    has_double_points INTEGER DEFAULT 0,
    has_shield INTEGER DEFAULT 0,
    invite_code TEXT,
    invited_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_users_member_level ON users(member_level)`,
  `CREATE INDEX IF NOT EXISTS idx_users_student_level ON users(student_level)`,
  `CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code)`,
  `CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by)`,
  `CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    personality TEXT,
    specialty TEXT,
    system_prompt TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS scenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT DEFAULT 'easy',
    coach_id INTEGER,
    system_prompt TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id)
  )`,
  `CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coach_id INTEGER,
    scene_id INTEGER,
    messages TEXT,
    score INTEGER,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_training_records_user_id ON training_records(user_id)`,
  `CREATE TABLE IF NOT EXISTS growth_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    social_confidence INTEGER DEFAULT 50,
    expression_ability INTEGER DEFAULT 50,
    emotional_intelligence INTEGER DEFAULT 50,
    empathy_score INTEGER DEFAULT 50,
    total_training_time INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS emotion_diaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    emotion TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_emotion_diaries_user_id ON emotion_diaries(user_id)`,
  `CREATE TABLE IF NOT EXISTS learning_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_learning_cards_user_id ON learning_cards(user_id)`,
  `CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    check_date TEXT NOT NULL,
    streak_days INTEGER DEFAULT 1,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, check_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id)`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    condition_type TEXT,
    condition_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS goodnight_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    bed_time TEXT,
    wake_time TEXT,
    routine_steps TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    price_coins INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_type)
  )`,
  `CREATE TABLE IF NOT EXISTS user_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id)`,
  `CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    tags TEXT,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id)`,
  `CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS talents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_talents_user_id ON talents(user_id)`,
  `CREATE TABLE IF NOT EXISTS real_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT DEFAULT 'easy',
    target_count INTEGER DEFAULT 1,
    reward_points INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES real_challenges(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id)`,
  `CREATE TABLE IF NOT EXISTS invite_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id INTEGER NOT NULL,
    invitee_id INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_item_type TEXT,
    reward_item_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_invite_rewards_inviter_id ON invite_rewards(inviter_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invite_rewards_invitee_id ON invite_rewards(invitee_id)`,
  `CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_item_type TEXT,
    reward_item_quantity INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    milestone_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, milestone_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS coach_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coach_id INTEGER NOT NULL,
    favorability INTEGER DEFAULT 0,
    last_contact_time TIMESTAMP,
    contact_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coach_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_coach_preferences_coach_id ON coach_preferences(coach_id)`,
  `CREATE TABLE IF NOT EXISTS gift_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coach_id INTEGER NOT NULL,
    gift_type TEXT NOT NULL,
    gift_amount INTEGER DEFAULT 1,
    favorability_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gift_records_user_id ON gift_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gift_records_coach_id ON gift_records(coach_id)`,
  `CREATE TABLE IF NOT EXISTS notification_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_read INTEGER DEFAULT 0,
    is_pushed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notification_records_user_id ON notification_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_records_is_read ON notification_records(is_read)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_records_type ON notification_records(notification_type)`,
  `CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'mobile',
    last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticket_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ticket_type)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_tickets_user_id ON user_tickets(user_id)`
];

router.post('/init-db', async (req, res) => {
  try {
    for (const sql of SQL_STATEMENTS) {
      await run(sql);
    }

    const itemRows = await get('SELECT COUNT(*) as cnt FROM items');
    if (!itemRows || itemRows.cnt === 0) {
      await run(`
        INSERT INTO items (name, item_type, description, icon, category, price_coins) VALUES
        ('时空穿梭券', 'time_shuttle', '重新选择对话分支，回到上一个决策点', '🕐', 'utility', 50),
        ('提示卡', 'hint_card', '获取教练对当前场景的额外提示', '💡', 'utility', 30),
        ('护盾', 'shield', '保护一次训练评分不受扣分影响', '🛡️', 'protection', 40),
        ('双倍积分卡', 'double_points', '下次训练获得双倍积分', '✨', 'boost', 60)
      `);
    }

    const milestoneRows = await get('SELECT COUNT(*) as cnt FROM milestones');
    if (!milestoneRows || milestoneRows.cnt === 0) {
      await run(`
        INSERT INTO milestones (name, description, icon, category, condition_type, condition_value, reward_points, reward_item_type, reward_item_quantity, sort_order) VALUES
        ('初出茅庐', '完成第一次训练', '🌱', 'training', 'total_sessions', 1, 10, NULL, 0, 1),
        ('勤学苦练', '累计完成5次训练', '📚', 'training', 'total_sessions', 5, 30, 'hint_card', 1, 2),
        ('小有所成', '累计完成20次训练', '🎯', 'training', 'total_sessions', 20, 80, 'time_shuttle', 1, 3),
        ('社交新手', '社交自信度达到60', '🤝', 'dimension', 'social_confidence', 60, 20, NULL, 0, 4),
        ('表达达人', '表达能力达到60', '🎤', 'dimension', 'expression_ability', 60, 20, NULL, 0, 5),
        ('情商高手', '情绪智力达到60', '🧠', 'dimension', 'emotional_intelligence', 60, 20, NULL, 0, 6),
        ('共情之星', '共情能力达到60', '❤️', 'dimension', 'empathy_score', 60, 20, NULL, 0, 7),
        ('青铜之路', '总积分达到100', '🥉', 'points', 'total_points', 100, 15, NULL, 0, 8),
        ('白银之辉', '总积分达到300', '🥈', 'points', 'total_points', 300, 30, 'shield', 1, 9),
        ('黄金之光', '总积分达到600', '🥇', 'points', 'total_points', 600, 60, 'double_points', 1, 10),
        ('连续签到3天', '连续签到3天', '🔥', 'checkin', 'streak_days', 3, 10, 'time_shuttle', 1, 11),
        ('连续签到7天', '连续签到7天', '🌟', 'checkin', 'streak_days', 7, 30, 'double_points', 1, 12)
      `);
    }

    res.json({ message: '数据库初始化成功' });
  } catch (error) {
    res.status(500).json({ message: '数据库初始化失败', error: error.message });
  }
});

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/coaches', require('./coach.routes'));
router.use('/scenes', require('./scene.routes'));
router.use('/training', require('./training.routes'));
router.use('/growth', require('./growth.routes'));
router.use('/check-in', require('./checkin.routes'));
router.use('/goodnight', require('./goodnight.routes'));
router.use('/social', require('./social.routes'));
router.use('/items', require('./item.routes'));
router.use('/membership', require('./membership.routes'));
router.use('/talents', require('./talent.routes'));
router.use('/real-challenges', require('./challenge.routes'));
router.use('/llm', require('./llm.routes'));

module.exports = router;
