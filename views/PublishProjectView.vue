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
            />
          </el-form-item>
          
          <el-form-item label="截止日期" prop="endDate">
            <el-date-picker
              v-model="projectForm.endDate"
              type="date"
              placeholder="选择项目参与截止日期"
              :disabled-date="disabledDate"
              value-format="YYYY-MM-DD"
              style="width: 100%"
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

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/store/modules/project'
import { useCategoryStore } from '@/store/modules/category'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const projectStore = useProjectStore()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const formRef = ref(null)
const loading = ref(false)

const projectForm = reactive({
  title: '',
  description: '',
  categoryId: null,
  coverImage: '',
  repositoryUrl: '',
  endDate: '',
  accessType: 'public',
  accessPassword: ''
})

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
  endDate: [
    { required: true, message: '请选择项目截止日期', trigger: 'change' }
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

// 禁用当前日期之前的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 86400000 // 86400000 = 1天的毫秒数
}

// 加载分类列表
onMounted(async () => {
  if (categories.value.length === 0) {
    await categoryStore.fetchCategories()
  }
})

const handlePublish = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await projectStore.createNewProject(projectForm)
        console.log('发布成功响应:', res)
        ElMessage.success('项目发布成功')
        // 延迟一下再跳转,让用户看到成功提示
        setTimeout(() => {
          router.push('/')
        }, 500)
      } catch (error) {
        console.error('发布失败:', error)
        ElMessage.error(error.message || '发布失败,请重试')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}
</script>

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
