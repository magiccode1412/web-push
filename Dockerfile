# 构建阶段 - 前端
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

# 设置前端工作目录
WORKDIR /app/web

# 复制前端依赖文件
COPY web/package.json web/pnpm-lock.yaml* ./

# 安装前端依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY web ./

# 构建前端
RUN pnpm run build

# 运行阶段 - 后端
FROM node:20-alpine

# 安装 pnpm
RUN npm install -g pnpm

# 设置后端工作目录
WORKDIR /app/server

# 复制后端依赖文件
COPY server/package.json server/pnpm-lock.yaml* ./

# 安装后端生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ../dist

# 复制后端代码
COPY server ./

# 暴露端口（默认 3001，可通过环境变量 PORT 覆盖）
EXPOSE 3001

# 默认环境变量（可通过运行时覆盖）
ENV NODE_ENV=production
ENV PORT=3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || '3001') + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "index.js"]
