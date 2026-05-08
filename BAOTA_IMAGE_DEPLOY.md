# 宝塔面板 Docker 镜像部署指南

## 📋 方案说明

**与Git自动部署的区别:**
- ❌ Git部署: 在服务器上拉取代码 → 构建镜像 → 运行容器
- ✅ 镜像部署: 从Docker Hub拉取预构建镜像 → 直接运行容器

**优势:**
- ⚡ 部署速度快(1-2分钟 vs 5-10分钟)
- 💾 节省服务器资源(不需要编译构建)
- 🔒 版本控制清晰(通过镜像标签管理)
- 🔄 回滚方便(切换到旧版本镜像即可)

---

## 🚀 部署步骤

### 第一步: 准备 Docker 镜像

#### 方式一: 从 Docker Hub 拉取(推荐)

```bash
# 拉取最新镜像
docker pull esdkaiyuan/co-creation:latest

# 或拉取指定版本
docker pull esdkaiyuan/co-creation:v1.0.0
```

#### 方式二: 本地构建后推送

参考 [DOCKER_IMAGE_GUIDE.md](DOCKER_IMAGE_GUIDE.md)

---

### 第二步: 在宝塔面板创建容器

#### 1. 打开 Docker 管理器

登录宝塔面板 → 左侧菜单 **Docker** → **容器管理**

#### 2. 点击"创建容器"

填写以下信息:

**基本信息:**
```
容器名称: co-creation
镜像名称: esdkaiyuan/co-creation:latest
重启策略: 始终重启 (always)
```

**端口映射:**
```
主机端口: 3000
容器端口: 3000
协议: TCP
```

**环境变量:**
点击"添加环境变量",逐个添加:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| DB_HOST | host.docker.internal | 数据库主机 |
| DB_PORT | 3306 | 数据库端口 |
| DB_USER | co_creation_esdk | 数据库用户名 |
| DB_PASSWORD | GchzPPQ8sM6Rc2Xn | 数据库密码 |
| DB_NAME | co_creation_esdk | 数据库名称 |
| JWT_SECRET | your-secret-key-change-in-production | JWT密钥(请修改!) |
| JWT_EXPIRES_IN | 7d | Token过期时间 |
| PORT | 3000 | 应用端口 |

**⚠️ 重要提示:**
- `DB_HOST` 使用 `host.docker.internal` 让容器访问宿主机的MySQL
- 如果不工作,改用服务器内网IP (如 `172.17.0.1`)
- `JWT_SECRET` 请修改为随机字符串

**存储卷挂载:**
点击"添加挂载":

```
宿主机路径: /www/wwwroot/co-creation/uploads
容器路径: /app/uploads
权限: 读写
```

这样可以保证上传的文件在容器重启后不会丢失。

**高级设置(可选):**
```
内存限制: 512MB (根据服务器配置调整)
CPU限制: 1核 (根据服务器配置调整)
日志驱动: json-file
日志大小限制: 10MB
```

#### 3. 点击"确定"创建容器

容器将立即启动,可以在"容器管理"中看到状态变为"运行中"。

---

### 第三步: 初始化数据库

如果还没有初始化数据库,需要执行:

```bash
# 方式一: 使用宝塔面板 phpMyAdmin
# 1. 导入 init_database.sql 文件

# 方式二: 使用命令行
mysql -u root -p co_creation_esdk < /path/to/init_database.sql
```

---

### 第四步: 配置域名和反向代理

#### 1. 添加网站

宝塔面板 → **网站** → **添加站点**:

```
域名: co-creation.esdkaiyuan.online
根目录: /www/wwwroot/co-creation (任意目录)
PHP版本: 纯静态
```

#### 2. 配置 SSL 证书

在网站设置中:
- 点击 **SSL** → **Let's Encrypt** → 申请免费证书
- 或者上传已有的证书文件

#### 3. 配置反向代理

在网站设置中:
- 点击 **反向代理** → **添加反向代理**

```
代理名称: co-creation-api
目标URL: http://127.0.0.1:3000
发送域名: $host
```

**Nginx 配置文件优化:**

点击"配置文件",添加以下内容:

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
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
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

#### 4. 测试访问

浏览器访问: https://co-creation.esdkaiyuan.online

应该能看到共创平台的首页!

---

## 🔄 更新应用

### 方式一: 拉取新镜像并重建(推荐)

