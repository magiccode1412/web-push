<div align="center">
   <h1>Web Push Notification System</h1>
   <a href="https://cnb.cool/magiccode1412/web-push" target="_blank">CNB仓库</a> | <a href="https://github.com/magiccode1412/web-push" target="_blank">GitHub仓库</a>
   <p>一个基于 Web Push API 的实时推送通知系统，使用 Service Worker 实现完美的推送体验。部署在 EdgeOne Pages 上，前后端一体化，无需独立服务器。</p>
</div>

## 写在前面（碎碎念）

这种推送方式目前只适合用户接收调试信息，不适合用于生产环境。原因有三：
1. chrome支持最完整，但是普遍无法正常和谷歌服务器进行有效的通讯，导致推送失败
2. 微软的推送服务器是正常的，在pc端可以正常使用；但是移动端就一言难尽了，不支持就直接就算了，还是会返回一个无效的endpoint，导致推送失败
3. 国内的其他浏览器就别想了，手机厂商自带的浏览器都是些破玩意，基本上浏览器的前沿技术都被他们给卡死了

注意：
+ Firefox未做测试
+ safari未做测试（没有苹果设备）

## 一键部署

+ 国内版

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fmagiccode1412%2Fweb-push&repository-name=web-push&project-name=web-push&build-command=pnpm+build&install-command=pnpm+i&output-directory=.%2Fdist&env=VAPID_PUBLIC_KEY%2CVAPID_PRIVATE_KEY%2CPUSH_TOKEN%2CKV_API_KEY&env-description=%E8%AF%A6%E7%BB%86%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E8%AF%B4%E6%98%8E%E8%AF%B7%E7%82%B9%E5%87%BB%E2%9E%A1%EF%B8%8F&env-link=https%3A%2F%2Fgithub.com%2Fmagiccode1412%2Fweb-push%2Fblob%2Fmain%2F.env.example)

+ 国际版

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fmagiccode1412%2Fweb-push&repository-name=web-push&project-name=web-push&build-command=pnpm+build&install-command=pnpm+i&output-directory=.%2Fdist&env=VAPID_PUBLIC_KEY%2CVAPID_PRIVATE_KEY%2CPUSH_TOKEN%2CKV_API_KEY&env-description=%E8%AF%A6%E7%BB%86%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E8%AF%B4%E6%98%8E%E8%AF%B7%E7%82%B9%E5%87%BB%E2%9E%A1%EF%B8%8F&env-link=https%3A%2F%2Fgithub.com%2Fmagiccode1412%2Fweb-push%2Fblob%2Fmain%2F.env.example)


## 原理

利用 Service Worker 的实时推送功能，实现浏览器原生的推送通知系统。后端基于 EdgeOne Pages 的 Node Functions，使用 Web Push 库发送推送消息，EdgeOne KV 存储订阅信息。前端通过 Service Worker 接收并处理推送通知，所有消息持久化存储到 IndexedDB。

## 架构

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS
- **后端**：EdgeOne Pages (Edge Functions + Node Functions)
- **存储**：IndexedDB（前端消息）+ EdgeOne KV（订阅数据）
- **推送**：web-push 库

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
   - EdgeOne Pages 部署自带 HTTPS，无需额外配置

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

3. **手动推送**（需要验证 PUSH_TOKEN）
   - 发送广播消息或定向推送
   - 支持添加图片 URL
   - 推送 Token 自动保存到本地
   - 实时显示发送结果

4. **调试日志页面**
   - 实时查看应用运行日志
   - 按分类和级别过滤日志
   - 浏览器能力检测（Service Worker、Push API、HTTPS 等）
   - 导出日志功能（下载 JSON 或复制到剪贴板）
   - 详细的错误堆栈信息
   - 自动检测 Edge 移动端并提示用户

5. **底部导航**
   - 固定在页面底部的悬浮导航
   - 玻璃态设计风格
   - 平滑的页面切换动画

6. **Service Worker 功能**
   - 接收推送通知并显示
   - IndexedDB 消息存储管理（增删改查）
   - 通知点击处理（支持聚焦现有窗口和打开新窗口）
   - 自动处理浏览器安全限制
   - 消息已读标记管理

### 后端接口

