# 🚀 共创平台 - 完整部署与使用指南

## ✅ 项目概述

共创平台是一个支持项目协作、创意分享的Web应用。

**技术栈:**
- **前端**: Vue 3 + Vite + Element Plus + Pinia
- **后端**: Node.js + Express + MySQL + JWT
- **数据库**: MySQL 9.7.0

---

## 📦 一键启动 (推荐)

### 方式一: 完整启动 (后端 + 前端)

双击运行: **`一键启动.bat`**

该脚本会自动:
1. ✅ 检查 Node.js 环境
2. ✅ 检查 MySQL 数据库连接
3. ✅ 安装后端依赖
4. ✅ 启动后端服务 (http://localhost:5000)
5. ✅ 启动前端服务 (http://localhost:3000)
6. ✅ 自动打开浏览器

### 方式二: 分别启动

**启动后端:**
```bash
双击运行: start-backend.bat
```

**启动前端:**
```bash
双击运行: start-frontend.bat
```

---

## 🔧 手动部署

### 1. 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8.0

### 2. 数据库配置

数据库已经初始化完成,连接信息:
```
主机: localhost:3306
数据库: co_creation_esdk
用户名: co_creation_esdk
密码: GchzPPQ8sM6Rc2Xn
```

### 3. 安装后端依赖

```bash
# 使用后端配置文件
copy package.backend.json package.json

# 安装依赖
npm install
```

### 4. 启动后端服务

```bash
# 开发模式 (支持热重载)
npm run dev

# 生产模式
npm start
```

后端服务将在 `http://localhost:5000` 启动

### 5. 安装前端依赖

```bash
# 如果还没有安装前端依赖
npm install
```

### 6. 启动前端服务

```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

---

## 📡 API 接口文档

### 基础信息

- **Base URL**: `http://localhost:5000/api`
- **认证方式**: JWT Token (在 Header 中添加 `Authorization: Bearer <token>`)
- **响应格式**: 
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {...}
  }
  ```

### 用户接口

#### 1. 用户注册
- **URL**: `POST /api/users/register`
- **请求体**:
  ```json
  {
    "username": "张三",
    "email": "zhangsan@example.com",
    "password": "123456"
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": { "userId": 10 }
  }
  ```

#### 2. 用户登录
- **URL**: `POST /api/users/login`
- **请求体**:
  ```json
  {
    "email": "zhangsan@example.com",
    "password": "123456"
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "张三",
        "email": "zhangsan@example.com",
        "avatar": null,
        "bio": "热爱开源技术的开发者"
      }
    }
  }
  ```

#### 3. 获取当前用户信息
- **URL**: `GET /api/users/me`
- **需要认证**: ✅
- **响应**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "id": 1,
      "username": "张三",
      "email": "zhangsan@example.com",
      "avatar": null,
      "bio": "热爱开源技术的开发者",
      "status": 1,
      "created_at": "2026-05-06T00:00:00.000Z",
      "updated_at": "2026-05-06T00:00:00.000Z"
    }
  }
  ```

### 分类接口

#### 4. 获取所有分类
- **URL**: `GET /api/categories`
- **响应**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": [
      {
        "id": 1,
        "name": "技术开发",
        "icon": "Monitor",
        "description": "编程、软件开发、开源项目等技术相关领域",
        "sort_order": 1,
        "project_count": 128,
        "status": 1
      }
    ]
  }
  ```

### 项目接口

#### 5. 获取项目列表
- **URL**: `GET /api/projects`
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `pageSize`: 每页数量 (默认: 12)
  - `categoryId`: 分类ID
  - `filter`: 过滤器 (`recommend` 或 `hot`)
  - `sort`: 排序方式 (`latest`, `hot`, `participants`)
  - `keyword`: 搜索关键词

- **示例**: `GET /api/projects?page=1&pageSize=12&sort=hot`

- **响应**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "projects": [
        {
          "id": 1,
          "title": "开源任务管理工具",
          "description": "打造一个简洁易用的开源任务管理工具...",
          "coverImage": "https://picsum.photos/seed/task1/400/300",
          "categoryName": "技术开发",
          "tags": ["开发", "开源", "效率工具"],
          "participantCount": 12,
          "likeCount": 1200,
          "commentCount": 32,
          "viewCount": 5600,
          "isRecommend": true,
          "isHot": false,
          "creator": {
            "username": "张三",
            "avatar": null
          },
          "createdAt": "2026-05-06T00:00:00.000Z",
          "updatedAt": "2026-05-06T00:00:00.000Z"
        }
      ],
      "total": 8,
      "page": 1,
      "pageSize": 12
    }
  }
  ```

