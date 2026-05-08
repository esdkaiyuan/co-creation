@echo off
chcp 65001 >nul
echo ========================================
echo    共创平台 - 一键完整启动
echo ========================================
echo.

REM 检查 Node.js
echo [步骤 1/5] 检查 Node.js...
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
echo [步骤 2/5] 检查 MySQL 连接...
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
echo [步骤 3/5] 安装后端依赖...
if not exist "node_modules" (
    echo 📦 正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 后端依赖安装完成
) else (
    echo ✅ 后端依赖已存在
)
echo.

REM 启动后端服务(后台运行)
echo [步骤 4/5] 启动后端服务...
echo 🚀 后端服务将在 http://localhost:5000 启动
start "共创平台-后端服务" /MIN cmd /c "node server.cjs"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务已启动
echo.

REM 启动前端服务
echo [步骤 5/5] 启动前端服务...
echo 📡 前端地址: http://localhost:3000
echo 🔄 API 代理: http://localhost:5000
echo.
echo ========================================
echo    🎉 启动完成!
echo    后端: http://localhost:5000
echo    前端: http://localhost:3000
echo    按任意键打开浏览器...
echo ========================================
echo.
pause >nul

REM 打开浏览器
start http://localhost:3000

echo.
echo ✅ 浏览器已打开
echo.
echo 提示: 
echo - 后端服务在后台窗口运行
echo - 前端服务在当前窗口运行
echo - 按 Ctrl+C 可停止前端服务
echo - 关闭后端窗口可停止后端服务
echo.

npm run dev

pause
