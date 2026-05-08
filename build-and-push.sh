#!/bin/bash

# Docker 镜像构建和推送脚本
# 用法: ./build-and-push.sh [version]
# 示例: ./build-and-push.sh v1.0.0

set -e

VERSION=${1:-latest}
IMAGE_NAME="esdkaiyuan/co-creation"

echo "=========================================="
echo "  Docker 镜像构建和推送工具"
echo "=========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"
echo ""

# 检查是否已登录 Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  警告: 未登录 Docker Hub"
    echo "请先执行: docker login"
    read -p "是否现在登录? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login
    else
        echo "❌ 取消操作"
        exit 1
    fi
fi

echo ""
echo "📦 开始构建镜像..."
echo "   镜像名称: ${IMAGE_NAME}:${VERSION}"
echo ""

# 记录开始时间
START_TIME=$(date +%s)

# 构建镜像
docker build -t ${IMAGE_NAME}:${VERSION} .

# 如果不是 latest,同时打 latest 标签
if [ "$VERSION" != "latest" ]; then
    echo ""
    echo "🏷️  添加 latest 标签..."
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

# 计算构建时间
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

echo ""
echo "✅ 镜像构建完成! (耗时: ${BUILD_TIME}秒)"
echo ""

# 显示镜像信息
echo "📊 镜像信息:"
docker images ${IMAGE_NAME}:${VERSION} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# 询问是否推送
read -p "是否推送到 Docker Hub? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  镜像已本地构建,但未推送"
    echo "稍后可以手动推送: docker push ${IMAGE_NAME}:${VERSION}"
    exit 0
fi

echo ""
echo "📤 开始推送镜像..."
echo ""

# 推送镜像
docker push ${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    echo ""
    echo "📤 推送 latest 标签..."
    docker push ${IMAGE_NAME}:latest
fi

echo ""
echo "=========================================="
echo "  ✅ 完成!"
echo "=========================================="
echo ""
echo "📦 镜像已推送到 Docker Hub:"
echo "   https://hub.docker.com/r/${IMAGE_NAME}"
echo ""
echo "🏷️  可用标签:"
echo "   - ${IMAGE_NAME}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    echo "   - ${IMAGE_NAME}:latest"
fi
echo ""
echo "🚀 在服务器上部署:"
echo "   docker pull ${IMAGE_NAME}:${VERSION}"
echo "   docker run -d --name co-creation -p 3000:3000 ${IMAGE_NAME}:${VERSION}"
echo ""
