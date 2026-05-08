# 侧边栏导航筛选功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为首页左侧边栏的4个导航项(发现项目/热门项目/最新项目/即将截止)实现快捷筛选入口功能,采用筛选标签模式,点击后改变首页的项目筛选条件。

**Architecture:** 采用混合URL策略,侧边栏导航通过Vue Router的query参数传递nav值,HomeView监听路由变化并更新筛选状态,Sidebar组件添加导航点击事件处理,后端API支持filter='deadline'筛选未来7天内截止的项目。

**Tech Stack:** Vue 3 Composition API, Vue Router, Pinia, Element Plus, Node.js + Express, MySQL

---

## 文件结构概览

### 需要修改的文件:

1. **server.cjs** - 后端API
   - 在`GET /api/projects`接口中添加filter='deadline'的SQL逻辑
   
2. **components/Sidebar.vue** - 侧边栏组件
   - 导入useRouter
   - 添加handleNavClick方法处理导航点击
   - 模板中绑定@click事件到导航项
   
3. **views/HomeView.vue** - 首页组件
   - 导入watch用于监听路由变化
   - 添加handleNavChange方法处理nav参数
   - 添加pageTitle和pageSubtitle计算属性动态更新标题
   - watch监听route.query.nav变化
   
4. **store/modules/project.js** - 无需修改
   - 已有的fetchProjects方法已支持任意filter参数

### 文件职责:
- **server.cjs**: 提供带deadline筛选的项目数据
- **Sidebar.vue**: 捕获用户点击,跳转到带query参数的首页URL
- **HomeView.vue**: 解析nav参数,更新筛选状态,加载对应数据
- **project.js store**: 传递filter参数到后端API

---

### Task 1: 后端API添加deadline筛选支持

**Files:**
- Modify: `server.cjs` (约第200-300行,GET /api/projects接口)

- [ ] **Step 1: 定位GET /api/projects接口的filter逻辑**

打开`server.cjs`,找到处理filter参数的代码段,应该在类似位置:

```javascript
if (params.filter === 'recommend') {
  // ...
} else if (params.filter === 'hot') {
  // ...
}
```

- [ ] **Step 2: 添加deadline筛选的SQL逻辑**

在上述filter判断之后添加:

```javascript
else if (params.filter === 'deadline') {
  // 查询未来7天内截止的项目
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
  whereClauses.push('p.end_date IS NOT NULL');
  whereClauses.push('p.end_date >= CURDATE()');
  whereClauses.push('p.end_date <= ?');
  queryParams.push(sevenDaysLater.toISOString().split('T')[0]);
  
  orderByClause = 'ORDER BY p.end_date ASC';
}
```

注意: 
- 使用`toISOString().split('T')[0]`获取YYYY-MM-DD格式日期
- 将日期作为参数化查询的一部分添加到queryParams数组
- 设置orderByClause按end_date升序排列

- [ ] **Step 3: 验证SQL构建逻辑**

确保whereClauses和queryParams被正确拼接到最终的SQL语句中,检查现有的SQL构建代码是否正确处理了新添加的条件。

- [ ] **Step 4: 重启后端服务**

```bash
# 停止当前后端进程(Ctrl+C或taskkill)
taskkill /F /IM node.exe
# 重新启动
cd "d:\treai项目\co-creation" && node server.cjs
```

预期输出:
```
✅ 数据库连接成功
🚀 后端服务已启动: http://localhost:5000
```

- [ ] **Step 5: 测试deadline API**

```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/projects?filter=deadline&page=1&pageSize=5" | Select-Object -ExpandProperty data | Select-Object -ExpandProperty projects | Format-Table id, title, end_date
```

预期结果:
- 返回的项目都有end_date字段
- end_date在今天到未来7天之间
- 按end_date升序排列

---

### Task 2: Sidebar组件添加导航点击处理

**Files:**
- Modify: `components/Sidebar.vue` (script部分约第71-164行)

- [ ] **Step 1: 确认useRouter已导入**

检查`components/Sidebar.vue`的import语句,应该已有:

```javascript
import { useRouter } from 'vue-router'
```

如果没有,添加它。

- [ ] **Step 2: 初始化router实例**

在script setup中找到const声明区域,添加:

```javascript
const router = useRouter()
```

应该在`const categoryStore = useCategoryStore()`附近。

- [ ] **Step 3: 修改handleNavClick方法**

找到现有的handleNavClick方法(约第148行),将其修改为:

```javascript
// 导航点击
const handleNavClick = (key) => {
  activeNav.value = key
  
  // 跳转到首页并带上nav参数
  router.push({ path: '/', query: { nav: key } })
}
```

原方法可能只是设置activeNav,现在需要添加router.push调用。

- [ ] **Step 4: 验证模板中的@click绑定**

检查模板部分(约第20-40行),确保导航项有@click绑定:

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

如果已经有@click绑定,确认它调用的是handleNavClick。

- [ ] **Step 5: 保存并等待Vite热更新**

