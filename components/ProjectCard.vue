<template>
  <div class="project-card" @click="goToDetail">
    <!-- 项目封面 -->
    <div class="card-cover">
      <img v-if="project.coverImage" :src="project.coverImage" :alt="project.title" />
      <div v-else class="default-cover">
        <el-icon><Picture /></el-icon>
      </div>
      <!-- 推荐/热门标签 -->
      <div v-if="project.isRecommend" class="badge recommend">
        <el-icon><Star /></el-icon>
        <span>推荐</span>
      </div>
      <div v-else-if="project.isHot" class="badge hot">
        <el-icon><TrendCharts /></el-icon>
        <span>热门</span>
      </div>
    </div>

    <!-- 项目信息 -->
    <div class="card-content">
      <h3 class="card-title">{{ project.title }}</h3>
      <p class="card-description">{{ project.description }}</p>

      <!-- 标签 -->
      <div class="card-tags">
        <el-tag
          v-for="tag in project.tags"
          :key="tag"
          size="small"
          type="info"
          effect="plain"
        >
          # {{ tag }}
        </el-tag>
      </div>

      <!-- 底部信息 -->
      <div class="card-footer">
        <div class="footer-left">
          <div class="creator-info">
            <AvatarInitial v-if="project.creator" :username="project.creator.username" :size="24" />
            <span class="creator-name">{{ project.creator?.username }}</span>
          </div>
          <div class="meta-info">
            <span class="participants">
              <el-icon><UserFilled /></el-icon>
              {{ project.participantCount || 0 }} 人参与
            </span>
            <span v-if="project.endDate" class="deadline-info">
              <el-icon><Calendar /></el-icon>
              截止日期: {{ formatDate(project.endDate) }}
            </span>
          </div>
        </div>
        <div class="divider-vertical"></div>
        <div class="footer-right">
          <span class="action-item like-count" @click.stop="handleLike" :class="{ 'is-liked': project.isLiked }">
            <span class="heart-icon">&#10084;</span>
            <span>{{ project.likeCount || 0 }}</span>
          </span>
          <span class="action-item favorite-count" @click.stop="handleFavorite" :class="{ 'is-favorited': project.isFavorited }">
            <el-icon><Star v-if="!project.isFavorited" /><StarFilled v-else /></el-icon>
            <span>{{ project.favoriteCount || 0 }}</span>
          </span>
          <span class="action-item comment-count">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ project.commentCount || 0 }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  Picture,
  Star,
  TrendCharts,
  UserFilled,
  StarFilled,
  ChatDotRound,
  Calendar
} from '@element-plus/icons-vue'
import AvatarInitial from './AvatarInitial.vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'favorite'])

const router = useRouter()

// 跳转到项目详情
const goToDetail = () => {
  router.push(`/project/${props.project.id}`)
}

// 处理点赞
const handleLike = () => {
  emit('like', props.project.id)
}

// 处理收藏
const handleFavorite = () => {
  emit('favorite', props.project.id)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}
</script>

<style lang="scss" scoped>
.project-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .card-cover img {
      transform: scale(1.08);
    }
  }

  .card-cover {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .default-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
      color: rgba(255, 255, 255, 0.6);
    }

    .badge {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      backdrop-filter: blur(10px);

      &.recommend {
        background: rgba(102, 126, 234, 0.9);
      }

      &.hot {
        background: rgba(255, 140, 66, 0.9);
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }

  .card-content {
    padding: 20px;

    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 12px 0;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .card-description {
      font-size: 14px;
      color: #909399;
      margin: 0 0 16px 0;
      line-height: 1.6;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      min-height: 45px;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;

      .el-tag {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        background: #f5f7fa;
        color: #606266;
        border: none;
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;

      .footer-left {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;

        .creator-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .creator-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
          }
        }

        .meta-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-left: 32px;

          .participants,
          .deadline-info {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #909399;

            .el-icon {
              font-size: 14px;
            }
          }

          .deadline-info {
            color: #00B4D8;
            font-weight: 500;
          }
        }
      }

      .divider-vertical {
        width: 1px;
        background-color: #e4e7ed;
        margin: 0 16px;
        align-self: stretch;
      }

      .footer-right {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 50px;

        .action-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #909399;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 40px;

          .el-icon,
          svg,
          .heart-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            line-height: 1;
          }

          .heart-icon {
            font-style: normal;
            -webkit-text-stroke: 1px currentColor;
            paint-order: stroke fill;
          }

          &:hover {
            color: #00B4D8;
          }
        }

        .like-count {
          .heart-icon {
            color: transparent;
            -webkit-text-stroke: 1.5px #909399;
          }

          &.is-liked {
            color: #ff6b6b;

            .heart-icon {
              color: #ff6b6b;
              -webkit-text-stroke: 0;
            }
          }
        }

        .favorite-count {
          &.is-favorited {
            color: #ffa502;
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 1024px) {
  .project-card {
    .card-cover {
      height: 180px;
    }
  }
}

@media (max-width: 768px) {
  .project-card {
    .card-cover {
      height: 160px;
    }

    .card-content {
      padding: 16px;

      .card-title {
        font-size: 16px;
      }

      .card-description {
        font-size: 13px;
        -webkit-line-clamp: 2;
      }

      .card-footer {
        .footer-left {
          .participants {
            font-size: 12px;
          }
        }

        .footer-right {
          span {
            font-size: 12px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .project-card {
    .card-cover {
      height: 140px;
    }

    .card-content {
      padding: 12px;

      .card-title {
        font-size: 15px;
      }

      .card-tags {
        margin: 12px 0;

        .el-tag {
          font-size: 11px;
          padding: 2px 6px;
        }
      }
    }
  }
}
</style>
