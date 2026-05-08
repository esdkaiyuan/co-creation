# 发布项目页面增强功能设计文档

**日期:** 2026-05-06  
**状态:** 已批准

## 功能概述

为发布项目页面增加三项核心功能:
1. 项目封面/Logo图片上传(本地存储)
2. 项目仓库地址(必填)
3. 访问权限控制(公开/密码保护)

## 数据库设计

### 修改表: `projects`

```sql
-- 新增字段
ALTER TABLE projects ADD COLUMN repository_url VARCHAR(500) NOT NULL COMMENT '项目仓库地址(必填)';
ALTER TABLE projects ADD COLUMN access_type ENUM('public', 'password') DEFAULT 'public' COMMENT '访问类型';
ALTER TABLE projects ADD COLUMN access_password VARCHAR(100) NULL COMMENT '访问密码(bcrypt加密)';
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| repository_url | VARCHAR(500) | 是 | GitHub/GitLab等仓库链接 |
| access_type | ENUM('public','password') | 是 | 公开访问或密码保护 |
| access_password | VARCHAR(100) | 条件必填 | 仅当access_type=password时必填,bcrypt加密 |

**已有字段:**
- `cover_image` VARCHAR(255) - 项目封面图片路径(已存在,可选)

## 前端设计

### 发布页面表单结构

```
┌─ 发布项目 ──────────────────────────────┐
│                                         │
│ 项目名称: [*] [___________________]     │
│ 项目描述: [*] [___________________]     │
│               [___________________]     │
│ 项目分类: [*] [下拉选择 ▼]              │
│                                         │
│ ───── 项目资源 ─────                    │
│ 项目封面: [📷 点击上传封面图片]         │
│           支持 jpg/png,最大2MB          │
│           [预览缩略图]                  │
│ 仓库地址: [*] [https://github.com/...]  │
│                                         │
│ ───── 访问权限 ─────                    │
│ 访问方式: ◉ 公开访问                    │
│           ○ 密码保护                    │
│ 访问密码: [*] [___________________]     │
│           (选择密码保护时显示)          │
│                                         │
│ [发布项目] [取消]                       │
└─────────────────────────────────────────┘
```

### 表单验证规则

| 字段 | 验证规则 |
|------|----------|
| 项目名称 | 必填, 2-100字符 |
| 项目描述 | 必填, ≥10字符 |
| 项目分类 | 必填 |
| 项目封面 | 可选, jpg/png, ≤2MB |
| 仓库地址 | **必填**, URL格式验证 |
| 访问方式 | 必填, 默认"公开" |
| 访问密码 | 当选择"密码保护"时必填, ≥6位 |

## 后端API设计

### 1. 文件上传接口 (新增)

```
POST /api/upload/image
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**功能:**
- 接收图片文件 (form-data的 `file` 字段)
- 验证: 类型(jpg/png/jpeg), 大小(≤2MB)
- 保存到 `uploads/projects/` 目录
- 返回文件URL

**响应:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/projects/1234567890-abc123.jpg"
  }
}
```

### 2. 创建项目接口 (修改)

```
POST /api/projects
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "title": "项目名称",
  "description": "项目描述",
  "categoryId": 1,
  "coverImage": "/uploads/projects/xxx.jpg",
  "repositoryUrl": "https://github.com/...",
  "accessType": "public",
  "accessPassword": "123456"
}
```

**验证规则:**
- repositoryUrl: 必填, URL格式
- accessType: 必填, 默认'public'
- accessPassword: 当accessType='password'时必填, ≥6位, bcrypt加密存储

### 3. 获取项目详情接口 (修改)

```
GET /api/projects/:id
Headers: X-Access-Password: <密码>
```

**逻辑:**
- 如果项目accessType='password', 验证X-Access-Password头
- 验证失败返回403
- 验证成功返回项目数据

### 4. 验证项目密码接口 (新增)

```
POST /api/projects/:id/verify-password
Content-Type: application/json
```

**请求:**
```json
{
  "password": "123456"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "验证成功",
  "data": {
    "verified": true
  }
}
```

## 文件存储

### 目录结构
```
uploads/
  projects/
    1234567890-abc123.jpg
    1234567891-def456.png
```

### 文件命名规则
- 格式: `{timestamp}-{random}.{ext}`
- 示例: `1715000000000-a3f9c2.jpg`
- 避免文件名冲突

## 错误处理

### 前端错误提示
- 上传失败: "图片上传失败,请重试"
- 格式错误: "仅支持jpg/png格式"
- 大小超限: "图片大小不能超过2MB"
- URL格式错误: "请输入有效的仓库地址"
- 密码长度不足: "密码长度不能少于6位"

### 后端错误码
- 400: 参数验证失败
- 401: 未登录
- 403: 密码验证失败/无权访问
- 500: 服务器错误

## 安全考虑

1. **文件上传安全**
   - 限制文件类型(jpg/png/jpeg)
   - 限制文件大小(2MB)
   - 使用唯一文件名防止覆盖
   - 防止目录遍历攻击

2. **密码安全**
   - bcrypt加密存储
   - 最小长度6位
   - 不返回密码字段

3. **访问控制**
   - 密码保护项目需要验证
   - 验证失败不返回任何项目信息