#### 6. 获取项目详情
- **URL**: `GET /api/projects/:id`
- **示例**: `GET /api/projects/1`
- **响应**: 包含项目完整信息、参与者列表、是否已点赞/参与

#### 7. 创建项目
- **URL**: `POST /api/projects`
- **需要认证**: ✅
- **请求体**:
  ```json
  {
    "title": "我的新项目",
    "description": "这是一个很棒的项目...",
    "categoryId": 1,
    "tags": ["开发", "开源"]
  }
  ```

#### 8. 点赞项目
- **URL**: `POST /api/projects/:id/like`
- **需要认证**: ✅

#### 9. 取消点赞
- **URL**: `DELETE /api/projects/:id/like`
- **需要认证**: ✅

#### 10. 参与项目
- **URL**: `POST /api/projects/:id/participate`
- **需要认证**: ✅

#### 11. 取消参与
- **URL**: `DELETE /api/projects/:id/participate`
- **需要认证**: ✅

### 健康检查

- **URL**: `GET /api/health`
- **响应**:
  ```json
  {
    "code": 200,
    "message": "服务正常",
    "data": {
      "status": "ok",
      "timestamp": "2026-05-06T12:00:00.000Z"
    }
  }
  ```

---

## 👥 测试账号

### 推荐测试账号
- **邮箱**: `test@example.com`
- **密码**: `123456`

### 其他测试账号
所有用户密码均为: `password123`

| 用户名 | 邮箱 | 简介 |
|--------|------|------|
| 张三 | zhangsan@example.com | 热爱开源技术的开发者 |
| 李四 | lisi@example.com | UI/UX设计师，专注于用户体验 |
| 王五 | wangwu@example.com | 全栈工程师，AI爱好者 |
| 赵六 | zhaoliu@example.com | 摄影师，视觉艺术家 |
| 钱七 | qianqi@example.com | 物联网工程师，智能家居专家 |
| 孙八 | sunba@example.com | 教育科技创业者 |
| 周九 | zhoujiu@example.com | 独立游戏开发者 |
| 吴十 | wushi@example.com | 字体设计师，排版爱好者 |

---

## 🗄️ 数据库管理

### 查看数据库

```bash
# 连接数据库
"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk

# 查看所有表
SHOW TABLES;

# 查看用户
SELECT id, username, email FROM users;

# 查看项目
SELECT id, title, like_count FROM projects ORDER BY like_count DESC;
```

### 重新初始化数据库

```bash
"C:\mysql-enterprise\bin\mysql.exe" -u root co_creation_esdk < init_database.sql
```

### 备份数据库

```bash
"C:\mysql-enterprise\bin\mysqldump.exe" -u root co_creation_esdk > backup.sql
```

---

## 🔍 常见问题

### Q1: 后端启动失败?

**检查项:**
1. MySQL 服务是否启动
2. 数据库连接信息是否正确
3. 端口 5000 是否被占用

**解决方法:**
```bash
# 检查 MySQL 服务
Get-Service MySQL

# 查看端口占用
netstat -ano | findstr :5000
```

### Q2: 前端无法连接后端?

