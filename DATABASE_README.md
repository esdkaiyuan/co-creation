# 共创平台数据库说明文档

## 📊 数据库概览

- **数据库名称**: co_creation_esdk
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **初始化时间**: 2026-05-06

---

## 🗂️ 数据表结构

### 1. users (用户表)
存储平台用户的基本信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 用户ID (主键) |
| username | VARCHAR(50) | 用户名 (唯一) |
| email | VARCHAR(100) | 邮箱 (唯一) |
| password | VARCHAR(255) | 密码 (bcrypt加密) |
| avatar | VARCHAR(255) | 头像URL |
| bio | TEXT | 个人简介 |
| status | TINYINT | 状态: 1-正常, 0-禁用 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. categories (分类表)
项目分类信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 分类ID (主键) |
| name | VARCHAR(50) | 分类名称 (唯一) |
| icon | VARCHAR(50) | 图标名称 |
| description | VARCHAR(255) | 分类描述 |
| sort_order | INT | 排序顺序 |
| project_count | INT | 项目数量 |
| status | TINYINT | 状态: 1-启用, 0-禁用 |

### 3. projects (项目表)
共创项目信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 项目ID (主键) |
| title | VARCHAR(200) | 项目标题 |
| description | TEXT | 项目描述 |
| cover_image | VARCHAR(255) | 封面图片URL |
| category_id | INT UNSIGNED | 分类ID (外键) |
| creator_id | INT UNSIGNED | 创建者ID (外键) |
| participant_count | INT | 参与人数 |
| like_count | INT | 点赞数 |
| comment_count | INT | 评论数 |
| view_count | INT | 浏览量 |
| is_recommend | TINYINT | 是否推荐: 1-是, 0-否 |
| is_hot | TINYINT | 是否热门: 1-是, 0-否 |
| status | TINYINT | 状态: 1-进行中, 2-已完成, 0-已下架 |
| tags | JSON | 标签数组 |

### 4. project_participants (项目参与者表)
记录用户参与的项目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 记录ID (主键) |
| project_id | INT UNSIGNED | 项目ID (外键) |
| user_id | INT UNSIGNED | 用户ID (外键) |
| role | VARCHAR(50) | 角色: creator-创建者, member-成员 |
| joined_at | TIMESTAMP | 加入时间 |

### 5. project_likes (项目点赞表)
记录用户对项目的点赞

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 记录ID (主键) |
| project_id | INT UNSIGNED | 项目ID (外键) |
| user_id | INT UNSIGNED | 用户ID (外键) |
| created_at | TIMESTAMP | 点赞时间 |

---

## 👥 测试账号

### 模拟用户 (密码均为 bcrypt 加密)

| 用户名 | 邮箱 | 密码 | 简介 |
|--------|------|------|------|
| 张三 | zhangsan@example.com | password123 | 热爱开源技术的开发者 |
| 李四 | lisi@example.com | password123 | UI/UX设计师，专注于用户体验 |
| 王五 | wangwu@example.com | password123 | 全栈工程师，AI爱好者 |
| 赵六 | zhaoliu@example.com | password123 | 摄影师，视觉艺术家 |
| 钱七 | qianqi@example.com | password123 | 物联网工程师，智能家居专家 |
| 孙八 | sunba@example.com | password123 | 教育科技创业者 |
| 周九 | zhoujiu@example.com | password123 | 独立游戏开发者 |
| 吴十 | wushi@example.com | password123 | 字体设计师，排版爱好者 |
| **测试用户** | **test@example.com** | **123456** | **这是一个测试账号** |

> ⚠️ **注意**: 实际使用时需要通过后端 API 进行注册和登录,密码会自动进行 bcrypt 加密

---

## 📁 分类数据

| ID | 分类名称 | 图标 | 项目数 |
|----|---------|------|--------|
| 1 | 技术开发 | Monitor | 128 |
| 2 | 设计创意 | Brush | 86 |
| 3 | 产品/运营 | ShoppingBag | 64 |
| 4 | 内容创作 | VideoCamera | 52 |
| 5 | 硬件/物联网 | Cpu | 38 |
| 6 | 研究学习 | Reading | 45 |
| 7 | 开源专区 | Share | 73 |
| 8 | 公益/社会创新 | Handbag | 29 |

---

## 🚀 项目数据

已初始化 8 个示例项目:

1. **开源任务管理工具** - 技术开发类, 推荐项目
2. **环保知识科普小程序** - 设计创意类, 热门项目
3. **AI 助手插件开发** - 技术开发类, 推荐且热门
4. **摄影作品分享平台** - 设计创意类
5. **智能家居控制系统** - 硬件/物联网类
6. **在线学习笔记协作平台** - 研究学习类
7. **独立游戏《遗忘之境》** - 设计创意类, 推荐且热门
8. **开源字体设计计划** - 设计创意类

---

## 🔧 API 接口对应关系

### 用户接口 (/api/users)
- `POST /users/register` - 用户注册
- `POST /users/login` - 用户登录
- `GET /users/me` - 获取当前用户信息

### 分类接口 (/api/categories)
- `GET /categories` - 获取所有分类
- `GET /categories/:id` - 获取单个分类

### 项目接口 (/api/projects)
- `GET /projects` - 获取项目列表 (支持分页、筛选、排序)
- `GET /projects/:id` - 获取项目详情
- `POST /projects` - 创建项目
- `PUT /projects/:id` - 更新项目
- `DELETE /projects/:id` - 删除项目
- `POST /projects/:id/like` - 点赞项目
- `DELETE /projects/:id/like` - 取消点赞
- `POST /projects/:id/participate` - 参与项目
- `DELETE /projects/:id/participate` - 取消参与

---

## 📝 常用查询示例

### 获取推荐项目
```sql
SELECT * FROM projects WHERE is_recommend = 1;
```

### 获取热门项目
```sql
SELECT * FROM projects WHERE is_hot = 1 ORDER BY like_count DESC;
```

### 获取某分类下的项目
```sql
SELECT p.*, c.name as category_name 
FROM projects p 
JOIN categories c ON p.category_id = c.id 
WHERE c.id = 1;
```

### 获取用户参与的项目
```sql
SELECT p.*, pp.role 
FROM projects p 
JOIN project_participants pp ON p.id = pp.project_id 
WHERE pp.user_id = 1;
```

### 获取用户点赞的项目
```sql
SELECT p.* 
FROM projects p 
JOIN project_likes pl ON p.id = pl.project_id 
WHERE pl.user_id = 1;
```

---

## 🔄 数据维护

### 重新初始化数据库
```bash
mysql -u root co_creation_esdk < init_database.sql
```

### 备份数据库
```bash
mysqldump -u root co_creation_esdk > backup.sql
```

### 恢复数据库
```bash
mysql -u root co_creation_esdk < backup.sql
```

---

## 📌 注意事项

1. **密码安全**: 所有密码使用 bcrypt 加密存储
2. **外键约束**: 删除用户时会级联删除其创建的项目和参与记录
3. **唯一约束**: 用户名和邮箱必须唯一
4. **JSON字段**: tags 字段使用 JSON 类型存储标签数组
5. **索引优化**: 已为常用查询字段添加索引

---

**最后更新**: 2026-05-06  
**维护人员**: 开发团队
