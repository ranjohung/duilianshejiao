# API接口设计

> 来源：PRD v2.0 第21章

## 21.1 通用规范

| 项目 | 规格 |
|------|------|
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 (2026-07-15T08:30:00Z) |
| 认证方式 | Bearer Token (JWT) |
| 分页参数 | page(页码,默认1) + page_size(每页数量,默认20,最大50) |
| 错误响应 | `{"code": 40001, "message": "错误描述", "details": {}}` |

**通用状态码：**

| HTTP状态码 | 含义 |
|-----------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 21.2 认证模块

### POST /api/auth/register

**描述：** 用户注册，触发实名认证流程

**请求体：**

```json
{
  "phone": "13800138000",
  "code": "123456",
  "nickname": "小明"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "user_id": 10001,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "real_name_required": true,
    "real_name_level": 0
  }
}
```

**业务规则：**
- 手机号必须唯一
- 验证码6位，5分钟有效
- 注册后默认创建growth_profiles记录(五维50分)
- 注册后默认分配鼓励型教练(沈清欢)
- 注册后标记real_name_required=true，引导完成实名认证

---

### POST /api/auth/login

**描述：** 用户登录

**请求体：**

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "user_id": 10001,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "nickname": "小明",
    "member_level": "free",
    "training_points": 85,
    "real_name_level": 2
  }
}
```

---

### POST /api/auth/verify-real-name

**描述：** 实名认证

**请求体：**

```json
{
  "real_name": "张三",
  "id_card": "110101199001011234",
  "face_image": "base64..."
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "实名认证成功",
  "data": {
    "real_name_level": 2,
    "age_group": "adult"
  }
}
```

**业务规则：**
- Level1认证：手机号验证
- Level2认证：身份证+人脸比对(阿里云实人认证/uni实人认证，系统自动选择成本最优)
- 认证结果存储，原始身份信息不存储
- 根据身份证号判断年龄分组

---

## 21.3 用户模块

### GET /api/users/profile

**描述：** 获取用户资料

**请求头：** Authorization: Bearer {token}

**响应体：**

```json
{
  "code": 0,
  "data": {
    "user_id": 10001,
    "nickname": "小明",
    "avatar": "https://oss.example.com/avatar/10001.jpg",
    "gender": 1,
    "age": 25,
    "member_level": "monthly",
    "training_points": 350,
    "student_level": "黄金",
    "total_training_days": 30,
    "comprehensive_score": 62.5,
    "is_real_name_verified": true,
    "real_name_level": 2,
    "selected_coach": {
      "id": 1,
      "name": "沈清欢",
      "teaching_style": "encouraging"
    },
    "created_at": "2026-06-01T10:00:00Z"
  }
}
```

---

### PUT /api/users/profile

**描述：** 更新用户资料

**请求体：**

```json
{
  "nickname": "小明同学",
  "avatar": "https://oss.example.com/avatar/new.jpg",
  "gender": 1
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

### GET /api/users/growth

**描述：** 获取成长数据

**响应体：**

```json
{
  "code": 0,
  "data": {
    "radar": {
      "communication": 58,
      "expression": 52,
      "empathy": 65,
      "emotion_control": 50,
      "adaptability": 45
    },
    "comprehensive_score": 54.0,
    "student_level": "白银",
    "training_points": 120,
    "next_level_points": 300,
    "talents": [
      {"type": "empathy", "level": 3, "experience": 280, "title": "进阶"},
      {"type": "speech", "level": 2, "experience": 80, "title": "初学"}
    ],
    "score_history": [
      {"week": "2026-W27", "communication": 52, "expression": 48, "empathy": 60}
    ]
  }
}
```

---

## 21.4 教练模块

### GET /api/coaches

**描述：** 获取教练列表

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | preset(预设)/custom(自定义)，不传则返回全部 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "preset": [
      {
        "id": 1,
        "name": "沈清欢",
        "avatar": "https://oss.example.com/coach/shen.jpg",
        "teaching_style": "encouraging",
        "description": "温柔知性的大姐姐",
        "is_collected": true
      }
    ],
    "custom": [
      {
        "id": 100,
        "name": "小智",
        "avatar": "https://oss.example.com/coach/custom_100.jpg",
        "teaching_style": "analytical",
        "personality": {"social_energy": "I", "info_processing": "S", "decision_making": "T", "life_attitude": "J"}
      }
    ]
  }
}
```

---

### GET /api/coaches/:id

**描述：** 获取教练详情

**响应体：**

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "沈清欢",
    "avatar": "https://oss.example.com/coach/shen.jpg",
    "teaching_style": "encouraging",
    "teaching_style_label": "鼓励型",
    "personality_config": {
      "social_energy": "E",
      "info_processing": "N",
      "decision_making": "F",
      "life_attitude": "P"
    },
    "emotion_state": {
      "pleasure": 80,
      "anxiety": 20,
      "fatigue": 15
    },
    "description": "温柔知性的大姐姐，总是能看到你做得好的地方",
    "voice_id": "zh-CN-XiaoxiaoNeural",
    "is_preset": true,
    "is_collected": true
  }
}
```

