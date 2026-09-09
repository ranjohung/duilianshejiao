# 数据库设计

> 来源：PRD v2.0 第20章

> **v2.4.2 状态校准：** 本文为目标生产表设计。当前初始化脚本已覆盖用户、会员、道具、签到和训练记录等基础表；`scene_unlocks`、好感度事件及积分/道具不可变流水仍需完成迁移并在生产事务中启用，不能把浏览器 localStorage 作为权益账本。

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
| member_level | ENUM('free','daily','weekly','monthly','yearly') | DEFAULT 'free' | 会员等级；历史 `experience` 账号迁移为 `free`，体验日卡使用 `daily` |
| training_points | INT | DEFAULT 0 | 可消费积分余额；解锁/兑换时扣减 |
| total_points | INT | DEFAULT 0 | 等级进度累计积分；奖励增加，消费不减少 |
| student_level | VARCHAR(20) | DEFAULT 'bronze' | 按 `total_points` 计算的学员等级 |
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
| scene_id | BIGINT | FK → scenes.id | 场景ID |
| coach_id | BIGINT | FK → coaches.id | 教练ID |
| messages | JSON | | 训练对话消息；服务端结算后写入 |
| score | INT | DEFAULT 0 | 本次训练总分 |
| duration | INT UNSIGNED | DEFAULT 0 | 训练时长（秒） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 结算记录创建时间 |

> 当前 Node/Express 初始化脚本以本表为准；星级、质量维度、报告和道具使用明细暂由 `messages` 或后续独立表扩展，不能在 API 中宣称已经持久化。下方 `quality_marks`/`evaluation_report` 仅是目标结构示例。

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
| level | ENUM('daily','weekly','monthly','yearly') | NOT NULL | 已支付会员方案；免费版不写会员记录，体验权益属于引导状态 |
| expire_at | DATETIME | | 过期时间 |
| remaining_daily_uses | INT | | 当日剩余训练次数快照，真实额度以权益配置和用量账本为准 |
| auto_renew | BOOLEAN | DEFAULT FALSE | 是否自动续费（需用户明确授权） |
| payment_order_id | VARCHAR(100) | UNIQUE | 已支付订单号 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### membership_orders（会员支付订单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 内部订单ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| order_no | VARCHAR(64) | UNIQUE, NOT NULL | 服务端幂等订单号 |
| plan_level | ENUM('daily','weekly','monthly','yearly') | NOT NULL | 方案快照 |
| amount_fen | INT UNSIGNED | NOT NULL | 服务端计算的金额（分） |
| payment_method | VARCHAR(20) | NOT NULL | wechat 等 |
| provider_transaction_id | VARCHAR(100) | UNIQUE | 支付平台流水号 |
| status | ENUM('pending','paid','entitled','failed','refunded','disputed') | NOT NULL | 订单状态 |
| idempotency_key | VARCHAR(100) | UNIQUE, NOT NULL | 防重复创建 |
| paid_at | DATETIME | | 验签成功时间 |
| refunded_at | DATETIME | | 退款时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### entitlement_ledger（权益账本）

会员、积分、券和道具发放/扣减必须写入不可变流水；余额由服务端事务汇总，禁止客户端直接修改。流水至少包含 `user_id`、`source_type`、`source_id`、`delta`、`balance_after`、`idempotency_key`、`created_at`，并对 `source_type + source_id` 建唯一约束，支持支付回调、退款和重复请求安全重放。

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
| reward_type | ENUM('points','time_shuttle','hint_card','emotion_shield','double_points') | | 奖励类型 |
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

> 目标表，当前 Node 原型尚未完成永久解锁写入；上线前须与积分、券扣减、好感度快照、折扣成本和幂等键放在同一事务中，并增加来源和审计流水。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 解锁ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| scene_id | BIGINT | FK → scenes.id, NOT NULL | 场景ID |
| base_points | INT | NOT NULL | 解锁原价（配置快照） |
| discount_rate | DECIMAL(4,3) | DEFAULT 0 | 解锁时好感度折扣快照 |
| points_consumed | INT | NOT NULL | 实际扣除的可用积分 |
| tickets_consumed | INT | DEFAULT 0 | 实际扣除的穿梭券 |
| idempotency_key | VARCHAR(100) | UNIQUE, NOT NULL | 防重复解锁 |
| unlocked_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 解锁时间 |

**UNIQUE约束：** (user_id, scene_id)

### favorability_ledger（好感度事件流水）

> 目标表，当前 Web 仅在本地保存最近30条原因日志；生产必须由服务端审核/规则引擎写入不可变事件，支持申诉、审计和幂等重放。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 事件ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| coach_id | BIGINT | FK → coaches.id | 当前教练 |
| event_type | VARCHAR(40) | NOT NULL | `training_dismissive`/`moderation_violation`/`inactivity_decay`/`training_reward` 等 |
| delta | INT | NOT NULL | 好感度变化，负数为扣减 |
| before_value | INT | NOT NULL | 事件前值 |
| after_value | INT | NOT NULL | 事件后值，限制0–200 |
| reason | VARCHAR(255) | NOT NULL | 面向用户的原因 |
| source_id | VARCHAR(100) | | 训练/登录事件 ID |
| idempotency_key | VARCHAR(100) | UNIQUE, NOT NULL | 防重复扣减/发放 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 事件时间 |

### items（道具表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 道具ID |
| name | VARCHAR(100) | NOT NULL | 道具名称 |
| item_type | VARCHAR(50) | UNIQUE, NOT NULL | 稳定业务类型：`time_shuttle`/`hint_card`/`emotion_shield`/`double_points` |
| description | VARCHAR(500) | | 道具说明 |
| icon | VARCHAR(500) | | 图标 |
| category | VARCHAR(50) | | 道具分类 |
| price_coins | INT UNSIGNED | DEFAULT 0 | 演示兑换价格 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否可用 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### user_items（用户道具库存表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 库存记录ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户ID |
| item_id | BIGINT | FK → items.id, NOT NULL | 道具ID |
| quantity | INT UNSIGNED | DEFAULT 0 | 当前数量 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**UNIQUE约束：** (user_id, item_id)。业务层使用 `item_type` 查询，写入时解析为 `items.id`。

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
