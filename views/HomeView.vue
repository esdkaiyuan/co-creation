<template>
  <div class="home-view">
    <!-- 顶部导航栏 -->
    <Header />

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-container">
        <!-- 左侧边栏 -->
        <Sidebar :selected-category-id="selectedCategoryId" @category-change="handleCategoryChange" />

        <!-- 右侧项目列表 -->
        <div class="project-section">
          <!-- 页面标题 -->
          <div class="page-header">
            <h1 class="page-title">
              {{ pageTitle }}
              <el-icon class="sparkle-icon"><Star /></el-icon>
            </h1>
            <p class="page-subtitle">{{ pageSubtitle }}</p>
          </div>

          <!-- 筛选栏 -->
          <div class="filter-bar">
            <div class="filter-tabs">
              <div
                v-for="tab in filterTabs"
                :key="tab.key"
                class="filter-tab"
                :class="{ active: activeFilter === tab.key }"
                @click="handleFilterChange(tab.key)"
              >
                {{ tab.label }}
              </div>
            </div>
            <div class="filter-actions">
              <el-dropdown @command="handleFilterCommand">
                <el-button>
                  <el-icon><Filter /></el-icon>
                  筛选
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="option in filterOptions"
                      :key="option.value"
                      :command="option.value"
                    >
                      {{ option.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-dropdown @command="handleSortCommand">
                <el-button>
                  排序：{{ currentSortLabel }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="option in sortOptions"
                      :key="option.value"
                      :command="option.value"
                    >
                      {{ option.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 项目网格 -->
          <ProjectGrid
            :projects="projects"
            :loading="loading"
            :total="total"
            @like="handleLike"
            @favorite="handleFavorite"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/store/modules/project'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import {
  Star,
  Filter,
  ArrowDown
} from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'

const route = useRoute()
const projectStore = useProjectStore()
const userStore = useUserStore()
const { projects, loading, total } = storeToRefs(projectStore)

const selectedCategoryId = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)
const searchKeyword = ref('')
const activeFilter = ref('all')
const activeSort = ref('recommend')

// 筛选标签
const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
  { key: 'hot', label: '热门' },
  { key: 'latest', label: '最新' },
  { key: 'deadline', label: '即将截止' }
]

// 筛选项
const filterOptions = [
  { label: '全部分类', value: 'all' },
  { label: '技术开发', value: 'tech' },
  { label: '设计创意', value: 'design' },
  { label: '产品/运营', value: 'product' },
  { label: '内容创作', value: 'content' }
]

// 排序选项
const sortOptions = [
  { label: '推荐', value: 'recommend' },
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'hot' },
  { label: '最多参与', value: 'participants' }
]

// 当前排序标签
const currentSortLabel = computed(() => {
  const option = sortOptions.find(opt => opt.value === activeSort.value)
  return option ? option.label : '推荐'
})

// 页面标题动态更新
const pageTitle = computed(() => {
  const navMap = {
    'discover': '发现项目',
    'hot': '热门项目',
    'latest': '最新项目',
    'deadline': '即将截止'
  }
  
  const nav = route.query.nav
  return nav && nav !== 'discover' ? navMap[nav] : '一起构想，一起创造'
})

const pageSubtitle = computed(() => {
  const navMap = {
    'discover': '浏览社区中的所有创意项目',
    'hot': '当前最受欢迎的项目',
    'latest': '最新发布的项目',
    'deadline': '即将截止参与的项目,抓紧时间!'
  }
  
  const nav = route.query.nav
  return nav && nav !== 'discover' ? navMap[nav] : '在共创社区，连接想法与能力，让创意变成现实'
})

// 加载项目列表
const loadProjects = async () => {
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
    filter: activeFilter.value,
    sort: activeSort.value
  }

  if (selectedCategoryId.value) {
    params.categoryId = selectedCategoryId.value
  }

  if (searchKeyword.value) {
    params.search = searchKeyword.value
  }

  await projectStore.fetchProjects(params)
}

// 处理导航变化
const handleNavChange = (nav) => {
  switch (nav) {
    case 'discover':
      // 完全重置
      selectedCategoryId.value = null
      activeFilter.value = 'all'
      activeSort.value = 'recommend'
      break
    case 'hot':
      activeFilter.value = 'hot'
      activeSort.value = 'hot'
      break
    case 'latest':
      activeFilter.value = 'latest'
      activeSort.value = 'latest'
      break
    case 'deadline':
      activeFilter.value = 'deadline'
      // deadline不需要设置sort,由后端默认按end_date排序
      break
    default:
      // 无效nav参数,忽略
      return
  }
  currentPage.value = 1
  loadProjects()
}

