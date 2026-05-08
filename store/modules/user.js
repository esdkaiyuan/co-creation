import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getCurrentUser, updateUserInfo, getUserProjects, getUserParticipatedProjects, getUserComments, getUserStats } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  
  // 个人中心相关状态
  const userProjects = ref([])
  const participatedProjects = ref([])
  const userComments = ref([])
  const userStats = ref({
    projectCount: 0,
    favoriteCount: 0,
    commentCount: 0
  })

  const isLoggedIn = computed(() => !!token.value)

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      const res = await getCurrentUser()
      userInfo.value = res.data
      return res
    } catch (error) {
      logout()
      throw error
    }
  }

  // 初始化：如果有token，自动获取用户信息
  if (token.value) {
    fetchUserInfo().catch(err => {
      console.error('初始化获取用户信息失败:', err)
    })
  }

  // 登录
  async function login(loginForm) {
    try {
      const res = await loginApi(loginForm)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      await fetchUserInfo()
      return res
    } catch (error) {
      throw error
    }
  }

  // 注册
  async function register(registerForm) {
    try {
      const res = await registerApi(registerForm)
      return res
    } catch (error) {
      throw error
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
    userProjects.value = []
    userComments.value = []
    userStats.value = { projectCount: 0, favoriteCount: 0, commentCount: 0 }
    localStorage.removeItem('token')
  }

  // 更新个人资料
  async function updateProfile(data) {
    try {
      const res = await updateUserInfo(data)
      // 更新本地用户信息
      userInfo.value = { ...userInfo.value, ...res.data }
      return res
    } catch (error) {
      console.error('更新个人资料失败:', error)
      throw error
    }
  }

  // 获取用户项目
  async function fetchUserProjects(params = {}) {
    try {
      const res = await getUserProjects(params)
      userProjects.value = res.data.projects
      return res.data
    } catch (error) {
      console.error('获取用户项目失败:', error)
      throw error
    }
  }

  // 获取用户参与的项目
  async function fetchParticipatedProjects(params = {}) {
    try {
      const res = await getUserParticipatedProjects(params)
      participatedProjects.value = res.data.projects
      return res.data
    } catch (error) {
      console.error('获取参与项目失败:', error)
      throw error
    }
  }

  // 获取用户评论
  async function fetchUserComments(params = {}) {
    try {
      const res = await getUserComments(params)
      userComments.value = res.data.comments
      return res.data
    } catch (error) {
      console.error('获取用户评论失败:', error)
      throw error
    }
  }

  // 获取用户统计
  async function fetchUserStats() {
    try {
      const res = await getUserStats()
      userStats.value = res.data
      return res.data
    } catch (error) {
      console.error('获取用户统计失败:', error)
      throw error
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userProjects,
    participatedProjects,
    userComments,
    userStats,
    login,
    register,
    fetchUserInfo,
    logout,
    updateProfile,
    fetchUserProjects,
    fetchParticipatedProjects,
    fetchUserComments,
    fetchUserStats
  }
})