1. **推送接口**
   - `POST /api/push` - 发送推送消息（支持 PUSH_TOKEN 认证，支持广播和定向推送）
   - `GET /api/vapid-key` - 获取 VAPID 公钥

2. **订阅接口**
   - `POST /api/subscribe` - 保存/取消推送订阅（支持白名单过滤）

## 常见问题

### Q1: 订阅推送失败，提示 "Registration failed - push service error"

**可能原因：**
1. 使用了 Edge 移动端浏览器（不支持 Web Push）
2. Chrome 浏览器无法访问 Google 推送服务（需要代理网络）
3. VAPID 公钥配置错误或未配置
4. 用户不在白名单中

**解决方案：**
1. 使用 Chrome 浏览器（推荐）
2. 确保网络可以访问 Google 服务（`fcm.googleapis.com`）
3. 检查 EdgeOne Pages 控制台中的环境变量配置
4. 在调试日志页面查看详细的错误日志

### Q2: 推送消息发送失败，日志显示 "getaddrinfo ENOTFOUND permanently-removed.invalid"

**原因：** 这是 Edge 移动端返回的无效 endpoint，系统会自动清理此类无效订阅。

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
4. 前端将 endpoint 发送给 Node Function
5. Node Function 使用这个 endpoint 发送推送消息

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
- 公钥发给浏览器，私钥保存在 EdgeOne 环境变量中
- 浏览器使用公钥加密推送消息，只有私钥才能解密

