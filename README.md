# Web Push Notification System

一个基于 Web Push API 的实时推送通知系统，使用 Service Worker 实现完美的推送体验。

## 写在前面（碎碎念）

这种推送方式目前只适合用户接收调试信息，不适合用于生产环境。原因有三：
1. chrome支持最完整，但是普遍无法正常和谷歌服务器进行有效的通讯，导致推送失败
2. 微软的推送服务器是正常的，在pc端可以正常使用；但是移动端就一言难尽了，不支持就直接就算了，还是会返回一个无效的endpoint，导致推送失败
3. 国内的其他浏览器就别想了，手机厂商自带的浏览器都是些破玩意，基本上浏览器的前沿技术都被他们给卡死了

注意：
+ Firefox未做测试
+ safari未做测试（没有苹果设备）

## 原理

利用 Service Worker 的实时推送功能，实现浏览器原生的推送通知系统。后端使用 Web Push 库发送推送消息，前端通过 Service Worker 接收并处理推送通知，所有消息持久化存储到 IndexedDB。

## 架构

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS
- **后端**：Node.js + Express + SQLite3 + web-push + Winston 日志
- **部署**：支持本地开发、PM2 部署和 Docker 部署
- **存储**：IndexedDB（前端）+ SQLite3（后端）

## 浏览器兼容性

### 推荐使用的浏览器

| 浏览器 | 平台 | 支持状态 | 推送服务 |
|--------|------|---------|---------|
| Chrome | 桌面/移动 | ✅ 完全支持 | FCM |
| Firefox | 桌面/移动 | ✅ 完全支持 | Mozilla Push Service |
| Edge | 桌面 | ✅ 支持 | WNS (Windows Push Notification Service) |
| Edge | 移动端 | ❌ 不支持 | 返回无效 endpoint |
| Safari | ---|---|---|

### ⚠️ 重要提示

1. **Edge 移动端不支持 Web Push**
   - Edge for Android 虽然在 API 层面声称支持 Push API，但实际返回无效的 endpoint
   - 会出现类似 `https://permanently-removed.invalid/...` 的无效 endpoint
   - 建议用户使用 Chrome 浏览器

2. **网络环境要求**
   - Chrome 浏览器需要能够访问 Google 推送服务（`fcm.googleapis.com`）
   - 如果在中国大陆使用，可能需要配置代理网络
   - 订阅时浏览器会内部连接推送服务，这个过程不会显示在网页的网络请求中

3. **HTTPS 要求**
   - Web Push API 必须在 HTTPS 环境下运行
   - localhost 是唯一的 HTTP 环境例外（仅用于开发）

## 功能

### 前端功能

1. **首页推送消息展示**
   - 消息内容存放在 IndexedDB 中
   - 打开页面时从 IndexedDB 获取消息
   - 卡片形式展示，包含标题、描述和封面图
   - 点击消息可跳转到详情页
   - 统计卡片显示总浏览数和内容数
   - 支持主题切换（亮色/深色模式）

2. **消息详情页**
   - 完整的消息内容展示
   - 显示发布时间
   - 支持分享功能（复制链接或调用系统分享）
   - 优雅的加载状态和错误处理
   - 自动标记已读
   - 图片不存在时使用随机图片 API

3. **管理后台**
   - 查看所有推送记录
   - 支持按标题和内容搜索
   - 显示消息类型（广播/定向推送）
   - 时间格式化显示（刚刚、X分钟前、X小时前等）

4. **手动推送**（需要验证 PUSH_TOKEN）
   - 发送广播消息或定向推送
   - 支持添加图片 URL
   - 推送 Token 自动保存到本地
   - 实时显示发送结果

5. **设置页面**
   - 开启/关闭消息推送
   - 查看和管理用户 ID
   - 随机生成新用户 ID
   - 查看应用版本信息
   - 清空本地存储数据
   - 推送测试功能

6. **调试日志页面**
   - 实时查看应用运行日志
   - 按分类和级别过滤日志
   - 浏览器能力检测（Service Worker、Push API、HTTPS 等）
   - 导出日志功能（下载 JSON 或复制到剪贴板）
   - 详细的错误堆栈信息
   - 自动检测 Edge 移动端并提示用户

