# Docker 镜像构建与推送指南

## 📋 前置准备

### 1. Docker Hub 账号
- 注册地址: https://hub.docker.com/
- 用户名: esdkaiyuan (示例,请替换为您的实际用户名)

### 2. 登录 Docker Hub

```bash
# 在本地机器上执行
docker login

# 输入用户名和密码
Username: esdkaiyuan
Password: ********
```

---

## 🚀 构建和推送流程

### 第一步: 构建 Docker 镜像

```bash
# 进入项目目录
cd d:\treai项目\co-creation

# 构建镜像(使用当前日期作为标签)
docker build -t esdkaiyuan/co-creation:latest .

# 或者使用版本号标签
docker build -t esdkaiyuan/co-creation:v1.0.0 .

# 或者同时打多个标签
docker build -t esdkaiyuan/co-creation:latest -t esdkaiyuan/co-creation:v1.0.0 .
```

**构建过程说明:**
- 基于 Node.js 18 Alpine 镜像
- 安装依赖
- 构建前端(dist目录)
- 复制源代码
- 设置健康检查

**预计时间:** 3-5分钟(首次构建)

---

### 第二步: 测试本地镜像

```bash
# 运行容器测试
docker run -d \
  --name co-creation-test \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=co_creation_esdk \
  -e DB_PASSWORD=GchzPPQ8sM6Rc2Xn \
  -e DB_NAME=co_creation_esdk \
  -e JWT_SECRET=test-secret-key \
  esdkaiyuan/co-creation:latest

# 查看日志
docker logs co-creation-test

# 测试 API
curl http://localhost:3000/api/health

# 停止并删除测试容器
docker stop co-creation-test
docker rm co-creation-test
```

---

### 第三步: 推送到 Docker Hub

```bash
# 推送 latest 标签
docker push esdkaiyuan/co-creation:latest

# 推送版本标签
docker push esdkaiyuan/co-creation:v1.0.0
```

**推送完成后,可以在这里查看:**
https://hub.docker.com/r/esdkaiyuan/co-creation

---

## 🔄 更新镜像流程

当代码有更新时:

### 方式一: 手动构建推送

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建新镜像
docker build -t esdkaiyuan/co-creation:latest .

# 3. 推送镜像
docker push esdkaiyuan/co-creation:latest
```

### 方式二: 使用自动化脚本

创建 `build-and-push.sh`:

```bash
#!/bin/bash

set -e

VERSION=${1:-latest}
IMAGE_NAME="esdkaiyuan/co-creation"

echo "🔨 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ "$VERSION" != "latest" ]; then
    echo "🏷️  添加 latest 标签..."
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

echo "📤 推送镜像到 Docker Hub..."
docker push ${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${IMAGE_NAME}:latest
fi

echo "✅ 完成! 镜像已推送: ${IMAGE_NAME}:${VERSION}"
```

使用:
```bash
chmod +x build-and-push.sh
./build-and-push.sh v1.0.1
```

---

## 📊 版本管理策略

### 推荐标签规范

| 标签类型 | 示例 | 用途 |
|---------|------|------|
| latest | `esdkaiyuan/co-creation:latest` | 最新稳定版本 |
| 语义化版本 | `esdkaiyuan/co-creation:v1.0.0` | 正式发布版本 |
| 开发版本 | `esdkaiyuan/co-creation:dev` | 开发测试版本 |
| 日期标签 | `esdkaiyuan/co-creation:20260506` | 按日期标记 |

### 版本发布流程

```bash
# 1. 更新 package.json 版本号
# 2. 提交代码
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags

# 3. 构建并推送
docker build -t esdkaiyuan/co-creation:v1.0.1 .
docker tag esdkaiyuan/co-creation:v1.0.1 esdkaiyuan/co-creation:latest
docker push esdkaiyuan/co-creation:v1.0.1
docker push esdkaiyuan/co-creation:latest
```

---

## 🗑️ 清理旧镜像

### 本地清理

```bash
# 查看所有镜像
docker images esdkaiyuan/co-creation

# 删除特定标签
docker rmi esdkaiyuan/co-creation:v1.0.0

# 删除悬空镜像
docker image prune

# 删除所有未使用的镜像
docker image prune -a
```

### Docker Hub 清理

访问: https://hub.docker.com/repository/docker/esdkaiyuan/co-creation/tags

可以手动删除旧的镜像标签。

---

## 🔐 安全性建议

### 1. 使用 .dockerignore

确保敏感文件不被包含在镜像中:

```
.env
.env.local
node_modules
.git
*.md
uploads/*
```

### 2. 不在镜像中硬编码密码

❌ **错误做法:**
```dockerfile
ENV DB_PASSWORD=GchzPPQ8sM6Rc2Xn
```

✅ **正确做法:**
```bash
# 运行时通过环境变量传入
docker run -e DB_PASSWORD=your-password ...
```

### 3. 使用多阶段构建减小镜像体积

已在 Dockerfile 中实现:
- 第一阶段: 安装依赖和构建
- 第二阶段: 只包含运行所需的文件

**镜像大小对比:**
- 未优化: ~500MB
- 优化后: ~150MB

---

## 📈 性能优化

### 1. 利用 Docker 缓存

Dockerfile 已优化构建顺序:

```dockerfile
# 先复制 package.json(变化少)
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码(变化多)
COPY . .
```

这样只有代码变化时才重新构建,依赖层可以复用缓存。

### 2. 使用 Alpine 基础镜像

```dockerfile
FROM node:18-alpine  # 约 50MB
# 而不是
FROM node:18         # 约 350MB
```

### 3. 压缩镜像层

```bash
# 构建时使用 --squash (需要启用实验性功能)
docker build --squash -t esdkaiyuan/co-creation:latest .
```

---

## 🎯 最佳实践

### 1. 始终使用具体版本标签

❌ **不推荐:**
```bash
docker pull esdkaiyuan/co-creation:latest
```

✅ **推荐:**
```bash
docker pull esdkaiyuan/co-creation:v1.0.1
```

### 2. 定期更新基础镜像

```bash
# 每月检查一次 Node.js 安全更新
docker pull node:18-alpine
```

### 3. 扫描镜像漏洞

```bash
# 使用 Docker Scout
docker scout cves esdkaiyuan/co-creation:latest

# 或使用 Trivy
trivy image esdkaiyuan/co-creation:latest
```

### 4. 添加镜像元数据

```dockerfile
LABEL maintainer="esdkaiyuan"
LABEL version="1.0.1"
LABEL description="Co-creation Platform"
```

---

## 📝 常见问题

### Q1: 推送失败 "unauthorized: authentication required"

**解决方案:**
```bash
# 重新登录
docker logout
docker login
```

### Q2: 镜像太大

**解决方案:**
- 检查 .dockerignore 是否排除了不必要文件
- 使用多阶段构建
- 使用 Alpine 基础镜像
- 清理 apt/yum 缓存

### Q3: 构建速度慢

**解决方案:**
- 确保 Dockerfile 指令顺序合理(利用缓存)
- 使用国内镜像加速器
- 并行构建多个阶段

### Q4: 如何查看镜像历史

```bash
docker history esdkaiyuan/co-creation:latest
```

---

## 🔗 相关资源

- **Docker Hub 仓库:** https://hub.docker.com/r/esdkaiyuan/co-creation
- **Docker 官方文档:** https://docs.docker.com/
- **Dockerfile 最佳实践:** https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

---

**祝构建顺利! 🚀**
