# 项目修改和删除功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现项目的编辑和删除功能,支持基于角色的权限控制(管理员/发布者/参与者),并实现软删除机制(6个月后永久删除)。

**Architecture:** 在users表添加is_admin字段标识管理员,在projects表添加deleted_at字段实现软删除。后端API通过权限验证控制不同用户的操作范围,前端在个人中心的"我参与的项目"列表中提供编辑和删除入口,根据用户角色动态显示按钮和禁用字段。

**Tech Stack:** Vue 3 Composition API, Element Plus, Pinia, Node.js + Express, MySQL, bcrypt, node-cron

---

## 文件结构概览

### 需要修改的文件:

1. **数据库脚本**
   - `init_database.sql` - 添加is_admin和deleted_at字段的ALTER语句
   
2. **server.cjs** - 后端API
   - 修改GET /api/users/me返回is_admin字段
   - 新增PUT /api/projects/:id编辑项目接口
   - 新增DELETE /api/projects/:id删除项目接口
   - 修改所有查询项目的SQL,添加deleted_at IS NULL条件
   
3. **cleanup_deleted_projects.js** - 定时清理脚本(新建)
   - 每天凌晨2点清理6个月前的软删除项目
   
4. **api/project.js** - 前端API封装
   - 新增updateProject函数
   - 新增deleteProject函数
   
5. **store/modules/user.js** - 用户状态管理
   - 在userInfo中添加isAdmin字段
   
6. **views/ProfileView.vue** - 个人中心页面
   - 在"我参与的项目"表格中添加编辑和删除按钮
   - 添加canDeleteProject权限判断方法
   - 添加handleEditProject和handleDeleteProject处理方法
   - 添加编辑对话框组件

### 文件职责:
- **数据库**: 存储管理员标识和软删除时间
- **server.cjs**: 提供带权限验证的编辑和删除API
- **cleanup_deleted_projects.js**: 定时清理过期数据
- **project.js API**: 封装前端调用
- **user store**: 管理用户权限信息
- **ProfileView.vue**: 提供UI入口和处理逻辑

---

### Task 1: 数据库修改 - 添加is_admin和deleted_at字段

**Files:**
- Modify: `init_database.sql` (在文件末尾添加ALTER语句)

- [ ] **Step 1: 添加users表is_admin字段**

在`init_database.sql`文件末尾添加:

```sql
-- ============================================
-- 添加管理员字段和软删除字段
-- ============================================

-- 为users表添加is_admin字段
ALTER TABLE users 
ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否管理员: 1-是, 0-否' 
AFTER status;

-- 为projects表添加deleted_at字段
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间(软删除)' 
AFTER updated_at;

-- 添加索引以优化查询
ALTER TABLE projects ADD INDEX idx_deleted_at (deleted_at);
```

- [ ] **Step 2: 执行数据库迁移**

连接到MySQL并执行上述ALTER语句:

```bash
C:\mysql-enterprise\bin\mysql.exe -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk < d:\treai项目\co-creation\init_database.sql
```

或者直接在MySQL客户端中执行ALTER语句。

- [ ] **Step 3: 设置管理员账号**

首先需要使用bcrypt生成密码哈希。创建一个临时脚本:

创建文件 `generate_password_hash.cjs`:

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'esdkaiyuan-ip';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash:', hash);
}

generateHash();
```

运行脚本:

```bash
node generate_password_hash.cjs
```

复制输出的哈希值,然后执行SQL:

```sql
-- 如果管理员用户不存在,先创建
INSERT INTO users (username, email, password, is_admin) 
VALUES ('admin', '2891672496@qq.com', '<刚才生成的hash>', 1)
ON DUPLICATE KEY UPDATE is_admin = 1;
```

- [ ] **Step 4: 验证数据库修改**

检查字段是否添加成功:

```sql
DESCRIBE users;
DESCRIBE projects;

