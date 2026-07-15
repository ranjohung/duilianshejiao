# 「对练社交」文档索引

**版本：v2.0 | 更新日期：2026-07-15**

> 本索引为「对练社交」AI对话社交训练平台的完整文档导航。所有文档均从PRD v2.0拆分而来，作为各方向的开发基准。

---

## 文档结构

```
docs/
├── index.md              ← 本文件（总索引）
├── prd.md                ← 完整PRD v2.0（原始文档）
├── product/              ← 产品方向（按模块功能拆分）
├── frontend/             ← 前端方向
└── backend/              ← 后端方向
```

---

## 一、产品方向（docs/product/）

按模块功能拆分，适合产品经理、全栈开发人员阅读。

| 文件 | 模块 | 内容概述 | PRD来源 |
|------|------|---------|---------|
| [overview.md](product/overview.md) | 产品概述 | 产品定位、核心差异化、用户画像 | 第1-2章 |
| [architecture.md](product/architecture.md) | 技术架构 | 技术栈、LLM混合引擎、成本控制 | 第3章 |
| [tabs.md](product/tabs.md) | 5大Tab功能规格 | 首页/教练/场景/成长/我的，含布局图和功能列表 | 第4章 |
| [coach.md](product/coach.md) | AI教练系统 | 渲染分级、预设角色、性格维度、情绪/记忆系统 | 第5章 |
| [scene.md](product/scene.md) | 场景与关卡 | 社交模拟场景(6阶段) + 高难度关卡(7个) | 第6-7章 |
| [growth-system.md](product/growth-system.md) | 成长体系 | 训练积分、学员等级(6级)、道具(4类)、才艺(5项) | 第8-9章、第11章 |
| [custom-coach.md](product/custom-coach.md) | 自定义教练 | 用户自定义教练人设、费用、与预设教练关系 | 第10章 |
| [voice-training.md](product/voice-training.md) | 语音训练 | Agora RTC集成、训练流程、MVP拆分(TTS先行) | 第12章 |
| [learning-cards.md](product/learning-cards.md) | 学习卡片 | 时空穿梭券使用流程、学习卡片自动生成 | 第13章 |
| [social.md](product/social.md) | 社交联动 | 变美联动、教练朋友圈、好友邀请与裂变 | 第14-15章、第18章 |
| [psychology.md](product/psychology.md) | 心理健康 | CBT+NVC触发条件、情绪识别训练、三级心理响应 | 第16章 |
| [retention.md](product/retention.md) | 留存增长 | 晚安计划、情绪日记、每周报告、签到、真实挑战、成就卡片 | 第17章 |
| [compliance.md](product/compliance.md) | 合规实施 | 实名认证、年龄分层、防沉迷、内容安全、隐私保护 | 第19章 |
| [schedule.md](product/schedule.md) | 排期与风险 | 开发排期(5 Phase/13周)、素材清单、风险评估 | 第22-24章 |

---

## 二、前端方向（docs/frontend/）

面向Flutter客户端开发，聚焦UI设计、渲染规格、交互流程。

| 文件 | 模块 | 内容概述 | PRD来源 |
|------|------|---------|---------|
| [overview.md](frontend/overview.md) | 前端技术总览 | Flutter跨端、Spine/Live2D/3D渲染、Agora RTC、LLM路由规则 | 第3章 |
| [tabs-design.md](frontend/tabs-design.md) | 5大Tab UI设计 | 每个Tab的页面布局图、功能列表、优先级 | 第4章 |
| [coach-render.md](frontend/coach-render.md) | 教练渲染规格 | 渲染分级(2D→2.5D→3D)、交互规格、预设角色、表情动画 | 第5章 |
| [scene-training-ui.md](frontend/scene-training-ui.md) | 场景训练UI | 场景选择、训练对话流程、高难度关卡、语音训练UI | 第6-7章、第12章 |
| [growth-retention-ui.md](frontend/growth-retention-ui.md) | 成长留存UI | 雷达图、进度条、签到、晚安计划、学习卡片、情绪日记 | 第8-9章、第13章、第17章 |
| [assets.md](frontend/assets.md) | 素材清单 | Spine立绘(4个)、场景背景、UI图标、TTS音色 | 第23章 |

---

## 三、后端方向（docs/backend/）

面向Node.js后端开发，聚焦数据层、API层、服务层。

| 文件 | 模块 | 内容概述 | PRD来源 |
|------|------|---------|---------|
| [overview.md](backend/overview.md) | 后端技术总览 | Node.js+Express、MySQL+Redis、AI服务、LLM路由、成本控制 | 第3章 |
| [database.md](backend/database.md) | 数据库设计 | 16张核心表结构、ER关系、JSON字段示例、索引策略 | 第20章 |
| [api.md](backend/api.md) | API接口设计 | 12个模块完整RESTful API，含请求/响应示例 | 第21章 |
| [llm-router.md](backend/llm-router.md) | LLM路由与AI服务 | 路由规则、降级机制、教练人格架构、系统提示词构建 | 第3.5节、第5章 |
| [scheduled-tasks.md](backend/scheduled-tasks.md) | 定时任务 | 8项cron任务汇总（签到重置/晚安推送/每周报告/朋友圈生成等） | 多章节汇总 |
| [compliance-backend.md](backend/compliance-backend.md) | 合规后端实现 | 实名认证流程、年龄分层逻辑、防沉迷检查、违禁词过滤 | 第19章 |

---

## 四、代码层

| 目录 | 内容 | 关键文件 |
|------|------|---------|
| `lib/models/` | 15个数据模型 | user_model, coach_model, scene_model, training_model, growth_model 等 |
| `lib/network/` | 网络层 | api_client, api_interceptor, api_response, api_routes, llm_router |
| `lib/network/services/` | 11个业务Service | auth, user, coach, scene, training, growth, checkIn, goodnight, social, item, membership |
| `lib/config/` | 配置 | app_config, api_config, theme_config |
| `lib/constants/` | 常量枚举 | app_constants, scene_constants |

---

## 五、阅读指引

| 角色 | 建议阅读顺序 |
|------|------------|
| **产品经理** | product/ 全部14个文件 |
| **前端开发** | frontend/overview → frontend/tabs-design → frontend/coach-render → frontend/scene-training-ui → frontend/growth-retention-ui → frontend/assets |
| **后端开发** | backend/overview → backend/database → backend/api → backend/llm-router → backend/scheduled-tasks → backend/compliance-backend |
| **全栈开发** | product/overview → product/architecture → 按模块对照 product/ + frontend/ + backend/ |
| **QA测试** | product/tabs → product/scene → product/compliance → backend/api |

---

> **原始文档：** [prd.md](prd.md)（完整PRD v2.0，3051行，所有修改的源文件）
