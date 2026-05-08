# 项目详情页增强功能设计文档

**日期:** 2026-05-07  
**状态:** 已批准

## 功能概述

为项目详情页面增加完整的互动功能:
1. 点赞功能(已有,需完善)
2. 收藏功能(新增)
3. 评论功能(新增,支持回复)

## 数据库设计

### 新建表

#### 1. 项目收藏表 `project_favorites`

```sql
CREATE TABLE project_favorites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (project_id, user_id)
) COMMENT '项目收藏表';
```

**字段说明:**
- `project_id`: 项目ID
- `user_id`: 用户ID
- `created_at`: 收藏时间
- `unique_favorite`: 唯一索引,防止重复收藏

#### 2. 项目评论表 `project_comments`

```sql
CREATE TABLE project_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  parent_id INT UNSIGNED DEFAULT NULL COMMENT '父评论ID,用于回复',
  content TEXT NOT NULL COMMENT '评论内容',
  like_count INT DEFAULT 0 COMMENT '评论点赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES project_comments(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_parent (parent_id)
) COMMENT '项目评论表';
```

**字段说明:**
- `project_id`: 项目ID
- `user_id`: 评论者ID
- `parent_id`: 父评论ID(NULL表示顶级评论)
- `content`: 评论内容
- `like_count`: 评论点赞数
- `created_at/updated_at`: 创建/更新时间

### 现有表

- `projects`: 已有`like_count`字段
- `project_likes`: 已存在,无需修改

## 前端设计

### 页面布局

```
┌─────────────────────────────────────────────────────┐
│ Header (导航栏)                                      │
├─────────────────────────────────────────────────────┤
│ [项目封面图片]                                       │
│                                                      │
│ ┌────────────────────────────────────────┐          │
│ │ 项目名称                                │          │
│ │ 项目描述...                             │          │
│ │ [❤️点赞 123] [⭐收藏 45] [👥参与 67]  │          │
│ └────────────────────────────────────────┘          │
│                                                      │
│ ┌─────────────────┐  ┌──────────────────┐          │
│ │ 项目信息卡片     │  │ 创建者信息        │          │
│ │ 分类/仓库/时间   │  │ 头像/名称/简介    │          │
│ └─────────────────┘  └──────────────────┘          │
│                                                      │
│ ┌────────────────────────────────────────┐          │
│ │ 评论区 (23条)                           │          │
│ │ [输入框] [发送]                         │          │
│ │ 评论列表(支持嵌套回复)                   │          │
│ │ [加载更多]                              │          │
│ └────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

### 组件结构

```
ProjectDetailView.vue (主页面)
├── ProjectHeader.vue (项目头部:封面、标题、描述、操作按钮)
├── ProjectInfo.vue (项目信息侧边栏)
├── CommentSection.vue (评论区)
│   ├── CommentInput.vue (评论输入框)
│   ├── CommentList.vue (评论列表)
│   │   └── CommentItem.vue (单条评论)
│   │       └── CommentReply.vue (回复组件)
│   └── CommentPagination.vue (分页加载)
```

### 交互逻辑

1. **点赞/收藏/参与**
   - 点击按钮切换状态
   - 实时更新计数
   - 未登录时提示登录

2. **评论功能**
   - 输入评论内容,点击发送
   - 支持回复其他评论
   - 评论点赞
   - 分页加载(每次20条)
   - 最新评论在前

3. **权限控制**
   - 点赞/收藏/评论需要登录
   - 只能删除自己的评论
   - 密码保护项目需要验证后才能互动

## 后端API设计

### 收藏接口

```javascript
// 收藏项目
POST /api/projects/:id/favorite
Headers: Authorization: Bearer <token>
Response: { code: 200, message: "收藏成功" }

// 取消收藏
DELETE /api/projects/:id/favorite
Headers: Authorization: Bearer <token>
Response: { code: 200, message: "取消收藏成功" }

// 获取用户收藏列表
GET /api/users/favorites?page=1&pageSize=12
Headers: Authorization: Bearer <token>
Response: { 
  code: 200, 
  data: { favorites: [...], total: 100 } 
}
```

### 评论接口

```javascript
// 发表评论
POST /api/projects/:id/comments
Headers: Authorization: Bearer <token>
Body: { content: "评论内容", parentId: null }
Response: { code: 200, message: "评论成功", data: { commentId: 123 } }

// 获取项目评论列表
GET /api/projects/:id/comments?page=1&pageSize=20
Response: { 
  code: 200, 
  data: { comments: [...], total: 50 } 
}

// 删除评论
DELETE /api/comments/:id
Headers: Authorization: Bearer <token>
Response: { code: 200, message: "删除成功" }

// 点赞评论
POST /api/comments/:id/like
Headers: Authorization: Bearer <token>
Response: { code: 200, message: "点赞成功" }
```

### 修改现有接口

**GET /api/projects/:id** 返回数据增加:
```json
{
  "id": 1,
  "title": "...",
  "isLiked": true,
  "isFavorited": false,
  "isParticipated": true,
  "likeCount": 123,
  "favoriteCount": 45,
  "participantCount": 67,
  "commentCount": 23
}
```

## 文件清单

### 新建文件
- `d:\treai项目\co-creation\components\ProjectHeader.vue`
- `d:\treai项目\co-creation\components\ProjectInfo.vue`
- `d:\treai项目\co-creation\components\CommentSection.vue`
- `d:\treai项目\co-creation\components\CommentInput.vue`
- `d:\treai项目\co-creation\components\CommentList.vue`
- `d:\treai项目\co-creation\components\CommentItem.vue`
- `d:\treai项目\co-creation\api\comment.js`
- `d:\treai项目\co-creation\api\favorite.js`
- `d:\treai项目\co-creation\store\modules\comment.js`
- `d:\treai项目\co-creation\store\modules\favorite.js`

### 修改文件
- `d:\treai项目\co-creation\views\ProjectDetailView.vue`
- `d:\treai项目\co-creation\server.cjs`
- `d:\treai项目\co-creation\api\project.js`
- `d:\treai项目\co-creation\store\modules\project.js`

## 验证计划

### 功能验证
1. ✅ 数据库表创建成功
2. ✅ 收藏/取消收藏功能正常
3. ✅ 发表/回复/删除评论功能正常
4. ✅ 评论点赞功能正常
5. ✅ 项目详情页显示所有互动数据
6. ✅ 未登录用户点击互动按钮提示登录
7. ✅ 密码保护项目验证后才能互动

### API测试
- 使用curl或Postman测试所有新增接口
- 验证权限控制(需要Token的接口)
- 验证错误处理(无效参数、不存在的项目等)

### 浏览器测试
- 使用Browser agent截图验证页面布局
- 测试各种交互场景
- 验证响应式设计

## 安全考虑

1. **SQL注入防护**: 使用参数化查询
2. **XSS防护**: 评论内容转义输出
3. **权限验证**: 所有修改操作验证用户身份
4. **频率限制**: 防止刷评论/点赞(可选)
5. **内容审核**: 敏感词过滤(可选)
