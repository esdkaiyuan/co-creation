# 宝塔面板 Docker 自动部署配置指南

## 📋 前置准备

### 1. GitHub 仓库
✅ 已完成: https://github.com/esdkaiyuan/co-creation

### 2. 宝塔面板环境要求
- ✅ 已安装 **Docker 管理器** (在软件商店中搜索安装)
- ✅ 已安装 **MySQL** 
- ✅ 已创建数据库 `co_creation_esdk`
- ✅ 已配置域名 `co-creation.esdkaiyuan.online` 和 SSL 证书

---

## 🚀 部署步骤

### 第一步: 初始化数据库

在宝塔面板的 **phpMyAdmin** 或 **MySQL管理** 中执行:

```sql
-- 1. 创建数据库(如果不存在)
CREATE DATABASE IF NOT EXISTS co_creation_esdk 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 选择数据库
USE co_creation_esdk;

-- 3. 导入 init_database.sql
-- 在 phpMyAdmin 中选择"导入",上传 init_database.sql 文件
```

**或者使用命令行:**
```bash
mysql -u root -p co_creation_esdk < /www/wwwroot/co-creation/init_database.sql
```

---

### 第二步: 在宝塔面板创建 Docker 项目

#### 1. 打开 Docker 管理器
登录宝塔面板 → 左侧菜单 **Docker** → **项目管理**

#### 2. 点击"添加项目"

填写以下信息:

```
项目名称: co-creation
Git仓库地址: https://github.com/esdkaiyuan/co-creation.git
分支名称: main
Dockerfile路径: Dockerfile
构建上下文: . (当前目录)
端口映射: 3000:3000
```

#### 3. 配置环境变量

点击 **"高级设置"** → **"环境变量"**,添加以下变量:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| DB_HOST | host.docker.internal | 数据库主机(容器访问宿主机) |
| DB_PORT | 3306 | 数据库端口 |
| DB_USER | co_creation_esdk | 数据库用户名 |
| DB_PASSWORD | GchzPPQ8sM6Rc2Xn | 数据库密码 |
| DB_NAME | co_creation_esdk | 数据库名称 |
| JWT_SECRET | your-secret-key-change-in-production | JWT密钥(生产环境请修改!) |
| JWT_EXPIRES_IN | 7d | Token过期时间 |
| PORT | 3000 | 应用端口 |

**⚠️ 重要提示:**
- `DB_HOST` 使用 `host.docker.internal` 让容器访问宿主机的MySQL
- 如果 `host.docker.internal` 不工作,改用服务器内网IP (如 `172.17.0.1`)
- `JWT_SECRET` 请修改为随机字符串,增强安全性

#### 4. 配置数据卷挂载

点击 **"存储"** → **"添加挂载"**:

```
宿主机路径: /www/wwwroot/co-creation/uploads
容器路径: /app/uploads
读写权限: 读写
```

这样可以保证上传的文件在容器重启后不会丢失。

#### 5. 点击"确定"开始构建

宝塔面板将自动:
1. 从 GitHub 拉取代码
2. 根据 Dockerfile 构建镜像
3. 创建并启动容器

**首次构建可能需要 3-5 分钟**,请耐心等待。

---

### 第三步: 配置域名和反向代理

#### 1. 添加网站

宝塔面板 → **网站** → **添加站点**:

```
域名: co-creation.esdkaiyuan.online
根目录: /www/wwwroot/co-creation (任意目录,稍后会配置反向代理)
PHP版本: 纯静态
数据库: 不创建
FTP: 不创建
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
内容替换: 不启用
```

**高级配置** (点击"配置文件"手动编辑):

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持(如果需要)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### 4. 测试访问

浏览器访问: https://co-creation.esdkaiyuan.online

应该能看到共创平台的首页!

---

### 第四步: 配置 Git 自动部署(Webhook)

#### 方案一: 使用宝塔面板内置功能(推荐)

1. **在 Docker 项目管理中找到 co-creation 项目**