保存文件后,Vite应该自动重新编译。检查终端输出是否有错误。

预期: 无编译错误

---

### Task 3: HomeView添加路由监听和nav处理

**Files:**
- Modify: `views/HomeView.vue` (script部分约第90-250行)

- [ ] **Step 1: 确认必要导入已存在**

检查import语句,确保有:

```javascript
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
```

如果没有watch或useRoute,添加它们。

- [ ] **Step 2: 初始化route实例**

在const声明区域添加:

```javascript
const route = useRoute()
```

应该在`const projectStore = useProjectStore()`附近。

- [ ] **Step 3: 添加handleNavChange方法**

在loadProjects函数之后(约第167行之后)添加:

```javascript
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
```

- [ ] **Step 4: 添加watch监听route.query.nav**

在onMounted之后(约第210行之后)添加:

```javascript
// 监听nav参数变化
watch(() => route.query.nav, (newNav) => {
  if (newNav) {
    handleNavChange(newNav)
  }
}, { immediate: true })
```

immediate: true确保组件挂载时立即执行一次,处理URL中已有的nav参数。

- [ ] **Step 5: 添加页面标题动态更新**

在currentSortLabel计算属性之后(约第147行之后)添加:

```javascript
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
```

- [ ] **Step 6: 更新模板中的标题绑定**

找到模板中的标题部分(约第16-20行),修改为:

```vue
<h1 class="page-title">
  {{ pageTitle }}
  <el-icon class="sparkle-icon"><Star /></el-icon>
</h1>
<p class="page-subtitle">{{ pageSubtitle }}</p>
```

原来可能是硬编码的文本,现在改为使用计算属性。

- [ ] **Step 7: 保存并等待Vite热更新**

保存文件,检查Vite编译是否成功。

预期: 无编译错误

---

### Task 4: 可选 - 在页面筛选标签中添加deadline选项

**Files:**
- Modify: `views/HomeView.vue` (约第119-124行,filterTabs定义)

这个任务是可选的,如果希望在页面上也显示"即将截止"标签。

- [ ] **Step 1: 修改filterTabs数组**

找到filterTabs定义:

```javascript
const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
  { key: 'hot', label: '热门' },
  { key: 'latest', label: '最新' }
]
```

修改为:

```javascript
const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
  { key: 'hot', label: '热门' },
  { key: 'latest', label: '最新' },
  { key: 'deadline', label: '即将截止' }
]
```

- [ ] **Step 2: 更新handleFilterChange方法**

确保handleFilterChange能正确处理'deadline':

```javascript
const handleFilterChange = (filter) => {
  activeFilter.value = filter
  if (filter === 'deadline') {
    // deadline不设置特定的sort,由后端默认排序
  }
  currentPage.value = 1
  loadProjects()
}
```

- [ ] **Step 3: 保存并验证**

保存文件,检查Vite编译。

---

### Task 5: 功能测试 - 基础导航功能

- [ ] **Step 1: 启动前后端服务**

确保MySQL、后端、前端都在运行:

```bash
# 终端1: MySQL (如果未运行)
C:\mysql-enterprise\bin\mysqld.exe --console

# 终端2: 后端
cd "d:\treai项目\co-creation" && node server.cjs

# 终端3: 前端
cd "d:\treai项目\co-creation" && npm run dev
```

- [ ] **Step 2: 访问首页**

打开浏览器访问 http://localhost:3000/

预期: 正常显示首页,侧边栏有4个导航项

- [ ] **Step 3: 点击"发现项目"**

点击侧边栏的"发现项目"导航项

预期:
- URL变为 `http://localhost:3000/?nav=discover`
- 页面标题显示"一起构想，一起创造"
- 显示所有项目,无分类筛选
- "全部"筛选标签高亮

- [ ] **Step 4: 点击"热门项目"**

点击侧边栏的"热门项目"导航项

预期:
- URL变为 `http://localhost:3000/?nav=hot`
- 页面标题显示"热门项目"
- 页面副标题显示"当前最受欢迎的项目"
- "热门"筛选标签高亮
- 只显示热门项目

- [ ] **Step 5: 点击"最新项目"**

点击侧边栏的"最新项目"导航项

预期:
- URL变为 `http://localhost:3000/?nav=latest`
- 页面标题显示"最新项目"
- 页面副标题显示"最新发布的项目"
- "最新"筛选标签高亮
- 只显示最新项目

- [ ] **Step 6: 点击"即将截止"**

点击侧边栏的"即将截止"导航项

预期:
- URL变为 `http://localhost:3000/?nav=deadline`
- 页面标题显示"即将截止"
- 页面副标题显示"即将截止参与的项目,抓紧时间!"
- 只显示有截止日期且在未来7天内的项目
- 项目按截止日期升序排列

---

### Task 6: 功能测试 - 刷新和浏览器历史

- [ ] **Step 1: 测试刷新保持状态**

1. 点击"热门项目"
2. 刷新页面(F5)

