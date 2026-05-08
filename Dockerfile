# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖(如果需要)
RUN apk add --no-cache python3 make g++

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 创建uploads目录并设置权限
RUN mkdir -p uploads && chmod -R 755 uploads

# 暴露端口
EXPOSE 3000

# 添加启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动应用
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.cjs"]
