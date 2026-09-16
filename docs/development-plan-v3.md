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

> 遵循 v3 运行时补丁模式，**新增独立模块 `libs/v4_teaching_closed_loop.js`**，不侵入 index.html 的礼仪/挑战基础对话逻辑，降低破坏风险。接入点为礼仪训练关卡列表（运行时包装 `renderEtiquetteLevelList`）、`window.Stage3D`、`window.DUILIAN_ACTIONS`、`duilian_training_log`。

### 8.1 四级教学闭环
- [ ] 关卡列表新增【📖 进入跟练模式】入口按钮（运行时包装 `renderEtiquetteLevelList`，追加到每关卡片）。
- [ ] **看示范（观看模式）**：播放 3D 动作时间线（靠近→注视→微笑→伸手→说话→握手→松手→自然站立），同步展示\"行为时间轴\"（00:00…00:05），每到关键节点**暂停并弹出\"为什么这么做\"讲解**。
- [ ] **跟练模式（低压力模仿）**：逐步提示\"现在请看向对方 / 微笑并伸手 / 说'您好'\"；用户点动作图标 + 语音输入**并发完成**（动作不打断输入）。
- [ ] **半开放训练（自主决策）**：只给场景不提示；用户自由决定说话与动作；AI 记录行为时间线并复盘\"动作-语言衔接\"。
- [ ] **真实模拟（高自由度）**：不告诉答案，AI 自由反应；随机触发意外（声音小/没回应/插话/冷淡/距离近/主动伸手或没伸手）。

### 8.2 行为时间线 + 边说边做快捷面板
- [ ] 训练底部常驻悬浮动作图标（微笑/点头/握手/鞠躬/挥手），**点击立即触发 3D 动作并打时间戳，不打断当前语音/文字输入**（替代现有\"选中自动写入输入框前缀\"的做法）。
- [ ] 每次训练把\"动作触发时间点 + 语音/文字内容\"合并到同一条时间轴，写入 `duilian_training_log`。

### 8.3 课程绑定
- [ ] `duilian_profile` 建立 `Lesson / EtiquetteRule / TrainingScenario` 数据结构（字段见 docs/prd.md §0.3）。
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
7. 新用户首次出现\"30 秒问候\"卡片且可一键开始。
8. 埋点事件（`ai_training_completed` 等）在对应时机触发并带参数。