7. **管理员登录**
   - 密码验证登录
   - JWT Token 认证
   - Token 持久化存储

8. **底部导航**
   - 固定在页面底部的悬浮导航
   - 玻璃态设计风格
   - 平滑的页面切换动画

9. **Service Worker 功能**
   - 接收推送通知并显示
   - IndexedDB 消息存储管理（增删改查）
   - 通知点击处理（支持聚焦现有窗口和打开新窗口）
   - 自动处理浏览器安全限制
   - 消息已读标记管理

### 后端接口

1. **认证接口**
   - `POST /api/auth/login` - 登录获取 JWT token
   - Token 验证中间件

2. **推送接口**
   - `POST /api/push` - 发送推送消息（需要 PUSH_TOKEN）
   - `GET /api/vapid-key` - 获取 VAPID 公钥

3. **订阅接口**
   - `POST /api/subscribe` - 保存推送订阅信息到数据库
   - `DELETE /api/subscribe/:id` - 删除订阅（需要 JWT token）
   - `GET /api/subscribe/list` - 获取订阅列表（需要 JWT token）

4. **记录接口**
   - `GET /api/records/list` - 获取推送记录列表（需要 JWT token）

5. **日志系统**
   - Winston 日志框架
   - 按日期自动轮转日志文件
   - 日志审计和保留策略
   - 详细记录推送流程和错误信息

## 常见问题

### Q1: 订阅推送失败，提示 "Registration failed - push service error"

**可能原因：**
1. 使用了 Edge 移动端浏览器（不支持 Web Push）
2. Chrome 浏览器无法访问 Google 推送服务（需要代理网络）
3. VAPID 公钥配置错误或未配置

**解决方案：**
1. 使用 Chrome 浏览器（推荐）
2. 确保网络可以访问 Google 服务（`fcm.googleapis.com`）
3. 检查服务器日志和前端调试日志
4. 确认 `.env` 文件中已配置有效的 VAPID 密钥

### Q2: 推送消息发送失败，日志显示 "getaddrinfo ENOTFOUND permanently-removed.invalid"

**原因：** 这是 Edge 移动端返回的无效 endpoint

**解决方案：**
1. 在管理后台删除该用户的订阅
2. 引导用户使用 Chrome 浏览器重新订阅
3. 系统会自动清理此类无效订阅

### Q3: 为什么浏览器订阅时需要代理网络？

**原因：**
- 浏览器在订阅时需要连接到推送服务商（Chrome 连接到 FCM）
- 这些连接是浏览器内部发起的，不会显示在网页的网络请求中
- 如果推送服务不可达（如被墙），订阅就会失败

**测试推送服务连接：**
```bash
# 测试 FCM 连接
curl -I https://fcm.googleapis.com
```

### Q4: endpoint 是怎么生成的？

**答案：** endpoint 是浏览器自动生成的
1. 用户点击订阅按钮
2. 浏览器连接到推送服务（FCM/WNS/Mozilla Push）
3. 推送服务返回唯一的 endpoint URL
4. 前端将 endpoint 发送给你的后端
5. 后端使用这个 endpoint 发送推送消息

**不同浏览器的 endpoint 示例：**
- Chrome: `https://fcm.googleapis.com/fcm/send/...`
- Firefox: `https://updates.push.services.mozilla.com/...`
- Edge (桌面): `https://wns2-sg2p.notify.windows.com/...`
- Edge (移动): `https://permanently-removed.invalid/...`（无效）

### Q5: 如何查看详细的调试信息？

**答案：** 使用内置的调试日志功能
1. 进入设置页面
2. 点击"调试日志"
3. 点击"检测浏览器能力"查看浏览器支持情况
4. 尝试订阅后查看详细的错误日志
5. 可以导出日志分享给开发者

### Q6: VAPID 密钥的作用是什么？

**作用：**
- 不是用来生成 endpoint
- 而是用来验证服务器身份，防止未授权的服务器向用户发送推送
- 公钥发给浏览器，私钥保存在服务器
- 浏览器使用公钥加密推送消息，只有私钥才能解密

**生成方法：**
```bash
npx web-push generate-vapid-keys
```

### Q7: 点击通知为什么没有打开页面？