预期:
- URL仍然是 `/?nav=hot`
- 页面仍然显示热门项目
- "热门"标签仍然高亮

- [ ] **Step 2: 测试浏览器后退**

1. 依次点击: 发现项目 → 热门项目 → 最新项目
2. 点击浏览器后退按钮

预期:
- 回到"热门项目"状态
- URL变为 `/?nav=hot`
- 显示热门项目

- [ ] **Step 3: 测试浏览器前进**

在上一步基础上,点击浏览器前进按钮

预期:
- 回到"最新项目"状态
- URL变为 `/?nav=latest`
- 显示最新项目

- [ ] **Step 4: 测试直接访问带参数的URL**

在浏览器地址栏输入: `http://localhost:3000/?nav=deadline`

预期:
- 页面加载后直接显示即将截止的项目
- 标题显示"即将截止"

---

### Task 7: 功能测试 - 组合筛选

- [ ] **Step 1: 测试nav与分类组合**

1. 点击"热门项目"(URL: `/?nav=hot`)
2. 点击左侧边栏的"技术开发"分类

预期:
- URL变为 `/?nav=hot&categoryId=1`(假设技术开发的ID是1)
- 显示技术开发分类下的热门项目
- "热门"标签仍然高亮

- [ ] **Step 2: 测试nav与页面排序组合**

1. 点击"热门项目"(URL: `/?nav=hot`)
2. 点击页面上的"最多参与"排序下拉选项

预期:
- URL仍然是 `/?nav=hot`(页面排序不改变URL)
- 项目按参与人数排序,但仍然是热门项目的子集

- [ ] **Step 3: 测试从分类切换到nav**

1. 先点击"技术开发"分类
2. 再点击"最新项目"导航

预期:
- 清除分类筛选
- URL变为 `/?nav=latest`
- 显示所有分类的最新项目

---

### Task 8: 边界情况测试

- [ ] **Step 1: 测试无效nav参数**

在浏览器地址栏输入: `http://localhost:3000/?nav=invalid`

预期:
- 页面正常加载,使用默认状态
- 显示所有项目
- 标题显示"一起构想，一起创造"

- [ ] **Step 2: 测试没有截止日期的项目**

1. 点击"即将截止"
2. 检查返回的项目列表

预期:
- 所有项目都有end_date字段
- 没有end_date为null的项目

- [ ] **Step 3: 测试空结果**

如果数据库中没有未来7天内截止的项目:

预期:
- 显示空状态提示
- 不报错

- [ ] **Step 4: 测试截止日期边界**

检查返回的项目,end_date应该:
- >= 今天
- <= 今天+7天

可以通过查看项目卡片的截止日期来验证。

---

### Task 9: UI细节验证

- [ ] **Step 1: 验证侧边栏高亮**

依次点击4个导航项,观察:

预期:
- 当前选中的导航项有active样式(蓝色背景)
- 其他导航项无active样式

- [ ] **Step 2: 验证页面标签高亮**

点击"热门项目"和"最新项目",观察页面筛选标签:

预期:
- "热门"或"最新"标签高亮
- 其他标签不高亮

对于"即将截止",如果添加了该标签,也应该高亮;如果没有添加,则所有标签都不高亮。

- [ ] **Step 3: 验证标题动态更新**

依次点击4个导航项,观察页面标题和副标题:

预期:
- 标题和副标题根据导航项正确变化
- 文字内容与设计中定义的一致

- [ ] **Step 4: 验证项目卡片显示**

在不同导航状态下,检查项目卡片:

预期:
- 项目卡片正常显示
- 截止日期在项目卡片上正确显示(如果有end_date)

---

### Task 10: 性能检查和优化建议

- [ ] **Step 1: 检查数据库索引**

连接到MySQL,检查projects表的end_date字段是否有索引:

```sql
SHOW INDEX FROM projects WHERE Column_name = 'end_date';
```

如果没有索引,建议添加:

```sql
ALTER TABLE projects ADD INDEX idx_end_date (end_date);
```

- [ ] **Step 2: 检查API响应时间**

在浏览器开发者工具的Network面板中,观察 `/api/projects?filter=deadline` 的响应时间

预期:
- 响应时间在合理范围内(<500ms)
- 如果较慢,考虑优化SQL查询或添加索引

- [ ] **Step 3: 记录后续优化建议**

在设计文档中记录的优化建议:
1. 即将截止的时间范围可配置(7天/14天/30天)
2. 在项目卡片上显示距离截止还有多少天的徽章
3. 当"即将截止"没有项目时,显示友好的空状态提示
4. 为end_date字段添加数据库索引(如果还没有)

---

## 完成标准

所有Task的checkbox都标记为完成([x]),并且:
- ✅ 后端API支持filter='deadline'
- ✅ 侧边栏导航可以点击并改变URL
- ✅ HomeView正确监听nav参数并更新筛选状态
- ✅ 页面标题动态更新
- ✅ 刷新页面保持筛选状态
- ✅ 浏览器前进/后退正常工作
- ✅ 所有测试通过
