# 共创平台 Docker 部署指南

## 概述

本文档说明如何使用 Docker 和 GitHub 在宝塔面板上部署共创平台应用。

**架构:**
- 前端: Vue 3 + Vite (构建为静态文件)
- 后端: Node.js + Express
- 数据库: 宝塔面板 MySQL
- 域名: co-creation.esdkaiyuan.online
- HTTPS: 已配置 SSL 证书

---

## 前置准备

### 1. GitHub 仓库

确保项目代码已推送到 GitHub 仓库。

### 2. 宝塔面板环境

- ✅ 已安装 Docker 管理器
- ✅ 已安装 MySQL
- ✅ 已创建数据库 `co_creation_esdk`
- ✅ 已配置域名 `co-creation.esdkaiyuan.online` 和 SSL 证书

### 3. 数据库准备

在宝塔面板中执行以下 SQL 初始化数据库:

```sql
-- 创建数据库(如果不存在)
CREATE DATABASE IF NOT EXISTS co_creation_esdk 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 导入 init_database.sql
USE co_creation_esdk;
-- (在宝塔面板的 phpMyAdmin 中导入 init_database.sql 文件)
```

---

## 部署步骤

### 第一步: 生成 JWT 密钥

在服务器上执行:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

复制输出的密钥,后续配置需要用到。

### 第二步: 在宝塔面板中添加 Docker 项目

1. 登录宝塔面板
2. 进入 **Docker** → **项目管理**
3. 点击 **添加项目**
4. 填写以下信息:

```
项目名称: co-creation
Git 地址: https://github.com/your-username/co-creation.git
分支: main (或您的主分支名)
Dockerfile 路径: Dockerfile
端口映射: 3000:3000
```

5. 点击 **高级设置**,添加环境变量:

```
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=co_creation_esdk
DB_PASSWORD=你的数据库密码
DB_NAME=co_creation_esdk
JWT_SECRET=第一步生成的密钥
PORT=3000
NODE_ENV=production
```

6. 点击 **挂载目录**,添加:

```
宿主机路径: /www/wwwroot/co-creation/uploads
容器路径: /app/uploads
```

7. 点击 **确定** 开始构建

### 第三步: 等待构建完成

- 首次构建可能需要 5-10 分钟
- 可以在 **日志** 中查看构建进度
- 构建成功后,容器会自动启动

### 第四步: 配置反向代理

1. 在宝塔面板进入 **网站**
2. 找到或创建站点 `co-creation.esdkaiyuan.online`
3. 点击 **设置** → **反向代理**
4. 添加反向代理:

```
代理名称: co-creation-api
目标 URL: http://127.0.0.1:3000
发送域名: $host
```

5. 确保已启用 HTTPS

### 第五步: 验证部署

访问以下地址测试:

- 首页: https://co-creation.esdkaiyuan.online/
- API 健康检查: https://co-creation.esdkaiyuan.online/api/health

预期返回:
```json
{
  "code": 200,
  "message": "服务正常",
  "data": null
}
```

---

## 更新部署

当代码推送到 GitHub 后,有两种更新方式:

### 方式一: 宝塔面板手动更新(推荐)

1. 在宝塔面板 Docker 管理器中找到项目
2. 点击 **更新** 按钮
3. 系统会自动拉取最新代码并重新构建
4. 等待构建完成后自动重启容器

### 方式二: 命令行更新

```bash
# 进入项目目录
cd /www/server/docker/co-creation

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

---

## 常见问题

### 1. 容器启动失败

**检查日志:**
```bash
docker logs co-creation
```

**常见原因:**
- 数据库连接失败: 检查 `DB_HOST` 和 `DB_PASSWORD`
- 端口被占用: 修改端口映射
- 环境变量缺失: 检查所有必需的环境变量

### 2. 无法连接数据库

**解决方案:**
- 确认 `DB_HOST` 设置为 `host.docker.internal` 或服务器内网 IP
- 确认数据库用户有远程访问权限
- 检查防火墙是否允许 3306 端口

**测试连接:**
```bash
docker exec -it co-creation sh
ping $DB_HOST
```

### 3. 上传文件丢失

**原因:** 未正确挂载 uploads 目录

**解决方案:**
- 确认在 Docker 配置中添加了目录挂载
- 检查宿主机目录权限: `chmod -R 755 /www/wwwroot/co-creation/uploads`

### 4. HTTPS 访问失败

**检查项:**
- SSL 证书是否有效
- 反向代理配置是否正确
- 防火墙是否开放 443 端口

---

## 备份与恢复

### 数据库备份

```bash
# 备份数据库
mysqldump -u co_creation_esdk -p co_creation_esdk > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u co_creation_esdk -p co_creation_esdk < backup_20260508.sql
```

### 上传文件备份

```bash
# 备份 uploads 目录
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /www/wwwroot/co-creation/uploads

# 恢复
tar -xzf uploads_backup_20260508.tar.gz -C /
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩

在宝塔面板网站设置中启用 Gzip 压缩。

### 2. 配置 CDN

将静态资源(CSS、JS、图片)托管到 CDN。

### 3. 数据库优化

- 定期清理过期数据(定时任务已配置)
- 添加必要的索引
- 优化慢查询

### 4. 监控

- 使用宝塔面板监控容器资源使用
- 配置告警通知
- 定期检查日志

---

## 技术支持

如遇到问题,请提供以下信息:

1. Docker 日志: `docker logs co-creation`
2. 错误截图
3. 操作步骤描述
4. 环境变量配置(隐藏敏感信息)

---

## 附录: 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| DB_HOST | 数据库主机地址 | - | ✅ |
| DB_PORT | 数据库端口 | 3306 | ❌ |
| DB_USER | 数据库用户名 | - | ✅ |
| DB_PASSWORD | 数据库密码 | - | ✅ |
| DB_NAME | 数据库名称 | co_creation_esdk | ❌ |
| JWT_SECRET | JWT 密钥 | - | ✅ |
| PORT | 应用端口 | 3000 | ❌ |
| NODE_ENV | 运行环境 | production | ❌ |

---

**最后更新:** 2026-05-08
