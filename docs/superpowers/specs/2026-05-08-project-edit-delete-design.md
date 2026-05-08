# 项目修改和删除功能设计文档

**日期**: 2026-05-08  
**主题**: 实现项目的编辑和删除功能,支持基于角色的权限控制

## 1. 需求概述

实现项目的修改和删除功能,根据不同用户角色提供不同的操作权限:
- **管理员**: 可以删除任意项目,可以编辑项目的所有字段
- **发布者**(项目创建者): 可以删除自己创建的项目,可以编辑项目的所有字段
- **参与者**(项目成员): 不能删除项目,只能编辑项目的基本信息(描述、标签等)

软删除机制:删除的项目在服务器中保存6个月,超时后永久删除。

## 2. 功能设计

### 2.1 权限规则

| 操作 | 管理员 | 发布者 | 参与者 |
|------|--------|--------|--------|
| 删除任意项目 | ✅ | ❌ | ❌ |
| 删除自己的项目 | ✅ | ✅ | ❌ |
| 编辑所有字段 | ✅ | ✅ | ❌ |
| 编辑基本信息 | ✅ | ✅ | ✅ |

**基本信息定义**: description(描述), tags(标签)  
**所有字段**: title, description, category_id, cover_image, end_date, repository_url, access_type, access_password, tags等

### 2.2 管理员账号

- 邮箱: 2891672496@qq.com
- 密码: esdkaiyuan-ip (使用bcrypt加密存储)
- 在users表中设置is_admin=1

### 2.3 软删除机制

- 删除项目时不直接从数据库删除,而是设置deleted_at字段为当前时间
- 查询项目时过滤掉已删除的项目(WHERE deleted_at IS NULL)
- 定时任务每天检查deleted_at < 6个月前的项目,永久删除

## 3. 技术实现

### 3.1 数据库修改

**文件**: `init_database.sql` 或单独的migration脚本

#### Step 1: users表添加is_admin字段

```sql
ALTER TABLE users 
ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否管理员: 1-是, 0-否' 
AFTER status;
```

#### Step 2: projects表添加deleted_at字段

```sql
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间(软删除)' 
AFTER updated_at;

-- 添加索引以优化查询
ALTER TABLE projects ADD INDEX idx_deleted_at (deleted_at);
```

#### Step 3: 设置管理员账号

```sql
-- 如果管理员用户不存在,先创建
INSERT INTO users (username, email, password, is_admin) 
VALUES ('admin', '2891672496@qq.com', '$2b$10$...', 1)
ON DUPLICATE KEY UPDATE is_admin = 1;

-- 注意: 密码需要使用bcrypt加密,实际执行时需要生成哈希值
```

### 3.2 后端API

**文件**: `server.cjs`

#### API 1: 获取当前用户信息(包含is_admin)

**路由**: `GET /api/users/me`

**现有接口已存在**,需要修改返回数据,添加is_admin字段:

```javascript
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar, bio, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return errorResponse(res, '用户不存在', 404);
    }
    
    successResponse(res, users[0], '获取成功', 200);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});
```

#### API 2: 编辑项目

**路由**: `PUT /api/projects/:id`

**请求体**:
```json
{
  "title": "项目标题",
  "description": "项目描述",
  "category_id": 1,
  "cover_image": "url",
  "end_date": "2026-06-01",
  "repository_url": "https://...",
  "access_type": "public",
  "access_password": "",
  "tags": ["tag1", "tag2"]
}
```

**权限验证逻辑**:

```javascript
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

#### API 3: 删除项目(软删除)

**路由**: `DELETE /api/projects/:id`

**权限验证逻辑**:

```javascript
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

#### API 4: 修改获取项目列表接口,过滤已删除的项目

在所有查询项目的SQL中添加条件: `AND p.deleted_at IS NULL`

例如:
```javascript
// GET /api/projects
let query = `
  SELECT p.*, c.name as category_name, 
         u.username as creator_name, u.avatar as creator_avatar 
  FROM projects p 
  JOIN categories c ON p.category_id = c.id 
  JOIN users u ON p.creator_id = u.id 
  WHERE p.status = 1 AND p.deleted_at IS NULL
`;
```

#### API 5: 定时任务清理6个月前的软删除项目

**文件**: 创建 `cleanup_deleted_projects.js` 或在 `server.cjs` 中添加

```javascript
const cron = require('node-cron');

// 每天凌晨2点执行清理任务
cron.schedule('0 2 * * *', async () => {
  console.log('开始清理6个月前的软删除项目...');
  
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
    }
    
    console.log('清理任务完成');
  } catch (error) {
    console.error('清理任务失败:', error);
  }
});
```

**注意**: 需要安装 `node-cron`:
```bash
npm install node-cron
```

### 3.3 前端修改

**文件**: `views/ProfileView.vue`