// 处理分类变化
const handleCategoryChange = (categoryId) => {
  selectedCategoryId.value = categoryId
  currentPage.value = 1
  loadProjects()
}

// 处理筛选标签变化
const handleFilterChange = (filter) => {
  activeFilter.value = filter
  currentPage.value = 1
  loadProjects()
}

// 处理筛选项变化
const handleFilterCommand = (value) => {
  // TODO: 实现具体筛选逻辑
  ElMessage.info(`筛选：${value}`)
}

// 处理排序变化
const handleSortCommand = (value) => {
  activeSort.value = value
  currentPage.value = 1
  loadProjects()
}

// 处理页码变化
const handlePageChange = ({ page, pageSize: size }) => {
  currentPage.value = page
  pageSize.value = size
  loadProjects()
}

// 处理点赞
const handleLike = async (projectId) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    await projectStore.toggleLike(projectId)
    // 查找项目确定当前状态
    const project = projectStore.projects.find(p => p.id === projectId)
    if (project && project.isLiked) {
      ElMessage.success('点赞成功')
    } else {
      ElMessage.success('已取消点赞')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 处理收藏
const handleFavorite = async (projectId) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    await projectStore.toggleFavorite(projectId)
    ElMessage.success('收藏成功')
  } catch (error) {
    console.error('收藏失败:', error)
  }
}

// 监听路由查询参数变化
watch(
  () => route.query.search,
  (newSearch) => {
    searchKeyword.value = newSearch || ''
    currentPage.value = 1
    loadProjects()
  }
)

// 监听nav参数变化
watch(() => route.query.nav, (newNav) => {
  if (newNav) {
    handleNavChange(newNav)
  }
}, { immediate: true })

// 初始化
onMounted(() => {
  if (route.query.search) {
    searchKeyword.value = route.query.search
  }
  
  loadProjects()
})
</script>

<style lang="scss" scoped>
.home-view {
  min-height: 100vh;
  background-color: #f5f7fa;

  .main-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;

    .content-container {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 32px;
      align-items: start;
    }

    .project-section {
      min-height: 400px;

      .page-header {
        margin-bottom: 32px;

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #303133;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 12px;

          .sparkle-icon {
            font-size: 28px;
            color: #00B4D8;
          }
        }

        .page-subtitle {
          font-size: 15px;
          color: #909399;
          margin: 0;
          line-height: 1.6;
        }
      }

      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e4e7ed;

        .filter-tabs {
          display: flex;
          gap: 8px;

          .filter-tab {
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            color: #606266;
            cursor: pointer;
            transition: all 0.3s;
            background: #fff;

            &:hover {
              color: #00B4D8;
              background: #f5f7fa;
            }

            &.active {
              background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%);
              color: #fff;
              font-weight: 500;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
          }
        }

        .filter-actions {
          display: flex;
          gap: 12px;

          .el-button {
            border-radius: 8px;
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .home-view {
    .main-content {
      .content-container {
        gap: 20px;
      }
    }
  }
}

@media (max-width: 1024px) {
  .home-view {
    .main-content {
      .content-container {
        grid-template-columns: 180px 1fr;
      }

      .project-section {
        .page-header {
          .page-title {
            font-size: 28px;
          }

          .page-subtitle {
            font-size: 14px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .home-view {
    .main-content {
      padding: 16px;

      .content-container {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-section {
        .page-header {
          .page-title {
            font-size: 24px;
          }

          .page-subtitle {
            font-size: 13px;
          }
        }

        .filter-bar {
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;

          .filter-tabs {
            flex-wrap: wrap;
            width: 100%;
          }

          .filter-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .home-view {
    .main-content {
      padding: 12px;

      .project-section {
        .page-header {
          margin-bottom: 16px;

          .page-title {
            font-size: 20px;
          }

          .page-subtitle {
            font-size: 12px;
          }
        }

        .filter-bar {
          .filter-tabs {
            .filter-tab {
              font-size: 13px;
              padding: 6px 12px;
            }
          }

          .filter-actions {
            .el-button {
              padding: 8px 12px;
              font-size: 13px;
            }
          }
        }
      }
    }
  }
}
</style>
