# Docker 镜像部署方案 - 完整指南

## 📋 方案对比

### Git自动部署 vs Docker镜像部署

| 特性 | Git自动部署 | Docker镜像部署 |
|------|------------|---------------|
| **部署速度** | 5-10分钟(需构建) | 1-2分钟(直接拉取) |
| **服务器资源** | 需要编译环境 | 无需编译,资源占用少 |
| **版本控制** | 通过Git分支/标签 | 通过Docker镜像标签 |
| **回滚难度** | 中等(需重新构建) | 简单(切换镜像标签) |
| **适用场景** | 开发环境、频繁更新 | 生产环境、稳定版本 |
| **复杂度** | 较高(需配置Webhook) | 较低(直接拉取镜像) |

**推荐:** 生产环境使用 **Docker镜像部署**,开发环境使用 **Git自动部署**

---

## 🚀 快速开始

### 第一步: 构建并推送Docker镜像(在本地机器)

#### Windows用户:
```bash
# 双击运行或使用命令行
build-and-push.bat v1.0.0
```

#### Linux/Mac用户:
```bash
chmod +x build-and-push.sh
./build-and-push.sh v1.0.0
```

**脚本会自动:**
1. ✅ 检查Docker是否安装
2. ✅ 检查Docker Hub登录状态
3. ✅ 构建Docker镜像
4. ✅ 询问是否推送到Docker Hub
5. ✅ 推送到 https://hub.docker.com/r/esdkaiyuan/co-creation

---

### 第二步: 在宝塔面板部署容器

#### 1. 拉取镜像

在宝塔面板 SSH终端执行:
```bash
docker pull esdkaiyuan/co-creation:latest
```

或在Docker管理器中搜索镜像 `esdkaiyuan/co-creation`

#### 2. 创建容器

**方式一: 使用宝塔面板Docker管理器**

1. Docker → 容器管理 → 创建容器
2. 填写配置:
   ```
   容器名称: co-creation
   镜像名称: esdkaiyuan/co-creation:latest
   重启策略: always
   端口映射: 3000:3000
   ```

3. 添加环境变量:
   ```env
   DB_HOST=host.docker.internal
   DB_PORT=3306
   DB_USER=co_creation_esdk
   DB_PASSWORD=GchzPPQ8sM6Rc2Xn
   DB_NAME=co_creation_esdk
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=7d
   PORT=3000
   ```

4. 挂载数据卷:
   ```
   宿主机: /www/wwwroot/co-creation/uploads
   容器: /app/uploads
   权限: 读写
   ```

5. 点击"确定"创建

**方式二: 使用命令行**

```bash
docker run -d \
  --name co-creation \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=co_creation_esdk \
  -e DB_PASSWORD=GchzPPQ8sM6Rc2Xn \
  -e DB_NAME=co_creation_esdk \
  -e JWT_SECRET=your-secret-key-change-in-production \
  -e JWT_EXPIRES_IN=7d \
  -e PORT=3000 \
  -v /www/wwwroot/co-creation/uploads:/app/uploads \
  esdkaiyuan/co-creation:latest
```

#### 3. 配置域名和反向代理

参考 [BAOTA_IMAGE_DEPLOY.md](BAOTA_IMAGE_DEPLOY.md) 第四步

---

## 🔄 更新应用

### 更新流程

```bash
# 1. 本地修改代码
git add .
git commit -m "Update feature"
git push origin main

# 2. 构建新版本镜像
./build-and-push.sh v1.0.1  # 或 build-and-push.bat v1.0.1

# 3. 在服务器上更新
docker pull esdkaiyuan/co-creation:v1.0.1
docker stop co-creation && docker rm co-creation
docker run -d --name co-creation ... esdkaiyuan/co-creation:v1.0.1
```

### 回滚到旧版本

```bash
# 拉取旧版本镜像
docker pull esdkaiyuan/co-creation:v1.0.0

# 停止当前容器
docker stop co-creation && docker rm co-creation

# 使用旧版本启动
docker run -d --name co-creation ... esdkaiyuan/co-creation:v1.0.0
```

---

## 📚 文档索引

| 文档 | 用途 | 位置 |
|------|------|------|
| **DOCKER_IMAGE_GUIDE.md** | Docker镜像构建和推送详细指南 | 项目根目录 |
| **BAOTA_IMAGE_DEPLOY.md** | 宝塔面板使用Docker镜像部署指南 | 项目根目录 |
| **build-and-push.sh** | Linux/Mac一键构建推送脚本 | 项目根目录 |
| **build-and-push.bat** | Windows一键构建推送脚本 | 项目根目录 |

