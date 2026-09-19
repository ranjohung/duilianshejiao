# 对练社交 V4.0 重构开发计划（社交技能教学闭环）

**版本：v4.0.0 ｜ 创建日期：2026-09-14 ｜ 最后更新：2026-09-16**
**基于「社交技能教学与现实迁移训练系统」重构规格（docs/prd.md §0）**

> 本次重构核心（v4.0.0，高于 v3.x 基线）：**打破"动作-语言"割裂的回合制**，实现**语音连续输入 + 动作时间线**，落地**四级教学闭环（看示范→跟练→半开放→真实模拟）**。经济体系按新规格降级。v3.x 已完成项（学-练-战-评、三币、安全合规、埋点、LocalStorage 统一、3D 朝向修正基座）全部保留沿用。

---

## 一、重构范围总览

| 模块 | 优先级 | 状态 | 说明 |
|---|---|---|---|
| 3D角色朝向Bug修复 | P0 | ✅ 已完成 | v3_3d_fix.js 运行时补丁，角色互视+写实光照 |
| "学-练-战-评"闭环重构 | P0 | ✅ 已完成 | 3秒记录卡✅ 勇气证据库✅ 临场突变✅ 学习卡片详情✅ 滑动修复✅ 微小现实任务✅ |
| 经济体系重构 | P0 | ✅ 已完成 | v3_economy_loop.js 三币+5触点+付费保护+订阅框架 |
| 安全合规与冷启动 | P0 | ✅ 已完成 | 危机热线12356✅ 冷启动卡片✅ 协议折叠UI(v3_protocol_ui.js)✅ |
| 指标埋点 | P1 | ✅ 已完成 | 4个漏斗事件+mutation_triggered+learning_to_practice |
| LocalStorage键名统一 | P1 | ✅ 已完成 | 6个标准键名全部实现 |
| 3D写实化视觉升级 | P1 | 🔄 进行中 | 10张SD场景图✅ 背景图自动加载✅ 写实光照✅ Blender角色待准备 |
| 勇气证据库页面 | P1 | ✅ 已完成 | 独立渲染+成长页入口+实时统计+付费报告 |

---

## 二、P0 开发任务分解

### Sprint 1：基础设施 + 3D修复（Day 1-2）

#### 1.1 3D角色朝向修复
- [ ] 在 `game_stage3d.js` 中搜索并删除所有 `character.lookAt(camera.position)` 代码
- [ ] 替换为角色间互视逻辑：`character.lookAt(otherCharacter.position.clone())`
- [ ] 添加四元数 slerp 平滑过渡
- [ ] 增加GLB初始朝向校正值 `character.rotation.y += Math.PI`（防背对背保险）
- [ ] 冒烟测试：两角色面向彼此、转身平滑、不同场景均正常

#### 1.2 LocalStorage 键名统一
- [ ] 定义6个标准键数据结构：
  - `duilian_profile`：用户资料 + `free_scenarios_used[]` + `free_reviews_used[]`
  - `duilian_training_log`：AI对练记录
  - `duilian_challenge_log`：现实挑战记录（含 `fear_predicted`/`outcome_negative` 标签）
  - `duilian_currency`：成长值/能量/社交币 + 能量最后刷新时间
  - `duilian_evidence`：勇气证据库聚合数据（从challenge_log计算）
  - `duilian_settings`：设置与协议确认状态
- [ ] 编写数据迁移脚本（从旧键名迁移到新键名）
- [ ] 确保所有页面读写统一使用新键名

#### 1.3 经济体系核心
- [ ] 实现三币数据结构：
  ```javascript
  duilian_currency = {
    growth: 0,           // 成长值（只增不减）
    energy: 3,           // 当前能量
    energyMax: 3,        // 能量上限（免费3/会员5）
    energyLastRefresh: 0, // 最后刷新时间戳
    socialCoin: 0,       // 社交币
    lastDailyReset: ''   // 上次日重置日期 YYYY-MM-DD
  }
  ```
- [ ] 实现每日0点能量自动恢复逻辑
- [ ] 实现社交币扣费前置校验 + 确认弹窗 + 余额不足引导充值
- [ ] 编写 `checkAndDeductCoin(amount, purpose)` 通用扣费函数
- [ ] 编写 `checkAndConsumeEnergy()` 能量消耗函数

### Sprint 2：UI重构 + 闭环逻辑（Day 3-5）

#### 2.1 学习卡片（课程库）重构
- [x] 修复列表滑动：底部安全距离 ≥ 80px，防止Tab遮挡
- [x] 实现课程详情页：课程正文 + 核心原则 + 红线提示
- [x] 每张卡片底部增加【一键去AI演练此场景】按钮
- [x] 绑定 `scenario_id`，跳转AI对话界面（按scene名称自动匹配templateScenes id）
- [x] 首次进入免费（记录到 `free_scenarios_used`）
- [x] 入口不拦截用户，能量不足在进入后界面引导充值

#### 2.2 AI对练模块重构
- [x] 在对话状态机中增加"临场突变"分支（第2-3回合概率触发）
  - 突然沉默 / 突然插话 / 质疑用户
- [x] 对话结束后：免费给"一句肯定+1个改进点"
- [x] 增加【解锁深度复盘】按钮
  - 首次免费（记录到 `free_reviews_used`）
  - 后续每次3社交币
- [x] 实现付费确认弹窗 + 余额校验

#### 2.3 现实挑战模块重构
- [x] "我的作业"改名为"现实挑战"
- [x] 完成AI场景后自动解锁微小现实任务（9种场景对应+每日1次限制）
- [x] 增加【今天状态差，换个更简单的】降级按钮
- [x] 固定弹窗文案："今天没准备好也没关系，机会永远都在。"
- [x] 能量清零边界说明UI文案（状态栏tooltip+能量弹窗说明+ℹ️按钮）
- [x] 实现3秒记录卡（复选框形式）：
  - 感受选项 + 标签映射（fear_predicted）
  - 对方反应选项 + 标签映射（outcome_negative）
  - 可选一句话补充
- [x] 数据统一写入 `duilian_challenge_log`

#### 2.4 认知重构与勇气证据库
- [x] AI三段式反馈：共情接纳 → 肯定勇气 → 引导认知重构
- [x] 反馈直接读取刚提交的挑战记录
- [x] 新增勇气证据库页面
  - 从 `duilian_challenge_log` 读取统计
  - 展示"X次挑战，Y次预想结果未发生"
  - 禁止排名，仅个人成长记录
- [x] 成长页入口卡片注入（实时统计+点击打开）
- [x] 本周概况免费 / 深度报告5社交币

### Sprint 3：安全合规 + 冷启动 + 埋点（Day 5-6）

