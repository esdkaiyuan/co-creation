<template>
  <div 
    class="avatar-initial"
    :style="{ backgroundColor: bgColor, width: size + 'px', height: size + 'px' }"
  >
    {{ initial }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  username: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 40
  }
})

// 根据用户名首字生成颜色
const bgColor = computed(() => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'
  ]
  const charCode = props.username.charCodeAt(0)
  return colors[charCode % colors.length]
})

// 获取用户名首字
const initial = computed(() => {
  return props.username ? props.username.charAt(0).toUpperCase() : '?'
})
</script>

<style scoped>
.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: v-bind('size * 0.5 + "px"');
  user-select: none;
}
</style>
