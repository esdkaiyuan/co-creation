import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCategories } from '@/api/category'
import { mockCategories } from '@/utils/mockData'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loading = ref(false)

  // 获取所有分类
  async function fetchCategories() {
    loading.value = true
    try {
      const res = await getCategories()
      // 将下划线命名转换为驼峰命名
      categories.value = res.data.map(cat => ({
        ...cat,
        projectCount: cat.project_count || 0
      }))
      return res
    } catch (error) {
      console.warn('获取分类失败，使用模拟数据', error)
      // 使用模拟数据
      categories.value = mockCategories.map(cat => ({
        ...cat,
        icon: cat.icon,
        projectCount: cat.projectCount || 0
      }))
      return { data: categories.value }
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    fetchCategories
  }
})
