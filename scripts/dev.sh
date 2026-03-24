#!/bin/bash

# 开发环境初始化脚本
# 用于安装依赖、生成 VAPID 密钥

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "初始化开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 安装依赖
echo -e "\n${YELLOW}[1/3] 安装依赖...${NC}"
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
  echo "  安装依赖..."
  pnpm install
fi

echo -e "${GREEN}  依赖安装完成${NC}"

# 2. 准备 .env 文件
echo -e "\n${YELLOW}[2/3] 检查环境变量...${NC}"
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "  创建 .env..."
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo -e "${GREEN}  .env 已创建${NC}"
else
  echo -e "${GREEN}  .env 已存在${NC}"
fi

# 3. 生成 VAPID 密钥并写入 .env
echo -e "\n${YELLOW}[3/3] 生成 VAPID 密钥对并写入 .env...${NC}"
VAPID_KEYS=$(cd "$PROJECT_ROOT" && node -e "
  const webpush = require('web-push');
  const keys = webpush.generateVAPIDKeys();
  console.log(keys.publicKey + '|' + keys.privateKey);
")

VAPID_PUBLIC=$(echo "$VAPID_KEYS" | cut -d'|' -f1)
VAPID_PRIVATE=$(echo "$VAPID_KEYS" | cut -d'|' -f2)

# 写入 .env 文件
sed -i "s/^VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=${VAPID_PUBLIC}/" "$PROJECT_ROOT/.env"
sed -i "s/^VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=${VAPID_PRIVATE}/" "$PROJECT_ROOT/.env"

echo -e "${GREEN}  VAPID 密钥已写入 .env${NC}"

echo -e "\n${GREEN}开发环境初始化完成！${NC}"
echo -e "启动开发服务器："
echo -e "  pnpm run dev      # 启动前端开发服务器"
echo -e "  pnpm run build    # 构建前端"