#### 3.1 安全合规
- [x] 危机热线替换为 `<a href="tel:12356">一键拨打全国统一心理援助热线 12356</a>`
- [x] 移动端悬浮快捷入口
- [x] 协议折叠：免责声明/服务协议/隐私政策分步展示（v3_protocol_ui.js — 三步确认流程+摘要优先+折叠全文+状态持久化）
- [x] 禁止AI自行查找或改动热线号码

#### 3.2 冷启动引导
- [x] 新用户首次进入推送"30秒和AI说一句问候"卡片
- [x] 点击直接开始对话
- [x] 不展示空状态

#### 3.3 埋点
- [x] `ai_training_completed` — AI对话结束时
- [x] `challenge_accepted` — 点击开始现实挑战时
- [x] `challenge_completed` — 提交3秒记录卡时
- [x] `reflection_completed` — 阅读完认知重构反馈时
- [x] 所有事件携带 `user_id, scenario_id, challenge_tier, timestamp`
- [x] 额外埋点：`mutation_triggered` + `learning_to_practice`

---

## 三、3D写实化视觉升级计划

### 目标
礼仪训练和真实挑战模块从当前 Low Poly 程序化风格升级为**真人影视风格画面**。

### 技术方案

#### Phase 1：SD生成写实贴图素材
- [x] 使用 Stable Diffusion 生成写实人物贴图/环境贴图
- [x] 场景风格关键词：`cinematic lighting, photorealistic, post-apocalyptic, urban scene, realistic human`
- [x] 生成场景背景图（咖啡厅、办公室、餐厅、公共场所等）— 10张已完成
- [ ] 生成人物皮肤/服装 PBR 贴图

#### Phase 2：Blender写实角色模型
- [ ] 在 Blender 中准备写实风格人物 GLB 模型
- [ ] 确保模型带有预设动画（idle, talk, nod, gesture, sit, stand）
- [ ] 导出 GLB（含 AnimationClip）
- [ ] 调整模型初始朝向轴匹配 Three.js 坐标系

#### Phase 3：game_stage3d.js 写实渲染升级
- [x] 增加 GLB 模型加载路径（复用现有 GLTFLoader）— v3_3d_fix.js 运行时hook
- [x] 写实光照：HDRI 环境光 + 三点布光 — ACES色调映射+暖环境光+方向光补光
- [ ] PBR 材质支持（MeshStandardMaterial + envMap）— 待写实角色GLB
- [ ] 后处理：Bloom + 景深 + 色调映射 — 待写实角色GLB就绪后
- [x] 保留程序化降级路径（GLB加载失败时回退）
- [x] 场景背景图自动加载（resolveRealisticBackdrop + challengeSceneCatalog映射）

#### Phase 4：场景写实化
- [ ] 每个场景配置写实背景图（SD生成）
- [ ] 3D场景使用照片级贴图替换纯色材质
- [ ] 环境音效配合（可选）

---

## 四、技术约束与红线

1. **纯前端**（GitHub Pages），数据持久化用 LocalStorage
2. **严禁**编写 Blender 自动骨骼绑定脚本
3. **严禁**在 Three.js 中实现 IK 解算器（用现有GLB预设动画）
4. **文案红线**：禁止"检验/考核/不及格/答错倒扣/作业"等评判字眼
5. **扣费红线**：严禁静默扣费、余额变负数
6. **数据红线**：3秒记录卡数据统一写入 `duilian_challenge_log`，勇气证据库从此读取

---

## 五、冒烟测试清单（12项）

> 代码审查已全部通过 ✅，待浏览器实际运行验证

1. [x] V3Economy/V3UI/V3Learning/V3Mutation/V3D/V3Evidence/V3Protocol 7个模块加载正常
2. [x] 三币初始化 + 能量每日刷新 + 能量消耗不为负
3. [x] LocalStorage 6键名约定正确（duilian_profile/currency/training_log/challenge_log/evidence/settings）
4. [x] 危机热线按钮存在且标题含12356
5. [x] 首页经济状态栏（能量/社交币/成长值）
6. [x] "我的作业"已替换为"现实挑战"
7. [x] 学习卡片底部安全距离≥80px
8. [x] 突变类型定义完整（SILENCE/INTERRUPTION/QUESTIONING）
9. [x] 写实场景图路径正确（challengeSceneCatalog 9个场景全覆盖）
10. [x] 埋点事件接口完整（trackAiTrainingCompleted/trackChallengeAccepted/trackChallengeCompleted）
11. [x] 勇气证据库模块加载 + 成长页入口
12. [x] 协议折叠UI模块加载 + 3份协议结构完整（disclaimer/service/privacy）

### 浏览器实测待验证项
- [ ] 3D两个角色面向彼此而非摄像机，转身平滑（需实际打开3D场景）
- [ ] 新用户首次进入出现"30秒问候"卡片且可一键开始
- [ ] 学习卡片顺畅滑动且不被底部Tab遮挡；详情页三点内容完整
- [ ] 【一键去AI演练此场景】携带 scenario_id 跳转且首次免费
- [ ] 3秒记录卡正确打上 fear_predicted 和 outcome_negative 标签
- [ ] AI三段式认知重构顺序正确，读取刚提交的记录
- [ ] 能量耗尽弹出社交币购买能量包；刷新说明"非惩罚性"
- [ ] 深度复盘首次免费、之后扣3社交币；有确认机制
- [ ] tel:12356 移动端一键呼出
- [ ] 四个埋点事件在对应时机触发并带上参数

---

## 六、文件变更清单

| 文件 | 变更类型 | 行数 | 说明 |
|---|---|---|---|
| `libs/v3_economy_loop.js` | ✅ 新增 | 864 | 三币机制+3秒记录卡+勇气证据库+付费保护+埋点+危机热线 |
| `libs/v3_ui_components.js` | ✅ 新增 | 529 | 3秒记录卡弹窗+认知重构三段式+勇气证据库页面+冷启动卡片+危机热线悬浮按钮 |
| `libs/v3_integration.js` | ✅ 新增 | ~330 | 拦截startChallenge/showChallengeResult/submitChallengeEvidence，注入能量/扣费/成长值/降级按钮/热线兜底 |
| `libs/v3_3d_fix.js` | ✅ 新增 | 352 | 3D角色朝向修复(互视)+写实光照(ACES+暖环境光)+背景图叠加 |
| `libs/v3_ai_mutations.js` | ✅ 新增 | ~280 | AI对练临场突变(5种类型+场景特定响应)+突变日志记录 |
| `libs/v3_learning_cards.js` | ✅ 新增 | ~450 | 学习卡片滑动修复+课程详情页+一键演练(scene名自动匹配)+首次免费 |
| `libs/v3_evidence_library.js` | ✅ 新增 | ~380 | 勇气证据库页面+成长页入口卡片+统计+付费报告 |
| `libs/v3_protocol_ui.js` | ✅ 新增 | ~310 | 协议折叠UI（三步分步确认+摘要优先+折叠全文+设置入口） |
| `index.html` | 修改 | 18038 | 注入8个V3 script标签 |
| `assets/images/challenges/` | ✅ 新增 | 10张 | SD写实场景图: cafe/office/family/community/service/home/public/market/auto/street/auto-realistic |
| `tools/v3_smoke_test.js` | ✅ 新增 | ~120 | P0冒烟测试清单（10+项检查） |
| `docs/development-plan-v3.md` | 本文件 | - | 开发计划 |

