<template>
  <div class="project-detail-view">
    <Header />
    
    <!-- 密码验证对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="请输入访问密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form @submit.prevent="handleVerifyPassword">
        <el-form-item label="访问密码">
          <el-input
            v-model="accessPassword"
            type="password"
            placeholder="请输入访问密码"
            show-password
            @keyup.enter="handleVerifyPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" @click="handleVerifyPassword" :loading="verifying">
          验证
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 参与项目密码验证对话框 -->
    <el-dialog
      v-model="showParticipateDialog"
      title="参与加密项目"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="此项目需要密码才能参与"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-form @submit.prevent="handleParticipateWithPassword">
        <el-form-item label="访问密码">
          <el-input
            v-model="participatePassword"
            type="password"
            placeholder="请输入项目访问密码"
            show-password
            @keyup.enter="handleParticipateWithPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showParticipateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleParticipateWithPassword" :loading="participating">
          确认参与
        </el-button>
      </template>
    </el-dialog>
    
    <div class="detail-container">
      <el-skeleton v-if="loading" :rows="10" animated />
      
      <div v-else-if="projectDetail" class="detail-content">
        <!-- 顶部区域: 项目封面和信息 -->
        <div v-if="projectDetail.coverImage" class="cover-image">
          <img :src="projectDetail.coverImage" :alt="projectDetail.title" />
        </div>
        
        <div class="project-header">
          <h1 class="project-title">{{ projectDetail.title }}</h1>
          <div class="project-meta">
            <el-tag>{{ projectDetail.categoryName }}</el-tag>
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ projectDetail.creator.username }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ projectDetail.viewCount }}
            </span>
            <span v-if="projectDetail.endDate" class="meta-item deadline">
              <el-icon><Calendar /></el-icon>
              截止: {{ formatDate(projectDetail.endDate) }}
            </span>
          </div>
        </div>
        
        <p class="project-description">{{ projectDetail.description }}</p>
        
        <div v-if="projectDetail.repositoryUrl" class="repository-info">
          <el-link :href="projectDetail.repositoryUrl" target="_blank" type="primary">
            <el-icon><Link /></el-icon>
            {{ projectDetail.repositoryUrl }}
          </el-link>
        </div>
        
        <el-divider />
        
        <!-- 操作按钮区 -->
        <div class="action-bar">
          <el-button 
            :type="projectDetail.isLiked ? 'danger' : 'default'"
            @click="handleLike"
            size="large"
          >
            <span class="button-icon" v-html="projectDetail.isLiked ? '&#10084;' : '&#9825;'"></span>
            {{ projectDetail.isLiked ? '已点赞' : '点赞' }} {{ projectDetail.likeCount }}
          </el-button>
          
          <el-button 
            :type="projectDetail.isFavorited ? 'warning' : 'default'"
            @click="handleFavorite"
            size="large"
          >
            <el-icon><Star v-if="!projectDetail.isFavorited" /><StarFilled v-else /></el-icon>
            {{ projectDetail.isFavorited ? '已收藏' : '收藏' }} {{ projectDetail.favoriteCount }}
          </el-button>
          
          <el-button 
            :type="projectDetail.isParticipated ? 'success' : 'primary'"
            @click="handleParticipate"
            :icon="UserFilled"
            size="large"
          >
            {{ projectDetail.isParticipated ? '已参与' : '参与项目' }}
          </el-button>
        </div>
        
        <el-divider />
        
        <!-- 评论区 -->
        <div class="comments-section">
          <h3 class="section-title">
            评论 ({{ projectDetail.commentCount }})
          </h3>
          
          <!-- 评论输入框 -->
          <CommentInput 
            @submit="handleAddComment"
            placeholder="分享你的想法..."
            buttonText="发表评论"
          />
          
          <!-- 评论列表 -->
          <el-skeleton v-if="commentLoading" :rows="5" animated />
          <div v-else-if="comments.length > 0" class="comments-list">
            <CommentItem
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              :project-id="projectId"
              :current-user-id="userStore.userInfo?.id"
              @reply="handleReply"
              @edit="handleEditComment"
              @delete="handleDeleteComment"
              @like="handleLikeComment"
            />
          </div>
          <el-empty v-else description="暂无评论,快来抢沙发吧!" />
        </div>
      </div>
      
      <el-empty v-else description="项目不存在" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { useProjectDetailStore } from '@/store/modules/projectDetail'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, View, Link, Star, StarFilled, UserFilled, Calendar } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import CommentInput from '@/components/CommentInput.vue'
import CommentItem from '@/components/CommentItem.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const projectDetailStore = useProjectDetailStore()

const { projectDetail, comments, loading, commentLoading } = storeToRefs(projectDetailStore)

const projectId = Number(route.params.id)
const showPasswordDialog = ref(false)
const accessPassword = ref('')
const verifying = ref(false)

// 参与项目相关
const showParticipateDialog = ref(false)
const participatePassword = ref('')
const participating = ref(false)

onMounted(async () => {
  // 重置状态,防止显示旧项目数据
  projectDetailStore.resetState()
  
  try {
    await projectDetailStore.fetchProjectDetail(projectId)
  } catch (error) {
    if (error.response?.status === 403) {
      // 需要密码验证
      showPasswordDialog.value = true
    } else {
      ElMessage.error('获取项目详情失败')
    }
  }
})

