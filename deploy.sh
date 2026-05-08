#!/bin/bash

# 共创平台 Docker 部署脚本
# 用法: ./deploy.sh [branch_name]

set -e

BRANCH=${1:-main}
PROJECT_NAME="co-creation"
IMAGE_NAME="co-creation-app"
CONTAINER_NAME="co-creation"
PORT=3000

echo "=========================================="
echo "  共创平台 Docker 部署脚本"
echo "=========================================="
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装"
    exit 1
fi

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ 错误: Git未安装"
    exit 1
fi

echo "✅ Docker版本: $(docker --version)"
echo "✅ Git版本: $(git --version)"
echo ""

# 停止并删除旧容器
echo "🔄 停止旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 拉取最新代码
echo "📥 拉取最新代码 (分支: $BRANCH)..."
git pull origin $BRANCH

# 构建Docker镜像
echo "🔨 构建Docker镜像..."
docker build -t $IMAGE_NAME .

# 创建uploads目录(如果不存在)
mkdir -p uploads

# 启动容器
echo "🚀 启动容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:$PORT \
  -e DB_HOST=${DB_HOST:-host.docker.internal} \
  -e DB_PORT=${DB_PORT:-3306} \
  -e DB_USER=${DB_USER:-co_creation_esdk} \
  -e DB_PASSWORD=${DB_PASSWORD} \
  -e DB_NAME=${DB_NAME:-co_creation_esdk} \
  -e JWT_SECRET=${JWT_SECRET} \
  -e PORT=$PORT \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  $IMAGE_NAME

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ 容器启动成功!"
    echo ""
    echo "📊 容器信息:"
    docker ps | grep $CONTAINER_NAME
    echo ""
    echo "🔗 访问地址: http://localhost:$PORT"
    echo "📝 查看日志: docker logs -f $CONTAINER_NAME"
else
    echo "❌ 容器启动失败!"
    echo "📋 查看日志:"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
