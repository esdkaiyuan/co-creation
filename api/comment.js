import request from './request'

// 发表评论/回复
export function createComment(projectId, content, parentId = null) {
  return request({
    url: `/projects/${projectId}/comments`,
    method: 'post',
    data: { content, parentId }
  })
}

// 获取项目评论列表
export function getProjectComments(projectId, page = 1, pageSize = 20) {
  return request({
    url: `/projects/${projectId}/comments`,
    method: 'get',
    params: { page, pageSize }
  })
}

// 更新评论
export function updateComment(commentId, content) {
  return request({
    url: `/comments/${commentId}`,
    method: 'put',
    data: { content }
  })
}

// 删除评论
export function deleteComment(commentId) {
  return request({
    url: `/comments/${commentId}`,
    method: 'delete'
  })
}

// 点赞评论
export function likeComment(commentId) {
  return request({
    url: `/comments/${commentId}/like`,
    method: 'post'
  })
}

// 取消点赞评论
export function unlikeComment(commentId) {
  return request({
    url: `/comments/${commentId}/unlike`,
    method: 'post'
  })
}