**推荐阅读顺序:**
1. 先看本文档 - 了解整体方案
2. 再看 DOCKER_IMAGE_GUIDE.md - 学习如何构建镜像
3. 最后看 BAOTA_IMAGE_DEPLOY.md - 在宝塔面板部署

---

## 🎯 核心优势

### 1. 部署速度快

```
Git部署: 拉取代码(30s) + 安装依赖(60s) + 构建前端(90s) = ~3分钟
镜像部署: 拉取镜像(30s) + 启动容器(10s) = ~40秒
```

**速度提升: 约5倍!**

### 2. 节省服务器资源

```
Git部署: 需要Node.js、npm、构建工具(~500MB磁盘空间)
镜像部署: 只需要Docker运行时(~150MB磁盘空间)
```

**资源节省: 约70%!**

### 3. 版本管理清晰

```
v1.0.0 - 初始版本
v1.0.1 - Bug修复
v1.1.0 - 新功能
v2.0.0 - 重大变更
```

每个版本都有对应的镜像标签,可以随时回滚。

### 4. 环境一致性

```
本地开发环境 = 测试环境 = 生产环境
```

Docker镜像保证所有环境完全一致,避免"在我机器上可以运行"的问题。

---

## 🔧 技术架构

```
┌─────────────────────────────────────┐
│     本地开发机器                     │
│  - 修改代码                          │
│  - git push                         │
│  - ./build-and-push.sh v1.0.1      │
└──────────────┬──────────────────────┘
               │ docker push
               ↓
┌─────────────────────────────────────┐
│     Docker Hub                       │
│  esdkaiyuan/co-creation:v1.0.1      │
│  esdkaiyuan/co-creation:latest      │
└──────────────┬──────────────────────┘
               │ docker pull
               ↓
┌─────────────────────────────────────┐
│     宝塔面板服务器                   │
│  - Docker 容器 (Port 3000)          │
│  - Nginx 反向代理 (Port 443/80)     │
│  - MySQL (Port 3306)                │
└─────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│     用户访问                         │
│  https://co-creation.esdkaiyuan...  │
└─────────────────────────────────────┘
```

---

## 📊 镜像大小优化

### 优化前 vs 优化后

| 阶段 | 大小 | 说明 |
|------|------|------|
| 基础镜像 | 50MB | node:18-alpine |
| 依赖层 | 80MB | node_modules |
| 应用层 | 20MB | 源代码 + dist |
| **总计** | **~150MB** | 压缩后传输更小 |

**优化措施:**
- ✅ 使用 Alpine 基础镜像(比完整版小70%)
- ✅ 多阶段构建(只保留运行时文件)
- ✅ .dockerignore 排除不必要文件
- ✅ npm ci --only=production(不安装devDependencies)

---

## 🛡️ 安全性建议

### 1. 不要在镜像中硬编码密码

❌ **错误:**
```dockerfile
ENV DB_PASSWORD=GchzPPQ8sM6Rc2Xn
```

✅ **正确:**
```bash
# 运行时传入
docker run -e DB_PASSWORD=your-password ...
```

### 2. 定期更新基础镜像

```bash
# 每月检查安全更新
docker pull node:18-alpine
```

### 3. 扫描镜像漏洞

```bash
# 使用 Docker Scout
docker scout cves esdkaiyuan/co-creation:latest

# 或使用 Trivy
trivy image esdkaiyuan/co-creation:latest
```

### 4. 使用私有仓库(可选)

如果担心公开镜像的安全性,可以使用:
- Docker Hub 私有仓库
- 阿里云容器镜像服务
- 腾讯云容器镜像服务
- 自建 Harbor 仓库

---

## 🎓 最佳实践

### 1. 版本命名规范

```
v{主版本}.{次版本}.{补丁版本}

示例:
v1.0.0 - 第一个稳定版本
v1.0.1 - Bug修复
v1.1.0 - 新功能
v2.0.0 - 重大变更(不兼容)
```

### 2. 标签策略

始终同时推送两个标签:
- `v1.0.1` - 具体版本(用于生产环境)
- `latest` - 最新版本(用于快速测试)

```bash
docker tag esdkaiyuan/co-creation:v1.0.1 esdkaiyuan/co-creation:latest
docker push esdkaiyuan/co-creation:v1.0.1
docker push esdkaiyuan/co-creation:latest
```