**原因：** 浏览器的安全限制
- 当用户最近没有与页面交互时，浏览器会阻止窗口的聚焦和打开
- 这是浏览器的安全策略，无法通过权限申请来绕过

**解决方案：** 项目已实现兼容方案
1. 优先尝试发送 postMessage 给现有客户端，让页面自己处理导航
2. 同时尝试打开/聚焦窗口（可能被浏览器阻止）
3. 如果收到 postMessage 消息，页面会自动导航到详情页

## 快速开始

### 1. 开发准备

运行初始化脚本，自动安装依赖、准备环境变量、生成 VAPID 密钥：

```bash
bash scripts/dev.sh
```

> 脚本会自动创建 `.env` 文件并生成 VAPID 密钥对，你只需配置 `JWT_SECRET`、`ADMIN_PASSWORD`、`PUSH_TOKEN`

### 2. 开发模式

```bash
# 同时启动前后端
pnpm run dev:all

# 或分别启动
pnpm run dev:web      # 前端 (端口 5173)
pnpm run dev:server   # 后端 (端口 3001)
```

### 3. 生产部署

```bash
# 构建前端
pnpm run build

# 启动后端服务器
pnpm run start
```

服务器将在 `http://localhost:3001` 启动。

## 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Tailwind CSS** - CSS 框架
- **Radix UI** - 无样式 UI 组件库
- **React Router** - 路由管理
- **Web Push** - 推送功能
- **IndexedDB** - 客户端数据存储

### 后端
- **Express** - Web 框架
- **SQLite3** - 数据库
- **web-push** - Web Push API 封装
- **jsonwebtoken** - JWT 认证
- **Winston** - 日志框架
- **cors** - 跨域支持
- **dotenv** - 环境变量管理

## 项目结构

```
workspace/
├── package.json                # 根目录配置（仅含 concurrently）
├── pnpm-lock.yaml              # 根目录 lock 文件
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                  # Docker 构建配置
│
├── web/                        # 前端项目
│   ├── package.json            # 前端依赖配置
│   ├── pnpm-lock.yaml          # 前端 lock 文件
│   ├── index.html              # HTML 入口
│   ├── vite.config.ts          # Vite 配置
│   ├── tailwind.config.js      # Tailwind 配置
│   ├── postcss.config.js       # PostCSS 配置
│   ├── components.json         # shadcn/ui 配置
│   ├── tsconfig.json           # TypeScript 配置（引用）
│   ├── tsconfig.app.json       # 应用 TypeScript 配置
│   ├── tsconfig.node.json      # Node TypeScript 配置
│   ├── .env                    # 前端环境变量
│   ├── .env.example            # 前端环境变量示例
│   ├── public/                 # 静态资源
│   │   ├── favicon.svg
│   │   └── sw.js               # Service Worker
│   └── src/                    # 源代码
│       ├── App.tsx             # 应用主组件
│       ├── main.tsx            # 应用入口
│       ├── style.css           # 全局样式
│       ├── components/         # React 组件
│       │   ├── ui/             # Radix UI 组件
│       │   ├── BackgroundImage.tsx
│       │   └── BottomNav.tsx
│       ├── pages/              # 页面组件
│       │   ├── Home.tsx        # 首页
│       │   ├── Detail.tsx      # 详情页
│       │   ├── Admin.tsx       # 管理后台
│       │   ├── Push.tsx        # 推送发送
│       │   ├── Login.tsx       # 登录页
│       │   ├── Settings.tsx    # 设置页
│       │   └── DebugLog.tsx    # 调试日志页
│       ├── services/           # 服务层
│       │   ├── authService.ts  # 认证服务
│       │   ├── dbService.ts    # IndexedDB 服务
│       │   ├── pushService.ts  # 推送服务
│       │   └── debugService.ts # 调试日志服务
│       ├── types/              # TypeScript 类型
│       │   └── index.ts
│       ├── utils/              # 工具函数
│       │   ├── formatDate.ts
│       │   └── swRegistration.ts
│       └── lib/
│           └── utils.ts        # 工具函数
│
├── server/                     # 后端项目
│   ├── package.json            # 后端依赖配置
│   ├── pnpm-lock.yaml          # 后端 lock 文件
│   ├── index.js                # Express 服务器入口
│   ├── .env                    # 后端环境变量
│   ├── .env.example            # 后端环境变量示例
│   ├── db/                     # 数据库
│   │   └── database.js         # SQLite3 连接和初始化
│   ├── routes/                 # 路由层
│   │   ├── auth.js             # 认证路由
│   │   ├── push.js             # 推送路由
│   │   ├── records.js          # 推送记录路由
│   │   ├── subscribe.js        # 订阅路由
│   │   └── vapid.js            # VAPID 公钥路由
│   ├── core/                   # 业务逻辑层
│   │   ├── auth.js             # 认证逻辑
│   │   ├── push.js             # 推送逻辑
│   │   ├── subscribe.js        # 订阅逻辑
│   │   └── records.js          # 记录查询逻辑
│   ├── utils/                  # 工具函数
│   │   ├── jwt.js              # JWT 生成和验证
│   │   ├── response.js         # 响应格式化
│   │   └── logger.js           # Winston 日志配置
│   └── middleware/             # 中间件
│       └── logger.js           # 日志中间件
│
├── scripts/                    # 脚本文件
│   ├── dev.sh                  # 开发环境初始化脚本
│   └── docker.sh               # Docker 构建推送脚本
│
├── data/                       # 数据目录（自动创建）
│   ├── push.db                 # SQLite 数据库
│   └── log/                    # 日志文件
│
└── dist/                       # 构建输出目录
```

