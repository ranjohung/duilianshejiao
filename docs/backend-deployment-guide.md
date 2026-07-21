# 「对练社交」后端部署操作指南

> 本指南专为小白用户编写，每一步都有详细说明和截图提示。

---

## 📋 部署前准备

后端部署需要以下几个云服务账号，请提前注册：

| 服务 | 用途 | 免费额度 | 注册地址 |
|------|------|---------|---------|
| PlanetScale | MySQL数据库 | 免费（1GB存储） | https://planetscale.com/ |
| Upstash | Redis缓存 | 免费（100MB存储） | https://upstash.com/ |
| DeepSeek | AI对话API | 需充值（新用户有赠送） | https://platform.deepseek.com/ |
| Azure | 语音合成(TTS) | 免费试用（可选） | https://azure.microsoft.com/ |

---

## 🔧 步骤一：创建MySQL数据库（PlanetScale）

### 1.1 注册并登录

1. 打开浏览器访问：https://planetscale.com/
2. 点击右上角 **Sign Up** 注册账号（可以用GitHub账号登录）
3. 登录成功后，进入控制台

### 1.2 创建数据库

1. 在控制台首页，点击 **New Database** 按钮
2. 输入数据库名称：`duilian-social`（或其他你喜欢的名称）
3. 选择区域：建议选择离你最近的区域（如 `asia-northeast` 东京或 `asia-east` 香港）
4. 点击 **Create database** 创建

### 1.3 获取连接信息

1. 数据库创建成功后，点击进入数据库详情页
2. 点击顶部菜单的 **Connect**
3. 在 **Connect with** 下拉框中选择 **Node.js**
4. 复制以下信息，保存下来：
   - **DATABASE_URL**（完整的连接字符串）
   - 或者分别记录：
     - **Host**: `xxx.psdb.cloud`
     - **Username**: `xxx`
     - **Password**: `xxx`
     - **Database**: `main`

> ⚠️ **注意**：这个密码只显示一次，一定要复制保存好！

---

## 🔧 步骤二：创建Redis缓存（Upstash）

### 2.1 注册并登录

1. 打开浏览器访问：https://upstash.com/
2. 点击右上角 **Sign Up** 注册账号（可以用GitHub账号登录）
3. 登录成功后，进入控制台

### 2.2 创建Redis

1. 在控制台首页，点击 **Create Redis** 按钮
2. 输入实例名称：`duilian-redis`（或其他你喜欢的名称）
3. 选择区域：建议选择和PlanetScale相同的区域
4. 点击 **Create** 创建

### 2.3 获取连接信息

1. Redis创建成功后，进入实例详情页
2. 复制以下信息，保存下来：
   - **REDIS_URL**（格式：`redis://:password@host:port`）

---

## 🔧 步骤三：获取DeepSeek API Key

### 3.1 注册并登录

1. 打开浏览器访问：https://platform.deepseek.com/
2. 点击右上角登录注册账号

### 3.2 获取API Key

1. 登录成功后，点击右上角头像 → **API Keys**
2. 点击 **Create new key** 创建新密钥
3. 输入密钥名称：`duilian-social`
4. 点击 **Create**
5. 复制生成的API Key，保存下来

> ⚠️ **注意**：这个密钥只显示一次，一定要复制保存好！

---

## 🔧 步骤四：（可选）获取Azure TTS Key

如果需要语音合成功能，需要此步骤。暂时不需要可以跳过。

1. 打开浏览器访问：https://azure.microsoft.com/
2. 注册账号并登录
3. 创建资源 → 搜索 **Speech** → 创建Speech资源
4. 在资源中找到 **Keys and Endpoint**
5. 复制 **Key1** 和 **Region**（如 `eastasia`），保存下来

---

## 🔧 步骤五：在Vercel配置环境变量

### 5.1 登录Vercel

1. 打开浏览器访问：https://vercel.com/
2. 使用GitHub账号登录

### 5.2 创建项目（如果还没有）

1. 在Vercel控制台，点击 **Add New...** → **Project**
2. 选择你的GitHub仓库 `对练社交`
3. 点击 **Import**
4. **不需要点击Deploy**，先进行环境变量配置

### 5.3 配置环境变量

1. 在项目页面，点击顶部菜单的 **Settings**
2. 在左侧菜单点击 **Environment Variables**
3. 点击 **Add Environment Variable** 添加以下变量：

