@echo off
chcp 65001 >nul
echo ========================================
echo    共创平台前端 - 启动脚本
echo ========================================
echo.

REM 检查 Node.js
echo [1/2] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 已安装: 
node --version
echo.

REM 安装前端依赖
echo [2/2] 安装前端依赖...
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)
echo.

REM 启动前端服务
echo 🚀 启动前端开发服务器...
echo 📡 前端地址: http://localhost:3000
echo 🔄 API 代理: http://localhost:5000
echo.
echo ========================================
echo    按 Ctrl+C 停止服务
echo ========================================
echo.

npm run dev

pause