2. **点击"设置" → "自动部署"**

3. **开启"Git自动部署"**

4. **复制 Webhook URL**,格式类似:
   ```
   http://你的服务器IP:8888/webhook/docker/xxx
   ```

5. **在 GitHub 配置 Webhook**:
   - 访问: https://github.com/esdkaiyuan/co-creation/settings/hooks
   - 点击 **"Add webhook"**
   - Payload URL: 粘贴上面的 Webhook URL
   - Content type: `application/json`
   - Secret: 留空或设置自定义密钥
   - Events: 选择 **"Just the push event"**
   - 点击 **"Add webhook"**

6. **测试 Webhook**:
   - 推送一次代码到 GitHub
   - 查看 GitHub Webhook 页面的 "Recent Deliveries"
   - 状态码应该是 **200**

#### 方案二: 手动触发重新部署

如果不配置 Webhook,可以手动触发:

1. 在宝塔面板 Docker 项目管理中
2. 找到 co-creation 项目
3. 点击 **"重新构建"** 或 **"重启"**

---

## 🔍 验证部署

### 1. 检查容器状态

```bash
# 查看容器是否运行
docker ps | grep co-creation

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
# 在宝塔面板 Docker 项目中修改端口映射为 3001:3000
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

### 问题5: Git 自动部署不触发

**症状:** 推送代码后容器没有自动更新

**解决方案:**

1. **检查 Webhook 配置:**
   - GitHub → Settings → Webhooks
   - 查看 "Recent Deliveries" 是否有失败记录

2. **手动测试 Webhook:**
   - 在 GitHub Webhook 页面点击 **"Redeliver"**

3. **检查宝塔面板日志:**
   ```bash
   tail -f /www/server/panel/logs/error.log
   ```

4. **临时方案:** 手动点击"重新构建"

---

## 📊 监控和维护

### 查看容器资源使用

```bash
# 实时资源监控
docker stats co-creation

# 查看容器详细信息
docker inspect co-creation
```

### 备份数据库

```bash
# 导出数据库
mysqldump -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk > backup_$(date +%Y%m%d).sql

# 导入数据库
mysql -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk < backup_20260506.sql
```

### 更新应用

**方式一: Git 自动部署**
```bash
# 本地修改代码
git add .
git commit -m "Update feature"
git push origin main

# 等待几秒,宝塔面板会自动拉取并重建
```

**方式二: 手动重新构建**
1. 宝塔面板 → Docker → 项目管理
2. 找到 co-creation 项目
3. 点击 **"重新构建"**

### 清理旧镜像

```bash
# 查看所有镜像
docker images

# 删除未使用的镜像
docker image prune -a

# 删除特定镜像
docker rmi <image_id>
```

---

## 🎯 性能优化建议

### 1. 启用 Nginx 缓存

在网站配置文件中添加:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 2. 启用 Gzip 压缩

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 3. 数据库优化

```sql
-- 添加索引(已在 init_database.sql 中)
ALTER TABLE projects ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE projects ADD INDEX idx_category_id (category_id);
ALTER TABLE projects ADD INDEX idx_creator_id (creator_id);
```

### 4. 定期清理日志

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

3. **宝塔面板版本:**
   - 在面板首页查看版本号

4. **错误截图**

---

## ✅ 部署完成检查清单

- [ ] 数据库已初始化并导入数据
- [ ] Docker 容器正在运行 (`docker ps`)
- [ ] API 健康检查通过 (`curl http://localhost:3000/api/health`)
- [ ] 前端页面可访问 (https://co-creation.esdkaiyuan.online)
- [ ] SSL 证书有效且自动续期
- [ ] 反向代理配置正确
- [ ] 上传文件目录已挂载
- [ ] Git Webhook 配置成功
- [ ] 测试账号可以正常登录
- [ ] 项目发布、编辑、删除功能正常

---

**祝部署顺利! 🎉**

如有问题,请查看容器日志或联系技术支持。
