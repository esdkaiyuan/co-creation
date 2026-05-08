@echo off
chcp 65001 >nul
REM Docker 镜像构建和推送脚本 (Windows版本)
REM 用法: build-and-push.bat [version]
REM 示例: build-and-push.bat v1.0.0

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=latest
set IMAGE_NAME=esdkaiyuan/co-creation

echo ==========================================
echo   Docker 镜像构建和推送工具
echo ==========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: Docker 未安装
    pause
    exit /b 1
)

echo ✅ Docker 已安装
echo.

REM 检查是否已登录 Docker Hub
docker info | findstr "Username" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告: 未登录 Docker Hub
    echo 请先执行: docker login
    set /p LOGIN="是否现在登录? (y/n): "
    if /i "!LOGIN!"=="y" (
        docker login
    ) else (
        echo ❌ 取消操作
        pause
        exit /b 1
    )
)

echo.
echo 📦 开始构建镜像...
echo    镜像名称: %IMAGE_NAME%:%VERSION%
echo.

REM 记录开始时间
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set START_TIME=%datetime%

REM 构建镜像
docker build -t %IMAGE_NAME%:%VERSION% .

if errorlevel 1 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)

REM 如果不是 latest,同时打 latest 标签
if not "%VERSION%"=="latest" (
    echo.
    echo 🏷️  添加 latest 标签...
    docker tag %IMAGE_NAME%:%VERSION% %IMAGE_NAME%:latest
)

echo.
echo ✅ 镜像构建完成!
echo.

REM 显示镜像信息
echo 📊 镜像信息:
docker images %IMAGE_NAME%:%VERSION%
echo.

REM 询问是否推送
set /p PUSH="是否推送到 Docker Hub? (y/n): "
if /i not "%PUSH%"=="y" (
    echo ⚠️  镜像已本地构建,但未推送
    echo 稍后可以手动推送: docker push %IMAGE_NAME%:%VERSION%
    pause
    exit /b 0
)

echo.
echo 📤 开始推送镜像...
echo.

REM 推送镜像
docker push %IMAGE_NAME%:%VERSION%

if not "%VERSION%"=="latest" (
    echo.
    echo 📤 推送 latest 标签...
    docker push %IMAGE_NAME%:latest
)

echo.
echo ==========================================
echo   ✅ 完成!
echo ==========================================
echo.
echo 📦 镜像已推送到 Docker Hub:
echo    https://hub.docker.com/r/%IMAGE_NAME%
echo.
echo 🏷️  可用标签:
echo    - %IMAGE_NAME%:%VERSION%
if not "%VERSION%"=="latest" (
    echo    - %IMAGE_NAME%:latest
)
echo.
echo 🚀 在服务器上部署:
echo    docker pull %IMAGE_NAME%:%VERSION%
echo    docker run -d --name co-creation -p 3000:3000 %IMAGE_NAME%:%VERSION%
echo.

pause
