require('dotenv').config();
const mysql = require('mysql2/promise');

const SQL_STATEMENTS = [
  // 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(500),
    bio VARCHAR(200),
    real_name VARCHAR(50),
    id_card VARCHAR(18),
    is_real_verified TINYINT(1) DEFAULT 0,
    member_level ENUM('experience','free','daily','weekly','monthly','yearly') DEFAULT 'free',
    experience_used TINYINT(1) DEFAULT 0,
    coins INT UNSIGNED DEFAULT 0,
    streak_days INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_member_level (member_level)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 教练表
  `CREATE TABLE IF NOT EXISTS coaches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(500),
    personality VARCHAR(100),
    specialty VARCHAR(100),
    system_prompt TEXT,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 场景表
  `CREATE TABLE IF NOT EXISTS scenes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
    coach_id BIGINT UNSIGNED,
    system_prompt TEXT,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 训练记录表
  `CREATE TABLE IF NOT EXISTS training_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    coach_id BIGINT UNSIGNED,
    scene_id BIGINT UNSIGNED,
    messages JSON,
    score INT,
    duration INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 成长档案表
  `CREATE TABLE IF NOT EXISTS growth_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    social_confidence INT UNSIGNED DEFAULT 50,
    expression_ability INT UNSIGNED DEFAULT 50,
    emotional_intelligence INT UNSIGNED DEFAULT 50,
    empathy_score INT UNSIGNED DEFAULT 50,
    total_training_time INT UNSIGNED DEFAULT 0,
    total_sessions INT UNSIGNED DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 情绪日记表
  `CREATE TABLE IF NOT EXISTS emotion_diaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    content TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 学习卡片表
  `CREATE TABLE IF NOT EXISTS learning_cards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 签到表
  `CREATE TABLE IF NOT EXISTS check_ins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    check_date DATE NOT NULL,
    streak_days INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, check_date),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 成就表
  `CREATE TABLE IF NOT EXISTS achievements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(500),
    condition_type VARCHAR(50),
    condition_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 用户成就关联表
  `CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    achievement_id BIGINT UNSIGNED NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 晚安计划表
  `CREATE TABLE IF NOT EXISTS goodnight_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    bed_time TIME,
    wake_time TIME,
    routine_steps JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 道具表
  `CREATE TABLE IF NOT EXISTS items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(500),
    category VARCHAR(50),
    price_coins INT UNSIGNED DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 用户道具关联表
  `CREATE TABLE IF NOT EXISTS user_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_item (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 会员订阅表
  `CREATE TABLE IF NOT EXISTS memberships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    level ENUM('daily','weekly','monthly','yearly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 社交动态表
  `CREATE TABLE IF NOT EXISTS social_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    images JSON,
    tags JSON,
    like_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 动态点赞表
  `CREATE TABLE IF NOT EXISTS post_likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 天赋表
  `CREATE TABLE IF NOT EXISTS talents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    level INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 真实挑战表
  `CREATE TABLE IF NOT EXISTS real_challenges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
];

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
  });

  const dbName = process.env.DB_NAME || 'duilian_social';

  console.log(`创建数据库 ${dbName}...`);
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.execute(`USE \`${dbName}\``);

  console.log('创建数据表...');
  for (const sql of SQL_STATEMENTS) {
    await connection.execute(sql);
  }

  console.log('数据库初始化完成！');
  await connection.end();
}

initDatabase().catch((err) => {
  console.error('数据库初始化失败:', err.message);
  process.exit(1);
});
