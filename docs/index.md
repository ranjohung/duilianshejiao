# 「对练社交」文档索引

**版本：v2.4.5 | 更新日期：2026-09-10**

> `prd.md` 是产品规则基准，`development-plan.md` 是实现状态与执行优先级基准。`product/`、`frontend/`、`backend/` 中的文件按模块维护；若与前两份基准冲突，以基准文档的“当前实现/生产待实现”标记为准。

---

## 文档结构

```
docs/
├── index.md              ← 本文件（总索引）
├── prd.md                ← 产品规则基准（v2.4.5）
├── development-plan.md   ← 真实进度、上线缺口与验收门槛
├── code-review-report-2026-09-03.md ← 审查问题、证据与修复状态
├── code-review-report-2026-09-04.md ← 学习者视角模块复审与修复回写（最终复核：2026-09-08）
├── code-review-report-2026-09-08.md ← Flutter 模拟器续审、问题复现与修复证据
├── user-manual.md        ← 当前版本完整使用说明书
├── revenue-rules-audit-2026-09-05.md ← 营收、奖励与解锁规则专项审查
├── knowledge-base-conversion-report-2026-09-10.md ← 知识库课程化与学习卡片接入审查
├── avatar-assets-report-2026-09-10.md ← 用户真人全身头像素材与功能复核
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
| [tabs.md](product/tabs.md) | 5大Tab早期规格 | 首页/教练/训练/成长/我的；布局细节以PRD v2.4.5为准 | 第4章 |
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
| [schedule.md](product/schedule.md) | 历史排期与风险 | 旧版5 Phase/13周计划，仅供追溯；当前计划见 `development-plan.md` | 历史资料 |

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
| [design-system-v3.md](frontend/design-system-v3.md) | 前端设计系统v3 | 品牌令牌、组件规则、页面层级、动效与验收标准 | 当前实现 |

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

> **产品规则基准：** [prd.md](prd.md)（v2.4.5）；**开发状态与计划：** [development-plan.md](development-plan.md)；**学习者视角总复审：** [code-review-report-2026-09-04.md](code-review-report-2026-09-04.md)；**最新 Flutter 模拟器续审：** [code-review-report-2026-09-08.md](code-review-report-2026-09-08.md)；**营收/奖励/解锁专项审查：** [revenue-rules-audit-2026-09-05.md](revenue-rules-audit-2026-09-05.md)；**知识库课程化与学习卡片接入：** [knowledge-base-conversion-report-2026-09-10.md](knowledge-base-conversion-report-2026-09-10.md)；**用户真人头像素材与功能：** [avatar-assets-report-2026-09-10.md](avatar-assets-report-2026-09-10.md)。
