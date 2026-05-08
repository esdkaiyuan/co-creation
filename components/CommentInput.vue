<template>
  <div class="comment-input">
    <el-input
      v-model="content"
      type="textarea"
      :placeholder="placeholder"
      :rows="3"
      maxlength="1000"
      show-word-limit
      :disabled="loading"
    />
    <div class="input-actions">
      <span class="tip">支持@提及他人</span>
      <div class="buttons">
        <el-button @click="handleCancel" v-if="showCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="loading"
          :disabled="!content.trim()"
        >
          {{ buttonText }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '写下你的评论...'
  },
  buttonText: {
    type: String,
    default: '发表评论'
  },
  showCancel: {
    type: Boolean,
    default: false
  },
  initialValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'cancel'])

const content = ref(props.initialValue)
const loading = ref(false)

watch(() => props.initialValue, (val) => {
  content.value = val
})

const handleSubmit = async () => {
  if (!content.value.trim()) return
  
  loading.value = true
  try {
    await emit('submit', content.value)
    content.value = ''
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  content.value = ''
  emit('cancel')
}
</script>

<style scoped>
.comment-input {
  margin-bottom: 20px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tip {
  font-size: 12px;
  color: #909399;
}

.buttons {
  display: flex;
  gap: 10px;
}
</style>
