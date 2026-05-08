# 发布项目页面增强功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为发布项目页面添加图片上传、仓库地址和访问权限控制功能

**Architecture:** 前端使用Element Plus Upload组件实现图片上传,表单增加仓库地址和权限控制字段;后端新增文件上传接口,修改项目创建和查询接口支持新字段

**Tech Stack:** Vue 3, Element Plus, Express.js, MySQL, multer, bcrypt

---

## 文件结构概览

### 新建文件
- `d:\treai项目\co-creation\uploads\projects\` - 图片存储目录(需手动创建)
- `d:\treai项目\co-creation\api\upload.js` - 文件上传API
- `d:\treai项目\co-creation\components\ImageUploader.vue` - 图片上传组件

### 修改文件
- `d:\treai项目\co-creation\views\PublishProjectView.vue` - 发布页面
- `d:\treai项目\co-creation\server.cjs` - 后端服务
- `d:\treai项目\co-creation\api\project.js` - 项目API
- `d:\treai项目\co-creation\store\modules\project.js` - 项目状态管理
- `d:\treai项目\co-creation\views\ProjectDetailView.vue` - 项目详情页(密码验证)
- `d:\treai项目\co-creation\vite.config.js` - 静态文件代理配置

---

## 任务分解

### Task 1: 数据库表结构修改

**Files:**
- 执行SQL脚本

- [ ] **Step 1: 创建并执行数据库迁移脚本**

在MySQL中执行以下SQL:

```bash
& "C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "
ALTER TABLE projects ADD COLUMN repository_url VARCHAR(500) NOT NULL DEFAULT '' COMMENT '项目仓库地址';
ALTER TABLE projects ADD COLUMN access_type ENUM('public', 'password') NOT NULL DEFAULT 'public' COMMENT '访问类型: public公开/password密码保护';
ALTER TABLE projects ADD COLUMN access_password VARCHAR(100) NULL COMMENT '访问密码(bcrypt加密)';
"
```

- [ ] **Step 2: 验证字段添加成功**

```bash
& "C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "DESCRIBE projects;"
```

预期输出应包含新增的3个字段。

---

### Task 2: 后端文件上传接口

**Files:**
- 修改: `d:\treai项目\co-creation\package.backend.json` (添加multer依赖)
- 修改: `d:\treai项目\co-creation\server.cjs` (添加上传接口)
- 创建目录: `d:\treai项目\co-creation\uploads\projects\`

- [ ] **Step 1: 安装multer依赖**

```bash
cd d:\treai项目\co-creation
npm install multer
```

- [ ] **Step 2: 在server.cjs中导入multer并配置**

在`server.cjs`开头添加:

```javascript
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 确保uploads目录存在
const uploadDir = path.join(__dirname, 'uploads', 'projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('仅支持jpg/png格式的图片'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});
```

- [ ] **Step 3: 添加静态文件服务中间件**

在server.cjs的中间件配置部分添加:

```javascript
// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

- [ ] **Step 4: 添加文件上传接口**

在server.cjs中添加:

```javascript
// 文件上传接口
app.post('/api/upload/image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的图片', 400);
    }
    
    const fileUrl = `/uploads/projects/${req.file.filename}`;
    successResponse(res, { url: fileUrl }, '上传成功');
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, '图片大小不能超过2MB', 400);
      }
      return errorResponse(res, '文件上传失败', 400);
    }
    console.error('上传错误:', error);
    errorResponse(res, error.message || '上传失败', 400);
  }
});
```

- [ ] **Step 5: 重启后端并测试上传接口**

重启后端服务后,使用curl测试:

```bash
# 先登录获取token
# 然后测试上传
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

预期返回: `{"code":200,"message":"上传成功","data":{"url":"/uploads/projects/xxx.jpg"}}`

- [ ] **Step 6: 提交**

```bash
git add server.cjs package.backend.json package.json package-lock.json
git commit -m "feat: 添加文件上传接口和图片存储功能"
```

---

### Task 3: 前端图片上传组件

**Files:**
- 创建: `d:\treai项目\co-creation\components\ImageUploader.vue`
- 创建: `d:\treai项目\co-creation\api\upload.js`

- [ ] **Step 1: 创建上传API**

创建 `d:\treai项目\co-creation\api\upload.js`:

```javascript
import request from './request'

// 上传图片
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
```

- [ ] **Step 2: 创建图片上传组件**

创建 `d:\treai项目\co-creation\components\ImageUploader.vue`:

```vue
<template>
  <div class="image-uploader">
    <el-upload
      class="image-uploader__component"
      action=""
      :auto-upload="false"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-change="handleFileChange"
      accept="image/jpeg,image/png,image/jpg"
    >
      <div v-if="imageUrl" class="image-preview">
        <img :src="imageUrl" class="preview-image" />
        <div class="image-overlay">
          <el-icon><ZoomIn /></el-icon>
          <span>点击更换</span>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">点击上传封面图片</div>
        <div class="upload-hint">支持jpg/png格式,最大2MB</div>
      </div>
    </el-upload>
    
    <el-dialog v-model="dialogVisible" title="图片预览" width="600px">
      <img :src="imageUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn } from '@element-plus/icons-vue'
import { uploadImage } from '@/api/upload'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const imageUrl = ref(props.modelValue)
const dialogVisible = ref(false)
const uploading = ref(false)

watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal
})

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