-- 检查管理员是否设置成功
SELECT id, username, email, is_admin FROM users WHERE email = '2891672496@qq.com';
```

预期结果:
- users表有is_admin字段
- projects表有deleted_at字段
- 管理员用户的is_admin=1

- [ ] **Step 5: 清理临时文件**

```bash
del generate_password_hash.cjs
```

---

### Task 2: 后端API - 修改GET /api/users/me返回is_admin

**Files:**
- Modify: `server.cjs` (约第600-650行,GET /api/users/me接口)

- [ ] **Step 1: 定位GET /api/users/me接口**

打开`server.cjs`,找到现有的获取当前用户信息的接口。

- [ ] **Step 2: 修改SELECT语句添加is_admin字段**

将原有的SELECT语句:

```javascript
const [users] = await pool.execute(
  'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
  [req.user.id]
);
```

修改为:

```javascript
const [users] = await pool.execute(
  'SELECT id, username, email, avatar, bio, is_admin, created_at FROM users WHERE id = ?',
  [req.user.id]
);
```

- [ ] **Step 3: 重启后端服务测试**

```bash
# 停止后端
taskkill /F /IM node.exe
# 重新启动
cd "d:\treai项目\co-creation" && node server.cjs
```

- [ ] **Step 4: 测试API返回is_admin字段**

登录管理员账号后,调用API:

```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/users/me" -Headers @{Authorization="Bearer <token>"} | Select-Object -ExpandProperty data
```

预期结果: 返回的数据中包含`isAdmin: 1`或`is_admin: 1`

---

### Task 3: 后端API - 实现PUT /api/projects/:id编辑项目

**Files:**
- Modify: `server.cjs` (在现有项目API之后添加新接口)

- [ ] **Step 1: 添加编辑项目接口**

在`server.cjs`中找到项目相关API的位置(约在第800-1200行之间),在删除项目接口之前添加:

```javascript
// 编辑项目
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 获取项目信息
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }
    
    const project = projects[0];
    const userId = req.user.id;
    
    // 2. 获取用户信息(判断是否是管理员)
    const [users] = await pool.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    const isAdmin = users[0].is_admin === 1;
    const isCreator = project.creator_id === userId;
    
    // 3. 检查是否是参与者
    const [participants] = await pool.execute(
      'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    
    const isParticipant = participants.length > 0;
    
    // 4. 权限验证
    if (!isAdmin && !isCreator && !isParticipant) {
      return errorResponse(res, '无权编辑此项目', 403);
    }
    
    // 5. 根据权限确定可编辑的字段
    const updateFields = [];
    const updateValues = [];
    
    if (isAdmin || isCreator) {
      // 管理员和创建者可以编辑所有字段
      const { title, description, category_id, cover_image, end_date, 
              repository_url, access_type, access_password, tags } = req.body;
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(category_id);
      }
      if (cover_image !== undefined) {
        updateFields.push('cover_image = ?');
        updateValues.push(cover_image);
      }
      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(end_date);
      }
      if (repository_url !== undefined) {
        updateFields.push('repository_url = ?');
        updateValues.push(repository_url);
      }
      if (access_type !== undefined) {
        updateFields.push('access_type = ?');
        updateValues.push(access_type);
      }
      if (access_password !== undefined && access_type === 'password') {
        const hashedPassword = await bcrypt.hash(access_password, 10);
        updateFields.push('access_password = ?');
        updateValues.push(hashedPassword);
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(tags));
      }
    } else if (isParticipant) {
      // 参与者只能编辑基本信息
      const { description, tags } = req.body;
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(tags));
      }
    }
    
    // 6. 如果没有要更新的字段,返回成功
    if (updateFields.length === 0) {
      return successResponse(res, null, '没有需要更新的字段', 200);
    }
    
    // 7. 执行更新
    updateFields.push('updated_at = NOW()');
    updateValues.push(req.params.id);
    
    const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(query, updateValues);
    
    successResponse(res, null, '更新成功', 200);
  } catch (error) {
    console.error('更新项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});
```

- [ ] **Step 2: 重启后端服务**

```bash
taskkill /F /IM node.exe
cd "d:\treai项目\co-creation" && node server.cjs
```

- [ ] **Step 3: 测试编辑API**

使用Postman或curl测试:

```bash
# 测试管理员编辑
Invoke-RestMethod -Uri "http://localhost:5000/api/projects/1" -Method PUT -Headers @{Authorization="Bearer <admin_token>"; "Content-Type"="application/json"} -Body '{"description": "新的描述"}' | ConvertTo-Json
```

预期结果: 返回成功消息

---

### Task 4: 后端API - 实现DELETE /api/projects/:id删除项目

**Files:**
- Modify: `server.cjs` (在编辑项目接口之后添加)

- [ ] **Step 1: 添加删除项目接口**

在编辑项目接口之后添加:

```javascript
// 删除项目(软删除)
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 获取项目信息
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    
    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }
    
    const project = projects[0];
    const userId = req.user.id;
    
    // 2. 获取用户信息(判断是否是管理员)
    const [users] = await pool.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    const isAdmin = users[0].is_admin === 1;
    const isCreator = project.creator_id === userId;
    
    // 3. 权限验证: 只有管理员或创建者可以删除
    if (!isAdmin && !isCreator) {
      return errorResponse(res, '无权删除此项目', 403);
    }
    
    // 4. 软删除: 设置deleted_at为当前时间
    await pool.execute(
      'UPDATE projects SET deleted_at = NOW(), status = 0 WHERE id = ?',
      [req.params.id]
    );
    
    successResponse(res, null, '删除成功', 200);
  } catch (error) {
    console.error('删除项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});
```

- [ ] **Step 2: 重启后端服务**

```bash
taskkill /F /IM node.exe
cd "d:\treai项目\co-creation" && node server.cjs
```

- [ ] **Step 3: 测试删除API**

```bash
# 测试删除项目
Invoke-RestMethod -Uri "http://localhost:5000/api/projects/1" -Method DELETE -Headers @{Authorization="Bearer <token>"} | ConvertTo-Json
```

预期结果: 返回成功消息,项目中deleted_at字段被设置为当前时间

- [ ] **Step 4: 验证软删除**

```sql
SELECT id, title, deleted_at FROM projects WHERE id = 1;
```

预期: deleted_at不为NULL

---

### Task 5: 后端API - 修改所有查询项目的SQL过滤已删除项目

**Files:**
- Modify: `server.cjs` (多处,所有查询projects的SQL)

- [ ] **Step 1: 修改GET /api/projects接口**

找到第391行的query构建:

```javascript
let query = `
  SELECT p.*, c.name as category_name, 
         u.username as creator_name, u.avatar as creator_avatar 
  FROM projects p 
  JOIN categories c ON p.category_id = c.id 
  JOIN users u ON p.creator_id = u.id 
  WHERE p.status = 1 AND p.deleted_at IS NULL
`;
```

同时修改countQuery(第434行):

```javascript
let countQuery = 'SELECT COUNT(*) as total FROM projects p WHERE p.status = 1 AND p.deleted_at IS NULL';
```

- [ ] **Step 2: 修改其他查询项目的接口**

搜索所有包含`FROM projects`的SQL语句,在每个WHERE条件中添加`AND deleted_at IS NULL`:

例如:
- GET /api/projects/:id (项目详情)
- GET /api/users/:id/projects (用户项目列表)
- GET /api/users/participated-projects (参与项目列表)

在每个查询中添加:
```sql
AND p.deleted_at IS NULL
```

- [ ] **Step 3: 重启并测试**

```bash
taskkill /F /IM node.exe
cd "d:\treai项目\co-creation" && node server.cjs
```

测试获取项目列表,确认已删除的项目不再显示。

---

### Task 6: 创建定时清理脚本

**Files:**
- Create: `cleanup_deleted_projects.js`

- [ ] **Step 1: 安装node-cron**

```bash
npm install node-cron
```

- [ ] **Step 2: 创建清理脚本**

创建文件 `cleanup_deleted_projects.js`:

```javascript
const mysql = require('mysql2/promise');
const cron = require('node-cron');

// 数据库配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'co_creation_esdk',
  password: 'GchzPPQ8sM6Rc2Xn',
  database: 'co_creation_esdk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 每天凌晨2点执行清理任务
cron.schedule('0 2 * * *', async () => {
  console.log(`[${new Date().toISOString()}] 开始清理6个月前的软删除项目...`);
  
  try {
    // 1. 查询6个月前软删除的项目
    const [deletedProjects] = await pool.execute(
      'SELECT id FROM projects WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)'
    );
    
    if (deletedProjects.length === 0) {
      console.log('没有需要清理的项目');
      return;
    }
    
    console.log(`找到 ${deletedProjects.length} 个需要永久删除的项目`);
    
    // 2. 逐个删除项目及其关联数据
    for (const project of deletedProjects) {
      const projectId = project.id;
      
      try {
        // 删除评论
        await pool.execute('DELETE FROM project_comments WHERE project_id = ?', [projectId]);
        
        // 删除点赞
        await pool.execute('DELETE FROM project_likes WHERE project_id = ?', [projectId]);
        
        // 删除收藏
        await pool.execute('DELETE FROM project_favorites WHERE project_id = ?', [projectId]);
        
        // 删除参与者
        await pool.execute('DELETE FROM project_participants WHERE project_id = ?', [projectId]);
        
        // 删除项目
        await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);
        
        console.log(`已永久删除项目 ID: ${projectId}`);
      } catch (error) {
        console.error(`删除项目 ${projectId} 失败:`, error.message);
      }
    }
    
    console.log(`[${new Date().toISOString()}] 清理任务完成`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 清理任务失败:`, error);
  }
});

console.log('定时清理任务已启动,每天凌晨2点执行');
```

- [ ] **Step 3: 测试清理脚本**

手动运行一次测试:

```bash
node cleanup_deleted_projects.js
```

按Ctrl+C停止。

- [ ] **Step 4: 集成到server.cjs**

在`server.cjs`的末尾(startServer调用之前)添加:

```javascript
// 启动定时清理任务
require('./cleanup_deleted_projects.js');
```

---

### Task 7: 前端API封装

**Files:**
- Modify: `api/project.js`

- [ ] **Step 1: 添加updateProject函数**

在`api/project.js`中添加:

```javascript
// 更新项目
export function updateProject(id, data) {
  return request.put(`/projects/${id}`, data)
}
```

- [ ] **Step 2: 添加deleteProject函数**

```javascript
// 删除项目
export function deleteProject(id) {
  return request.delete(`/projects/${id}`)
}
```

---

### Task 8: 用户Store添加isAdmin字段

**Files:**
- Modify: `store/modules/user.js`

- [ ] **Step 1: 在userInfo状态中添加isAdmin**

找到userInfo的定义,添加isAdmin字段:

```javascript
const userInfo = ref(null) // { id, username, email, avatar, bio, isAdmin, ... }
```

- [ ] **Step 2: 确保fetchUserInfo获取isAdmin**

检查fetchUserInfo方法,确保从API返回的数据中包含isAdmin字段(后端已在Task 2中修改)。

---

### Task 9: ProfileView添加编辑和删除功能

**Files:**
- Modify: `views/ProfileView.vue`

- [ ] **Step 1: 导入必要的依赖**

在script setup顶部添加:

```javascript
import { ElMessage, ElMessageBox } from 'element-plus'
import { updateProject, deleteProject } from '@/api/project'
```

- [ ] **Step 2: 添加编辑对话框相关状态**

在ref声明区域添加:

```javascript
const showEditDialog = ref(false)
const editForm = ref({})
const canEditAllFields = ref(false)
```

- [ ] **Step 3: 添加权限判断方法**

在methods区域添加:

```javascript
// 判断是否可以删除项目
const canDeleteProject = (project) => {
  // 如果是管理员,可以删除任意项目
  if (userStore.userInfo?.isAdmin) {
    return true
  }
  
  // 如果是创建者,可以删除自己的项目
  if (project.creatorId === userStore.userInfo?.id) {
    return true
  }
  
  // 参与者不能删除
  return false
}
```

- [ ] **Step 4: 修改"我参与的项目"表格的操作列**

找到操作列(约在第XXX行),修改为:

```vue
<el-table-column label="操作" width="180" fixed="right">
  <template #default="{ row }">
    <el-button size="small" type="primary" @click="handleEditProject(row)">
      编辑
    </el-button>
    <el-button 
      v-if="canDeleteProject(row)" 
      size="small" 
      type="danger" 
      @click="handleDeleteProject(row)"
    >
      删除
    </el-button>
  </template>
</el-table-column>
```

- [ ] **Step 5: 添加编辑项目处理方法**

```javascript
// 编辑项目
const handleEditProject = (project) => {
  // 打开编辑对话框
  showEditDialog.value = true
  editForm.value = { ...project }
  
  // 根据权限设置可编辑字段
  const isAdmin = userStore.userInfo?.isAdmin
  const isCreator = project.creatorId === userStore.userInfo?.id
  
  // 如果不是管理员也不是创建者,只能编辑基本信息
  canEditAllFields.value = isAdmin || isCreator
}
```

- [ ] **Step 6: 添加删除项目处理方法**

```javascript
// 删除项目
const handleDeleteProject = async (project) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个项目吗?删除后可以在6个月内恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteProject(project.id)
    ElMessage.success('删除成功')
    
    // 刷新列表
    loadParticipatedProjects()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}
```

- [ ] **Step 7: 添加提交编辑方法**

```javascript
// 提交编辑
const submitEdit = async () => {
  try {
    await updateProject(editForm.value.id, editForm.value)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    
    // 刷新列表
    loadParticipatedProjects()
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error('更新失败')
  }
}
```

- [ ] **Step 8: 添加编辑对话框模板**

在template末尾添加:

```vue
<!-- 编辑项目对话框 -->
<el-dialog v-model="showEditDialog" title="编辑项目" width="800px">
  <el-form :model="editForm" label-width="100px">
    <!-- 标题 - 只有管理员和创建者可编辑 -->
    <el-form-item label="项目标题">
      <el-input 
        v-model="editForm.title" 
        :disabled="!canEditAllFields"
      />
    </el-form-item>
    
    <!-- 描述 - 所有人都可编辑 -->
    <el-form-item label="项目描述">
      <el-input 
        v-model="editForm.description" 
        type="textarea"
        :rows="4"
      />
    </el-form-item>
    
    <!-- 分类 - 只有管理员和创建者可编辑 -->
    <el-form-item label="分类" v-if="canEditAllFields">
      <el-select v-model="editForm.categoryId" placeholder="选择分类">
        <el-option
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>
    </el-form-item>
    
    <!-- 截止日期 - 只有管理员和创建者可编辑 -->
    <el-form-item label="截止日期" v-if="canEditAllFields">
      <el-date-picker 
        v-model="editForm.endDate" 
        type="date"
        placeholder="选择日期"
        style="width: 100%"
      />
    </el-form-item>
    
    <!-- 仓库地址 - 只有管理员和创建者可编辑 -->
    <el-form-item label="仓库地址" v-if="canEditAllFields">
      <el-input v-model="editForm.repositoryUrl" />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitEdit">保存</el-button>
      <el-button @click="showEditDialog = false">取消</el-button>
    </el-form-item>
  </el-form>
</el-dialog>
```

注意: 需要在script中导入categories:

```javascript
import { useCategoryStore } from '@/store/modules/category'
import { storeToRefs } from 'pinia'

const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

// 在onMounted中加载分类
onMounted(async () => {
  await categoryStore.fetchCategories()
  // ... 其他初始化代码
})
```

- [ ] **Step 9: 保存并测试**

保存文件,Vite应该自动热更新。访问个人中心页面测试编辑和删除功能。

---

### Task 10: 完整功能测试

- [ ] **Step 1: 测试管理员权限**

1. 使用管理员账号(2891672496@qq.com)登录
2. 进入个人中心 -> "我参与的项目"
3. 验证: 所有项目都显示"编辑"和"删除"按钮
4. 点击"编辑",验证所有字段都可编辑
5. 点击"删除",验证可以删除任意项目

- [ ] **Step 2: 测试发布者权限**

1. 使用普通用户登录
2. 发布一个新项目
3. 进入个人中心 -> "我参与的项目"
4. 验证: 自己创建的项目显示"编辑"和"删除"按钮
5. 点击"编辑",验证所有字段都可编辑
6. 点击"删除",验证可以删除自己的项目

- [ ] **Step 3: 测试参与者权限**

1. 使用另一个用户参与某个项目
2. 进入个人中心 -> "我参与的项目"
3. 验证: 参与的项目只显示"编辑"按钮,不显示"删除"按钮
4. 点击"编辑",验证只能编辑描述和标签,其他字段被禁用

- [ ] **Step 4: 测试软删除**

1. 删除一个项目
2. 检查数据库: `SELECT id, title, deleted_at FROM projects WHERE id = <删除的项目ID>`
3. 验证: deleted_at不为NULL
4. 刷新项目列表,验证已删除的项目不再显示

- [ ] **Step 5: 测试定时清理**

手动执行清理脚本测试:

```bash
# 先手动设置一个项目的deleted_at为7个月前
UPDATE projects SET deleted_at = DATE_SUB(NOW(), INTERVAL 7 MONTH) WHERE id = <测试项目ID>;

# 运行清理脚本
node cleanup_deleted_projects.js

# 检查项目是否被永久删除
SELECT * FROM projects WHERE id = <测试项目ID>;
```

预期: 项目已被永久删除

---

## 完成标准

所有Task的checkbox都标记为完成([x]),并且:
- ✅ 数据库添加了is_admin和deleted_at字段
- ✅ 管理员账号已创建并设置is_admin=1
- ✅ 后端API支持编辑和删除项目,权限验证正确
- ✅ 所有查询项目的SQL都过滤了已删除的项目
- ✅ 定时清理脚本正常工作
- ✅ 前端个人中心可以编辑和删除项目
- ✅ 根据权限正确显示/隐藏按钮和禁用字段
- ✅ 所有测试通过