---

### POST /api/coaches/custom

**描述：** 创建自定义教练

**请求体：**

```json
{
  "name": "小智",
  "teaching_style": "analytical",
  "personality_config": {
    "social_energy": "I",
    "info_processing": "S",
    "decision_making": "T",
    "life_attitude": "J"
  },
  "voice_id": "zh-CN-YunxiNeural",
  "appearance_config": {
    "hairstyle": "short",
    "outfit": "casual",
    "accessory": "glasses"
  },
  "custom_title": "导师"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "coach_id": 100,
    "points_cost": 100,
    "remaining_points": 50
  }
}
```

**业务规则：**
- 消耗100训练积分
- 用户同时最多持有2个自定义教练
- 系统自动生成system_prompt
- 初始情绪状态为默认值

---

### PUT /api/coaches/:id/personality

**描述：** 更新教练人格设置

**请求体：**

```json
{
  "teaching_style": "challenging",
  "personality_config": {
    "social_energy": "E",
    "info_processing": "N",
    "decision_making": "T",
    "life_attitude": "P"
  }
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "points_cost": 50,
    "remaining_points": 0
  }
}
```

**业务规则：**
- 预设教练不可修改（返回403）
- 每次修改消耗50训练积分
- 修改后重新生成system_prompt

---

## 21.5 场景模块

### GET /api/scenes

**描述：** 获取场景列表（含解锁状态）

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| stage | int | 按阶段筛选(1-6) |
| high_challenge | boolean | 是否高难度关卡 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "stages": [
      {
        "stage": 1,
        "name": "破冰期",
        "is_unlocked": true,
        "unlock_progress": "已完成1/2场景",
        "scenes": [
          {
            "id": 1,
            "name": "相亲模拟",
            "difficulty": 2,
            "estimated_duration": 12,
            "completion_rate": 75,
            "best_score": 85,
            "is_unlocked": true,
            "is_completed": true
          }
        ]
      }
    ]
  }
}
```

---

### GET /api/scenes/:id

**描述：** 获取场景详情

**响应体：**

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "相亲模拟",
    "description": "朋友介绍了一个条件不错的相亲对象，你们约在咖啡厅第一次见面。如何给对方留下好印象？",
    "stage": 1,
    "stage_name": "破冰期",
    "difficulty": 2,
    "difficulty_label": "中等",
    "rounds": 5,
    "estimated_duration": 10,
    "teaching_point": "自然开启对话、制造话题",
    "npc_config": {
      "name": "小林",
      "role": "咖啡厅常客",
      "personality": "友善但有些害羞",
      "opening_line": "你好，这个位置有人吗？"
    },
    "is_unlocked": true,
    "best_score": 85,
    "completion_rate": 75,
    "unlock_condition": {
      "min_points": 0,
      "description": "默认解锁"
    }
  }
}
```

---

### POST /api/scenes/:id/start

**描述：** 开始训练

**请求体：**

```json
{
  "coach_id": 1,
  "items": ["double_points"]
}
```

**响应体：**

