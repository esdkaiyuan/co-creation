<template>
  <div class="profile-view">
    <Header />
    
    <div class="profile-container">
      <el-skeleton v-if="loading" :rows="10" animated />
      
      <div v-else-if="userInfo" class="profile-content">
        <!-- 用户信息卡片 -->
        <el-card class="user-info-card">
          <div class="user-header">
            <AvatarInitial :username="userInfo.username" :size="80" />
            <div class="user-details">
              <h2 class="username">{{ userInfo.username }}</h2>
              <p class="email">{{ userInfo.email }}</p>
              <p class="register-time">注册时间: {{ formatDate(userInfo.created_at) }}</p>
            </div>
            <el-button type="primary" @click="activeTab = 'settings'">
              编辑资料
            </el-button>
          </div>
        </el-card>

        <!-- 统计信息 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.projectCount }}</div>
                <div class="stat-label">我的项目</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.favoriteCount }}</div>
                <div class="stat-label">我的收藏</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.commentCount }}</div>
                <div class="stat-label">我的评论</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Tab标签页 -->
        <el-card class="tabs-card">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <!-- 我的项目 -->
            <el-tab-pane label="我的项目" name="projects">
              <div v-loading="projectsLoading" class="tab-content">
                <div v-if="userProjects.length > 0" class="project-list">
                  <el-row :gutter="20">
                    <el-col 
                      v-for="project in userProjects" 
                      :key="project.id" 
                      :span="8"
                      class="project-col"
                    >
                      <el-card 
                        class="project-card" 
                        shadow="hover"
                        @click="goToProject(project.id)"
                      >
                        <h4 class="project-title">{{ project.title }}</h4>
                        <p class="project-desc">{{ project.description }}</p>
                        <div class="project-meta">
                          <span>{{ project.categoryName }}</span>
                          <span>👍 {{ project.likeCount }}</span>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
                <el-empty v-else description="暂无项目" />
              </div>
            </el-tab-pane>

            <!-- 我的收藏 -->
            <el-tab-pane label="我的收藏" name="favorites">
              <div v-loading="favoritesLoading" class="tab-content">
                <div v-if="favorites.length > 0" class="project-list">
                  <el-row :gutter="20">
                    <el-col 
                      v-for="project in favorites" 
                      :key="project.id" 
                      :span="8"
                      class="project-col"
                    >
                      <el-card 
                        class="project-card" 
                        shadow="hover"
                        @click="goToProject(project.id)"
                      >
                        <h4 class="project-title">{{ project.title }}</h4>
                        <p class="project-desc">{{ project.description }}</p>
                        <div class="project-meta">
                          <span>{{ project.categoryName }}</span>
                          <span>👍 {{ project.likeCount }}</span>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
                <el-empty v-else description="暂无收藏" />
              </div>
            </el-tab-pane>

            <!-- 我参与的项目 -->
            <el-tab-pane label="我参与的项目" name="participated">
              <div v-loading="participatedProjectsLoading" class="tab-content">
                <div v-if="participatedProjects.length > 0">
                  <el-table :data="participatedProjects" style="width: 100%" stripe>
                    <el-table-column prop="title" label="项目名称" min-width="200">
                      <template #default="{ row }">
                        <el-link type="primary" @click="goToProject(row.id)">{{ row.title }}</el-link>
                      </template>
                    </el-table-column>
                    <el-table-column prop="creator.username" label="发布者" width="120">
                      <template #default="{ row }">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <AvatarInitial :username="row.creator.username" :size="24" />
                          <span>{{ row.creator.username }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="repositoryUrl" label="仓库地址" min-width="250">
                      <template #default="{ row }">
                        <el-link :href="row.repositoryUrl" target="_blank" type="primary" v-if="row.repositoryUrl">
                          {{ row.repositoryUrl }}
                        </el-link>
                        <span v-else style="color: #909399;">未提供</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="categoryName" label="分类" width="100" />
                    <el-table-column prop="endDate" label="截止日期" width="120">
                      <template #default="{ row }">
                        <span v-if="row.endDate">{{ formatDate(row.endDate) }}</span>
                        <span v-else style="color: #909399;">无</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="participantCount" label="参与人数" width="100" />
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
                  </el-table>
                </div>
                <el-empty v-else description="暂未参与任何项目" />
              </div>
            </el-tab-pane>

            <!-- 我的评论 -->
            <el-tab-pane label="我的评论" name="comments">
              <div v-loading="commentsLoading" class="tab-content">
                <div v-if="userComments.length > 0" class="comment-list">
                  <div 
                    v-for="comment in userComments" 
                    :key="comment.id" 
                    class="comment-item"
                  >
                    <p class="comment-content">{{ comment.content }}</p>
                    <div class="comment-meta">
                      <el-link 
                        type="primary" 
                        @click="goToProject(comment.project.id)"
                      >
                        {{ comment.project.title }}
                      </el-link>
                      <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无评论" />
              </div>
            </el-tab-pane>

            <!-- 个人设置 -->
            <el-tab-pane label="个人设置" name="settings">
              <div class="tab-content settings-content">
                <el-form 
                  ref="formRef"
                  :model="profileForm"
                  :rules="rules"
                  label-width="100px"
                >
                  <el-form-item label="用户名" prop="username">
                    <el-input v-model="profileForm.username" />
                  </el-form-item>
                  
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="profileForm.email" />
                  </el-form-item>
                  
                  <el-form-item label="个人简介" prop="bio">
                    <el-input 
                      v-model="profileForm.bio" 
                      type="textarea"
                      :rows="4"
                      maxlength="500"
                      show-word-limit
                    />
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button 
                      type="primary" 
                      @click="handleSaveProfile"
                      :loading="saving"
                    >
                      保存修改
                    </el-button>
                    <el-button @click="resetForm">重置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>

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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { useCategoryStore } from '@/store/modules/category'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import Header from '@/components/Header.vue'
import AvatarInitial from '@/components/AvatarInitial.vue'
import { getUserFavorites } from '@/api/favorite'
import { updateProject, deleteProject } from '@/api/project'

const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const { userInfo, userProjects, participatedProjects, userComments, userStats } = storeToRefs(userStore)
const { categories } = storeToRefs(categoryStore)

const loading = ref(false)
const projectsLoading = ref(false)
const participatedProjectsLoading = ref(false)
const favoritesLoading = ref(false)
const commentsLoading = ref(false)
const saving = ref(false)
const activeTab = ref('projects')
const favorites = ref([])
const formRef = ref(null)

// 编辑对话框相关状态
const showEditDialog = ref(false)
const editForm = ref({})
const canEditAllFields = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  bio: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  bio: [
    { max: 500, message: '个人简介不能超过500字', trigger: 'blur' }
  ]
}