## API 文档

### POST /api/auth/login

登录接口，获取 JWT token

**请求体：**
```json
{
  "password": "your-admin-password"
}
```

**响应：**
```json
{
  "success": true,
  "token": "jwt-token-here"
}
```

### POST /api/push

发送推送消息（需要 PUSH_TOKEN）

**请求头：**
```
Authorization: Bearer your-push-token
Content-Type: application/json
```

**请求体：**
```json
{
  "title": "消息标题",
  "content": "消息内容",
  "imageUrl": "https://example.com/image.jpg",
  "targetUserId": "user_123"
}
```

**参数说明：**
- `title`（必填）- 推送标题，最多 50 字符
- `content`（必填）- 推送内容，最多 200 字符
- `imageUrl`（可选）- 图片 URL
- `targetUserId`（可选）- 目标用户 ID，留空则广播

**响应：**
```json
{
  "success": true,
  "message": "推送成功！已发送给 5 个用户",
  "pushedCount": 5
}
```

### POST /api/subscribe

保存推送订阅信息

**请求体：**
```json
{
  "userId": "user_1234567890_abc123",
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**响应：**
```json
{
  "success": true
}
```

### GET /api/records/list

获取推送记录（需要 JWT token）

**请求头：**
```
Authorization: Bearer your-jwt-token
```

**响应：**
```json
{
  "success": true,
  "records": [
    {
      "id": "magic_push_record:1",
      "title": "消息标题",
      "content": "消息内容",
      "imageUrl": "https://...",
      "timestamp": 1234567890,
      "targetUserId": "user_123"
    }
  ]
}
```

### GET /api/vapid-key

获取 VAPID 公钥（前端订阅推送时使用）

**响应：**
```json
{
  "success": true,
  "publicKey": "BMVYhYEUXHMPeaAvO4f0NmA1jvk5DkpCjOWl-4Tx2YiheMU7pu7Ef0VZ1M0bY90ySSVKoTXY8y9AMY9pY5q9pT0"
}
```

## 样式系统

项目使用 CSS 变量实现主题切换，支持亮色和深色模式。

### CSS 变量

**基础颜色：**
- `--background` - 背景色
- `--foreground` - 前景色
- `--card` - 卡片背景
- `--card-foreground` - 卡片前景

**主题色：**
- `--primary` - 主色调
- `--primary-foreground` - 主色调前景
- `--secondary` - 次色调
- `--secondary-foreground` - 次色调前景

**渐变色：**
- `--gradient-start` - 渐变起始色
- `--gradient-end` - 渐变结束色
- `--gradient-accent-1` - 辅助渐变色 1
- `--gradient-accent-2` - 辅助渐变色 2

**功能色：**
- `--success` - 成功色
- `--success-foreground` - 成功色前景
- `--destructive` - 危险/错误色
- `--destructive-foreground` - 危险色前景

**玻璃态：**
- `--glass-bg` - 玻璃态背景
- `--glass-hover` - 玻璃态悬停
- `--glass-strong` - 玻璃态强背景
- `--glass-border` - 玻璃态边框

### 使用示例

```tsx
// 使用主题色
<div className="bg-primary text-primary-foreground" />

