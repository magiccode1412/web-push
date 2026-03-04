#!/bin/bash

# Docker 镜像构建和推送脚本
# 用法: bash ./scripts/docker.sh [branch]
#   branch: 分支名，默认 main
#   - main 分支构建 latest 标签
#   - dev 分支构建 dev 标签

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取分支参数
BRANCH="${1:-main}"

# 根据分支确定标签
if [ "$BRANCH" = "main" ]; then
  TAG="latest"
else
  TAG="$BRANCH"
fi

# Docker Hub 镜像名
DOCKERHUB_IMAGE="${DOCKERHUB_USERNAME}/${CNB_REPO_SLUG_LOWERCASE}:${TAG}"

# CNB 镜像名
CNB_IMAGE="${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:${TAG}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Docker 镜像构建和推送${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "  分支: ${GREEN}${BRANCH}${NC}"
echo -e "  标签: ${GREEN}${TAG}${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查必要的环境变量
if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_TOKEN" ]; then
  echo -e "${RED}错误: 请设置 DOCKERHUB_USERNAME 和 DOCKERHUB_TOKEN 环境变量${NC}"
  exit 1
fi

# 1. 构建 Docker 镜像
echo -e "\n${YELLOW}[1/4] 构建 Docker 镜像...${NC}"
cd "$PROJECT_ROOT"
docker build -t "$PROJECT_NAME:$TAG" .
echo -e "${GREEN}  ✓ 镜像构建完成${NC}"

# 2. 登录 Docker Hub
echo -e "\n${YELLOW}[2/4] 登录 Docker Hub...${NC}"
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
echo -e "${GREEN}  ✓ Docker Hub 登录成功${NC}"

# 3. 推送到 Docker Hub
echo -e "\n${YELLOW}[3/4] 推送到 Docker Hub...${NC}"
docker tag "$PROJECT_NAME:$TAG" "$DOCKERHUB_IMAGE"
docker push "$DOCKERHUB_IMAGE"
echo -e "${GREEN}  ✓ 推送到 Docker Hub 完成${NC}"
echo -e "  镜像: ${DOCKERHUB_IMAGE}"

# 4. 推送到 CNB
echo -e "\n${YELLOW}[4/4] 推送到 CNB...${NC}"
docker tag "$PROJECT_NAME:$TAG" "$CNB_IMAGE"
docker push "$CNB_IMAGE"
echo -e "${GREEN}  ✓ 推送到 CNB 完成${NC}"
echo -e "  镜像: ${CNB_IMAGE}"

# 清理本地标签
echo -e "\n${YELLOW}清理本地镜像标签...${NC}"
docker rmi "$DOCKERHUB_IMAGE" 2>/dev/null || true
docker rmi "$CNB_IMAGE" 2>/dev/null || true

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 构建和推送完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Docker Hub: ${DOCKERHUB_IMAGE}"
echo -e "  CNB:        ${CNB_IMAGE}"