// 加载数据
onMounted(async () => {
  loading.value = true
  try {
    await categoryStore.fetchCategories()
    await userStore.fetchUserInfo()
    await userStore.fetchUserStats()
    initProfileForm()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
})

// 初始化表单
const initProfileForm = () => {
  if (userInfo.value) {
    profileForm.username = userInfo.value.username
    profileForm.email = userInfo.value.email
    profileForm.bio = userInfo.value.bio || ''
  }
}

// Tab切换
const handleTabChange = async (tab) => {
  if (tab === 'projects' && userProjects.value.length === 0) {
    await loadProjects()
  } else if (tab === 'favorites' && favorites.value.length === 0) {
    await loadFavorites()
  } else if (tab === 'participated' && participatedProjects.value.length === 0) {
    await loadParticipatedProjects()
  } else if (tab === 'comments' && userComments.value.length === 0) {
    await loadComments()
  }
}

// 加载项目
const loadProjects = async () => {
  projectsLoading.value = true
  try {
    await userStore.fetchUserProjects({ page: 1, pageSize: 12 })
  } catch (error) {
    ElMessage.error('加载项目失败')
  } finally {
    projectsLoading.value = false
  }
}

// 加载收藏
const loadFavorites = async () => {
  favoritesLoading.value = true
  try {
    const res = await getUserFavorites(1, 12)
    favorites.value = res.data.favorites
  } catch (error) {
    ElMessage.error('加载收藏失败')
  } finally {
    favoritesLoading.value = false
  }
}

// 加载评论
const loadComments = async () => {
  commentsLoading.value = true
  try {
    await userStore.fetchUserComments({ page: 1, pageSize: 20 })
  } catch (error) {
    ElMessage.error('加载评论失败')
  } finally {
    commentsLoading.value = false
  }
}

// 加载参与的项目
const loadParticipatedProjects = async () => {
  participatedProjectsLoading.value = true
  try {
    await userStore.fetchParticipatedProjects({ page: 1, pageSize: 20 })
  } catch (error) {
    ElMessage.error('加载参与项目失败')
  } finally {
    participatedProjectsLoading.value = false
  }
}

// 保存个人资料
const handleSaveProfile = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        await userStore.updateProfile(profileForm)
        ElMessage.success('保存成功')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '保存失败')
      } finally {
        saving.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  initProfileForm()
}

