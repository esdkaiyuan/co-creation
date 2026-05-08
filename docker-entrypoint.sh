#!/bin/sh
set -e

echo "🚀 启动共创平台应用..."

# 检查必要的环境变量
if [ -z "$DB_HOST" ]; then
    echo "❌ 错误: DB_HOST环境变量未设置"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ 错误: DB_PASSWORD环境变量未设置"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  警告: JWT_SECRET未设置,使用默认值(生产环境请修改!)"
    export JWT_SECRET="your-secret-key-change-in-production"
fi

# 设置默认端口
export PORT=${PORT:-3000}

echo "✅ 数据库主机: $DB_HOST"
echo "✅ 数据库名称: ${DB_NAME:-co_creation_esdk}"
echo "✅ 应用端口: $PORT"
echo ""

# 执行传入的命令
exec "$@"