| 变量名 | 填什么 | 示例 |
|--------|--------|------|
| `PORT` | 固定填 `3000` | `3000` |
| `NODE_ENV` | 固定填 `production` | `production` |
| `DB_HOST` | PlanetScale的Host地址 | `xxx.psdb.cloud` |
| `DB_PORT` | 固定填 `3306` | `3306` |
| `DB_USER` | PlanetScale的用户名 | `xxx` |
| `DB_PASSWORD` | PlanetScale的密码 | `xxx` |
| `DB_NAME` | 固定填 `main` | `main` |
| `REDIS_HOST` | Upstash的Host地址（不带端口） | `xxx.upstash.io` |
| `REDIS_PORT` | Upstash的端口 | `12345` |
| `REDIS_PASSWORD` | Upstash的密码 | `xxx` |
| `JWT_SECRET` | 任意一串复杂的字符串（用于加密） | `your-secret-key-here-make-it-long` |
| `JWT_EXPIRES_IN` | 固定填 `7d` | `7d` |
| `DEEPSEEK_API_KEY` | DeepSeek的API Key | `sk-xxx` |
| `DEEPSEEK_BASE_URL` | 固定填 `https://api.deepseek.com/v1` | `https://api.deepseek.com/v1` |
| `OLLAMA_BASE_URL` | 固定填空或任意值（Vercel不支持Ollama） | `` |
| `AZURE_TTS_KEY` | Azure的Key（可选） | `xxx` |
| `AZURE_TTS_REGION` | Azure的Region（可选） | `eastasia` |

4. 所有变量添加完成后，点击 **Save**

---

## 🚀 步骤六：执行Vercel部署

### 6.1 打开命令行

在你的电脑上打开命令行工具（Windows用户打开 **PowerShell** 或 **命令提示符**）

### 6.2 进入项目目录

执行命令：
```bash
cd F:\开发软件项目文件\对练社交
```

### 6.3 登录Vercel

执行命令：
```bash
vercel login
```

按照提示操作：
1. 输入你的邮箱
2. 打开浏览器，点击Vercel发送的确认链接

### 6.4 部署项目

执行命令：
```bash
vercel --prod
```

按照提示操作：
1. 如果问 **Set up and deploy "对练社交"?** → 输入 `Y` 回车
2. 如果问 **Link to existing project?** → 输入 `Y` 回车
3. 选择你的项目名称

等待部署完成，部署成功后会显示一个URL（如 `https://duilian-social.vercel.app`）

---

## 📦 步骤七：初始化数据库

部署成功后，需要初始化数据库表结构。

### 7.1 在本地初始化（推荐）

1. 确保你的电脑上安装了Node.js
2. 在命令行进入项目目录：
   ```bash
   cd F:\开发软件项目文件\对练社交\server
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 创建 `.env` 文件，填入你的数据库信息：
   ```
   DB_HOST=xxx.psdb.cloud
   DB_PORT=3306
   DB_USER=xxx
   DB_PASSWORD=xxx
   DB_NAME=main
   ```
5. 执行初始化脚本：
   ```bash
   npm run init-db
   ```

### 7.2 或者通过API调用初始化

部署成功后，访问以下URL：
```
https://你的项目名.vercel.app/api/init-db
```

如果返回 `{"message": "数据库初始化成功"}` 就表示成功了。

---

## ✅ 验证部署

部署完成后，访问以下URL验证：

| URL | 预期返回 |
|-----|---------|
| `https://你的项目名.vercel.app/health` | `{"status":"ok","timestamp":xxx}` |
| `https://你的项目名.vercel.app/api/scenes` | 返回场景列表数据 |

---

## 📝 你需要提供给我的信息

完成以上步骤后，请把以下信息发给我：

1. **PlanetScale数据库信息**：
   - DB_HOST: ____________
   - DB_USER: ____________
   - DB_PASSWORD: ____________
   - DB_NAME: main

2. **Upstash Redis信息**：
   - REDIS_HOST: ____________
   - REDIS_PORT: ____________
   - REDIS_PASSWORD: ____________

3. **DeepSeek API Key**：
   - DEEPSEEK_API_KEY: ____________

4. **Vercel部署URL**：
   - https://____________.vercel.app

5. **（可选）Azure TTS信息**：
   - AZURE_TTS_KEY: ____________
   - AZURE_TTS_REGION: ____________

---

## ❓ 常见问题

### Q: Vercel部署失败怎么办？
A: 检查以下几点：
1. 环境变量是否都配置正确
2. Node.js版本是否符合要求（需要Node.js 18+）
3. 是否有代码语法错误

### Q: 数据库连接失败怎么办？
A: 检查以下几点：
1. PlanetScale数据库是否已创建并激活
2. 连接信息是否正确（特别是密码）
3. 是否在PlanetScale中允许外部访问（默认允许）

### Q: DeepSeek API调用失败怎么办？
A: 检查以下几点：
1. API Key是否正确
2. 是否有余额（新用户有赠送额度）
3. 网络是否能访问DeepSeek服务器

### Q: 还需要其他什么吗？
A: 部署完成后，如果需要上线使用，还需要：
1. 购买域名并绑定到Vercel项目
2. 配置HTTPS证书（Vercel自动提供）
3. 考虑CDN加速（Vercel自动提供）

---

## 📞 需要帮助？

如果在操作过程中遇到任何问题，随时告诉我，我会一步步帮你解决！