---

## 七、执行节奏

- **第1轮（2026-09-14 12:00-16:00）**：完成需求文档 + 开发计划 + Sprint 1核心代码
  - ✅ 创建 development-plan-v3.md
  - ✅ 创建 v3_economy_loop.js（864行）
  - ✅ 创建 v3_ui_components.js（529行）
  - ✅ 创建 v3_integration.js（294行）
  - ✅ 创建 v3_3d_fix.js（352行）
  - ✅ 生成8张SD写实场景图
  - ✅ index.html 注入V3脚本标签
- **第2轮（2026-09-14 20:00-20:30）**：集成完善 + 场景图补充
  - ✅ v3_integration.js 增加冷启动引导+危机热线自动初始化
  - ✅ 发现已有 v3_ai_mutations.js(423行) + v3_learning_cards.js(471行) 前置产物
  - ✅ 生成2张额外场景图（auto通用场景 + street街道场景），总计10张
  - ✅ 更新开发计划文档进度至v3.0.1
  - ✅ 确认6个V3脚本标签正确注入index.html
- **第3轮（2026-09-14 20:30-20:50）**：数据结构对齐 + 功能补全 + 协议折叠UI
  - ✅ 确认全局变量为 `window.knowledgeLearningCards`，修复v3_learning_cards.js
  - ✅ 新增 scene name → templateScenes id 自动映射
  - ✅ 新增勇气证据库成长页入口卡片（实时统计）
  - ✅ 新增 v3_protocol_ui.js — 协议折叠UI（免责/服务/隐私分步确认）
  - ✅ index.html 注入第8个V3模块
  - ✅ 冒烟测试新增至13+项（含V3Evidence/V3Protocol检查）
- **第4轮（2026-09-14 20:50-21:00）**：3D写实化集成 + 微小现实任务 + 能量边界说明
  - ✅ 3D场景背景图自动加载（resolveRealisticBackdrop + 10张映射 + 模糊匹配）
  - ✅ v3_3d_fix.js 公开接口增加 resolveBackdrop
  - ✅ 完成AI训练后自动解锁微小现实任务（9种场景对应+每日1次限制）
  - ✅ 能量清零边界说明UI文案（状态栏tooltip+ℹ️按钮+弹窗说明）
  - ✅ 更新开发计划至v3.0.3
- **第5轮（2026-09-14 20:50-21:00）**：协议折叠UI补全 + 模块集成验证
  - ✅ 创建 v3_protocol_ui.js — 三步分步确认流程（免责/服务/隐私）
  - ✅ 关键条款摘要优先展示 + 完整协议折叠 + 步骤指示器
  - ✅ 确认状态持久化到 duilian_settings.protocols
  - ✅ 首次使用自动检测未确认协议并弹出流程
  - ✅ 设置页协议查看入口（单独查看+状态标识）
  - ✅ index.html 注入第8个V3模块标签
  - ✅ 全部8个V3模块加载顺序验证通过
- **第6轮（待执行）**：浏览器冒烟测试 + Blender写实角色GLB准备
- 后续轮次：按Sprint顺序逐步实现，设置心跳持续推进
- 3D写实化：与功能开发并行，先生成素材再集成

---

## 八、V4 社交技能教学闭环开发任务（本次重构）

> **2026-09-17 方向修正：** 下方“四级教学闭环/行为时间轴”保留为历史方案，不再是当前礼仪训练界面。当前实现以“教练先教→文字/语音跟练→提交后评价”的课堂流程为准；真实挑战保持输入前无提示。`libs/v4_teaching_closed_loop.js` 已停止从页面加载。


> 遵循 v3 运行时补丁模式，**新增独立模块 `libs/v4_teaching_closed_loop.js`**，不侵入 index.html 的礼仪/挑战基础对话逻辑，降低破坏风险。接入点为礼仪训练关卡列表（运行时包装 `renderEtiquetteLevelList`）、`window.Stage3D`、`window.DUILIAN_ACTIONS`、`duilian_training_log`。

### 8.1 四级教学闭环
- [x] 九个课程卡片直接作为教学入口；移除重复的三世界说明区和独立总入口。
- [x] **看示范（观看模式）**：播放 3D 动作时间线（靠近→注视→微笑→伸手→说话→握手→松手→自然站立），同步展示\"行为时间轴\"（00:00…00:05），每到关键节点**暂停并弹出\"为什么这么做\"讲解**。
- [x] **跟练模式（低压力模仿）**（文字输入与动作并发已完成；连续语音识别待接入）：逐步提示\"现在请看向对方 / 微笑并伸手 / 说'您好'\"；用户点动作图标 + 语音输入**并发完成**（动作不打断输入）。
- [x] **半开放训练（自主决策）**：只给场景不提示；用户自由决定说话与动作；AI 记录行为时间线并复盘\"动作-语言衔接\"。
- [x] **真实模拟（高自由度）**（Web 原型随机事件完成；生产 AI 自由反应待接入）：不告诉答案，AI 自由反应；随机触发意外（声音小/没回应/插话/冷淡/距离近/主动伸手或没伸手）。

### 8.2 行为时间线 + 边说边做快捷面板
- [x] 训练底部常驻悬浮动作图标（微笑/点头/握手/鞠躬/挥手），**点击立即触发 3D 动作并打时间戳，不打断当前语音/文字输入**（替代现有\"选中自动写入输入框前缀\"的做法）。
- [x] 每次训练把\"动作触发时间点 + 语音/文字内容\"合并到同一条时间轴，写入 `duilian_training_log`。

### 8.3 课程绑定
- [x] `duilian_profile` 建立 `Lesson / EtiquetteRule / TrainingScenario` 数据结构（字段见 docs/prd.md §0.3）。
- [ ] 学习卡片底部按钮由【一键去 AI 演练此场景】改为【进入跟练模式】。

### 8.4 经济降级（覆盖 v3 价格）
- [ ] 成长值（软通货·只增不减·仅展示）；能量（每日 3 点 · 每日 0 点恢复）；社交币（硬通货·仅深度复盘与现实挑战记录等核心功能可用）。
- [ ] 深度复盘首次免费、后续 **3 社交币**/次；会员 **¥29/月**（能量上限提升 + 课程库全免）。

### 8.5 安全合规与冷启动（继承 v3，只做对齐核对）
- [ ] 危机热线 `<a href="tel:12356">`（禁止改动）；协议分步折叠；新用户首推\"30 秒问候\"卡片（不显示空状态）。

