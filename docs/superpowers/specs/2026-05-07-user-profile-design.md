# 用户个人信息页面设计文档

**日期:** 2026-05-07  
**状态:** 已批准

## 功能概述

为用户开发完整的个人信息页面(个人中心),包含:
1. 文字头像组件 - 根据用户名首字自动生成多种底色的圆形头像
2. 用户信息展示 - 显示用户名、邮箱、注册时间等基本信息
3. Tab标签页切换 - 我的项目、我的收藏、我的评论、个人设置
4. 统计信息 - 显示项目数、收藏数、评论数
5. 个人信息编辑 - 支持修改用户名、邮箱、个人简介

## 数据库设计

### 现有表结构
用户表 `users` 已包含所需字段:
- `id`: 用户ID
- `username`: 用户名
- `email`: 邮箱
- `avatar`: 头像URL(可选,本功能不使用)
- `bio`: 个人简介
- `created_at`: 注册时间

### 无需新建表
所有数据可从现有表查询:
- 项目数: `SELECT COUNT(*) FROM projects WHERE creator_id = ?`
- 收藏数: `SELECT COUNT(*) FROM project_favorites WHERE user_id = ?`
- 评论数: `SELECT COUNT(*) FROM project_comments WHERE user_id = ?`

## 后端API设计

### 1. 更新用户信息
```javascript
PUT /api/users/me
Headers: Authorization: Bearer <token>
Body: { 
  username: "新用户名",
  email: "new@example.com",
  bio: "个人简介"
}
Response: { 
  code: 200, 
  message: "更新成功", 
  data: { 
    id: 1,
    username: "新用户名",
    email: "new@example.com",
    bio: "个人简介",
    updated_at: "2026-05-07T10:00:00Z"
  } 
}
```

**验证规则:**
- 用户名: 2-20字符,不能为空
- 邮箱: 有效邮箱格式
- 简介: 最多500字符

### 2. 获取用户创建的项目列表
```javascript
GET /api/users/projects?page=1&pageSize=12
Headers: Authorization: Bearer <token>
Response: { 
  code: 200, 
  data: { 
    projects: [...],
    total: 10 
  } 
}
```

### 3. 获取用户的评论历史
```javascript
GET /api/users/comments?page=1&pageSize=20
Headers: Authorization: Bearer <token>
Response: { 
  code: 200, 
  data: { 
    comments: [
      {
        id: 1,
        content: "评论内容",
        project: { id: 1, title: "项目名称" },
        createdAt: "2026-05-07T10:00:00Z"
      }
    ],
    total: 50 
  } 
}
```

### 4. 获取用户统计信息
```javascript
GET /api/users/stats
Headers: Authorization: Bearer <token>
Response: { 
  code: 200, 
  data: { 
    projectCount: 5,
    favoriteCount: 12,
    commentCount: 30
  } 
}
```

## 前端组件设计

### 1. AvatarInitial.vue - 文字头像组件

**功能:**
- 根据用户名首字的Unicode值自动选择15种预设颜色之一
- 显示白色粗体首字母/汉字
- 支持自定义大小
- 圆形设计

**Props:**
- `username`: String (必需) - 用户名
- `size`: Number (默认40) - 头像大小(px)

**颜色方案:**
```javascript
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'
]
```

### 2. ProfileView.vue - 个人中心主页面

**布局结构:**
```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│ 用户信息卡片                     │
│ [头像] 用户名                   │
│         邮箱                    │
│         注册时间                │
│         [编辑资料]              │
├─────────────────────────────────┤
│ 统计信息                         │
│ 项目数 | 收藏数 | 评论数        │
├─────────────────────────────────┤
│ Tab标签页                        │
│ [我的项目][我的收藏]            │
│ [我的评论][个人设置]            │
├─────────────────────────────────┤
│ 内容区域(Tab切换)               │
└─────────────────────────────────┘
```

**Tab内容:**
1. **我的项目**: 使用现有项目卡片组件,显示用户创建的项目
2. **我的收藏**: 复用项目卡片组件,显示收藏的项目
3. **我的评论**: 自定义列表,显示评论内容、所属项目、时间
4. **个人设置**: 表单形式编辑用户名、邮箱、简介

### 3. API封装 (api/user.js)

新增函数:
- `updateUserInfo(data)` - 更新用户信息
- `getUserProjects(params)` - 获取用户项目
- `getUserComments(params)` - 获取用户评论
- `getUserStats()` - 获取统计数据

### 4. Store模块 (store/modules/user.js)

新增状态:
- `userProjects` - 用户项目列表
- `userComments` - 用户评论列表
- `userStats` - 统计数据

新增方法:
- `fetchUserProjects()` - 获取用户项目
- `fetchUserComments()` - 获取用户评论
- `fetchUserStats()` - 获取统计数据
- `updateProfile(data)` - 更新个人资料

### 5. 路由配置 (router/index.js)

```javascript
{
  path: '/profile',
  name: 'Profile',
  component: () => import('@/views/ProfileView.vue'),
  meta: { requiresAuth: true }
}
```

### 6. Header导航更新

在Header组件的用户下拉菜单中添加:
- "个人中心"菜单项,点击跳转到 `/profile`

## 实现计划

### 阶段1: 后端API开发
1. 实现更新用户信息接口
2. 实现获取用户项目列表接口
3. 实现获取用户评论历史接口
4. 实现获取用户统计信息接口

### 阶段2: 前端组件开发
1. 创建AvatarInitial.vue文字头像组件
2. 创建ProfileView.vue主页面
3. 创建各Tab子组件(如需要)
4. 更新api/user.js添加新API
5. 更新store/modules/user.js添加新状态和方法

### 阶段3: 路由和导航
1. 添加/profile路由
2. 更新Header组件添加个人中心入口

### 阶段4: 测试验证
1. 测试文字头像颜色生成
2. 测试各Tab数据加载
3. 测试个人信息编辑功能
4. 测试权限控制(未登录跳转)
5. 浏览器截图自检

## 验证标准

✅ 文字头像正确显示用户名首字
✅ 15种颜色根据用户名自动分配
✅ 用户信息正确显示
✅ 统计信息准确
✅ 各Tab数据正确加载
✅ 个人信息编辑保存成功
✅ 未登录用户访问跳转登录页
✅ 页面布局美观,响应式正常
✅ Console无错误
✅ Network请求全部成功
