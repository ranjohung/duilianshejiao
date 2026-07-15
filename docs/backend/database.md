# 数据库设计

> 来源：PRD v2.0 第20章

## 20.1 ER关系概览

```
users 1──N training_records
users 1──1 growth_profiles
users 1──1 memberships
users 1──N emotion_diaries
users 1──N learning_cards
users 1──N check_ins
users 1──N achievements
users 1──N goodnight_plans
users 1──N scene_unlocks
users 1──N items
users 1──N talents
users 1──N real_challenges
users 1──N friends

coaches 1──N training_records
coaches 1──N social_posts
coaches 1──N goodnight_plans

scenes 1──N training_records
scenes 1──N scene_unlocks
```

## 20.2 核心表结构

### users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 用户ID |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | 手机号(加密存储) |
| nickname | VARCHAR(50) | NOT NULL | 昵称 |
| avatar | VARCHAR(255) | | 头像URL |
| gender | TINYINT | | 性别(0未知/1男/2女) |
| age | INT | | 年龄 |
| member_level | ENUM('experience','free','daily','weekly','monthly','yearly') | DEFAULT 'free' | 会员等级 |
| training_points | INT | DEFAULT 0 | 训练积分 |
| total_training_days | INT | DEFAULT 0 | 累计训练天数 |
| comprehensive_score | DECIMAL(5,2) | DEFAULT 50.00 | 综合能力评分 |
| is_real_name_verified | BOOLEAN | DEFAULT FALSE | 是否完成实名认证 |
| real_name_level | TINYINT | DEFAULT 0 | 实名认证等级(0/1/2) |
| age_group | ENUM('under14','teen','adult') | | 年龄分组 |
| selected_coach_id | BIGINT | FK → coaches.id | 当前选择的教练 |
| weekly_training_count | INT | DEFAULT 0 | 本周已训练次数 |
| weekly_count_reset_at | DATETIME | | 周计数重置时间 |
| daily_training_minutes | INT | DEFAULT 0 | 今日已训练分钟数 |
| daily_minutes_reset_at | DATETIME | | 日计时重置时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### coaches（教练表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 教练ID |
| name | VARCHAR(50) | NOT NULL | 教练名称 |
| avatar | VARCHAR(255) | | 教练头像URL |
| teaching_style | ENUM('encouraging','supportive','challenging','analytical') | NOT NULL | 教学风格 |
| personality_config | JSON | | 性格维度配置 |
| emotion_state | JSON | DEFAULT '{"pleasure":70,"anxiety":30,"fatigue":20}' | 情绪状态 |
| memory_fragments | JSON | | 记忆片段(最多50条) |
| is_preset | BOOLEAN | DEFAULT FALSE | 是否预设教练 |
| creator_id | BIGINT | FK → users.id | 创建者(自定义教练) |
| voice_id | VARCHAR(100) | | TTS音色ID |
| appearance_config | JSON | | 外观配置(发型/服装等) |
| custom_title | VARCHAR(50) | | 用户自定义称呼 |
| system_prompt | TEXT | | 系统提示词(完整人格描述) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**personality_config JSON结构：**

```json
{
  "social_energy": "E",
  "info_processing": "N",
  "decision_making": "F",
  "life_attitude": "P"
}
```

**memory_fragments JSON结构：**

```json
[
  {
    "id": "mem_001",
    "content": "用户喜欢在上午训练",
    "created_at": "2026-07-10T09:00:00Z",
    "source": "training_record_123"
  }
]
```

### scenes（场景表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 场景ID |
| name | VARCHAR(100) | NOT NULL | 场景名称 |
| description | TEXT | | 场景描述 |
| stage | TINYINT | NOT NULL | 所属阶段(1-6) |
| difficulty | TINYINT | NOT NULL | 难度(1-5星) |
| rounds | INT | DEFAULT 5 | 对话轮次 |
| teaching_point | TEXT | | 教学重点 |
| unlock_condition | JSON | | 解锁条件 |
| estimated_duration | INT | | 预估时长(分钟) |
| is_high_challenge | BOOLEAN | DEFAULT FALSE | 是否高难度关卡 |
| bg_image | VARCHAR(255) | | 背景图URL |
| npc_config | JSON | | NPC角色配置 |
| script_config | JSON | | 剧本配置(对话树) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**unlock_condition JSON结构：**

```json
{
  "min_points": 50,
  "required_stage": 1,
  "required_scene_completion": 1
}
```

**npc_config JSON结构：**

```json
{
  "name": "小李",
  "role": "咖啡厅常客",
  "personality": "友善但话不多",
  "opening_line": "你好，这个位置有人吗？"
}
```

### training_records（训练记录表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 记录ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| scene_id | BIGINT | FK → scenes.id, NOT NULL | 场景ID |
| coach_id | BIGINT | FK → coaches.id, NOT NULL | 教练ID |
| score | INT | | 总分(0-100) |
| star_rating | TINYINT | | 星级(1-3) |
| quality_marks | JSON | | 各维度评分 |
| emotion_diary | TEXT | | 情绪日记内容 |
| evaluation_report | JSON | | 评估报告 |
| dialogue_history | JSON | | 对话历史记录 |
| items_used | JSON | | 使用的道具 |
| time_travel_used | INT | DEFAULT 0 | 使用穿梭券次数 |
| started_at | DATETIME | NOT NULL | 开始时间 |
| ended_at | DATETIME | | 结束时间 |

**quality_marks JSON结构：**

```json
{
  "communication": 75,
  "expression": 68,
  "empathy": 80,
  "emotion_control": 60,
  "adaptability": 70
}
```

**evaluation_report JSON结构：**