### 8.6 本版文件变更清单
| 文件 | 变更类型 | 说明 |
|---|---|---|
| `libs/v4_teaching_closed_loop.js` | ✅ 新增 | 四级教学闭环 + 行为时间线 + 边说边做快捷面板 + 课程绑定 + 日志写入 |
| `index.html` | 修改 | 尾部追加 `<script src=\"libs/v4_teaching_closed_loop.js\"></script>`（1 行） |
| `tools/v4_smoke_test.js` | ✅ 新增 | Node 桩环境 smoke：四级切换/边说边做/时间线写日志/课程绑定（已通过） |
| `docs/prd.md` | 修改 | 升级 v2.6.0 定位 + 新增 §0 教学闭环规格 |
| `docs/development-plan-v3.md` | 本文件 | V4 计划 |

### 8.7 P0 冒烟测试
1. 3D 两角色面向彼此、转身平滑（沿用 v3 修复基座，v4 复用 `Stage3D`）。
2. 进入\"第一次见客户\"场景先【看示范】并展示行为时间轴。
3. 跟练模式可用语音输入同时点动作图标，实现\"边说边做\"。
4. 半开放训练 AI 记录行为时间线并对\"动作-语言衔接\"复盘。
5. 现实挑战与课程场景绑定；3 秒记录卡正确打 `fear_predicted` / `outcome_negative` 标签。
6. `tel:12356` 移动端一键呼出。
7. 新用户首次出现"30 秒问候"卡片且可一键开始。
8. 埋点事件（`ai_training_completed` 等）在对应时机触发并带参数。

---

## 九、V5.0.0 礼仪训练 + 真实挑战重构计划

**创建日期：2026-09-19 ｜ 前置依赖：V4 Sprint 0-3 已完成 ｜ PRD 基准：`docs/prd.md` v5.0.0 校准说明 + §0.8/§0.9/§0.10**

### 9.1 架构转向核心说明

| 维度 | V3/V4 设计（已废弃或降级） | V5.0.0 新设计 |
|---|---|---|
| 3D 定位 | 教学地基——AnimationMixer 队列、quaternion slerp、行为时间轴 | **第三层增强器**——可选开启，不阻塞核心教学流程 |
| 示范载体 | GLB 动画 clip + Audio 讲解 | **动作示范卡时间轴**（单图 / 3-6 步连续图 / 短视频） |
| 跟练方式 | 底部常驻 3D 动作快捷面板 + 边说边做 | **跟练引导卡**（分步提示 + 用户勾选"我完成了" + 语音/文字输入） |
| 评价维度 | 单一四级评价（动作+语言一起评） | **三种分离评价**：知识（选择题判断）、语言（AI 四级）、行为（自我确认清单） |
| 真实挑战 | 独立任务清单 + 积分奖励 | **课堂→现实迁移训练 + 复盘回链**（完成场景训练自动解锁） |
| 场景模板 | AI 聊天 Prompt 池 | **完整教学包**（知识点/礼仪规则/动作/话术/跟练/角色扮演/挑战/反例） |
| 核心数据结构 | Scenario + Node + BehaviorSequence | **SceneTemplate**（见 PRD §0.8） |

**三种评价的明确边界**：

| 评价类型 | 实现方式 | 文案 | 状态 |
|---|---|---|---|
| 知识评价 | 预置选择题/场景匹配题 → 对比课程规则 | "这个情境下，哪种做法更合适？" | ✅ P0 实现 |
| 语言评价 | AI 语义分析 → 意图匹配度四级分（✅🟡🟠🔴） | "从对话内容看，你的表达..." | ✅ P0 实现 |
| 行为评价 | 第一阶段：用户勾选动作清单自我确认；第二阶段（远期）：摄像头姿态识别 | "请勾选你刚才完成的动作" | ✅ P0 实现自我勾选 |
| 行为评价（摄像头） | MediaPipe / 自定义姿态模型 | "检测到你的动作..." | ❌ **当前不承诺**，列为 P4+ 研究项 |

**关键禁令**（PRD §0.0 延续）：
- ❌ 禁止 AI 自行决定正确礼仪标准
- ❌ 禁止 3D 动画用 setTimeout 硬调度（3D 保留时仍需 AnimationMixer 队列）
- ❌ 禁止评价文案用"对/错/不及格/答错"字眼
- ❌ 禁止 lookAt(camera.position)（3D 启用时仍需遵守）
- ❌ **禁止在没有摄像头的情况下假装做"视觉行为判断"**（ChatGPT §8 明确警告）

### 9.2 Sprint 0（Day 1-2）：SceneTemplate 数据创建

> **目标**：把已有的 9 个礼仪场景 + 8 个话术场景从松散的 markdown/learning_cards 格式升级为结构化 SceneTemplate JSON。这是 V5 的地基——没有 SceneTemplate JSON，后续 Sprint 都无法开始。

#### 9.2.1 目录结构

```
knowledge_base/
├── scene_templates/                    ← 新增
│   ├── _index.json                     ← 模板索引
│   ├── ST-001_first_visit_client.json  ← 第一次拜访客户（完整示例）
│   ├── ST-002_first_meeting.json       ← 初次见面问候
│   ├── ST-003_handshake.json           ← 握手礼仪
│   ├── ST-004_dining_toast.json        ← 用餐祝酒
│   ├── ST-005_job_interview.json       ← 求职面试
│   └── ...（9 礼仪 + 8 话术 = 17 个模板）
└── action_assets/                      ← 新增
    ├── _catalog.json                   ← 动作素材目录
    ├── single/                         ← A级：单张静态图
    │   ├── greet_smile.svg
    │   ├── handshake_ready.svg
    │   ├── handshake_mid.svg
    │   └── bow.svg
    └── sequences/                      ← B级：连续步骤图
        ├── handshake_7step.svg         ← 握手 7 步序列
        ├── enter_room_4step.svg        ← 进房间 4 步序列
        └── bow_3step.svg               ← 鞠躬 3 步序列
```

#### 9.2.2 JSON 字段规范（对齐 PRD §0.8）

每个 SceneTemplate JSON 必须包含以下顶层字段：
- `scene_id`（唯一，ST-001 ~ ST-017）
- `title` / `category` / `scenario_goal` / `learning_objectives[]`
- `knowledge_source[]`（关联到 `learning_cards.js` 中的 Lesson ID）
- `related_rules[]`（关联到 EtiquetteRule ID）
- `scenario_illustration`（SVG 文件名，放在 `assets/images/scenes/`）
- `total_steps` / `estimated_minutes`
- `action_steps[]`（每个含 action_id + instruction + why_this_way + checklist + wrong_examples + assets）
- `dialogue_steps[]`（每个含 dialogue_id + action_step_binding + when_to_say + recommended/acceptable/not_recommended/severely_inappropriate + voice_tone）
- `practice_steps[]`（每个含 practice_id + type + instruction + action_checklist + input_mode + ai_evaluation_dimensions）
- `ai_roleplay`（ai_prompt + npc_persona + difficulty_level + random_events[]）
- `challenge`（title + prompt + requirements + fallback_option + record_form + review_loop）