```json
{
  "code": 0,
  "data": {
    "training_id": 5001,
    "scene": {
      "name": "相亲模拟",
      "description": "朋友介绍了一个条件不错的相亲对象...",
      "npc": {"name": "小雨", "opening_line": "你好，我是XXX介绍的小雨"}
    },
    "coach": {
      "name": "沈清欢",
      "teaching_style": "encouraging"
    },
    "items_applied": ["double_points"],
    "remaining_weekly_uses": 14,
    "started_at": "2026-07-15T10:00:00Z"
  }
}
```

**业务规则：**
- 检查场景是否已解锁
- 检查本周训练次数是否用完
- 检查防沉迷时间限制
- 消耗1次训练次数
- 记录使用的道具

---

### POST /api/scenes/:id/complete

**描述：** 完成训练（提交评估）

**请求体：**

```json
{
  "training_id": 5001,
  "dialogue_history": [...],
  "emotion_diary": {
    "emotion_type": "happy",
    "intensity": 7,
    "content": "感觉还不错，比上次放松了"
  }
}
```

**响应体：**

```json
{
  "code": 0,
  "data": {
    "training_id": 5001,
    "score": 82,
    "star_rating": 2,
    "quality_marks": {
      "communication": 78,
      "expression": 72,
      "empathy": 85,
      "emotion_control": 70,
      "adaptability": 68
    },
    "evaluation_report": {
      "summary": "你在本次相亲模拟训练中表现良好...",
      "strengths": ["能主动开启话题", "语气自然友好"],
      "improvements": ["可以多用开放式问题延续对话"],
      "coach_comment": "你今天的开场很自然！下次试试问对方平时喜欢做什么，会让对话更有深度。——沈清欢"
    },
    "points_earned": 25,
    "total_points": 375,
    "learning_card": {
      "id": 3001,
      "title": "如何在咖啡厅自然破冰",
      "key_point": "观察对方兴趣→真诚表达好奇→开放式问题延续"
    },
    "talent_exp_gained": {
      "empathy": 30,
      "communication": 20
    },
    "ended_at": "2026-07-15T10:12:00Z"
  }
}
```

---

## 21.6 训练模块

### POST /api/training/chat

**描述：** 发送对话消息（LLM路由）

**请求体：**

```json
{
  "training_id": 5001,
  "message": "你好，我也很喜欢这本书！",
  "choice_index": 0,
  "use_hint": false,
  "use_time_travel": false,
  "use_shield": false
}
```

**响应体：**

```json
{
  "code": 0,
  "data": {
    "coach_response": "你说得很好！自然地表达了共同兴趣。小林看起来很高兴找到了书友，接下来你可以试着问她最喜欢书里的哪个角色。",
    "npc_response": "真的吗？太巧了！你觉得第三章那个反转怎么样？",
    "feedback": {
      "choice_analysis": "你选择了主动表达共同兴趣，这是一个很好的破冰方式",
      "score_delta": 5,
      "emotion_impact": {"pleasure": 5, "anxiety": -3}
    },
    "next_choices": [
      {"index": 0, "text": "我觉得那个反转太出乎意料了！", "type": "direct"},
      {"index": 1, "text": "嗯...我还没看到那里呢", "type": "indirect"},
      {"index": 2, "text": "哈哈，你喜欢悬疑类小说吗？", "type": "humor"}
    ],
    "round": 3,
    "total_rounds": 5,
    "items_remaining": {
      "time_travel": 2,
      "hint_card": 3,
      "shield": 2
    },
    "llm_provider": "deepseek"
  }
}
```

**业务规则：**
- 根据用户会员等级路由到不同LLM
- 如果use_hint=true，消耗1张提示卡，在feedback中标注最佳选项
- 如果use_time_travel=true，消耗1张时空穿梭券，返回上一轮选项
- 如果use_shield=true，消耗1张情绪护盾，减少负面情绪影响
- 后置人格校验，偏离则重新生成

---

### GET /api/training/records

