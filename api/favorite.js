import request from './request'

// 收藏项目
export function favoriteProject(projectId) {
  return request({
    url: `/projects/${projectId}/favorite`,
    method: 'post'
  })
}

// 取消收藏
export function unfavoriteProject(projectId) {
  return request({
    url: `/projects/${projectId}/favorite`,
    method: 'delete'
  })
}

// 获取用户收藏列表
export function getUserFavorites(page = 1, pageSize = 12) {
  return request({
    url: '/users/favorites',
    method: 'get',
    params: { page, pageSize }
  })
}