#### 9.2.3 从现有素材提取内容映射

| 现有来源 | 提取到 SceneTemplate 字段 |
|---|---|
| `knowledge_base/markdown/亲密关系与约会/初次约会.md` | `ST-010_first_date.json` 的 action_steps + dialogue_steps + practice_steps |
| `knowledge_base/markdown/家庭与亲友/亲戚问敏感问题.md` | `ST-012_relatives_sensitive.json` |
| `knowledge_base/markdown/公共服务与办事/酒店入住沟通.md` | `ST-014_hotel_checkin.json` |
| `knowledge_base/course_content/_index.json` | 统一关联 knowledge_source[] |
| `knowledge_base/learning_cards.js` | 补充知识点（why_this_way + wrong_examples） |
| `assets/images/scenes/*.png` | 转换/重绘为 SVG 的 illustration |

#### 9.2.4 验收标准

- [ ] 至少 3 个完整 SceneTemplate JSON（ST-001/002/003）含全部字段
- [ ] `_index.json` 列出全部 17 个模板及 category 映射
- [ ] 每个 action_steps 都有 checklist（3-6 项可勾选）
- [ ] 每个 dialogue_steps 都有 recommended + not_recommended 两极话术
- [ ] challenge 都包含 `fallback_option`（换个更简单的降级选项）

### 9.3 Sprint 1（Day 3-5）：礼仪训练界面重写

> **目标**：替换 V4 依赖 3D 的 HTML/JS 为 V5 的 7 区域固定页面布局（PRD §0.10），实现纯文字+图片驱动的教学闭环。

#### 9.3.1 新增运行时模块

| 文件 | 替代 | 说明 |
|---|---|---|
| `libs/v5_etiquette_training.js` | 替代 `v4_teaching_closed_loop.js` | 礼仪训练主控——SceneTemplate 加载器、7 区域页面状态机、三种评价引擎 |
| `libs/v5_action_renderer.js` | 新增 | 动作示范卡渲染——SVG/连续步骤图时间轴、卡片翻转、"为什么这么做"展开 |
| `libs/v5_evaluator.js` | 新增 | 三种评价引擎——知识（规则匹配）、语言（AI）、行为（自我勾选） |

#### 9.3.2 7 区域页面布局（PRD §0.10 对齐）

```
┌──────────────────────────────────────────┐
│ ① 顶部进度条  3/8 步 | 第2章 · 礼仪训练  │  ← 固定 48px
├──────────────────────────────────────────┤
│ ② 场景插画区（SVG，替代 3D 场景）         │  ← 自适应高度，最大 200px
├──────────────────────────────────────────┤
│ ③ 情境导入卡（场景目标 + 5 条知识点）     │
├──────────────────────────────────────────┤
│ ④ 教学区                                  │
│  ┌────────────────────────────────────┐  │
│  │ 动作示范卡（3-6 步连续图 + 时间轴） │  │
│  │ "为什么这么做" 可展开               │  │
│  │ 反例提示（可展开）                  │  │
│  │ 话术示范（recommended 优先高亮）    │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│ ⑤ 跟练区                                  │
│  ┌────────────────────────────────────┐  │
│  │ □ 我已面向对方                      │  │
│  │ □ 我已做出自然表情                  │  │
│  │ □ 我已说出问候                      │  │
│  │ [文字输入]  [🎤]  [提交]             │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│ ⑥ AI 反馈区                               │
│  知识评价 ✅ | 语言评价 🟡 | 行为 ✅      │
│  "建议：问候可以加上对方的姓氏..."        │  ← 自动消失 1.5-2s
├──────────────────────────────────────────┤
│ ⑦ AI 角色扮演继续（可选）                 │
│  [继续对话]  [开始半开放模式]             │
└──────────────────────────────────────────┘
```

#### 9.3.3 进度与解锁逻辑

- 线性进度：action_step 必须完成（checklist 全部勾选 + 至少一条话术输入）才能进入下一个
- 三种评价**每次都跑**：知识（该步骤的选择题）→ 语言（用户话术 AI 分析）→ 行为（checklist 勾选）
- 积分奖励：每步基础 2 分 + 三种评价全部 ✅ 额外 +3 分
- 挑战解锁：完成整个 SceneTemplate（practice_steps 全部 done）后，challenge 卡片自动激活

#### 9.3.4 验收标准

- [ ] 打开 ST-001 场景，看到完整 7 区域布局，无需任何 3D 资源加载
- [ ] 动作示范卡能渲染 SVG 序列图 + 时间轴标签
- [ ] 点击"为什么这么做"展开/收起
- [ ] 勾选 checklist 后进度条实时更新
- [ ] 提交话术后 AI 反馈区三种评价同时出现，1.5s 后自动收起
- [ ] 完成全部 8 步后，challenge 卡片从灰色锁定变为金色可点击
- [ ] 无任何 3D 相关 console 报错或 canvas 元素

### 9.4 Sprint 2（Day 6-7）：真实挑战重构

> **目标**：真实挑战从"独立任务清单"升级为"课堂→现实迁移训练"，与 SceneTemplate 强绑定，并加入复盘回链。

#### 9.4.1 核心逻辑变更

```
原流程：用户主动点"真实挑战" → 选挑战 → 完成 → 给积分

新流程：
  SceneTemplate 完成
    → 自动解锁对应 challenge（同 scene_id 系列）
    → 用户点"去现实试试"
    → 3秒记录卡（where + feeling + outcome）
    → 提交后 AI 复盘分析
    → 推荐下一个 SceneTemplate（根据 challenge 结果）
```

#### 9.4.2 复盘回链

`challenge.review_loop` 字段（PRD §0.8.5 对齐）驱动：
- 用户 outcome_negative = true → 系统推荐回到当前 SceneTemplate 重练薄弱步骤
- 用户 outcome = "成功但紧张" → 系统推荐同 category 下更难一级的 SceneTemplate
- 用户 outcome = "完全自然" → 系统推荐不同 category 的新场景

#### 9.4.3 3秒记录卡升级

在现有 `duilian_challenge_log` 基础上新增字段：
```json
{
  "scene_id": "ST-001",
  "challenge_id": "CH-001",
  "where": "商务拜访 / 日常社交 / 家庭聚会",
  "feeling_before": "紧张(7)",
  "outcome": ["没敢开口", "尝试了但不自然", "还不错", "很自然"],
  "recommended_next_scene": "ST-003_handshake",
  "review_note": "你提到对方主动伸手时你犹豫了，建议重新练握手的'等待对方先伸手'这一步",
  "fear_predicted": true,
  "outcome_negative": true
}
```

#### 9.4.4 验收标准