**描述：** 获取训练记录列表

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码(默认1) |
| page_size | int | 每页数量(默认20) |
| scene_id | int | 按场景筛选 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "total": 45,
    "page": 1,
    "page_size": 20,
    "records": [
      {
        "id": 5001,
        "scene_name": "相亲模拟",
        "scene_difficulty": 2,
        "coach_name": "沈清欢",
        "score": 82,
        "star_rating": 2,
        "started_at": "2026-07-15T10:00:00Z",
        "ended_at": "2026-07-15T10:12:00Z"
      }
    ]
  }
}
```

---

### GET /api/training/records/:id

**描述：** 获取训练详情

**响应体：**

```json
{
  "code": 0,
  "data": {
    "id": 5001,
    "scene_name": "相亲模拟",
    "coach_name": "沈清欢",
    "score": 82,
    "star_rating": 2,
    "quality_marks": {
      "communication": 78,
      "expression": 72,
      "empathy": 85,
      "emotion_control": 70,
      "adaptability": 68
    },
    "evaluation_report": {
      "summary": "你在本次相亲模拟训练中表现良好...",
      "strengths": ["能主动开启话题", "语气自然友好"],
      "improvements": ["可以多用开放式问题延续对话"],
      "coach_comment": "你今天的开场很自然！——沈清欢"
    },
    "dialogue_history": [...],
    "emotion_diary": {
      "emotion_type": "happy",
      "intensity": 7,
      "content": "感觉还不错"
    },
    "started_at": "2026-07-15T10:00:00Z",
    "ended_at": "2026-07-15T10:12:00Z"
  }
}
```

---

## 21.7 成长模块

### GET /api/growth/radar

**描述：** 获取能力雷达图数据

**响应体：**

```json
{
  "code": 0,
  "data": {
    "dimensions": [
      {"name": "沟通力", "key": "communication", "score": 58, "max": 100},
      {"name": "表达力", "key": "expression", "score": 52, "max": 100},
      {"name": "共情力", "key": "empathy", "score": 65, "max": 100},
      {"name": "情绪控制", "key": "emotion_control", "score": 50, "max": 100},
      {"name": "应变力", "key": "adaptability", "score": 45, "max": 100}
    ],
    "comprehensive_score": 54.0
  }
}
```

---

### GET /api/growth/progress

**描述：** 获取进步曲线数据

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| dimension | string | 能力维度(communication等)，不传返回全部 |
| weeks | int | 查询周数(默认12，最大52) |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "dimensions": {
      "communication": [
        {"week": "2026-W26", "score": 52},
        {"week": "2026-W27", "score": 55},
        {"week": "2026-W28", "score": 58}
      ],
      "expression": [...]
    }
  }
}
```

---

### GET /api/growth/weekly-report