// 验证密码
const handleVerifyPassword = async () => {
  if (!accessPassword.value) {
    ElMessage.warning('请输入访问密码')
    return
  }
  
  verifying.value = true
  try {
    await projectDetailStore.fetchProjectDetail(projectId, accessPassword.value)
    showPasswordDialog.value = false
    ElMessage.success('验证成功')
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error('密码错误,请重试')
    } else {
      ElMessage.error('验证失败')
    }
  } finally {
    verifying.value = false
  }
}

// 点赞
const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    return
  }
  
  try {
    await projectDetailStore.toggleLike(projectId)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 收藏
const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    return
  }
  
  try {
    await projectDetailStore.toggleFavorite(projectId)
    ElMessage.success(projectDetail.value.isFavorited ? '收藏成功' : '取消收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 参与项目
const handleParticipate = async () => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    return
  }
  
  // 检查是否已参与
  if (projectDetail.value.isParticipated) {
    try {
      await ElMessageBox.confirm('确定要取消参与此项目吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await projectDetailStore.toggleParticipate(projectId)
      ElMessage.success('已取消参与')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('操作失败')
      }
    }
    return
  }
  
  // 检查项目是否需要密码
  if (projectDetail.value.accessType === 'password') {
    // 加密项目，显示密码输入对话框
    participatePassword.value = ''
    showParticipateDialog.value = true
  } else {
    // 公开项目，直接参与
    try {
      await projectDetailStore.toggleParticipate(projectId)
      ElMessage.success(`已将仓库地址 ${projectDetail.value.repositoryUrl} 保存到我参与的项目中`)
    } catch (error) {
      ElMessage.error('参与失败，请重试')
    }
  }
}

// 使用密码参与项目
const handleParticipateWithPassword = async () => {
  if (!participatePassword.value) {
    ElMessage.warning('请输入访问密码')
    return
  }
  
  participating.value = true
  try {
    await projectDetailStore.toggleParticipate(projectId, participatePassword.value)
    showParticipateDialog.value = false
    ElMessage.success(`已将仓库地址 ${projectDetail.value.repositoryUrl} 保存到我参与的项目中`)
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error('密码错误，请重试')
    } else {
      ElMessage.error('参与失败，请重试')
    }
  } finally {
    participating.value = false
  }
}

// 发表评论
const handleAddComment = async (content) => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再评论', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    throw new Error('未登录')
  }
  
  try {
    await projectDetailStore.addComment(projectId, content)
    ElMessage.success('评论成功')
  } catch (error) {
    ElMessage.error('评论失败')
    throw error
  }
}

// 回复评论
const handleReply = async (content, parentId) => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再回复', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    throw new Error('未登录')
  }
  
  try {
    await projectDetailStore.addComment(projectId, content, parentId)
    ElMessage.success('回复成功')
  } catch (error) {
    ElMessage.error('回复失败')
    throw error
  }
}

// 编辑评论
const handleEditComment = async (commentId, content) => {
  try {
    await projectDetailStore.editComment(commentId, content, projectId)
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

// 删除评论
const handleDeleteComment = async (commentId) => {
  try {
    await projectDetailStore.removeComment(commentId, projectId)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 点赞评论
const handleLikeComment = async (commentId, isLiked) => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
    return
  }
  
  try {
    await projectDetailStore.toggleCommentLike(commentId, isLiked)
  } catch (error) {
    ElMessage.error('操作失败')
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
.project-detail-view {
  min-height: 100vh;
  background-color: #f5f7fa;

  .detail-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 24px;

    .detail-content {
      background: #fff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .cover-image {
        margin: -32px -32px 24px;
        max-height: 400px;
        overflow: hidden;

        img {
          width: 100%;
          height: auto;
          display: block;
        }
      }

      .project-header {
        margin-bottom: 20px;

        .project-title {
          font-size: 28px;
          color: #303133;
          margin: 0 0 12px 0;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          color: #909399;
          font-size: 14px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            
            &.deadline {
              color: #00B4D8;
              font-weight: bold;
            }
          }
        }
      }

      .project-description {
        font-size: 16px;
        color: #606266;
        line-height: 1.8;
        margin-bottom: 20px;
      }

      .repository-info {
        margin-bottom: 20px;
      }

      .action-bar {
        display: flex;
        gap: 15px;
        justify-content: center;
        padding: 20px 0;

        .button-icon {
          font-style: normal;
          font-size: 18px;
          line-height: 1;
          display: inline-block;
          margin-right: 4px;
        }

        // 点赞按钮的心形图标样式
        .el-button:first-child {
          .button-icon {
            color: #909399;
          }

          &.is-danger {
            .button-icon {
              color: #ff6b6b;
            }
          }
        }
      }

      .comments-section {
        margin-top: 30px;

        .section-title {
          font-size: 20px;
          color: #303133;
          margin-bottom: 20px;
        }

        .comments-list {
          margin-top: 20px;
        }
      }
    }
  }
}
</style>
