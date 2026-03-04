#!/bin/bash

# 开发环境初始化脚本
# 用于安装依赖、准备环境变量文件、生成 VAPID 密钥

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 初始化开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 安装依赖
echo -e "\n${YELLOW}[1/4] 安装依赖...${NC}"
cd "$PROJECT_ROOT"

# 根目录依赖
if [ ! -d "node_modules" ]; then
  echo "  安装根目录依赖..."
  pnpm install
fi

# 前端依赖
if [ ! -d "web/node_modules" ]; then
  echo "  安装前端依赖..."
  cd web && pnpm install && cd ..
fi

# 后端依赖
if [ ! -d "server/node_modules" ]; then
  echo "  安装后端依赖..."
  cd server && pnpm install && cd ..
fi

echo -e "${GREEN}  ✓ 依赖安装完成${NC}"

# 2. 准备前端 .env 文件
echo -e "\n${YELLOW}[2/4] 检查前端环境变量...${NC}"
if [ ! -f "$PROJECT_ROOT/web/.env" ]; then
  echo "  创建 web/.env..."
  cp "$PROJECT_ROOT/web/.env.example" "$PROJECT_ROOT/web/.env"
  echo -e "${GREEN}  ✓ 前端 .env 已创建${NC}"
else
  echo -e "${GREEN}  ✓ 前端 .env 已存在${NC}"
fi

# 3. 准备后端 .env 文件
echo -e "\n${YELLOW}[3/4] 检查后端环境变量...${NC}"
if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
  echo "  创建 server/.env..."
  cp "$PROJECT_ROOT/server/.env.example" "$PROJECT_ROOT/server/.env"
  NEED_VAPID=true
else
  echo -e "${GREEN}  ✓ 后端 .env 已存在${NC}"
  
  # 检查是否需要生成 VAPID 密钥
  if grep -q "your-vapid-public-key-change-in-production" "$PROJECT_ROOT/server/.env" 2>/dev/null; then
    NEED_VAPID=true
  else
    NEED_VAPID=false
  fi
fi

# 4. 生成 VAPID 密钥
if [ "$NEED_VAPID" = true ] || [ -z "$NEED_VAPID" ]; then
  echo -e "\n${YELLOW}[4/4] 生成 VAPID 密钥对...${NC}"
  
  # 使用 Node.js 生成 VAPID 密钥
  VAPID_KEYS=$(cd "$PROJECT_ROOT/server" && node -e "
    const webpush = require('web-push');
    const keys = webpush.generateVAPIDKeys();
    console.log(keys.publicKey + '|' + keys.privateKey);
  ")
  
  VAPID_PUBLIC=$(echo "$VAPID_KEYS" | cut -d'|' -f1)
  VAPID_PRIVATE=$(echo "$VAPID_KEYS" | cut -d'|' -f2)
  
  # 更新 .env 文件
  if [ -f "$PROJECT_ROOT/server/.env" ]; then
    # macOS 和 Linux 兼容的 sed 命令
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|your-vapid-public-key-change-in-production|$VAPID_PUBLIC|g" "$PROJECT_ROOT/server/.env"
      sed -i '' "s|your-vapid-private-key-change-in-production|$VAPID_PRIVATE|g" "$PROJECT_ROOT/server/.env"
    else
      sed -i "s|your-vapid-public-key-change-in-production|$VAPID_PUBLIC|g" "$PROJECT_ROOT/server/.env"
      sed -i "s|your-vapid-private-key-change-in-production|$VAPID_PRIVATE|g" "$PROJECT_ROOT/server/.env"
    fi
    echo -e "${GREEN}  ✓ VAPID 密钥已生成并写入 .env${NC}"
  fi
else
  echo -e "\n${GREEN}[4/4] VAPID 密钥已存在，跳过生成${NC}"
fi

# 5. 提示用户配置其他环境变量
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}请检查并配置以下环境变量：${NC}"
echo -e "  ${RED}server/.env${NC}:"
echo -e "    - JWT_SECRET: JWT 密钥"
echo -e "    - ADMIN_PASSWORD: 管理员密码"
echo -e "    - PUSH_TOKEN: 推送 API 令牌"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}✅ 开发环境初始化完成！${NC}"
echo -e "\n启动开发服务器："
echo -e "  pnpm run dev:all    # 同时启动前后端"
echo -e "  pnpm run dev:web    # 只启动前端"
echo -e "  pnpm run dev:server # 只启动后端"
