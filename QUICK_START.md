# 🚀 共创平台 - 一键部署指南

## ✅ 已完成的工作

### 1. 数据库初始化 ✓
- ✅ 创建了数据库 `co_creation_esdk`
- ✅ 创建了用户 `co_creation_esdk` (密码: GchzPPQ8sM6Rc2Xn)
- ✅ 创建了 5 张数据表
- ✅ 插入了完整的模拟数据

### 2. 数据内容
- 👥 **9个用户** (包括1个测试账号)
- 📁 **8个分类** (技术开发、设计创意等)
- 🚀 **8个项目** (包含推荐和热门项目)
- 👍 **点赞记录** (8条)
- 🤝 **参与记录** (8条)

---

## 📋 快速开始

### 方式一: 使用现有前端 + 新建后端 (推荐)

#### 1️⃣ 安装后端依赖

```bash
# 复制后端配置文件
copy package.backend.json package.json

# 安装依赖
npm install
```

#### 2️⃣ 创建后端入口文件

将 `API_EXAMPLE.js` 重命名为 `server.js`:

```bash
ren API_EXAMPLE.js server.js
```

#### 3️⃣ 启动后端服务

```bash
npm start
```

后端将在 `http://localhost:5000` 运行

#### 4️⃣ 配置前端代理

修改 `.env.production`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### 5️⃣ 启动前端

```bash
npm run dev
```

---

### 方式二: 仅使用前端 (开发模式)

前端已经内置了模拟数据,可以直接运行:

```bash
npm install
npm run dev
```

前端会自动使用 `utils/mockData.js` 中的模拟数据。

---

## 🔑 测试账号

### 推荐使用
- **邮箱**: test@example.com
- **密码**: 123456

### 其他测试账号
所有用户的密码都是: `password123`

| 用户名 | 邮箱 |
|--------|------|
| 张三 | zhangsan@example.com |
| 李四 | lisi@example.com |
| 王五 | wangwu@example.com |
| 赵六 | zhaoliu@example.com |
| 钱七 | qianqi@example.com |
| 孙八 | sunba@example.com |
| 周九 | zhoujiu@example.com |
| 吴十 | wushi@example.com |

---

## 🗄️ 数据库管理

### 查看数据

```bash
# 连接到数据库
& "C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk

# 查看所有表
SHOW TABLES;

# 查看用户
SELECT * FROM users;

# 查看项目
SELECT * FROM projects;
```

### 重新初始化数据库

如果需要重置数据库:

```bash
& "C:\mysql-enterprise\bin\mysql.exe" -u root co_creation_esdk < init_database.sql
```

### 备份数据库

```bash
& "C:\mysql-enterprise\bin\mysqldump.exe" -u root co_creation_esdk > backup_20260506.sql
```

---

## 🌐 API 接口列表

### 用户接口
- `POST /api/users/register` - 注册
- `POST /api/users/login` - 登录
- `GET /api/users/me` - 获取当前用户信息

### 分类接口
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类

### 项目接口
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects` - 创建项目 (需要登录)
- `POST /api/projects/:id/like` - 点赞 (需要登录)
- `DELETE /api/projects/:id/like` - 取消点赞 (需要登录)
- `POST /api/projects/:id/participate` - 参与 (需要登录)
- `DELETE /api/projects/:id/participate` - 取消参与 (需要登录)

---

## 📁 项目文件说明

| 文件 | 说明 |
|------|------|
| `init_database.sql` | 数据库初始化脚本 |
| `create_database.sql` | 创建数据库和用户脚本 |
| `DATABASE_README.md` | 数据库详细说明文档 |
| `API_EXAMPLE.js` | 后端 API 示例代码 |
| `package.backend.json` | 后端依赖配置 |
| `QUICK_START.md` | 本文件 - 快速启动指南 |

---

## 🔧 常见问题

### Q1: MySQL 服务无法启动?
```bash
# 检查服务状态
Get-Service MySQL

# 手动启动
net start MySQL
```

### Q2: 端口 5000 被占用?
修改 `API_EXAMPLE.js` 中的端口:
```javascript
const PORT = process.env.PORT || 5001; // 改为其他端口
```

### Q3: 前端无法连接后端?
检查 `.env.production` 中的 API 地址是否正确:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Q4: 如何添加更多模拟数据?
编辑 `init_database.sql` 文件,在相应位置添加 INSERT 语句,然后重新执行:
```bash
& "C:\mysql-enterprise\bin\mysql.exe" -u root co_creation_esdk < init_database.sql
```

---

## 📊 数据统计

当前数据库包含:
- 用户数: 9
- 分类数: 8
- 项目数: 8
- 参与记录: 8
- 点赞记录: 8

---

## 🎯 下一步

1. **完善后端功能**: 
   - 实现评论系统
   - 添加文件上传
   - 实现消息通知

2. **优化前端体验**:
   - 添加加载动画
   - 优化移动端适配
   - 增加搜索功能

3. **部署到生产环境**:
   - 配置 Nginx
   - 设置 HTTPS
   - 配置域名

---

## 📞 技术支持

如有问题,请查看:
- 数据库文档: `DATABASE_README.md`
- API 示例: `API_EXAMPLE.js`
- 前端代码: `src/` 目录

---

**祝使用愉快! 🎉**
