<template>
  <div class="image-uploader">
    <el-upload
      class="image-uploader__component"
      action=""
      :auto-upload="false"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-change="handleFileChange"
      accept="image/jpeg,image/png,image/jpg"
    >
      <div v-if="imageUrl" class="image-preview">
        <img :src="imageUrl" class="preview-image" />
        <div class="image-overlay">
          <el-icon><ZoomIn /></el-icon>
          <span>点击更换</span>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">点击上传封面图片</div>
        <div class="upload-hint">支持jpg/png格式,最大2MB</div>
      </div>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn } from '@element-plus/icons-vue'
import { uploadImage } from '@/api/upload'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const imageUrl = ref(props.modelValue)
const uploading = ref(false)

watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal
})

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

const handleFileChange = async (file) => {
  if (!beforeUpload(file.raw)) return
  
  if (uploading.value) return
  uploading.value = true
  
  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
  
  try {
    // 上传到服务器
    const res = await uploadImage(file.raw)
    imageUrl.value = res.data.url
    emit('update:modelValue', res.data.url)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败,请重试')
    imageUrl.value = props.modelValue
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-uploader__component {
    width: 100%;
  }
  
  .upload-placeholder {
    width: 100%;
    height: 200px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
    }
    
    .upload-icon {
      font-size: 48px;
      color: #8c939d;
      margin-bottom: 12px;
    }
    
    .upload-text {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }
    
    .upload-hint {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .image-preview {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      color: white;
      
      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }
    
    &:hover .image-overlay {
      opacity: 1;
    }
  }
}
</style>