#### Step 1: 在"我参与的项目"表格中添加操作列

在现有的操作列中添加"编辑"和"删除"按钮:

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

#### Step 2: 添加权限判断方法

```javascript
// 判断是否可以删除项目
const canDeleteProject = (project) => {
  // 如果是管理员,可以删除任意项目
  if (userStore.userInfo?.isAdmin) {
    return true;
  }
  
  // 如果是创建者,可以删除自己的项目
  if (project.creatorId === userStore.userInfo?.id) {
    return true;
  }
  
  // 参与者不能删除
  return false;
};
```

#### Step 3: 添加编辑和删除处理方法

```javascript
import { ElMessage, ElMessageBox } from 'element-plus';
import { updateProject, deleteProject } from '@/api/project';

// 编辑项目
const handleEditProject = (project) => {
  // 打开编辑对话框
  showEditDialog.value = true;
  editForm.value = { ...project };
  
  // 根据权限设置可编辑字段
  const isAdmin = userStore.userInfo?.isAdmin;
  const isCreator = project.creatorId === userStore.userInfo?.id;
  
  // 如果不是管理员也不是创建者,只能编辑基本信息
  canEditAllFields.value = isAdmin || isCreator;
};

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
    );
    
    await deleteProject(project.id);
    ElMessage.success('删除成功');
    
    // 刷新列表
    loadParticipatedProjects();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};
```

#### Step 4: 创建编辑对话框组件

复用发布项目的表单,但根据权限禁用某些字段:

```vue
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
      <el-select v-model="editForm.categoryId">
        <!-- 分类选项 -->
      </el-select>
    </el-form-item>
    
    <!-- 截止日期 - 只有管理员和创建者可编辑 -->
    <el-form-item label="截止日期" v-if="canEditAllFields">
      <el-date-picker 
        v-model="editForm.endDate" 
        type="date"
        placeholder="选择日期"
      />
    </el-form-item>
    
    <!-- 其他字段类似处理 -->
    
    <el-form-item>
      <el-button type="primary" @click="submitEdit">保存</el-button>
      <el-button @click="showEditDialog = false">取消</el-button>
    </el-form-item>
  </el-form>
</el-dialog>
```

```javascript
// 提交编辑
const submitEdit = async () => {
  try {
    await updateProject(editForm.value.id, editForm.value);
    ElMessage.success('更新成功');
    showEditDialog.value = false;
    
    // 刷新列表
    loadParticipatedProjects();
  } catch (error) {
    ElMessage.error('更新失败');
  }
};
```

### 3.4 前端API封装

**文件**: `api/project.js`

```javascript
// 更新项目
export function updateProject(id, data) {
  return request.put(`/projects/${id}`, data)
}

// 删除项目
export function deleteProject(id) {
  return request.delete(`/projects/${id}`)
}
```

## 4. 边界情况处理

### 4.1 权限不足
- 当用户尝试执行无权操作时,返回403错误
- 前端显示友好的错误提示

### 4.2 项目不存在
- 当尝试编辑或删除不存在的项目时,返回404错误

### 4.3 并发删除
- 使用事务确保数据一致性
- 检查deleted_at字段防止重复删除

### 4.4 定时任务失败
- 记录日志便于排查问题
- 下次执行时会继续清理

## 5. 测试要点

### 5.1 功能测试
- [ ] 管理员可以删除任意项目
- [ ] 管理员可以编辑任意项目的所有字段
- [ ] 创建者可以删除自己的项目
- [ ] 创建者可以编辑自己项目的所有字段
- [ ] 参与者不能删除项目
- [ ] 参与者只能编辑项目的基本信息(描述、标签)
- [ ] 参与者尝试编辑核心字段时被禁用
- [ ] 删除项目后,项目不再出现在列表中
- [ ] 软删除的项目在数据库中保留deleted_at值
- [ ] 定时任务正确清理6个月前的项目

### 5.2 UI测试
- [ ] "我参与的项目"列表中正确显示编辑和删除按钮
- [ ] 根据权限正确显示/隐藏删除按钮
- [ ] 编辑对话框中根据权限禁用相应字段
- [ ] 删除前有确认对话框
- [ ] 操作成功后有提示信息

### 5.3 API测试
- [ ] PUT /api/projects/:id 正确验证权限
- [ ] DELETE /api/projects/:id 正确验证权限
- [ ] GET /api/projects 过滤掉已删除的项目
- [ ] GET /api/users/me 返回is_admin字段

## 6. 后续优化建议

1. **回收站功能**: 允许管理员查看和恢复6个月内的软删除项目
2. **操作日志**: 记录谁在什么时候编辑或删除了哪些项目
3. **批量操作**: 支持批量删除项目
4. **通知机制**: 项目被删除时通知参与者
5. **数据备份**: 永久删除前自动备份数据

