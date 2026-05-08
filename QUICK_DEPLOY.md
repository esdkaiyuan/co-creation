# 宝塔面板 Docker 部署 - 快速配置清单

## 📝 环境变量配置

复制以下内容到宝塔面板 Docker 项目的"环境变量"设置中:

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

**⚠️ 重要:** 请将 `JWT_SECRET` 修改为随机字符串!

---

## 📁 数据卷挂载配置

| 宿主机路径 | 容器路径 | 权限 |
|-----------|---------|------|
| /www/wwwroot/co-creation/uploads | /app/uploads | 读写 |

---

## 🌐 反向代理配置

### Nginx 配置文件

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

---

## 🔗 GitHub Webhook 配置

### GitHub 端配置

1. 访问: https://github.com/esdkaiyuan/co-creation/settings/hooks
2. 点击 **"Add webhook"**
3. 填写:
   ```
   Payload URL: http://你的服务器IP:8888/webhook/docker/xxx (从宝塔获取)
   Content type: application/json
   Secret: (留空或自定义)
   Events: Just the push event
   ```

### 宝塔端配置

1. Docker 项目管理 → co-creation → 设置
2. 开启 **"Git自动部署"**
3. 复制 Webhook URL
4. 粘贴到 GitHub

---

## ✅ 验证命令

```bash
# 1. 检查容器状态
docker ps | grep co-creation

# 2. 查看日志
docker logs co-creation --tail 50

# 3. 测试 API
curl http://localhost:3000/api/health

# 4. 查看资源使用
docker stats co-creation
```

---

## 🐛 故障排查

### 数据库连接失败

```bash
# 方案1: 尝试内网IP
# 将 DB_HOST 改为 172.17.0.1

# 方案2: 检查用户权限
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user = 'co_creation_esdk';"
```

### 端口被占用

```bash
# 查看占用
netstat -tlnp | grep 3000

# 停止进程
kill -9 <PID>
```

### 重新构建容器

```bash
# 在宝塔面板操作:
# Docker → 项目管理 → co-creation → 重新构建
```

---

## 📊 常用维护命令

```bash
# 重启容器
docker restart co-creation

# 停止容器
docker stop co-creation

# 删除容器(保留数据)
docker rm co-creation

# 清理旧镜像
docker image prune -a

# 备份数据库
mysqldump -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk > backup_$(date +%Y%m%d).sql
```

---

## 🎯 部署流程图

```
GitHub (git push)
    ↓
Webhook 触发
    ↓
宝塔拉取代码
    ↓
Docker 构建镜像
    ↓
启动新容器
    ↓
健康检查通过
    ↓
✅ 部署完成
```

---

## 📞 快速链接

- **完整部署文档:** BAOTA_DEPLOY.md
- **Docker 配置说明:** DOCKER_README.md
- **GitHub 仓库:** https://github.com/esdkaiyuan/co-creation
- **生产域名:** https://co-creation.esdkaiyuan.online

---

**祝部署顺利! 🚀**
