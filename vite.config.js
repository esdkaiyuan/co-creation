import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // 只代理具体的后端API路径,不使用通配符
      '/api/users': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api/projects': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api/categories': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api/health': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api/upload': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
