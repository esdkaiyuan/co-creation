import request from './request'

// 用户注册
export function register(data) {
  return request.post('/users/register', data)
}

// 用户登录
export function login(data) {
  return request.post('/users/login', data)
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/users/me')
}

// 更新用户信息
export function updateUserInfo(data) {
  return request.put('/users/me', data)
}

// 获取用户创建的项目
export function getUserProjects(params) {
  return request.get('/users/projects', { params })
}

// 获取用户参与的项目列表
export function getUserParticipatedProjects(params) {
  return request.get('/users/participated-projects', { params })
}

// 获取用户评论历史
export function getUserComments(params) {
  return request.get('/users/comments', { params })
}

// 获取用户统计信息
export function getUserStats() {
  return request.get('/users/stats')
}