- [ ] SceneTemplate 完成后 challenge 自动解锁
- [ ] 降级选项"换个更简单的"按钮始终存在，点击不扣积分
- [ ] 3秒记录卡提交后能正确写入 `duilian_challenge_log`
- [ ] 复盘推荐 SceneTemplate 逻辑可运行（至少关键词匹配版本）
- [ ] 挑战训练对话框**不显示 ABC 答案提示**（PRD 硬约束）

### 9.5 Sprint 3（Day 8-9）：动作素材库

> **目标**：建立可持续扩展的动作素材分级体系，首批覆盖 5 个常见动作。

#### 9.5.1 分级定义（PRD §0.9 对齐）

| 级别 | 类型 | 适用场景 | 制作方式 |
|---|---|---|---|
| A | 单张静态图 | 静态动作（微笑 / 挥手 / 鞠躬静态） | SVG 平面插画（Figma / Inkscape） |
| B | 3-6 张连续步骤图 | 动作序列（握手 7 步 / 进房间 4 步） | SVG 逐帧拆分 |
| C | 短视频 / GIF | 复杂连贯动作（拥抱 / 送别） | MP4 < 3s，WebM 优先 |
| D | 摄像头姿态识别 | 高级功能（不在 P0 范围） | MediaPipe / 自研模型 |

#### 9.5.2 首批动作清单（P0 必做）

| action_id | 中文名 | 级别 | 步骤数 | 素材路径 |
|---|---|---|---|---|
| ACT-SMILE | 微笑 | A | 1 | `action_assets/single/smile.svg` |
| ACT-GREET | 问候 | A | 1 | `action_assets/single/greet.svg` |
| ACT-BOW | 鞠躬 | B | 3 | `action_assets/sequences/bow_3step.svg` |
| ACT-HANDSHAKE | 握手 | B | 7 | `action_assets/sequences/handshake_7step.svg` |
| ACT-ENTER | 进房间 | B | 4 | `action_assets/sequences/enter_room_4step.svg` |

#### 9.5.3 风格规范

- 人物：统一简洁的火柴人 / 扁平插画风格，肤色/服装保持一致
- 画布：16:9 横版，375×211px（移动端最大宽度适配）
- 无背景干扰，纯色或极简线条背景
- 箭头标注动作方向（如 "↓ 身体前倾 15°"）

