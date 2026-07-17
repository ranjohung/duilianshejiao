# API接口前后端一致性分析报告

**报告日期：** 2026-07-16
**版本：** v1.0
**范围：** 前端(Dart/Flutter) + 后端(Node.js/Express) + PRD文档对照

---

## 一、分析方法

1. 提取前端 API 调用点（`lib/network/services/*.dart`）
2. 提取后端路由声明（`server/src/routes/*.js`）
3. 提取后端控制器逻辑（`server/src/controllers/*.js`）
4. 对照 PRD 文档（`docs/backend/api.md`）
5. 验证路径、参数、响应体的一致性

---

## 二、问题分类汇总

| 严重程度 | 问题数量 | 已修复 | 说明 |
|---------|---------|--------|------|
| 🔴 高 | 6 | 6 | 路径不匹配、参数不匹配，导致接口完全不可用 |
| 🟡 中 | 4 | 4 | 响应字段缺失、错误码不规范 |
| 🟢 低 | 3 | 0 | 字段命名不一致、逻辑未实现（问题5、12、13） |

---

## 三、详细问题分析

### 3.1 认证模块

#### 问题1：刷新Token接口参数不匹配 ✅ 已修复

| 项目 | 前端(Dart) | 后端(Node.js) |
|------|-----------|--------------|
| 路径 | `/api/auth/refresh` | `/api/auth/refresh-token` → `/api/auth/refresh` |
| 请求参数 | `refreshToken` | `token` → `refreshToken` |

**修复内容：**
- 后端路由路径从 `/refresh-token` 修改为 `/refresh`
- 参数名从 `token` 修改为 `refreshToken`
- 响应添加 `refreshToken` 字段

**代码修改位置：**
- [auth.routes.js](file:///f:/开发软件项目文件/对练社交/server/src/routes/auth.routes.js#L32-L35)
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L125)

---

#### 问题2：登录/注册响应字段缺失 ✅ 已修复

| 字段 | PRD要求 | 后端实际返回 |
|------|---------|-------------|
| `user_id` | ✅ | ✅ |
| `token` | ✅ | ✅ |
| `nickname` | ✅ | ❌ → ✅ |
| `member_level` | ✅ | ❌ → ✅ |
| `training_points` | ✅ | ❌ → ✅ |
| `real_name_level` | ✅ | ❌ → ✅ |
| `real_name_required` | ✅ (注册) | ❌ → ✅ |

**修复内容：**
- 注册响应添加：`nickname`、`memberLevel`、`trainingPoints`、`realNameLevel`、`realNameRequired`、`refreshToken`
- 登录响应添加：`nickname`、`memberLevel`、`trainingPoints`、`realNameLevel`、`realNameRequired`、`refreshToken`

**代码修改位置：**
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L34-L43)（注册）
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L74-L83)（登录）

---

#### 问题3：RefreshToken存储逻辑不一致 ✅ 已修复

**修复内容：**
- 登录/注册响应添加 `refreshToken` 字段
- 刷新Token响应添加 `refreshToken` 字段