### 3. 更新流程

```bash
# 1. 备份数据库
mysqldump ... > backup_before_update.sql

# 2. 拉取新镜像
docker pull esdkaiyuan/co-creation:v1.0.1

# 3. 更新容器
docker stop co-creation && docker rm co-creation
docker run ... esdkaiyuan/co-creation:v1.0.1

# 4. 验证功能
curl http://localhost:3000/api/health

# 5. 如有问题,快速回滚
docker stop co-creation && docker rm co-creation
docker run ... esdkaiyuan/co-creation:v1.0.0
```

### 4. 监控和告警

```bash
# 设置容器重启告警
docker events --filter 'event=die' --filter 'container=co-creation'

# 监控资源使用
docker stats co-creation

# 定期检查日志
docker logs co-creation --tail 100
```

---

## 🐛 常见问题

### Q1: 镜像拉取失败

**解决方案:**
```bash
# 配置国内镜像加速器
# 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}

# 重启 Docker
systemctl restart docker
```

### Q2: 容器启动后立即退出

**解决方案:**
```bash
# 查看日志
docker logs co-creation

# 常见原因:
# 1. 数据库连接失败 - 检查 DB_HOST
# 2. 端口被占用 - 检查端口映射
# 3. 环境变量缺失 - 检查环境变量配置
```

### Q3: 如何查看镜像历史

```bash
docker history esdkaiyuan/co-creation:latest
```

### Q4: 如何清理旧镜像

```bash
# 查看所有镜像
docker images esdkaiyuan/co-creation

# 删除特定版本
docker rmi esdkaiyuan/co-creation:v1.0.0

# 清理未使用的镜像
docker image prune -a
```

---

## 📈 性能对比

### 部署时间对比

| 步骤 | Git部署 | 镜像部署 |
|------|---------|---------|
| 拉取代码/镜像 | 30s | 30s |
| 安装依赖 | 60s | 0s |
| 构建前端 | 90s | 0s |
| 启动容器 | 10s | 10s |
| **总计** | **~190s** | **~40s** |

**速度提升: 4.75倍!**

### 资源占用对比

| 项目 | Git部署 | 镜像部署 |
|------|---------|---------|
| 磁盘空间 | ~500MB | ~150MB |
| CPU使用(构建时) | 高 | 无 |
| 内存使用 | 高 | 低 |

**资源节省: 约70%!**

---

## ✅ 部署检查清单

### 本地构建阶段
- [ ] Docker已安装并运行
- [ ] 已登录Docker Hub (`docker login`)
- [ ] 代码已提交到GitHub
- [ ] 执行 `./build-and-push.sh v1.0.0`
- [ ] 镜像已成功推送到Docker Hub
- [ ] 可以在 https://hub.docker.com/r/esdkaiyuan/co-creation 看到镜像

### 服务器部署阶段
- [ ] 已拉取镜像 (`docker pull esdkaiyuan/co-creation:latest`)
- [ ] 数据库已初始化
- [ ] 容器已创建并运行
- [ ] 环境变量已正确配置
- [ ] 数据卷已正确挂载
- [ ] API健康检查通过
- [ ] 前端页面可访问
- [ ] SSL证书已配置
- [ ] 反向代理已配置

### 验证阶段
- [ ] 测试账号可以登录
- [ ] 项目发布功能正常
- [ ] 上传文件功能正常
- [ ] 数据库连接正常
- [ ] 容器重启策略生效

---

## 🎊 总结

**Docker镜像部署的优势:**
- ⚡ 部署速度快5倍
- 💾 节省70%服务器资源
- 🔒 版本管理清晰
- 🔄 回滚简单快速
- 🌍 环境一致性保证

**推荐使用场景:**
- ✅ 生产环境部署
- ✅ 稳定版本发布
- ✅ 多环境部署(测试/预发布/生产)
- ✅ 团队协作开发

**下一步:**
1. 阅读 [DOCKER_IMAGE_GUIDE.md](DOCKER_IMAGE_GUIDE.md) 学习构建细节
2. 阅读 [BAOTA_IMAGE_DEPLOY.md](BAOTA_IMAGE_DEPLOY.md) 学习部署步骤
3. 执行 `./build-and-push.sh v1.0.0` 构建第一个镜像
4. 在宝塔面板部署容器
5. 享受快速部署带来的便利!

---

**祝部署顺利! 🚀**