**描述：** 获取每周报告

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| week | string | 周标识(如2026-W28)，不传返回最新 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "week": "2026-W28",
    "training_stats": {
      "total_sessions": 5,
      "total_minutes": 65,
      "points_earned": 85
    },
    "score_changes": {
      "communication": {"before": 52, "after": 58, "delta": 6},
      "expression": {"before": 48, "after": 51, "delta": 3}
    },
    "emotion_trend": "本周情绪整体偏积极，周三有一次紧张波动",
    "coach_comment": "这周你的沟通力进步特别明显！我发现你在表达观点时更加自信了。继续保持，下周我们试试更有挑战性的场景？——沈清欢",
    "generated_at": "2026-07-15T08:00:00Z"
  }
}
```

---

### GET /api/growth/milestones

**描述：** 获取里程碑

**响应体：**

```json
{
  "code": 0,
  "data": {
    "unlocked": [
      {
        "type": "first_training",
        "title": "初次训练",
        "description": "完成第1次场景训练",
        "unlocked_at": "2026-06-01T10:15:00Z"
      }
    ],
    "locked": [
      {
        "type": "perfect_score",
        "title": "首次满分",
        "description": "训练评分100分",
        "progress": "最高得分85/100"
      }
    ]
  }
}
```

---

## 21.8 签到模块

### POST /api/check-in

**描述：** 每日签到

**请求体：** 无

**响应体：**

```json
{
  "code": 0,
  "data": {
    "consecutive_days": 5,
    "points_earned": 9,
    "total_points": 379,
    "today_reward": {
      "type": "points",
      "value": 9
    },
    "week_bonus": {
      "days_remaining": 2,
      "bonus_description": "连续7天额外20积分+时空穿梭券+双倍积分卡"
    }
  }
}
```

**业务规则：**
- 每日只能签到1次
- 连续天数递增积分：5,6,7,8,9,10,11...
- 断签归零重计

---

### GET /api/check-in/status

**描述：** 获取签到状态

**响应体：**

```json
{
  "code": 0,
  "data": {
    "today_checked_in": true,
    "consecutive_days": 5,
    "this_week_progress": [true, true, true, true, true, false, false],
    "next_reward_preview": {
      "day_6": {"type": "emotion_shield", "value": 1},
      "day_7": {"type": "bonus", "points": 20, "items": ["time_travel", "double_points"]}
    }
  }
}
```

---

## 21.9 晚安计划

### POST /api/goodnight/plan

**描述：** 设置晚安计划

**请求体：**

```json
{
  "coach_id": 1,
  "scheduled_time": "21:30",
  "is_active": true
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "设置成功",
  "data": {
    "plan_id": 1,
    "scheduled_time": "21:30",
    "coach_name": "沈清欢",
    "is_active": true
  }
}
```

---

### POST /api/goodnight/trigger

**描述：** 触发晚安推送（内部接口，定时任务调用）

**请求体：**

```json
{
  "user_id": 10001,
  "plan_id": 1
}
```

**响应体：**

```json
{
  "code": 0,
  "data": {
    "audio_url": "https://oss.example.com/goodnight/10001_20260715.mp3",
    "duration_seconds": 180,
    "content_preview": "今天你完成了两次训练，进步很大..."
  }
}
```

---

## 21.10 社交模块

### GET /api/social/posts

**描述：** 获取朋友圈列表

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码 |
| page_size | int | 每页数量 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "total": 30,
    "posts": [
      {
        "id": 1,
        "coach_id": 1,
        "coach_name": "沈清欢",
        "coach_avatar": "https://oss.example.com/coach/shen.jpg",
        "content": "今天去了一家新开的咖啡店，拿铁上的拉花是一只小猫🐱",
        "post_type": "life_share",
        "image_url": "https://oss.example.com/posts/cat_latte.jpg",
        "comments": [
          {
            "user_id": 10001,
            "nickname": "小明",
            "content": "好可爱！",
            "coach_reply": "谢谢～你也加油哦！",
            "created_at": "2026-07-10T10:30:00Z"
          }
        ],
        "created_at": "2026-07-10T09:15:00Z"
      }
    ]
  }
}
```

---

### POST /api/social/posts/:id/comment

**描述：** 评论朋友圈

**请求体：**

```json
{
  "content": "好可爱！"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "评论成功",
  "data": {
    "comment_id": 501,
    "coach_reply": "谢谢～你也加油哦！",
    "reply_delay_seconds": 180
  }
}
```

**业务规则：**
- 教练回复延迟5-30分钟（模拟真实社交感）
- 评论内容经过违禁词过滤

---

### POST /api/social/invite

**描述：** 邀请好友

**请求体：**

```json
{
  "friend_phone": "13900139000",
  "invite_code": "FRIEND2026"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "邀请已发送",
  "data": {
    "invite_id": 1,
    "rewards_preview": {
      "inviter": "各类道具×1 + 10积分",
      "invitee": "体验卡(1次DeepSeek对话)"
    }
  }
}
```

---

### GET /api/social/leaderboard

**描述：** 获取好友排行榜

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 排行榜类型：training_days(训练天数)/scene_count(完成场景数)，默认training_days |
| limit | Integer | 否 | 返回数量，默认20 |

**响应体：**

```json
{
  "code": 0,
  "data": {
    "leaderboard": [
      {
        "user_id": "u003",
        "nickname": "小明",
        "avatar": "https://oss.example.com/avatars/u003.jpg",
        "value": 15,
        "rank": 1
      }
    ],
    "my_rank": {
      "rank": 5,
      "value": 12
    }
  }
}
```

---

## 21.11 道具模块

### GET /api/items

**描述：** 获取道具列表

