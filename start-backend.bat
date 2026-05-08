@echo off
chcp 65001 >nul
echo ========================================
echo    共创平台 - 一键启动脚本
echo ========================================
echo.

REM 检查 Node.js
echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装: 
node --version
echo.

REM 检查 MySQL
echo [2/4] 检查 MySQL 连接...
"C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL 连接失败，请检查:
    echo    1. MySQL 服务是否启动
    echo    2. 数据库 co_creation_esdk 是否存在
    echo    3. 用户 co_creation_esdk 密码是否正确
    pause
    exit /b 1
)
echo ✅ MySQL 连接成功
echo.

REM 安装后端依赖
echo [3/4] 安装后端依赖...
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

REM 启动后端服务
echo [4/4] 启动后端服务...
echo 🚀 后端服务将在 http://localhost:5000 启动
echo.
echo ========================================
echo    按 Ctrl+C 停止服务
echo ========================================
echo.

node server.cjs

pause
