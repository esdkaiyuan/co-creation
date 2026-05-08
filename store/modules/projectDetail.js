import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProjectById, likeProject, unlikeProject, participateProject, cancelParticipate } from '@/api/project'
import { favoriteProject, unfavoriteProject } from '@/api/favorite'
import { 
  getProjectComments, 
  createComment, 
  updateComment, 
  deleteComment,
  likeComment,
  unlikeComment
} from '@/api/comment'

export const useProjectDetailStore = defineStore('projectDetail', () => {
  // 项目详情
  const projectDetail = ref(null)
  
  // 评论列表
  const comments = ref([])
  const commentTotal = ref(0)
  const commentPage = ref(1)
  const commentPageSize = ref(20)
  
  // 加载状态
  const loading = ref(false)
  const commentLoading = ref(false)

  // 获取项目详情
  async function fetchProjectDetail(projectId, accessPassword = null) {
    loading.value = true
    try {
      const headers = {}
      if (accessPassword) {
        headers['x-access-password'] = accessPassword
      }
      
      const res = await getProjectById(projectId, { headers })
      projectDetail.value = res.data
      
      // 获取评论
      await fetchComments(projectId)
      
      return res.data
    } catch (error) {
      console.error('获取项目详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取评论列表
  async function fetchComments(projectId, page = 1) {
    commentLoading.value = true
    try {
      const res = await getProjectComments(projectId, page, commentPageSize.value)
      comments.value = res.data.comments
      commentTotal.value = res.data.total
      commentPage.value = page
      return res.data
    } catch (error) {
      console.error('获取评论列表失败:', error)
      throw error
    } finally {
      commentLoading.value = false
    }
  }

  // 点赞项目
  async function toggleLike(projectId) {
    try {
      if (projectDetail.value.isLiked) {
        await unlikeProject(projectId)
        projectDetail.value.isLiked = false
        projectDetail.value.likeCount--
      } else {
        await likeProject(projectId)
        projectDetail.value.isLiked = true
        projectDetail.value.likeCount++
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      throw error
    }
  }

  // 收藏项目
  async function toggleFavorite(projectId) {
    try {
      if (projectDetail.value.isFavorited) {
        await unfavoriteProject(projectId)
        projectDetail.value.isFavorited = false
        projectDetail.value.favoriteCount--
      } else {
        await favoriteProject(projectId)
        projectDetail.value.isFavorited = true
        projectDetail.value.favoriteCount++
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      throw error
    }
  }

  // 参与/取消参与项目
  async function toggleParticipate(projectId, accessPassword = null) {
    try {
      if (projectDetail.value.isParticipated) {
        // 取消参与
        await cancelParticipate(projectId)
        projectDetail.value.isParticipated = false
        projectDetail.value.participantCount = Math.max(0, projectDetail.value.participantCount - 1)
      } else {
        // 参与项目
        const headers = {}
        if (accessPassword) {
          headers['x-access-password'] = accessPassword
        }
        await participateProject(projectId, { headers })
        projectDetail.value.isParticipated = true
        projectDetail.value.participantCount++
      }
    } catch (error) {
      console.error('参与项目操作失败:', error)
      throw error
    }
  }

  // 发表评论
  async function addComment(projectId, content, parentId = null) {
    try {
      await createComment(projectId, content, parentId)
      // 重新获取评论列表
      await fetchComments(projectId, 1)
      // 更新评论数
      projectDetail.value.commentCount++
    } catch (error) {
      console.error('发表评论失败:', error)
      throw error
    }
  }

  // 更新评论
  async function editComment(commentId, content, projectId) {
    try {
      await updateComment(commentId, content)
      // 刷新评论列表
      await fetchComments(projectId, commentPage.value)
    } catch (error) {
      console.error('更新评论失败:', error)
      throw error
    }
  }

  // 删除评论
  async function removeComment(commentId, projectId) {
    try {
      await deleteComment(commentId)
      // 刷新评论列表
      await fetchComments(projectId, commentPage.value)
      // 更新评论数
      projectDetail.value.commentCount--
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  // 点赞评论
  async function toggleCommentLike(commentId, isLiked) {
    try {
      if (isLiked) {
        await unlikeComment(commentId)
      } else {
        await likeComment(commentId)
      }
      // 刷新评论列表以更新点赞数
      const projectId = projectDetail.value?.id
      if (projectId) {
        await fetchComments(projectId, commentPage.value)
      }
    } catch (error) {
      console.error('评论点赞操作失败:', error)
      throw error
    }
  }

  // 重置状态
  function resetState() {
    projectDetail.value = null
    comments.value = []
    commentTotal.value = 0
    commentPage.value = 1
  }

  return {
    projectDetail,
    comments,
    commentTotal,
    commentPage,
    loading,
    commentLoading,
    fetchProjectDetail,
    fetchComments,
    toggleLike,
    toggleFavorite,
    toggleParticipate,
    addComment,
    editComment,
    removeComment,
    toggleCommentLike,
    resetState
  }
})