**响应体：**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "item_type": "time_travel",
        "name": "时空穿梭券",
        "description": "回到训练中的关键分支点重新选择",
        "quantity": 3,
        "icon": "⏳"
      },
      {
        "item_type": "hint_card",
        "name": "提示卡",
        "description": "教练给出当前轮次的最优选择提示",
        "quantity": 2,
        "icon": "💡"
      },
      {
        "item_type": "emotion_shield",
        "name": "情绪护盾",
        "description": "本轮负面情绪影响减半",
        "quantity": 1,
        "icon": "🛡️"
      },
      {
        "item_type": "double_points",
        "name": "双倍积分卡",
        "description": "本次训练积分翻倍",
        "quantity": 1,
        "icon": "✨"
      }
    ]
  }
}
```

---

### POST /api/items/use

**描述：** 使用道具

**请求体：**

```json
{
  "item_type": "hint_card",
  "training_id": 5001,
  "round": 3
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "使用成功",
  "data": {
    "item_type": "hint_card",
    "remaining_quantity": 1,
    "hint_content": "本轮建议选择A选项——直接表达你的感受会更有效"
  }
}
```

**业务规则：**
- 检查道具数量是否充足
- 检查使用时机是否合法
- 扣减道具数量
- 返回道具效果

---

## 21.12 会员模块

### GET /api/membership/plans

**描述：** 获取会员方案

**响应体：**

```json
{
  "code": 0,
  "data": {
    "plans": [
      {
        "level": "daily",
        "name": "日卡",
        "price": 3.9,
        "duration_days": 1,
        "features": ["DeepSeek对话", "每周20次训练", "2D Spine教练"]
      },
      {
        "level": "weekly",
        "name": "周卡",
        "price": 18,
        "duration_days": 7,
        "features": ["DeepSeek对话", "无限训练次数", "2.5D Live2D教练", "每周道具包"]
      },
      {
        "level": "monthly",
        "name": "月卡",
        "price": 58,
        "duration_days": 30,
        "features": ["DeepSeek对话", "无限训练次数", "3D教练", "每月道具包", "语音训练"]
      },
      {
        "level": "yearly",
        "name": "年卡",
        "price": 398,
        "duration_days": 365,
        "features": ["DeepSeek高优先级", "无限训练次数", "3D+真人教练", "年道具包", "语音训练", "专属皮肤"]
      }
    ],
    "current_plan": {
      "level": "free",
      "expire_at": null
    }
  }
}
```

---

### POST /api/membership/purchase

**描述：** 购买会员

**请求体：**

```json
{
  "level": "monthly",
  "payment_method": "wechat"
}
```

**响应体：**

```json
{
  "code": 0,
  "message": "购买成功",
  "data": {
    "order_id": "ORD20260715001",
    "level": "monthly",
    "expire_at": "2026-08-14T23:59:59Z",
    "payment_amount": 58.00
  }
}
```

**业务规则：**
- 已有会员时，新购买时长叠加
- 升级会员时，计算剩余时长差价
- 14-18岁用户单笔消费上限50元
- 14-18岁用户月累计消费上限200元

**会员权益对比表：**

| 权益 | 体验 | 免费 | 日卡 | 周卡 | 月卡 | 年卡 |
|------|------|------|------|------|------|------|
| LLM引擎 | DeepSeek(1次) | Ollama+10%偶遇 | DeepSeek | DeepSeek | DeepSeek | DeepSeek高优 |
| 每周训练次数 | 1次 | 15次 | 20次 | 无限 | 无限 | 无限 |
| 教练渲染 | 2D Spine | 2D Spine | 2D Spine | 2.5D Live2D | 3D | 3D+真人 |
| 语音训练 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 高难度关卡 | ❌ | 积分≥300解锁 | 积分≥300解锁 | ✅直接解锁 | ✅直接解锁 | ✅直接解锁 |

**说明：** 所有用户训练积分≥300均可解锁高难度关卡，周卡/月卡/年卡会员无积分限制直接解锁。
| 时空穿梭券 | 0 | 签到获取 | 签到获取 | 3张/周 | 10张/月 | 15张/月 |
| 双倍积分卡 | 0 | 签到获取 | 签到获取 | 1张/周 | 3张/月 | 3张/月 |
| 价格 | 免费 | 免费 | ¥3.9/日 | ¥18/周 | ¥58/月 | ¥398/年 |