**代码修改位置：**
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L152)（刷新Token）
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L37)（注册）
- [auth.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/auth.controller.js#L77)（登录）

---

### 3.2 场景模块

#### 问题4：检查解锁接口路径不匹配 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 路径 | `/api/scenes/:sceneId/unlock-check` → `/api/scenes/:sceneId/check-unlock` | `/api/scenes/:sceneId/check-unlock` |

**修复内容：**
- 前端路径从 `unlock-check` 修改为 `check-unlock`

**代码修改位置：**
- [scene_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/scene_service.dart#L54-L56)

---

#### 问题5：开始训练接口路径不匹配 ⚠️ 部分修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 路径 | `/api/scenes/:sceneId/start` | `/api/scenes/:id/start` |
| 模块 | 场景模块 | 场景模块 |

**修复内容：**
- TrainingService 的 startTraining 改为调用 `/api/training/start` ✅
- SceneService 的 startTraining 保持调用场景模块 `/api/scenes/:id/start`（用于场景内直接开始）

**未完成：**
- 后端 `scene.startScene` 函数仍为空实现，需要调用训练模块的 `startTraining`

**代码修改位置：**
- [api_routes.dart](file:///f:/开发软件项目文件/对练社交/lib/network/api_routes.dart#L32)（添加 trainingStart 路由）
- [training_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/training_service.dart#L15-L21)

---

#### 问题6：完成训练接口路径错误 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 路径 | `/api/scenes/:sceneId/complete` → `/api/training/end` | `/api/training/end` |
| 模块 | 场景模块 → 训练模块 | 训练模块 |

**修复内容：**
- SceneService 的 completeTraining 改为调用 `/api/training/end`
- 参数名从 `trainingId` 修改为 `sessionId`

**代码修改位置：**
- [api_routes.dart](file:///f:/开发软件项目文件/对练社交/lib/network/api_routes.dart#L34)（添加 trainingEnd 路由）
- [scene_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/scene_service.dart#L84-L93)

---

### 3.3 训练模块

#### 问题7：发送消息参数名称不匹配 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 参数名 | `trainingId` → `sessionId` | `sessionId` |

**修复内容：**
- TrainingService 的 sendMessage、sendMessageStream、chat 方法参数名从 `trainingId` 修改为 `sessionId`
- 路径从 `/api/training/chat` 修改为 `/api/training/message`

**代码修改位置：**
- [api_routes.dart](file:///f:/开发软件项目文件/对练社交/lib/network/api_routes.dart#L33)（添加 trainingMessage 路由）
- [training_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/training_service.dart#L34-L71)

---

#### 问题8：开始训练接口路径错误 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 路径 | `/api/scenes/:sceneId/start` → `/api/training/start` | `/api/training/start` |

**修复内容：**
- TrainingService 的 startTraining 改为调用 `/api/training/start`
- 使用 `ApiRoutes.trainingStart` 路由常量

**代码修改位置：**
- [api_routes.dart](file:///f:/开发软件项目文件/对练社交/lib/network/api_routes.dart#L32)（添加 trainingStart 路由）
- [training_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/training_service.dart#L15-L21)

---

#### 问题9：结束训练接口路径错误 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 路径 | `/api/scenes/:trainingId/complete` → `/api/training/end` | `/api/training/end` |

**修复内容：**
- TrainingService 的 endTraining 改为调用 `/api/training/end`
- 参数名从 `trainingId` 修改为 `sessionId`

**代码修改位置：**
- [api_routes.dart](file:///f:/开发软件项目文件/对练社交/lib/network/api_routes.dart#L34)（添加 trainingEnd 路由）
- [training_service.dart](file:///f:/开发软件项目文件/对练社交/lib/network/services/training_service.dart#L74-L87)

---

### 3.4 响应格式问题

#### 问题10：错误响应格式不规范 ✅ 已修复

| 项目 | PRD规范 | 后端实际 |
|------|---------|---------|
| 结构 | `{ code, message, details }` | `{ code: statusCode, message, data: details }` → `{ code: 业务错误码, message, data, details }` |
| 错误码 | 业务错误码(如40001) | HTTP状态码(如400) → 业务错误码(如40400) |

**修复内容：**
- 错误码转换：4xx → 40000 + statusCode，500 → 50000
- 响应结构同时包含 `data`（兼容旧代码）和 `details`（PRD规范）

**代码修改位置：**
- [response.js](file:///f:/开发软件项目文件/对练社交/server/src/utils/response.js#L5-L15)

---

#### 问题11：分页参数命名不一致 ✅ 已修复

| 项目 | 前端 | 后端 |
|------|------|------|
| 每页数量 | `page_size` | `pageSize` → 兼容 `page_size` 和 `pageSize` |

**修复内容：**
- 后端同时支持 `page_size`（PRD规范）和 `pageSize`（兼容旧代码）
- 默认值从10改为20（符合PRD规范）

**代码修改位置：**
- [training.controller.js](file:///f:/开发软件项目文件/对练社交/server/src/controllers/training.controller.js#L280)

---

### 3.5 功能缺失

#### 问题12：自定义场景接口缺失

根据PRD v2.1，需要以下接口：

| 接口 | 方法 | 状态 |
|------|------|------|
| `/api/scenes/custom` | POST | ❌ 缺失 |
| `/api/scenes/custom` | GET | ❌ 缺失 |
| `/api/scenes/templates` | GET | ❌ 缺失 |
| `/api/scenes/custom/:id` | PUT | ❌ 缺失 |
| `/api/scenes/custom/:id/visibility` | PUT | ❌ 缺失 |

**影响：** 自定义场景功能无法使用

**修复建议：** 在 `scene.controller.js` 中添加相关接口

---

#### 问题13：用户形象接口缺失

根据PRD v2.1，需要以下接口：

| 接口 | 方法 | 状态 |
|------|------|------|
| `/api/user/avatar/upload` | POST | ❌ 缺失 |
| `/api/user/avatar` | GET | ❌ 缺失 |
| `/api/user/avatar` | PUT | ❌ 缺失 |
| `/api/user/avatar` | DELETE | ❌ 缺失 |

**影响：** 用户形象上传功能无法使用

**修复建议：** 在 `user.controller.js` 中添加相关接口

---

## 四、修复优先级建议

### 第一优先级（必须修复才能运行）

1. 🔴 问题1：刷新Token路径和参数统一
2. 🔴 问题4：检查解锁接口路径统一
3. 🔴 问题6：完成训练接口路径修正
4. 🔴 问题7：发送消息参数名统一
5. 🔴 问题8：开始训练接口路径修正
6. 🔴 问题9：结束训练接口路径修正

### 第二优先级（影响用户体验）

1. 🟡 问题2：登录/注册响应字段补充
2. 🟡 问题3：RefreshToken字段补充
3. 🟡 问题10：错误响应格式规范
4. 🟡 问题11：分页参数命名统一

### 第三优先级（功能缺失）

1. 🟢 问题5：场景开始训练逻辑实现
2. 🟢 问题12：自定义场景接口实现
3. 🟢 问题13：用户形象接口实现

---

## 五、接口一致性对照表

### 5.1 认证模块

| 接口 | 前端调用 | 后端路由 | 状态 |
|------|---------|---------|------|
| 注册 | POST `/api/auth/register` | POST `/api/auth/register` | ✅ |
| 登录 | POST `/api/auth/login` | POST `/api/auth/login` | ✅ |
| 发送验证码 | POST `/api/auth/send-code` | POST `/api/auth/send-code` | ✅ |
| 实名认证 | POST `/api/auth/verify-real-name` | POST `/api/auth/verify-real-name` | ✅ |
| 刷新Token | POST `/api/auth/refresh` | POST `/api/auth/refresh` | ✅ |
| 退出登录 | - | POST `/api/auth/logout` | ⚠️ 前端未实现 |

### 5.2 场景模块

| 接口 | 前端调用 | 后端路由 | 状态 |
|------|---------|---------|------|
| 获取场景列表 | GET `/api/scenes` | GET `/api/scenes` | ✅ |
| 获取场景详情 | GET `/api/scenes/:id` | GET `/api/scenes/:id` | ✅ |
| 检查解锁 | GET `/api/scenes/:id/check-unlock` | GET `/api/scenes/:sceneId/check-unlock` | ✅ |
| 开始训练 | POST `/api/scenes/:id/start` | POST `/api/scenes/:id/start` | ⚠️ 后端未实现逻辑 |

### 5.3 训练模块

| 接口 | 前端调用 | 后端路由 | 状态 |
|------|---------|---------|------|
| 开始训练 | POST `/api/training/start` | POST `/api/training/start` | ✅ |
| 发送消息 | POST `/api/training/message` | POST `/api/training/message` | ✅ |
| 结束训练 | POST `/api/training/end` | POST `/api/training/end` | ✅ |
| 训练历史 | GET `/api/training/records` | GET `/api/training/records` | ✅ |
| 训练详情 | GET `/api/training/records/:id` | GET `/api/training/records/:id` | ✅ |

---

## 六、总结

### 已修复的核心问题 ✅

1. **路径不匹配**：训练模块的接口路径已统一到 `/api/training/*`
2. **参数不匹配**：`trainingId` → `sessionId`，`token` → `refreshToken`
3. **响应格式不统一**：错误码转换为业务错误码，添加 `details` 字段
4. **登录/注册响应字段缺失**：补充了 `nickname`、`memberLevel`、`trainingPoints`、`realNameLevel`、`realNameRequired`、`refreshToken`

### 遗留问题 ⚠️

1. **场景模块 startScene 为空实现**：需要调用训练模块的 startTraining
2. **自定义场景接口缺失**：需要实现 `/api/scenes/custom/*` 接口
3. **用户形象接口缺失**：需要实现 `/api/user/avatar/*` 接口

### 建议的后续工作

1. 实现场景模块 startScene 的完整逻辑
2. 添加自定义场景接口（MVP后阶段）
3. 添加用户形象上传接口（MVP后阶段）
