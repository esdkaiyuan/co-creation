<template>
  <div class="comment-item">
    <div class="comment-header">
      <AvatarInitial :username="comment.username" :size="32" />
      <div class="comment-info">
        <span class="username">{{ comment.username }}</span>
        <span class="time">{{ formatTime(comment.createdAt) }}</span>
      </div>
    </div>
    
    <div class="comment-content">
      <p>{{ comment.content }}</p>
    </div>
    
    <div class="comment-actions">
      <el-button 
        text 
        size="small" 
        @click="handleReply"
        :icon="ChatDotRound"
      >
        回复
      </el-button>
      <el-button 
        text 
        size="small" 
        @click="handleLike"
        :icon="Star"
        :class="{ 'liked': isLiked }"
      >
        {{ comment.likeCount || 0 }}
      </el-button>
      <el-dropdown v-if="canEdit" trigger="click">
        <el-button text size="small" :icon="MoreFilled">更多</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleEdit">编辑</el-dropdown-item>
            <el-dropdown-item @click="handleDelete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 回复输入框 -->
    <CommentInput
      v-if="showReplyInput"
      placeholder="回复 {{ comment.username }}"
      buttonText="发送回复"
      :show-cancel="true"
      @submit="handleSubmitReply"
      @cancel="showReplyInput = false"
    />
    
    <!-- 编辑输入框 -->
    <CommentInput
      v-if="showEditInput"
      :initial-value="comment.content"
      buttonText="保存修改"
      :show-cancel="true"
      @submit="handleSubmitEdit"
      @cancel="showEditInput = false"
    />
    
    <!-- 回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies">
      <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
        <CommentItem 
          :comment="reply" 
          :project-id="projectId"
          :current-user-id="currentUserId"
          @reply="handleReplyToReply"
          @edit="handleEditReply"
          @delete="handleDeleteReply"
          @like="handleLikeReply"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { ChatDotRound, Star, MoreFilled } from '@element-plus/icons-vue'
import CommentInput from './CommentInput.vue'
import AvatarInitial from './AvatarInitial.vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  projectId: {
    type: Number,
    required: true
  },
  currentUserId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['reply', 'edit', 'delete', 'like'])

const userStore = useUserStore()
const showReplyInput = ref(false)
const showEditInput = ref(false)

// 判断是否可以编辑/删除
const canEdit = computed(() => {
  return userStore.userInfo?.id === props.comment.user_id
})

const isLiked = ref(false)

// 格式化时间
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 回复
const handleReply = () => {
  showReplyInput.value = true
  showEditInput.value = false
}

// 点赞
const handleLike = () => {
  emit('like', props.comment.id, isLiked.value)
  isLiked.value = !isLiked.value
}

// 编辑
const handleEdit = () => {
  showEditInput.value = true
  showReplyInput.value = false
}

// 删除
const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这条评论吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete', props.comment.id, props.projectId)
  })
}

// 提交回复
const handleSubmitReply = async (content) => {
  emit('reply', content, props.comment.id, props.projectId)
  showReplyInput.value = false
}

// 提交编辑
const handleSubmitEdit = async (content) => {
  emit('edit', props.comment.id, content, props.projectId)
  showEditInput.value = false
}

// 处理子评论的事件
const handleReplyToReply = (content, parentId, projectId) => {
  emit('reply', content, parentId, projectId)
}

const handleEditReply = (commentId, content, projectId) => {
  emit('edit', commentId, content, projectId)
}

const handleDeleteReply = (commentId, projectId) => {
  emit('delete', commentId, projectId)
}

const handleLikeReply = (commentId, liked) => {
  emit('like', commentId, liked)
}
</script>

<style scoped>
.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-bottom: 10px;
  padding-left: 42px;
}

.comment-content p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.comment-actions {
  display: flex;
  gap: 15px;
  padding-left: 42px;
}

.liked {
  color: #e6a23c;
}

.replies {
  margin-left: 42px;
  margin-top: 10px;
  padding-left: 15px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  margin-top: 10px;
}
</style>
