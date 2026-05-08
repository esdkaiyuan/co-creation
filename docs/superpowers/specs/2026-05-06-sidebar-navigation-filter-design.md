# 侧边栏导航筛选功能设计文档

**日期**: 2026-05-06  
**主题**: 侧边栏导航项(发现项目/热门项目/最新项目/即将截止)的筛选功能实现

## 1. 需求概述

为首页左侧边栏的4个导航项实现快捷筛选入口功能,采用筛选标签模式,点击后改变首页的项目筛选条件。

## 2. 功能设计

### 2.1 导航项行为定义

| 导航项 | URL参数 | filter值 | sort值 | 页面标签高亮 | 说明 |
|--------|---------|----------|--------|--------------|------|
| 发现项目 | `?nav=discover` | 'all' | 'recommend' | "全部" | 完全重置所有筛选 |
| 热门项目 | `?nav=hot` | 'hot' | 'hot' | "热门" | 按热度筛选和排序 |
| 最新项目 | `?nav=latest` | 'latest' | 'latest' | "最新" | 按时间筛选和排序 |
| 即将截止 | `?nav=deadline` | 'deadline' | 无(后端默认排序) | 无对应标签 | 未来7天内截止的项目 |

### 2.2 URL策略(混合方案)

- **侧边栏导航**: 改变URL query参数(`?nav=xxx`),支持浏览器前进/后退,刷新页面保持状态
- **页面筛选标签**: 只改变前端状态,不改变URL
- **组合使用**: 用户可以在侧边栏选择"热门项目"后,再在页面上切换排序方式

### 2.3 交互流程

```
用户点击侧边栏导航
  ↓
更新URL query参数 (?nav=xxx)
  ↓
HomeView监听route.query.nav变化
  ↓
根据nav参数设置activeFilter和activeSort
  ↓
调用projectStore.fetchProjects加载数据
  ↓
同步更新页面筛选标签的高亮状态
```

## 3. 技术实现

### 3.1 后端API修改

**文件**: `server.cjs`

在 `GET /api/projects` 接口中添加filter='deadline'支持:

```javascript
else if (params.filter === 'deadline') {
  // 查询未来7天内截止的项目
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
  WHERE end_date IS NOT NULL 
    AND end_date >= CURDATE() 
    AND end_date <= ?
  ORDER BY end_date ASC
}
```

**SQL逻辑**:
- 只返回有截止日期(end_date不为NULL)的项目
- 截止日期在今天到未来7天之间
- 按截止日期升序排列(最近的优先)

### 3.2 前端Store修改

**文件**: `store/modules/project.js`

无需修改,已有的fetchProjects方法支持传递任意filter参数到后端。

### 3.3 HomeView组件修改

**文件**: `views/HomeView.vue`

#### 3.3.1 监听路由query参数

```javascript
import { useRoute } from 'vue-router'

const route = useRoute()

// 监听nav参数变化
watch(() => route.query.nav, (newNav) => {
  if (newNav) {
    handleNavChange(newNav)
  }
}, { immediate: true })

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
  }
  currentPage.value = 1
  loadProjects()
}
```

#### 3.3.2 同步页面标签高亮

页面筛选标签(filterTabs)需要根据activeFilter自动高亮:

```vue
<div
  v-for="tab in filterTabs"
  :key="tab.key"
  class="filter-tab"
  :class="{ active: activeFilter === tab.key }"
  @click="handleFilterChange(tab.key)"
>
  {{ tab.label }}
</div>
```

注意: filterTabs需要添加'deadline'选项(可选,如果希望在页面上也显示这个标签)

### 3.4 Sidebar组件修改

**文件**: `components/Sidebar.vue`

添加导航点击事件处理:

```javascript
import { useRouter } from 'vue-router'

const router = useRouter()

// 导航点击
const handleNavClick = (key) => {
  activeNav.value = key
  
  // 跳转到首页并带上nav参数
  router.push({ path: '/', query: { nav: key } })
}
```

模板中绑定点击事件:

```vue
<div
  v-for="item in navItems"
  :key="item.key"
  class="nav-item"
  :class="{ active: activeNav === item.key }"
  @click="handleNavClick(item.key)"
>
  <el-icon><component :is="item.icon" /></el-icon>
  <span>{{ item.label }}</span>
</div>
```

### 3.5 页面标题动态更新

根据当前导航显示不同的页面标题:

```javascript
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
```

## 4. 边界情况处理

### 4.1 无效nav参数
- 如果URL中的nav参数不是预定义的4个值之一,忽略该参数,使用默认状态

### 4.2 nav与其他参数组合
- nav参数可以与categoryId、search等其他参数共存
- 例如: `/?nav=hot&categoryId=1` 表示在技术开发分类下查看热门项目

### 4.3 刷新页面
- 刷新页面时,根据URL中的nav参数恢复筛选状态
- 通过watch的immediate: true选项实现

### 4.4 浏览器前进/后退
- 由于使用了query参数,浏览器的前进/后退按钮会自动工作
- watch会监听到nav参数变化并更新筛选状态

## 5. 测试要点

### 5.1 功能测试
- [ ] 点击"发现项目"后,清除所有筛选,显示全部项目
- [ ] 点击"热门项目"后,只显示热门项目,按热度排序
- [ ] 点击"最新项目"后,只显示最新项目,按时间排序
- [ ] 点击"即将截止"后,只显示未来7天内截止的项目
- [ ] 刷新页面后,筛选状态保持不变
- [ ] 浏览器前进/后退正常工作

### 5.2 UI测试
- [ ] 侧边栏导航项正确高亮当前选中的项
- [ ] 页面筛选标签正确高亮(如果有对应标签)
- [ ] 页面标题和副标题根据导航动态更新
- [ ] 项目列表正确显示筛选结果

### 5.3 API测试
- [ ] 后端正确接收filter='deadline'参数
- [ ] 返回的项目确实是在未来7天内截止的
- [ ] 项目按end_date升序排列
- [ ] 没有截止日期的项目不出现在结果中

## 6. 后续优化建议

1. **即将截止的时间范围可配置**: 可以考虑让用户自定义时间范围(7天/14天/30天)
2. **添加截止日期徽章**: 在项目卡片上显示距离截止还有多少天
3. **空状态提示**: 当"即将截止"没有项目时,显示友好的提示信息
4. **性能优化**: 如果项目数量很大,考虑为end_date字段添加数据库索引