**生成方法：**
```bash
pnpm run generate-vapid
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

> 脚本会自动创建 `.env` 文件并生成 VAPID 密钥对。将生成的密钥配置到 EdgeOne Pages 控制台即可。

### 2. 开发模式

```bash
pnpm run dev
```

启动 Vite 开发服务器（端口 5173）。注意：本地开发时后端 API 不可用，需要部署到 EdgeOne Pages 才能测试完整功能。

### 3. 生产部署

部署到 EdgeOne Pages：

```bash
pnpm run build
```

将项目根目录连接到 EdgeOne Pages，EdgeOne 会自动识别 `edge-functions/`、`node-functions/` 目录和静态资源进行部署。

## 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Tailwind CSS** - CSS 框架
- **Radix UI** - 无样式 UI 组件库
- **React Router** - 路由管理
- **IndexedDB (idb-keyval)** - 客户端消息存储

### 后端 (EdgeOne Pages)
- **Edge Functions** - KV 存储边缘函数
- **Node Functions** - API 业务逻辑
- **EdgeOne KV** - 订阅数据存储
- **web-push** - Web Push API 封装

## 项目结构

```
project-root/
├── index.html                  # HTML 入口
├── package.json                # 依赖和脚本
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js           # PostCSS 配置
├── components.json             # shadcn/ui 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.app.json           # 应用 TypeScript 配置
├── tsconfig.node.json          # Node TypeScript 配置
├── .env.example                # 环境变量示例
│
├── src/                        # 前端源代码
│   ├── App.tsx                 # 应用主组件
│   ├── main.tsx                # 应用入口
│   ├── style.css               # 全局样式
│   ├── components/             # React 组件
│   │   ├── ui/                 # Radix UI 组件
│   │   ├── BackgroundImage.tsx
│   │   └── BottomNav.tsx
│   ├── pages/                  # 页面组件
│   │   ├── Home.tsx            # 首页（消息列表）
│   │   ├── Detail.tsx          # 消息详情
│   │   ├── Push.tsx            # 发送推送
│   │   ├── Settings.tsx        # 设置页
│   │   └── DebugLog.tsx        # 调试日志
│   ├── services/               # 服务层
│   │   ├── dbService.ts        # IndexedDB 服务
│   │   ├── pushService.ts      # 推送服务
│   │   └── debugService.ts     # 调试日志服务
│   ├── types/                  # TypeScript 类型
│   ├── utils/                  # 工具函数
│   └── lib/                    # 工具函数
│
├── public/                     # 静态资源
│   ├── favicon.svg
│   └── sw.js                   # Service Worker
│
├── edge-functions/             # EdgeOne 边缘函数
│   └── kv/index.js             # KV 存储操作
│
├── node-functions/             # EdgeOne Node 函数
│   ├── kv-client.js            # KV 客户端封装
│   └── api/
│       ├── vapid-key/index.js  # GET /api/vapid-key
│       ├── subscribe/index.js  # POST /api/subscribe
│       └── push/index.js       # POST /api/push
│
├── scripts/                    # 脚本
│   └── dev.sh                  # 开发环境初始化
│
└── dist/                       # 构建输出（Vite 产物）
```

## API 文档

### GET /api/vapid-key

获取 VAPID 公钥（前端订阅推送时使用）

**响应：**
```json
{
  "publicKey": "BMVYhYEUXHMPeaAvO4f0NmA1jvk5DkpCjOWl-4Tx2YiheMU7pu7Ef0VZ1M0bY90ySSVKoTXY8y9AMY9pY5q9pT0"
}
```

### POST /api/subscribe

保存或取消推送订阅（支持白名单过滤）

**请求体：**
```json
{
  "action": "subscribe",
  "userId": "user_1234567890_abc123",
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**参数说明：**
- `action` - `"subscribe"` 订阅，`"unsubscribe"` 取消订阅
- `userId` - 用户唯一标识
- `endpoint` - 推送服务端点 URL
- `keys.p256dh` - 用户代理公钥
- `keys.auth` - 认证密钥

**订阅成功响应：**
```json
{
  "success": true,
  "message": "订阅成功"
}
```

**白名单拒绝响应：**
```json
{
  "success": false,
  "message": "非白名单用户拒绝订阅"
}
```

### POST /api/push

发送推送消息（可通过 PUSH_TOKEN 认证，支持广播和定向推送）

**请求头（可选）：**
```
Authorization: Bearer your-push-token
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
- `title`（必填）- 推送标题
- `content`（必填）- 推送内容
- `imageUrl`（可选）- 封面图片 URL
- `targetUserId`（可选）- 目标用户 ID，不传则广播给所有订阅者

**响应：**
```json
{
  "success": true,
  "message": "推送完成",
  "pushedCount": 5,
  "totalSubscriptions": 6,
  "failedCount": 1
}
```



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

## 部署到 EdgeOne Pages

### 1. 环境变量配置

在 EdgeOne Pages 控制台配置以下环境变量：

| 变量 | 说明 | 必需 |
|------|------|------|
| `VAPID_PUBLIC_KEY` | Web Push 公钥 | 是 |
| `VAPID_PRIVATE_KEY` | Web Push 私钥 | 是 |
| `EMAIL` | VAPID 联系邮箱 | 否 |
| `PUSH_TOKEN` | 推送 API 认证令牌（不设置则关闭认证） | 否 |
| `ALLOWED_USERS` | 用户白名单，逗号分隔（不设置则允许任何人订阅） | 否 |
| `KV_API_KEY` | KV 存储访问密钥 | 是 |

### 2. 生成 VAPID 密钥

```bash
pnpm run generate-vapid
```

### 3. 部署

将项目连接到 EdgeOne Pages：
- 构建命令：`pnpm run build`
- 输出目录：`dist`
- EdgeOne 会自动识别 `edge-functions/` 和 `node-functions/` 目录

### 前端环境变量（可选）

| 变量 | 说明 |
|------|------|
| `VITE_BG_URL` | 自定义背景图片 URL |
| `VITE_API_URL` | API 地址（部署后同域，通常不需要设置） |

## 开发注意事项

### Service Worker

Service Worker 源文件位于 `public/sw.js`，构建时会被 Vite 自动复制到 `dist/` 目录。修改 Service Worker 代码后需要重新构建：

```bash
pnpm run build
```

### 主题切换

所有颜色都使用 CSS 变量，自动适配亮色和深色模式。

### 数据存储

- **前端**：IndexedDB 存储推送消息（`keyval-store` 数据库，`messages` 对象存储）
- **后端**：EdgeOne KV 存储订阅信息（`webpush_subscription:` 前缀）
- **本地存储**：localStorage 存储 PUSH_TOKEN、用户 ID 等

### 安全性

- PUSH_TOKEN 验证推送接口（可选）
- 白名单过滤订阅用户（可选）
- XSS 防护：HTML 内容过滤
- 自动清理无效订阅（410、404、ENOTFOUND 等错误）

## 许可证

MIT