```json
{
  "summary": "你在本次训练中表现不错...",
  "strengths": ["能用具体例子支撑观点", "语气保持平和"],
  "improvements": ["回答前可以多停顿思考", "尝试使用NVC表达需求"],
  "coach_comment": "进步很大！下次试试更直接地表达自己。——沈清欢"
}
```

### growth_profiles（成长档案表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 档案ID |
| user_id | BIGINT | FK → users.id, UNIQUE, NOT NULL | 用户ID |
| communication_score | DECIMAL(5,2) | DEFAULT 50.00 | 沟通力 |
| expression_score | DECIMAL(5,2) | DEFAULT 50.00 | 表达力 |
| empathy_score | DECIMAL(5,2) | DEFAULT 50.00 | 共情力 |
| emotion_control_score | DECIMAL(5,2) | DEFAULT 50.00 | 情绪控制 |
| adaptability_score | DECIMAL(5,2) | DEFAULT 50.00 | 应变力 |
| comprehensive_score | DECIMAL(5,2) | DEFAULT 50.00 | 综合评分 |
| score_history | JSON | | 历史变化记录(最近52周) |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### memberships（会员表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 会员ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| level | ENUM('experience','free','daily','weekly','monthly','yearly') | NOT NULL | 会员等级 |
| expire_at | DATETIME | | 过期时间 |
| remaining_daily_uses | INT | | 当日剩余训练次数 |
| auto_renew | BOOLEAN | DEFAULT FALSE | 是否自动续费 |
| payment_order_id | VARCHAR(100) | | 支付订单号 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### emotion_diaries（情绪日记表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 日记ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| training_record_id | BIGINT | FK → training_records.id | 关联训练记录 |
| emotion_type | ENUM('happy','calm','nervous','anxious','sad','angry') | NOT NULL | 情绪类型 |
| intensity | TINYINT | | 情绪强度(1-10) |
| content | TEXT | | 日记内容 |
| is_auto_generated | BOOLEAN | DEFAULT TRUE | 是否自动生成 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### learning_cards（学习卡片表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 卡片ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| training_record_id | BIGINT | FK → training_records.id, NOT NULL | 关联训练记录 |
| title | VARCHAR(200) | NOT NULL | 卡片标题 |
| content | TEXT | | 卡片内容 |
| key_point | TEXT | | 关键知识点 |
| user_performance | TEXT | | 用户表现 |
| improvement_suggestion | TEXT | | 改进建议 |
| is_collected | BOOLEAN | DEFAULT FALSE | 是否收藏 |
| share_count | INT | DEFAULT 0 | 分享次数 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### check_ins（签到表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 签到ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| check_in_date | DATE | NOT NULL | 签到日期 |
| consecutive_days | INT | DEFAULT 1 | 连续天数 |
| reward_type | ENUM('points','time_travel','hint_card','shield','double_card') | | 奖励类型 |
| points_earned | INT | | 获得积分 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**UNIQUE约束：** (user_id, check_in_date) — 每用户每天只能签到一次

### achievements（成就表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 成就ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| type | VARCHAR(50) | NOT NULL | 成就类型 |
| title | VARCHAR(100) | NOT NULL | 成就标题 |
| description | TEXT | | 成就描述 |
| unlocked_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 解锁时间 |

**UNIQUE约束：** (user_id, type) — 每用户每种成就只能获得一次

### goodnight_plans（晚安计划表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 计划ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| coach_id | BIGINT | FK → coaches.id, NOT NULL | 教练ID |
| scheduled_time | TIME | DEFAULT '21:30' | 计划时间 |
| content | TEXT | | 计划内容 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| last_triggered_at | DATETIME | | 上次触发时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### scene_unlocks（场景解锁表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 解锁ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| scene_id | BIGINT | FK → scenes.id, NOT NULL | 场景ID |
| unlocked_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 解锁时间 |

**UNIQUE约束：** (user_id, scene_id)

### items（道具表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 道具ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| item_type | ENUM('time_travel','hint_card','emotion_shield','double_points') | NOT NULL | 道具类型 |
| quantity | INT | DEFAULT 0 | 数量 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**UNIQUE约束：** (user_id, item_type)

### social_posts（朋友圈动态表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 动态ID |
| coach_id | BIGINT | FK → coaches.id, NOT NULL | 教练ID |
| content | TEXT | NOT NULL | 动态内容 |
| post_type | ENUM('life_share','mood','training_encourage') | NOT NULL | 动态类型 |
| image_url | VARCHAR(255) | | 配图URL |
| comments | JSON | | 评论列表 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**comments JSON结构：**

```json
[
  {
    "user_id": 123,
    "content": "好可爱！",
    "coach_reply": "谢谢～你也加油哦！",
    "created_at": "2026-07-10T10:30:00Z"
  }
]
```

### friends（好友表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 关系ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| friend_id | BIGINT | FK → users.id, NOT NULL | 好友ID |
| invite_code | VARCHAR(20) | | 邀请码 |
| status | ENUM('pending','accepted','blocked') | DEFAULT 'pending' | 关系状态 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**UNIQUE约束：** (user_id, friend_id)

### talents（才艺表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 才艺ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| talent_type | ENUM('speech','writing','negotiation','humor','empathy') | NOT NULL | 才艺类型 |
| level | INT | DEFAULT 1 | 等级(1-6) |
| experience | INT | DEFAULT 0 | 经验值 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**UNIQUE约束：** (user_id, talent_type)

### real_challenges（真实挑战表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 挑战ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| title | VARCHAR(200) | NOT NULL | 挑战标题 |
| description | TEXT | | 挑战描述 |
| evidence_url | VARCHAR(255) | | 凭证URL(图片/文字) |
| status | ENUM('pending','approved','rejected') | DEFAULT 'pending' | 审核状态 |
| points_earned | INT | DEFAULT 0 | 获得积分 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