const handleFileChange = async (file) => {
  if (!beforeUpload(file.raw)) return
  
  uploading.value = true
  
  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
  
  try {
    // 上传到服务器
    const res = await uploadImage(file.raw)
    imageUrl.value = res.data.url
    emit('update:modelValue', res.data.url)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败,请重试')
    imageUrl.value = props.modelValue
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-uploader__component {
    width: 100%;
  }
  
  .upload-placeholder {
    width: 100%;
    height: 200px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
    }
    
    .upload-icon {
      font-size: 48px;
      color: #8c939d;
      margin-bottom: 12px;
    }
    
    .upload-text {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }
    
    .upload-hint {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .image-preview {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      color: white;
      
      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }
    
    &:hover .image-overlay {
      opacity: 1;
    }
  }
}
</style>
```

- [ ] **Step 3: 提交**

```bash
git add api/upload.js components/ImageUploader.vue
git commit -m "feat: 创建图片上传组件和API"
```

---

### Task 4: 更新发布页面表单

**Files:**
- 修改: `d:\treai项目\co-creation\views\PublishProjectView.vue`

- [ ] **Step 1: 更新表单数据模型**

修改`PublishProjectView.vue`的projectForm:

```javascript
const projectForm = reactive({
  title: '',
  description: '',
  categoryId: null,
  coverImage: '',
  repositoryUrl: '',
  accessType: 'public',
  accessPassword: ''
})
```

- [ ] **Step 2: 更新验证规则**

```javascript
const rules = {
  title: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度在2-100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { min: 10, message: '项目描述不能少于10个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择项目分类', trigger: 'change' }
  ],
  repositoryUrl: [
    { required: true, message: '请输入项目仓库地址', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+/, 
      message: '请输入有效的URL地址', 
      trigger: 'blur' 
    }
  ],
  accessPassword: [
    { 
      validator: (rule, value, callback) => {
        if (projectForm.accessType === 'password' && !value) {
          callback(new Error('请输入访问密码'))
        } else if (value && value.length < 6) {
          callback(new Error('密码长度不能少于6位'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}
```

- [ ] **Step 3: 导入ImageUploader组件**

在script部分添加:

```javascript
import ImageUploader from '@/components/ImageUploader.vue'
```

- [ ] **Step 4: 更新模板**

替换原有表单模板:

```vue
<template>
  <div class="publish-project-view">
    <Header />
    <div class="publish-container">
      <el-card class="publish-card">
        <h2>发布项目</h2>
        <el-form :model="projectForm" :rules="rules" ref="formRef" label-width="120px">
          <!-- 基本信息 -->
          <el-form-item label="项目名称" prop="title">
            <el-input v-model="projectForm.title" placeholder="请输入项目名称" />
          </el-form-item>
          
          <el-form-item label="项目描述" prop="description">
            <el-input
              v-model="projectForm.description"
              type="textarea"
              :rows="5"
              placeholder="请输入项目描述"
            />
          </el-form-item>
          
          <el-form-item label="项目分类" prop="categoryId">
            <el-select v-model="projectForm.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
          
          <!-- 项目资源 -->
          <el-divider content-position="left">项目资源</el-divider>
          
          <el-form-item label="项目封面">
            <ImageUploader v-model="projectForm.coverImage" />
          </el-form-item>
          
          <el-form-item label="仓库地址" prop="repositoryUrl">
            <el-input 
              v-model="projectForm.repositoryUrl" 
              placeholder="请输入GitHub/GitLab等仓库地址"
              prefix-icon="Link"
            />
          </el-form-item>
          
          <!-- 访问权限 -->
          <el-divider content-position="left">访问权限</el-divider>
          
          <el-form-item label="访问方式">
            <el-radio-group v-model="projectForm.accessType">
              <el-radio label="public">公开访问</el-radio>
              <el-radio label="password">密码保护</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item 
            v-if="projectForm.accessType === 'password'" 
            label="访问密码" 
            prop="accessPassword"
          >
            <el-input
              v-model="projectForm.accessPassword"
              type="password"
              placeholder="请设置访问密码(至少6位)"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handlePublish" :loading="loading">
              发布项目
            </el-button>
            <el-button @click="handleCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 更新样式**

```scss
<style lang="scss" scoped>
.publish-project-view {
  min-height: 100vh;
  background-color: #f5f7fa;

  .publish-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px;

    .publish-card {
      padding: 32px;

      h2 {
        text-align: center;
        margin-bottom: 32px;
        color: #303133;
      }
      
      :deep(.el-divider__text) {
        font-weight: bold;
        color: #606266;
      }
    }
  }
}
</style>
```

- [ ] **Step 6: 测试前端页面**

访问 http://localhost:3000/publish,检查:
- 表单是否正常显示
- 图片上传功能是否正常
- 验证规则是否生效
- 权限切换是否正常显示/隐藏密码框

- [ ] **Step 7: 提交**

```bash
git add views/PublishProjectView.vue
git commit -m "feat: 更新发布页面表单,添加图片上传、仓库地址和权限控制"
```

---

### Task 5: 后端创建项目接口更新

**Files:**
- 修改: `d:\treai项目\co-creation\server.cjs`

- [ ] **Step 1: 修改创建项目接口**

找到`app.post('/api/projects', ...)`部分,更新为:

```javascript
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { title, description, categoryId, coverImage, repositoryUrl, accessType, accessPassword } = req.body;
    const creatorId = req.user.id;

    // 验证必填字段
    if (!title || !description || !categoryId || !repositoryUrl) {
      return errorResponse(res, '项目名称、描述、分类和仓库地址不能为空', 400);
    }

    if (title.length < 2 || title.length > 200) {
      return errorResponse(res, '项目名称长度在2-200个字符之间', 400);
    }

    if (description.length < 10) {
      return errorResponse(res, '项目描述不能少于10个字符', 400);
    }

    // 验证URL格式
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(repositoryUrl)) {
      return errorResponse(res, '请输入有效的仓库地址', 400);
    }

    // 验证访问权限
    const finalAccessType = accessType || 'public';
    let hashedPassword = null;
    
    if (finalAccessType === 'password') {
      if (!accessPassword || accessPassword.length < 6) {
        return errorResponse(res, '访问密码不能少于6位', 400);
      }
      hashedPassword = await bcrypt.hash(accessPassword, 10);
    }

    // 验证分类是否存在
    const [categories] = await pool.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (categories.length === 0) {
      return errorResponse(res, '项目分类不存在', 400);
    }

    // 插入项目
    const [result] = await pool.execute(
      `INSERT INTO projects (title, description, cover_image, category_id, creator_id, repository_url, access_type, access_password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, coverImage || null, categoryId, creatorId, repositoryUrl, finalAccessType, hashedPassword]
    );

    successResponse(res, { projectId: result.insertId }, '项目创建成功');
  } catch (error) {
    console.error('创建项目错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});
```

- [ ] **Step 2: 重启后端服务**

- [ ] **Step 3: 测试创建项目**

使用Postman或curl测试:

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "测试项目",
    "description": "这是一个测试项目的描述信息,长度超过10个字符",
    "categoryId": 1,
    "repositoryUrl": "https://github.com/test/repo",
    "accessType": "public"
  }'
```

预期返回: `{"code":200,"message":"项目创建成功","data":{"projectId":XX}}`

- [ ] **Step 4: 提交**

```bash
git add server.cjs
git commit -m "feat: 更新创建项目接口,支持仓库地址和访问权限"
```

---

### Task 6: 项目详情接口密码验证

**Files:**
- 修改: `d:\treai项目\co-creation\server.cjs`
- 创建: `d:\treai项目\co-creation\api\project.js` (添加verifyPassword方法)

- [ ] **Step 1: 修改获取项目详情接口**

找到`app.get('/api/projects/:id', ...)`部分,在返回数据前添加:

```javascript
// 检查访问权限
if (project.access_type === 'password') {
  const providedPassword = req.headers['x-access-password'];
  if (!providedPassword) {
    return errorResponse(res, '该项目需要密码访问', 403);
  }
  
  const passwordMatch = await bcrypt.compare(providedPassword, project.access_password);
  if (!passwordMatch) {
    return errorResponse(res, '访问密码错误', 403);
  }
}
```

完整代码应在获取项目数据后,返回前添加此验证。

- [ ] **Step 2: 添加验证密码接口**

```javascript
// 验证项目密码
app.post('/api/projects/:id/verify-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, '请提供访问密码', 400);
    }

    const [projects] = await pool.execute(
      'SELECT id, access_type, access_password FROM projects WHERE id = ? AND status = 1',
      [id]
    );

    if (projects.length === 0) {
      return errorResponse(res, '项目不存在', 404);
    }

    const project = projects[0];

    if (project.access_type !== 'password') {
      return errorResponse(res, '该项目无需密码访问', 400);
    }

    const passwordMatch = await bcrypt.compare(password, project.access_password);
    if (!passwordMatch) {
      return errorResponse(res, '访问密码错误', 403);
    }

    successResponse(res, { verified: true }, '验证成功');
  } catch (error) {
    console.error('验证密码错误:', error);
    errorResponse(res, '服务器错误', 500);
  }
});
```

- [ ] **Step 3: 更新前端project.js API**

在`d:\treai项目\co-creation\api\project.js`中添加:

```javascript
// 验证项目密码
export function verifyProjectPassword(projectId, password) {
  return request({
    url: `/projects/${projectId}/verify-password`,
    method: 'post',
    data: { password }
  })
}

// 获取项目详情(带密码)
export function getProjectDetailWithPassword(id, password) {
  return request({
    url: `/projects/${id}`,
    method: 'get',
    headers: {
      'X-Access-Password': password
    }
  })
}
```

- [ ] **Step 4: 提交**

```bash
git add server.cjs api/project.js
git commit -m "feat: 添加项目密码验证功能"
```

---

### Task 7: Vite配置静态文件代理

**Files:**
- 修改: `d:\treai项目\co-creation\vite.config.js`

- [ ] **Step 1: 添加uploads目录代理**

在`vite.config.js`的server.proxy中添加:

```javascript
server: {
  port: 3000,
  proxy: {
    '^/api/(users|projects|categories|health|upload)': {
      target: 'http://localhost:5000',
      changeOrigin: true
    },
    '/uploads': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

- [ ] **Step 2: 测试图片访问**

重启前端服务后,访问: http://localhost:3000/uploads/projects/xxx.jpg
应该能正常显示上传的图片。

- [ ] **Step 3: 提交**

```bash
git add vite.config.js
git commit -m "feat: 添加uploads目录代理配置"
```

---

### Task 8: 数据库初始化脚本更新

**Files:**
- 修改: `d:\treai项目\co-creation\init_database.sql`

- [ ] **Step 1: 更新SQL脚本**

在projects表创建语句中添加新字段:

```sql
`repository_url` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '项目仓库地址',
`access_type` ENUM('public', 'password') NOT NULL DEFAULT 'public' COMMENT '访问类型',
`access_password` VARCHAR(100) NULL COMMENT '访问密码(bcrypt加密)',
```

- [ ] **Step 2: 更新模拟数据**

为INSERT语句添加默认值:

```sql
INSERT INTO projects (title, description, cover_image, category_id, creator_id, repository_url, access_type) VALUES
('智能客服系统', '...', NULL, 1, 1, 'https://github.com/example/chatbot', 'public'),
-- ... 其他数据
```

- [ ] **Step 3: 提交**

```bash
git add init_database.sql
git commit -m "feat: 更新数据库初始化脚本,添加新字段"
```

---

### Task 9: 完整测试

- [ ] **Step 1: 重启所有服务**

```bash
# 停止所有node进程
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# 启动后端
node server.cjs

# 启动前端(新终端)
npm run dev
```

- [ ] **Step 2: 测试完整流程**

1. 访问 http://localhost:3000/publish
2. 登录测试账号 (test@example.com / 123456)
3. 填写表单:
   - 项目名称: 测试项目
   - 项目描述: 这是一个完整的测试项目描述
   - 项目分类: 选择任意分类
   - 项目封面: 上传图片
   - 仓库地址: https://github.com/test/repo
   - 访问方式: 选择"公开访问"或"密码保护"
4. 点击"发布项目"
5. 验证是否跳转到首页并显示新项目

- [ ] **Step 3: 使用浏览器截图技能检查**

使用Browser agent访问页面并截图,验证:
- 表单布局是否正确
- 各功能是否正常
- 样式是否美观

---

## 验收标准

1. ✅ 数据库新增3个字段
2. ✅ 文件上传接口正常工作
3. ✅ 发布页面包含所有新增字段
4. ✅ 图片上传功能正常
5. ✅ 仓库地址必填且URL验证
6. ✅ 访问权限控制正常(公开/密码)
7. ✅ 密码保护项目需要密码才能访问
8. ✅ 所有验证规则生效
9. ✅ 样式美观,用户体验良好