// 跳转到项目详情
const goToProject = (projectId) => {
  router.push(`/project/${projectId}`)
}

// 判断是否可以删除项目
const canDeleteProject = (project) => {
  // 如果是管理员,可以删除任意项目
  if (userInfo.value?.isAdmin) {
    return true
  }
  
  // 如果是创建者,可以删除自己的项目
  if (project.creatorId === userInfo.value?.id) {
    return true
  }
  
  // 参与者不能删除
  return false
}

// 编辑项目
const handleEditProject = (project) => {
  // 打开编辑对话框
  showEditDialog.value = true
  editForm.value = { ...project }
  
  // 根据权限设置可编辑字段
  const isAdmin = userInfo.value?.isAdmin
  const isCreator = project.creatorId === userInfo.value?.id
  
  // 如果不是管理员也不是创建者,只能编辑基本信息
  canEditAllFields.value = isAdmin || isCreator
}

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

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style lang="scss" scoped>
.profile-view {
  min-height: 100vh;
  background-color: #f5f7fa;

  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;

    .profile-content {
      .user-info-card {
        margin-bottom: 20px;

        .user-header {
          display: flex;
          align-items: center;
          gap: 20px;

          .user-details {
            flex: 1;

            .username {
              margin: 0 0 8px 0;
              font-size: 24px;
              color: #303133;
            }

            .email {
              margin: 0 0 4px 0;
              color: #606266;
            }

            .register-time {
              margin: 0;
              font-size: 14px;
              color: #909399;
            }
          }
        }
      }

      .stats-row {
        margin-bottom: 20px;

        .stat-card {
          text-align: center;

          .stat-item {
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #409EFF;
              margin-bottom: 8px;
            }

            .stat-label {
              font-size: 14px;
              color: #909399;
            }
          }
        }
      }

      .tabs-card {
        .tab-content {
          min-height: 300px;
          padding: 20px 0;

          .project-list {
            .project-col {
              margin-bottom: 20px;

              .project-card {
                cursor: pointer;
                transition: transform 0.2s;

                &:hover {
                  transform: translateY(-4px);
                }

                .project-title {
                  margin: 0 0 8px 0;
                  font-size: 16px;
                  color: #303133;
                }

                .project-desc {
                  margin: 0 0 12px 0;
                  font-size: 14px;
                  color: #606266;
                  height: 40px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                }

                .project-meta {
                  display: flex;
                  justify-content: space-between;
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }

          .comment-list {
            .comment-item {
              padding: 15px 0;
              border-bottom: 1px solid #f0f0f0;

              &:last-child {
                border-bottom: none;
              }

              .comment-content {
                margin: 0 0 8px 0;
                line-height: 1.6;
                color: #606266;
              }

              .comment-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;

                .comment-time {
                  color: #909399;
                }
              }
            }
          }

          .settings-content {
            max-width: 600px;
            margin: 0 auto;
          }
        }
      }
    }
  }
}
</style>