// 使用渐变
<div className="bg-gradient-to-br from-gradient-start to-gradient-end" />

// 使用玻璃态
<div className="bg-glass backdrop-blur-md border border-glass-border" />

// 使用成功色
<div className="bg-success text-success-foreground" />
```

## 开发注意事项

### API 代理

在开发模式下，Vite 会自动将 `/api` 请求代理到后端服务器（默认端口 3001）。可通过环境变量 `VITE_API_URL` 自定义。配置在 `vite.config.ts`：

```typescript
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

### Service Worker

Service Worker 源文件位于 `public/sw.js`，构建时会被 Vite 自动复制到 `dist/` 目录。修改 Service Worker 代码后需要重新构建：

```bash
pnpm run build
```

在开发环境中，Service Worker 也会被注册（移除了 `import.meta.env.PROD` 条件），方便测试。

### 主题切换

所有颜色都使用 CSS 变量，自动适配亮色和深色模式。硬编码颜色值已全部替换为 CSS 变量。

### 数据存储

- **前端**：IndexedDB 存储推送消息（`keyval-store` 数据库，`messages` 对象存储）
- **后端**：SQLite3 存储推送订阅和记录（`data/push.db`）
- **本地存储**：localStorage 存储 JWT token、PUSH_TOKEN、用户 ID 等

### 日志系统

项目使用 Winston 日志框架，特性包括：
- 按日期自动轮转日志文件
- 不同级别的日志输出（info、warn、error、success）
- 结构化日志，便于分析和调试
- 日志审计和保留策略
- 前端调试日志功能

### 安全性

- 密码使用环境变量配置
- JWT Token 认证保护敏感接口
- PUSH_TOKEN 验证推送接口
- XSS 防护：HTML 内容过滤
- 自动清理无效订阅（410、404、ENOTFOUND 等错误）

## 部署

### 环境变量配置

**后端 (`server/.env`)：**
| 变量 | 说明 | 必需 |
|------|------|------|
| `PORT` | 服务端口，默认 3001 | 否 |
| `JWT_SECRET` | JWT 签名密钥 | 是 |
| `ADMIN_PASSWORD` | 管理员登录密码 | 是 |
| `PUSH_TOKEN` | 推送 API 认证令牌 | 是 |
| `VAPID_PUBLIC_KEY` | Web Push 公钥 | 是 |
| `VAPID_PRIVATE_KEY` | Web Push 私钥 | 是 |

**前端 (`web/.env`)：**
| 变量 | 说明 | 必需 |
|------|------|------|
| `VITE_BG_URL` | 背景图片 URL | 否 |
| `VITE_API_URL` | API 地址 | 否 |

### Docker 部署

#### 使用预构建镜像

```bash
docker run -d \
  --name magic-push \
  -p 3001:3001 \
  -e ADMIN_PASSWORD=your-admin-password \
  -e JWT_SECRET=your-jwt-secret \
  -e PUSH_TOKEN=your-push-token \
  -e VAPID_PUBLIC_KEY=your-vapid-public-key \
  -e VAPID_PRIVATE_KEY=your-vapid-private-key \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  your-username/magic-push:latest
```

#### 自行构建

```bash
# 构建并推送到 Docker Hub 和 CNB
./scripts/docker.sh        # main 分支 -> latest 标签
./scripts/docker.sh dev    # dev 分支 -> dev 标签
```

需要设置环境变量：
- `DOCKERHUB_USERNAME` - Docker Hub 用户名
- `DOCKERHUB_TOKEN` - Docker Hub PAT 令牌
- `CNB_DOCKER_REGISTRY` - CNB Docker 注册表地址
- `CNB_REPO_SLUG_LOWERCASE` - CNB 仓库路径

## 许可证

MIT
