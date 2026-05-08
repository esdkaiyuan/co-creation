# 🎉 共创平台 - 完整项目

一个基于 Vue 3 + Node.js + MySQL 的项目协作平台。

---

## ✨ 项目特性

### 前端
- ⚡ Vue 3 + Vite - 快速开发体验
- 🎨 Element Plus - 精美 UI 组件库
- 📦 Pinia - 状态管理
- 🛡️ JWT 认证 - 安全的用户认证
- 📱 响应式设计 - 适配多种设备

### 后端
- 🚀 Express.js - 高性能 Web 框架
- 💾 MySQL - 可靠的关系型数据库
- 🔐 JWT Token - 无状态认证
- 🔒 bcrypt - 密码加密
- ✨ RESTful API - 标准化接口设计

### 功能模块
- 👤 用户注册/登录
- 📁 项目分类管理
- 🚀 项目发布与管理
- 👍 项目点赞功能
- 🤝 项目参与功能
- 🔍 项目搜索与筛选

---

## 🚀 快速启动

### 方式一: 一键启动 (推荐)

**前提条件**: 需要先以管理员身份启动 MySQL 服务

```bash
# 在 PowerShell (管理员) 中执行
net start MySQL

# 然后双击运行
一键启动.bat
```

这将自动:
1. ✅ 检查环境
2. ✅ 安装依赖
3. ✅ 启动后端 (端口 5000)
4. ✅ 启动前端 (端口 3000)
5. ✅ 打开浏览器

### 方式二: 手动启动

#### 1. 启动 MySQL
```bash
# PowerShell (管理员)
net start MySQL
```

#### 2. 启动后端
```bash
# 新终端窗口
node server.cjs
```

#### 3. 启动前端
```bash
# 另一个终端窗口
npm run dev
```

---

## 📋 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **MySQL**: >= 8.0
- **操作系统**: Windows 10/11

---

## 🗄️ 数据库配置

### 连接信息
```
主机: localhost:3306
数据库: co_creation_esdk
用户名: co_creation_esdk
密码: GchzPPQ8sM6Rc2Xn
```

### 数据库已包含
- ✅ 9 个测试用户
- ✅ 8 个项目分类
- ✅ 8 个示例项目
- ✅ 完整的关联数据

### 测试账号
```
邮箱: test@example.com
密码: 123456
```

其他测试账号 (密码均为 `password123`):
- zhangsan@example.com
- lisi@example.com
- wangwu@example.com
- 等等...

---

## 📡 API 接口

### 用户接口
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息

### 分类接口
- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类

### 项目接口
- `GET /api/projects` - 获取项目列表 (支持分页、筛选、排序)
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects` - 创建项目 (需登录)
- `PUT /api/projects/:id` - 更新项目 (需登录)
- `DELETE /api/projects/:id` - 删除项目 (需登录)
- `POST /api/projects/:id/like` - 点赞 (需登录)
- `DELETE /api/projects/:id/like` - 取消点赞 (需登录)
- `POST /api/projects/:id/participate` - 参与 (需登录)
- `DELETE /api/projects/:id/participate` - 取消参与 (需登录)

### 健康检查
- `GET /api/health` - 服务健康检查

---

## 📁 项目结构

```
co-creation/
├── 📦 核心文件
│   ├── server.cjs                # 后端服务入口
│   ├── package.json              # 前端依赖
│   ├── package.backend.json      # 后端依赖
│   └── vite.config.js            # Vite 配置
│
├── 🚀 启动脚本
│   ├── 一键启动.bat              # ⭐ 一键启动前后端
│   ├── start-backend.bat         # 启动后端
│   ├── start-frontend.bat        # 启动前端
│   └── test-api.bat              # API 测试
│
├── 🗄️ 数据库
│   ├── init_database.sql         # 数据库初始化脚本
│   └── create_database.sql       # 创建数据库脚本
│
├── 📖 文档
│   ├── README.md                 # 本文件
│   ├── 启动说明.md               # 详细启动指南
│   ├── DATABASE_README.md        # 数据库文档
│   ├── QUICK_START.md            # 快速指南
│   ├── README_DEPLOY.md          # 部署说明
│   └── COMPLETION_REPORT.md      # 完成报告
│
├── 🎨 前端源码
│   ├── api/                      # API 调用
│   ├── assets/                   # 静态资源
│   ├── components/               # 公共组件
│   ├── router/                   # 路由配置
│   ├── store/                    # 状态管理
│   ├── styles/                   # 全局样式
│   ├── utils/                    # 工具函数
│   ├── views/                    # 页面组件
│   ├── App.vue                   # 根组件
│   ├── main.js                   # 入口文件
│   └── index.html                # HTML 模板
│
└── ⚙️ 配置
    ├── .env.production           # 前端环境变量
    └── .env.example              # 后端环境变量示例
```

---

## 🔧 配置说明

### 前端配置
编辑 `.env.production`:
```env
VITE_API_BASE_URL=/api
```

### 后端配置
编辑 `server.cjs` 中的数据库配置:
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'co_creation_esdk',
  password: 'GchzPPQ8sM6Rc2Xn',
  database: 'co_creation_esdk'
});
```

---

## 🧪 测试

### 测试后端
```bash
# 运行测试脚本
test-api.bat

# 或手动测试
curl http://localhost:5000/api/health
```

### 测试前端
浏览器访问: http://localhost:3000

### 测试数据库
```bash
"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "SELECT COUNT(*) FROM users;"
```

---

## 🐛 常见问题

### MySQL 服务无法启动
```bash
# 以管理员身份运行
net start MySQL

# 如果还是失败,检查服务是否存在
Get-Service MySQL
```

### 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :5000  # 后端
netstat -ano | findstr :3000  # 前端

# 修改端口
# 后端: 编辑 server.cjs 中的 PORT
# 前端: 编辑 vite.config.js 中的 port
```

### 依赖安装失败
```bash
# 清除缓存
npm cache clean --force

# 重新安装
npm install
```

更多问题请查看: `启动说明.md`

---

## 📊 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 前端框架 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | UI 组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP 客户端 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 16+ | 运行时环境 |
| Express | 4.x | Web 框架 |
| MySQL2 | 3.x | 数据库驱动 |
| bcrypt | 5.x | 密码加密 |
| jsonwebtoken | 9.x | JWT 认证 |
| CORS | 2.x | 跨域处理 |

---

## 🎯 开发指南

### 添加新功能
1. 后端: 在 `server.cjs` 中添加路由
2. 前端: 在 `api/` 中添加 API 调用
3. 前端: 在 `store/` 中添加状态管理
4. 前端: 在 `views/` 中创建页面

### 修改数据库
1. 编辑 `init_database.sql`
2. 重新执行初始化:
```bash
"C:\mysql-enterprise\bin\mysql.exe" -u root co_creation_esdk < init_database.sql
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
- 📖 启动说明: `启动说明.md`
- 🗄️ 数据库文档: `DATABASE_README.md`
- 🚀 快速指南: `QUICK_START.md`
- 📋 完成报告: `COMPLETION_REPORT.md`

---

## 📄 许可证

MIT License

---

**祝使用愉快! 🎉**
