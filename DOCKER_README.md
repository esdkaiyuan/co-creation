# Docker 部署快速指南

## 文件说明

本项目包含以下Docker相关文件:

- **Dockerfile** - Docker镜像构建配置
- **.dockerignore** - Docker构建时忽略的文件
- **.gitignore** - Git版本控制忽略的文件
- **docker-entrypoint.sh** - 容器启动脚本
- **deploy.sh** - 一键部署脚本(Linux/Mac)
- **DEPLOY.md** - 完整部署文档

---

## 快速开始

### 1. 推送到GitHub

```bash
# 初始化Git仓库(如果还没有)
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit with Docker support"

# 添加远程仓库
git remote add origin https://github.com/your-username/co-creation.git

# 推送
git push -u origin main
```

### 2. 在宝塔面板部署

详细步骤请参考 [DEPLOY.md](DEPLOY.md)

### 3. 本地测试Docker构建

```bash
# 构建镜像
docker build -t co-creation-app .

# 运行容器(需要设置环境变量)
docker run -d \
  --name co-creation \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=your-db-password \
  -e JWT_SECRET=your-jwt-secret \
  -v $(pwd)/uploads:/app/uploads \
  co-creation-app

# 查看日志
docker logs -f co-creation
```

---

## 环境变量

部署时需要设置以下环境变量:

| 变量 | 说明 | 示例 |
|------|------|------|
| DB_HOST | 数据库主机 | host.docker.internal |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | co_creation_esdk |
| DB_PASSWORD | 数据库密码 | (您的密码) |
| DB_NAME | 数据库名称 | co_creation_esdk |
| JWT_SECRET | JWT密钥 | (生成的随机字符串) |
| PORT | 应用端口 | 3000 |

生成JWT密钥:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 常用命令

### 查看容器状态
```bash
docker ps
```

### 查看日志
```bash
docker logs -f co-creation
```

### 重启容器
```bash
docker restart co-creation
```

### 停止容器
```bash
docker stop co-creation
```

### 删除容器
```bash
docker rm co-creation
```

### 进入容器
```bash
docker exec -it co-creation sh
```

### 更新部署
```bash
./deploy.sh
```

---

## 故障排查

### 容器无法启动

检查日志:
```bash
docker logs co-creation
```

常见原因:
- 数据库连接失败
- 端口被占用
- 环境变量缺失

### 数据库连接失败

测试连接:
```bash
docker exec -it co-creation sh
ping $DB_HOST
```

### 上传文件丢失

确认已挂载uploads目录:
```bash
docker inspect co-creation | grep -A 5 Mounts
```

---

## 更多信息

完整的部署文档和常见问题解答,请查看 [DEPLOY.md](DEPLOY.md)