```bash
# 1. 拉取最新镜像
docker pull esdkaiyuan/co-creation:latest

# 2. 停止并删除旧容器
docker stop co-creation
docker rm co-creation

# 3. 使用新镜像创建容器(重复第二步的配置)
# 在宝塔面板中重新创建容器,或使用命令行:

docker run -d \
  --name co-creation \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=co_creation_esdk \
  -e DB_PASSWORD=GchzPPQ8sM6Rc2Xn \
  -e DB_NAME=co_creation_esdk \
  -e JWT_SECRET=your-secret-key \
  -e JWT_EXPIRES_IN=7d \
  -e PORT=3000 \
  -v /www/wwwroot/co-creation/uploads:/app/uploads \
  esdkaiyuan/co-creation:latest
```

### 方式二: 在宝塔面板中操作

1. Docker → 容器管理 → 找到 co-creation 容器
2. 点击"更多" → "重建容器"
3. 选择新镜像标签
4. 确认配置无误后点击"确定"

### 方式三: 使用版本号回滚

如果需要回滚到旧版本:

```bash
# 拉取旧版本镜像
docker pull esdkaiyuan/co-creation:v1.0.0

# 停止当前容器
docker stop co-creation
docker rm co-creation

# 使用旧版本镜像启动
docker run -d \
  --name co-creation \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=co_creation_esdk \
  -e DB_PASSWORD=GchzPPQ8sM6Rc2Xn \
  -e DB_NAME=co_creation_esdk \
  -e JWT_SECRET=your-secret-key \
  -e JWT_EXPIRES_IN=7d \
  -e PORT=3000 \
  -v /www/wwwroot/co-creation/uploads:/app/uploads \
  esdkaiyuan/co-creation:v1.0.0
```

---

## 🔍 验证部署

### 1. 检查容器状态

```bash
# 查看容器是否运行
docker ps | grep co-creation

# 查看容器详细信息
docker inspect co-creation

# 查看容器日志
docker logs co-creation

# 查看实时日志
docker logs -f co-creation
```

**预期输出:**
```
🚀 启动共创平台应用...
✅ 数据库主机: host.docker.internal
✅ 数据库名称: co_creation_esdk
✅ 应用端口: 3000

Server is running on port 3000
定时清理任务已启动,每天凌晨2点执行
```

### 2. 测试 API 接口

```bash
# 健康检查
curl http://localhost:3000/api/health

# 获取分类列表
curl http://localhost:3000/api/categories

# 获取项目列表
curl http://localhost:3000/api/projects
```

**预期响应:**
```json
{
  "code": 200,
  "message": "服务正常运行",
  "data": null
}
```

### 3. 测试前端页面

浏览器访问: https://co-creation.esdkaiyuan.online

应该能看到:
- ✅ 首页导航栏
- ✅ 项目卡片列表
- ✅ 登录/注册按钮

### 4. 测试登录功能

使用测试账号登录:
```
邮箱: test@example.com
密码: 123456
```

登录后应该能:
- ✅ 查看个人信息
- ✅ 发布项目
- ✅ 参与项目
- ✅ 点赞/收藏

---

## 🐛 常见问题排查

### 问题1: 容器无法连接数据库

**症状:** 日志显示 `ECONNREFUSED` 或 `Access denied`

**解决方案:**

1. **检查 MySQL 是否运行:**
   ```bash
   systemctl status mysqld
   ```

2. **检查数据库用户权限:**
   ```sql
   -- 在 MySQL 中执行
   SELECT user, host FROM mysql.user WHERE user = 'co_creation_esdk';
   
   -- 如果不存在,创建用户
   CREATE USER 'co_creation_esdk'@'%' IDENTIFIED BY 'GchzPPQ8sM6Rc2Xn';
   GRANT ALL PRIVILEGES ON co_creation_esdk.* TO 'co_creation_esdk'@'%';
   FLUSH PRIVILEGES;
   ```

3. **尝试更换 DB_HOST:**
   - 将 `host.docker.internal` 改为服务器内网IP
   - 查看内网IP: `ip addr show docker0` (通常是 `172.17.0.1`)

4. **检查防火墙:**
   ```bash
   # 确保 3306 端口对 Docker 网络开放
   firewall-cmd --list-ports
   ```

### 问题2: 端口被占用

**症状:** 容器启动失败,日志显示 `EADDRINUSE`

**解决方案:**

```bash
# 查看端口占用
netstat -tlnp | grep 3000

# 停止占用端口的进程
kill -9 <PID>

# 或者修改端口映射
docker run -p 3001:3000 ...
```

### 问题3: 上传文件丢失

**症状:** 重启容器后上传的图片/文件消失

**解决方案:**

确保已正确配置数据卷挂载:
```
宿主机路径: /www/wwwroot/co-creation/uploads
容器路径: /app/uploads
```

检查挂载是否生效:
```bash
docker inspect co-creation | grep Mounts -A 20
```

### 问题4: HTTPS 不工作

**症状:** 访问 https://co-creation.esdkaiyuan.online 显示不安全

**解决方案:**