### 9.6 文件变更清单（V5.0.0）

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/prd.md` | 修改 | 升级 v5.0.0 + 新增 §0.8/§0.9/§0.10 |
| `docs/development-plan-v3.md` | 修改 | 追加第九章 V5 计划 |
| `knowledge_base/scene_templates/_index.json` | ✅ 新增 | 17 个模板索引 |
| `knowledge_base/scene_templates/ST-001_first_visit_client.json` | ✅ 新增 | 第一个完整模板示例 |
| `knowledge_base/scene_templates/ST-002_first_meeting.json` | ✅ 新增 | |
| `knowledge_base/scene_templates/ST-003_handshake.json` | ✅ 新增 | |
| `knowledge_base/action_assets/_catalog.json` | ✅ 新增 | 动作素材目录 |
| `knowledge_base/action_assets/single/*.svg` | ✅ 新增 | 首批 A 级素材 |
| `knowledge_base/action_assets/sequences/*.svg` | ✅ 新增 | 首批 B 级素材 |
| `libs/v5_etiquette_training.js` | ✅ 新增 | 礼仪训练主控模块 |
| `libs/v5_action_renderer.js` | ✅ 新增 | 动作示范卡渲染器 |
| `libs/v5_evaluator.js` | ✅ 新增 | 三种评价引擎 |
| `index.html` | 修改 | 礼仪训练入口指向新模板加载器 |
| `assets/images/scenes/*.svg` | ✅ 新增 | 场景插画（SVG 版） |
| `libs/v4_teaching_closed_loop.js` | **保留但不修改** | 3D 可选路径，不侵入 V5 |
| `game_stage3d.js` / `v3_3d_fix.js` | **保留但不修改** | 第三层增强器，可选加载 |

### 9.7 V5 冒烟测试清单（12 项）

| # | 测试项 | 验证方法 | 通过标准 |
|---|---|---|---|
| 1 | SceneTemplate JSON 加载 | `fetch('scene_templates/ST-001_first_visit_client.json')` | 无 404，字段完整 |
| 2 | 7 区域页面渲染 | 打开礼仪训练入口 | 7 区域全部可见，48px 进度条 + 动作示范卡正常 |
| 3 | 动作示范卡时间轴 | 查看握手步骤 | 7 张连续图横向排列，时间轴标签清晰 |
| 4 | "为什么这么做"可展开 | 点击每个 action_step 的展开按钮 | 平滑展开/收起，内容来自 SceneTemplate |
| 5 | checklist 勾选驱动进度 | 完成全部 checklist | 进度条实时前进，步骤按钮变绿 |
| 6 | 知识评价选择题 | 完成某个 practice_step | 4 个选项随机，答案匹配 `related_rules` |
| 7 | 语言评价 AI 四级分 | 提交话术 | 返回 ✅🟡🟠🔴 之一 + 原因解释 |
| 8 | 行为评价自我勾选 | practice 完成后 | 用户勾选动作清单，系统记录到 log |
| 9 | AI 反馈区自动消失 | 评价后等待 | 1.5-2s 后平滑收起，不阻塞操作 |
| 10 | SceneTemplate 完成 → challenge 解锁 | 完成 8 步全流程 | challenge 卡片从 🔒 变为 ✅，无扣分提示 |
| 11 | 降级选项 | challenge 中点击"换个更简单的" | 不扣积分，进入降级模板 |
| 12 | 3D 不阻塞教学 | 屏蔽 Three.js 加载 | 礼仪训练完整可用，无 canvas 错误 |

### 9.8 与 ChatGPT 24 章方案的对照验证

| ChatGPT 章节 | 本计划对应 Sprint | 验证 |
|---|---|---|
| §1-3 3D → 辅助，核心 = 文字+动作图+话术+跟练+AI反馈 | Sprint 1（7 区域页面） | ✅ |
| §4-6 动作示范卡 | Sprint 3（A/B 级素材） | ✅ |
| §7 场景 = 行为 + 语言 | SceneTemplate action_steps + dialogue_steps 绑定 | ✅ |
| §8 无摄像头不假装判断行为 | 行为评价 = 自我勾选 | ✅ |
| §9 三种评价 | v5_evaluator.js 三模块 | ✅ |
| §10-11 7 区域 UI | Sprint 1 页面布局 | ✅ |
| §12 SceneTemplate | knowledge_base/scene_templates/*.json | ✅ |
| §13 完整教学包 | 每个 SceneTemplate = 知识+动作+话术+练习+AI+挑战 | ✅ |
| §14-16 真实挑战 = 课堂→现实迁移+复盘回链 | Sprint 2 | ✅ |
| §17 3D = 第三层增强器 | 保留 v4/v3 的 3D 文件但不加载 | ✅ |
| §18 完整架构图 | PRD §0.1 十步引擎框架（保留） | ✅ |
| §21 动作素材库分级 | §0.9 + Sprint 3 | ✅ |
| §23 最终判断表 | —— | ✅ 整体符合 |

---

## 九、V5.0.0 礼仪训练 + 真实挑战重构计划

**创建日期：2026-09-19 ｜ 前置依赖：V4 Sprint 0-3 已完成 ｜ PRD 基准：docs/prd.md v5.0.0 校准说明 + §0.8/§0.9/§0.10**

### 9.1 架构转向核心说明

| 维度 | V3/V4 设计（已废弃或降级） | V5.0.0 新设计 |
|---|---|---|
| 3D 定位 | 教学地基——AnimationMixer 队列、quaternion slerp、行为时间轴 | **第三层增强器**——可选开启，不阻塞核心教学流程 |
| 示范载体 | GLB 动画 clip + Audio 讲解 | **动作示范卡时间轴**（单图 / 3-6 步连续图 / 短视频） |
| 跟练方式 | 底部常驻 3D 动作快捷面板 + 边说边做 | **跟练引导卡**（分步提示 + 用户勾选"我完成了" + 语音/文字输入） |
| 评价维度 | 单一四级评价（动作+语言一起评） | **三种分离评价**：知识（选择题判断）、语言（AI 四级）、行为（自我确认清单） |
| 真实挑战 | 独立任务清单 + 积分奖励 | **课堂→现实迁移训练 + 复盘回链**（完成场景训练自动解锁） |
| 场景模板 | AI 聊天 Prompt 池 | **完整教学包**（知识点/礼仪规则/动作/话术/跟练/角色扮演/挑战/反例） |
| 核心数据结构 | Scenario + Node + BehaviorSequence | **SceneTemplate**（见 PRD §0.8） |

**三种评价的明确边界**：

| 评价类型 | 实现方式 | 文案 | 状态 |
|---|---|---|---|
| 知识评价 | 预置选择题/场景匹配题 → 对比课程规则 | "这个情境下，哪种做法更合适？" | ✅ P0 实现 |
| 语言评价 | AI 语义分析 → 意图匹配度四级分 | "从对话内容看，你的表达..." | ✅ P0 实现 |
| 行为评价 | 第一阶段：用户勾选动作清单自我确认 | "请勾选你刚才完成的动作" | ✅ P0 实现自我勾选 |
| 行为评价（摄像头） | MediaPipe / 自定义姿态模型 | —— | ❌ 当前不承诺，P4+ 研究项 |

**关键禁令**（PRD §0.0 延续）：
- ❌ 禁止 AI 自行决定正确礼仪标准
- ❌ 禁止 3D 动画用 setTimeout 硬调度
- ❌ 禁止评价文案用"对/错/不及格/答错"字眼
- ❌ 禁止 lookAt(camera.position)（3D 启用时仍需遵守）
- ❌ **禁止在没有摄像头的情况下假装做"视觉行为判断"**

### 9.2 Sprint 0（Day 1-2）：SceneTemplate 数据创建

> **目标**：把已有的 9 个礼仪场景 + 8 个话术场景从松散的 markdown/learning_cards 格式升级为结构化 SceneTemplate JSON。这是 V5 的地基。

#### 9.2.1 目录结构

`
knowledge_base/
├── scene_templates/                    ← 新增
│   ├── _index.json                     ← 模板索引
│   ├── ST-001_first_visit_client.json  ← 完整示例
│   ├── ST-002_first_meeting.json
│   └── ...（9 礼仪 + 8 话术 = 17 个模板）
└── action_assets/                      ← 新增
    ├── _catalog.json                   ← 动作素材目录
    ├── single/                         ← A级：单张静态图
    └── sequences/                      ← B级：连续步骤图
`

#### 9.2.2 JSON 字段规范（对齐 PRD §0.8）

每个 SceneTemplate JSON 必须包含：
- scene_id（唯一，ST-001 ~ ST-017）
- 	itle / category / scenario_goal / learning_objectives[]
- knowledge_source[] / elated_rules[]
- scenario_illustration / 	otal_steps / estimated_minutes
- ction_steps[] / dialogue_steps[] / practice_steps[]
- i_roleplay / challenge

#### 9.2.3 从现有素材提取映射

| 现有来源 | 提取到 SceneTemplate 字段 |
|---|---|
| markdown/亲密关系与约会/初次约会.md | ST-010_first_date.json |
| markdown/家庭与亲友/亲戚问敏感问题.md | ST-012_relatives_sensitive.json |
| markdown/公共服务与办事/酒店入住沟通.md | ST-014_hotel_checkin.json |
| learning_cards.js | 补充 why_this_way + wrong_examples |
| ssets/images/scenes/*.png | 重绘为 SVG illustration |

#### 9.2.4 验收标准

- [ ] 至少 3 个完整 SceneTemplate JSON（ST-001/002/003）
- [ ] _index.json 列出全部 17 个模板
- [ ] 每个 action_steps 有 checklist（3-6 项）
- [ ] 每个 dialogue_steps 有 recommended + not_recommended
- [ ] challenge 都包含 allback_option（降级选项）

### 9.3 Sprint 1（Day 3-5）：礼仪训练界面重写

> **目标**：替换 V4 依赖 3D 的 HTML/JS 为 V5 的 7 区域固定页面布局（PRD §0.10）。

#### 9.3.1 新增运行时模块

| 文件 | 说明 |
|---|---|
| libs/v5_etiquette_training.js | 礼仪训练主控——SceneTemplate 加载器、7 区域状态机 |
| libs/v5_action_renderer.js | 动作示范卡渲染——SVG 序列图 + 时间轴 + 展开/收起 |
| libs/v5_evaluator.js | 三种评价引擎——知识/语言/行为 |

#### 9.3.2 7 区域页面布局

① 顶部进度条（固定 48px）→ ② 场景插画区（SVG，最大 200px）→ ③ 情境导入卡 → ④ 教学区（动作示范卡 + 话术示范）→ ⑤ 跟练区（checklist + 文字/语音输入）→ ⑥ AI 反馈区（1.5-2s 自动消失）→ ⑦ AI 角色扮演继续

#### 9.3.3 进度与解锁逻辑

- 线性进度：checklist 全部勾选 + 至少一条话术 → 才能进入下一步
- 三种评价**每次都跑**
- 每步基础 2 分 + 三种评价全 ✅ 额外 +3 分
- 完成整个 SceneTemplate 后 challenge 自动激活

#### 9.3.4 验收标准

- [ ] 完整 7 区域布局，无需 3D 加载
- [ ] 动作示范卡渲染 SVG 序列图 + 时间轴
- [ ] "为什么这么做"展开/收起流畅
- [ ] checklist 驱动进度条
- [ ] AI 反馈区自动消失
- [ ] 完成全流程后 challenge 自动解锁
- [ ] 无 3D console 报错

### 9.4 Sprint 2（Day 6-7）：真实挑战重构

#### 9.4.1 核心逻辑

`
原：用户主动点"真实挑战" → 选挑战 → 完成 → 给积分

新：SceneTemplate 完成 → 自动解锁 challenge → 用户点"去现实试试" → 3秒记录卡 → 提交 → AI 复盘 → 推荐下一个 SceneTemplate
`

#### 9.4.2 复盘回链

- outcome_negative → 重练当前薄弱步骤
- 成功但紧张 → 同 category 更难一级
- 完全自然 → 不同 category 新场景

#### 9.4.3 3秒记录卡字段升级

`json
{
  "scene_id": "ST-001",
  "challenge_id": "CH-001",
  "where": "商务拜访",
  "feeling_before": "紧张(7)",
  "outcome": "尝试了但不自然",
  "recommended_next_scene": "ST-003_handshake",
  "review_note": "你提到对方伸手时你犹豫了，建议重练'等待对方先伸手'",
  "fear_predicted": true,
  "outcome_negative": true
}
`

#### 9.4.4 验收标准

- [ ] SceneTemplate 完成后 challenge 自动解锁
- [ ] 降级选项按钮始终存在，点击不扣积分
- [ ] 3秒记录卡正确写入 duilian_challenge_log
- [ ] 复盘推荐逻辑可运行（关键词匹配）
- [ ] **挑战训练对话框不显示 ABC 答案提示**（PRD 硬约束）



### 9.5 Sprint 3（Day 8-9）：动作素材库

> **目标**：建立可持续扩展的动作素材分级体系，首批覆盖 5 个常见动作。

#### 9.5.1 分级定义（PRD §0.9 对齐）

| 级别 | 类型 | 适用 | 制作方式 |
|---|---|---|---|
| A | 单张静态图 | 静态动作（微笑 / 挥手） | SVG 平面插画 |
| B | 3-6 张连续步骤图 | 动作序列（握手 7 步 / 鞠躬 3 步） | SVG 逐帧拆分 |
| C | 短视频 / GIF | 复杂连贯动作 | MP4 < 3s |
| D | 摄像头姿态识别 | 高级功能 | MediaPipe（P4+） |

#### 9.5.2 首批动作清单（P0 必做）

| action_id | 中文名 | 级别 | 步骤数 | 素材路径 |
|---|---|---|---|---|
| ACT-SMILE | 微笑 | A | 1 | ction_assets/single/smile.svg |
| ACT-GREET | 问候 | A | 1 | ction_assets/single/greet.svg |
| ACT-BOW | 鞠躬 | B | 3 | ction_assets/sequences/bow_3step.svg |
| ACT-HANDSHAKE | 握手 | B | 7 | ction_assets/sequences/handshake_7step.svg |
| ACT-ENTER | 进房间 | B | 4 | ction_assets/sequences/enter_room_4step.svg |

#### 9.5.3 风格规范

- 人物：统一简洁扁平插画风格，肤色/服装一致
- 画布：16:9 横版，375x211px
- 箭头标注动作方向（如"↓ 身体前倾 15°"）

### 9.6 文件变更清单（V5.0.0）

| 文件 | 变更 | 说明 |
|---|---|---|
| docs/prd.md | 修改 | 升级 v5.0.0 + 新增 §0.8/§0.9/§0.10 |
| docs/development-plan-v3.md | 修改 | 追加第九章 V5 计划 |
| knowledge_base/scene_templates/_index.json | ✅ 新增 | 17 个模板索引 |
| knowledge_base/scene_templates/ST-001_*.json | ✅ 新增 | 完整模板示例 x3 |
| knowledge_base/action_assets/_catalog.json | ✅ 新增 | 动作素材目录 |
| knowledge_base/action_assets/single/*.svg | ✅ 新增 | A 级素材 |
| knowledge_base/action_assets/sequences/*.svg | ✅ 新增 | B 级素材 |
| libs/v5_etiquette_training.js | ✅ 新增 | 礼仪训练主控 |
| libs/v5_action_renderer.js | ✅ 新增 | 动作示范卡渲染器 |
| libs/v5_evaluator.js | ✅ 新增 | 三种评价引擎 |
| index.html | 修改 | 礼仪训练入口指向新加载器 |
| ssets/images/scenes/*.svg | ✅ 新增 | 场景插画 |
| 4_teaching_closed_loop.js | **保留不动** | 3D 可选路径 |
| game_stage3d.js | **保留不动** | 第三层增强器 |

### 9.7 V5 冒烟测试清单（12 项）

| # | 测试项 | 通过标准 |
|---|---|---|
| 1 | SceneTemplate JSON 加载 | etch 无 404，字段完整 |
| 2 | 7 区域页面渲染 | 48px 进度条 + 动作示范卡正常 |
| 3 | 动作示范卡时间轴 | 连续图横向排列，时间轴标签清晰 |
| 4 | "为什么这么做"可展开 | 平滑展开/收起 |
| 5 | checklist 驱动进度 | 进度条实时前进 |
| 6 | 知识评价选择题 | 4 选项随机，答案匹配 rules |
| 7 | 语言评价 AI 四级分 | 返回 ✅🟡🟠🔴 + 原因 |
| 8 | 行为评价自我勾选 | 记录到 log |
| 9 | AI 反馈区自动消失 | 1.5-2s 后平滑收起 |
| 10 | 完成全流程 → challenge 解锁 | 从 🔒 变 ✅ |
| 11 | 降级选项 | 不扣积分，进入降级模板 |
| 12 | 3D 不阻塞教学 | 屏蔽 Three.js 后仍完整可用 |

### 9.8 与 ChatGPT 24 章方案对照

| ChatGPT 章节 | 本计划 Sprint | 验证 |
|---|---|---|
| §1-3 3D → 辅助，核心 = 文字+动作图+话术+跟练+AI反馈 | Sprint 1（7 区域） | ✅ |
| §4-6 动作示范卡 | Sprint 3（A/B 级） | ✅ |
| §7 场景 = 行为 + 语言 | action_steps + dialogue_steps 绑定 | ✅ |
| §8 无摄像头不假装判断行为 | 自我勾选 | ✅ |
| §9 三种评价 | v5_evaluator.js | ✅ |
| §10-11 7 区域 UI | Sprint 1 | ✅ |
| §12 SceneTemplate | scene_templates/*.json | ✅ |
| §13 完整教学包 | 每个模板 = 全链路 | ✅ |
| §14-16 真实挑战 = 迁移+复盘回链 | Sprint 2 | ✅ |
| §17 3D = 第三层增强器 | 保留但不加载 | ✅ |
| §21 动作素材库分级 | §0.9 + Sprint 3 | ✅ |
| §23 最终判断表 | —— | ✅ 符合 |