**检查项:**
1. 后端服务是否正常运行
2. `vite.config.js` 中的代理配置是否正确
3. 浏览器控制台是否有 CORS 错误

**解决方法:**
- 确认后端在 `http://localhost:5000` 运行
- 访问 `http://localhost:5000/api/health` 测试后端

### Q3: 登录后无法获取用户信息?

**检查项:**
1. Token 是否正确保存
2. 请求头是否包含 Authorization
3. Token 是否过期

**解决方法:**
- 打开浏览器开发者工具,查看 Network 请求
- 检查 localStorage 中是否有 token

### Q4: 如何修改后端端口?

编辑 `server.js` 文件:
```javascript
const PORT = process.env.PORT || 5000; // 改为其他端口
```

同时需要修改 `vite.config.js` 中的代理配置:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:新端口',
    changeOrigin: true
  }
}
```

### Q5: 数据库连接失败?

**检查项:**
1. MySQL 服务是否启动
2. 用户名密码是否正确
3. 数据库是否存在

**解决方法:**
```bash
# 启动 MySQL 服务
net start MySQL

# 测试连接
"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn
```

---

## 📊 项目结构

```
co-creation/
├── 一键启动.bat              # 一键启动脚本
├── start-backend.bat         # 启动后端
├── start-frontend.bat        # 启动前端
├── server.js                 # 后端服务入口
├── package.backend.json      # 后端依赖配置
├── .env.example              # 环境变量示例
│
├── api/                      # 前端 API 调用
│   ├── request.js            # Axios 封装
│   ├── user.js               # 用户接口
│   ├── project.js            # 项目接口
│   └── category.js           # 分类接口
│
├── views/                    # 页面组件
│   ├── HomeView.vue          # 首页
│   ├── LoginView.vue         # 登录
│   ├── RegisterView.vue      # 注册
│   ├── ProjectDetailView.vue # 项目详情
│   └── PublishProjectView.vue# 发布项目
│
├── components/               # 公共组件
├── store/                    # 状态管理
├── router/                   # 路由配置
│
├── init_database.sql         # 数据库初始化脚本
├── DATABASE_README.md        # 数据库文档
└── README_DEPLOY.md          # 本文件
```

---

## 🎯 开发流程

### 1. 启动开发环境

```bash
# 方式一: 一键启动
双击: 一键启动.bat

# 方式二: 分别启动
# 终端1: 启动后端
start-backend.bat

# 终端2: 启动前端
start-frontend.bat
```

### 2. 访问应用

打开浏览器访问: `http://localhost:3000`

### 3. 测试功能

- 使用测试账号登录: `test@example.com` / `123456`
- 浏览项目列表
- 查看项目详情
- 点赞和参与项目
- 发布新项目

### 4. 调试

**前端调试:**
- 打开浏览器开发者工具 (F12)
- 查看 Console 和 Network 面板

**后端调试:**
- 查看后端控制台输出
- 所有错误都会打印到控制台

---

## 🚀 生产部署

### 1. 后端部署

```bash
# 安装依赖
npm install --production

# 启动服务
NODE_ENV=production node server.js
```

### 2. 前端构建

```bash
# 构建生产版本
npm run build

# 产物在 dist/ 目录
```

### 3. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📝 更新日志

### v1.0.0 (2026-05-06)

- ✅ 完成数据库设计和初始化
- ✅ 实现用户注册/登录功能
- ✅ 实现项目 CRUD 操作
- ✅ 实现点赞和参与功能
- ✅ 实现分类管理
- ✅ 添加 JWT 认证
- ✅ 创建一键启动脚本
- ✅ 完善 API 文档

---

## 📞 技术支持

如有问题,请查看:
- 数据库文档: `DATABASE_README.md`
- 完成报告: `COMPLETION_REPORT.md`
- 快速启动: `QUICK_START.md`

---

**祝使用愉快! 🎉**