1. **确认 SSL 证书已配置:**
   - 宝塔面板 → 网站 → SSL → 确认证书状态为"正常"

2. **强制 HTTPS 跳转:**
   在网站设置的 **配置文件** 中添加:
   ```nginx
   server {
       listen 80;
       server_name co-creation.esdkaiyuan.online;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **清除浏览器缓存** 后重试

### 问题5: 镜像拉取失败

**症状:** `docker pull` 超时或失败

**解决方案:**

1. **配置国内镜像加速器:**

编辑 `/etc/docker/daemon.json`:
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

重启 Docker:
```bash
systemctl restart docker
```

2. **检查网络连接:**
   ```bash
   ping hub.docker.com
   ```

---

## 📊 监控和维护

### 查看容器资源使用

```bash
# 实时资源监控
docker stats co-creation

# 查看容器详细信息
docker inspect co-creation

# 查看容器进程
docker top co-creation
```

### 备份数据库

```bash
# 导出数据库
mysqldump -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk > backup_$(date +%Y%m%d).sql

# 导入数据库
mysql -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk < backup_20260506.sql
```

### 清理旧镜像

```bash
# 查看所有镜像
docker images esdkaiyuan/co-creation

# 删除未使用的镜像
docker image prune -a

# 删除特定镜像
docker rmi esdkaiyuan/co-creation:v1.0.0
```

### 定期维护任务

```bash
# 每周清理日志
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete

# 每月更新基础镜像
docker pull node:18-alpine

# 每季度扫描漏洞
docker scout cves esdkaiyuan/co-creation:latest
```

---

## 🎯 版本管理最佳实践

### 1. 使用语义化版本

```
v1.0.0 - 第一个稳定版本
v1.0.1 - Bug修复
v1.1.0 - 新功能
v2.0.0 - 重大变更
```

### 2. 保留多个版本

建议同时保留:
- `latest` - 最新稳定版
- `v1.x.x` - 当前主版本的最新补丁
- `v1.0.0` - 初始版本(用于回滚)

### 3. 更新流程

```bash
# 1. 本地测试新版本
docker run --rm -p 3000:3000 esdkaiyuan/co-creation:v1.1.0

# 2. 备份数据库
mysqldump ... > backup_before_update.sql

# 3. 拉取新镜像
docker pull esdkaiyuan/co-creation:v1.1.0

# 4. 更新容器
docker stop co-creation && docker rm co-creation
docker run ... esdkaiyuan/co-creation:v1.1.0

# 5. 验证功能
curl http://localhost:3000/api/health

# 6. 如有问题,快速回滚
docker stop co-creation && docker rm co-creation
docker run ... esdkaiyuan/co-creation:v1.0.0
```

---

## 📈 性能优化建议

### 1. 启用 Nginx 缓存

已在反向代理配置中添加静态资源缓存。

### 2. 启用 Gzip 压缩

已在反向代理配置中启用。

### 3. 数据库优化

```sql
-- 添加索引(已在 init_database.sql 中)
ALTER TABLE projects ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE projects ADD INDEX idx_category_id (category_id);
ALTER TABLE projects ADD INDEX idx_creator_id (creator_id);

-- 定期优化表
OPTIMIZE TABLE projects;
OPTIMIZE TABLE users;
```

### 4. Docker 资源限制

在创建容器时设置:
```bash
docker run \
  --memory=512m \
  --cpus=1 \
  ...
```

### 5. 定期清理日志

```bash
# 限制容器日志大小
# 在 /etc/docker/daemon.json 中添加:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启 Docker
systemctl restart docker
```

---

## ✅ 部署完成检查清单

- [ ] Docker 镜像已拉取 (`docker pull esdkaiyuan/co-creation:latest`)
- [ ] 数据库已初始化并导入数据
- [ ] Docker 容器正在运行 (`docker ps`)
- [ ] API 健康检查通过 (`curl http://localhost:3000/api/health`)
- [ ] 前端页面可访问 (https://co-creation.esdkaiyuan.online)
- [ ] SSL 证书有效且自动续期
- [ ] 反向代理配置正确
- [ ] 上传文件目录已挂载
- [ ] 测试账号可以正常登录
- [ ] 项目发布、编辑、删除功能正常
- [ ] 已配置资源限制(内存/CPU)
- [ ] 已配置日志轮转

---

## 📞 技术支持

如遇到问题,请提供以下信息:

1. **容器日志:**
   ```bash
   docker logs co-creation --tail 100
   ```

2. **Docker 版本:**
   ```bash
   docker --version
   ```

3. **镜像信息:**
   ```bash
   docker inspect esdkaiyuan/co-creation:latest
   ```

4. **错误截图**

---

**祝部署顺利! 🎉**
