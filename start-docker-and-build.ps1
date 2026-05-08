# start-docker-and-build.ps1
# Docker 启动和镜像构建脚本
# 用法: .\start-docker-and-build.ps1
# 注意: 需要以管理员身份运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Docker 启动和镜像构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  警告: 未以管理员身份运行" -ForegroundColor Yellow
    Write-Host "某些操作可能需要管理员权限" -ForegroundColor Yellow
    Write-Host ""
}

# 检查 Docker 是否运行
Write-Host "🔍 检查 Docker 状态..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker 已在运行" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "⚠️  Docker 未运行,正在启动..." -ForegroundColor Yellow
    Write-Host ""
    
    # 启动 LxssManager 服务
    Write-Host "📌 步骤1: 启动 LxssManager 服务..." -ForegroundColor Cyan
    try {
        Start-Service LxssManager -ErrorAction Stop
        Write-Host "   ✅ LxssManager 服务已启动" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  无法自动启动 LxssManager 服务" -ForegroundColor Yellow
        Write-Host "   请手动执行: Start-Service LxssManager (需要管理员权限)" -ForegroundColor Yellow
    }
    
    # 启动 Docker Desktop
    Write-Host ""
    Write-Host "📌 步骤2: 启动 Docker Desktop..." -ForegroundColor Cyan
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "   ✅ Docker Desktop 已启动" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 未找到 Docker Desktop" -ForegroundColor Red
        Write-Host "   请确保已安装 Docker Desktop" -ForegroundColor Red
        exit 1
    }
    
    # 等待 Docker 启动
    Write-Host ""
    Write-Host "📌 步骤3: 等待 Docker Desktop 完全启动(最多2分钟)..." -ForegroundColor Cyan
    $maxWait = 120
    $waited = 0
    $checkInterval = 5
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds $checkInterval
        $waited += $checkInterval
        
        # 显示进度
        $progress = [math]::Min(($waited / $maxWait * 100), 100)
        $bars = [math]::Floor($progress / 5)
        $progressBar = "[" + ("█" * $bars) + ("░" * (20 - $bars)) + "]"
        Write-Host "`r   进度: $progressBar ${progress}% (${waited}s/${maxWait}s)" -NoNewline -ForegroundColor Yellow
        
        try {
            docker info | Out-Null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "   ✅ Docker Desktop 已启动! (耗时: ${waited}秒)" -ForegroundColor Green
                break
            }
        } catch {
            continue
        }
    }
    
    Write-Host ""
    
    if ($waited -ge $maxWait) {
        Write-Host "   ❌ Docker Desktop 启动超时" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 建议:" -ForegroundColor Yellow
        Write-Host "   1. 手动启动 Docker Desktop 应用程序" -ForegroundColor Yellow
        Write-Host "   2. 等待系统托盘图标变为静止状态" -ForegroundColor Yellow
        Write-Host "   3. 然后重新运行此脚本" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  开始构建 Docker 镜像" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 进入项目目录
$projectDir = "d:\treai项目\co-creation"
Set-Location $projectDir

Write-Host "📂 项目目录: $projectDir" -ForegroundColor Cyan
Write-Host ""

# 显示构建信息
Write-Host "📦 镜像名称: esdkaiyuan/co-creation:latest" -ForegroundColor Cyan
Write-Host "🏗️  基础镜像: node:18-alpine" -ForegroundColor Cyan
Write-Host ""

# 询问是否继续
Write-Host "准备开始构建,这可能需要 3-5 分钟..." -ForegroundColor Yellow
$confirm = Read-Host "是否继续? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ 已取消" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔨 开始构建..." -ForegroundColor Green
Write-Host ""

# 记录开始时间
$startTime = Get-Date

# 构建镜像
docker build -t esdkaiyuan/co-creation:latest .

# 检查构建结果
if ($LASTEXITCODE -eq 0) {
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalSeconds, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ 镜像构建成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏱️  构建耗时: ${duration}秒" -ForegroundColor Cyan
    Write-Host ""
    
    # 显示镜像信息
    Write-Host "📊 镜像信息:" -ForegroundColor Cyan
    docker images esdkaiyuan/co-creation:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    Write-Host ""
    
    # 显示下一步操作
    Write-Host "🚀 下一步操作:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   1️⃣  测试镜像(本地运行):" -ForegroundColor Yellow
    Write-Host "      docker run -d --name co-creation-test -p 3000:3000 esdkaiyuan/co-creation:latest" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2️⃣  推送到 Docker Hub:" -ForegroundColor Yellow
    Write-Host "      docker login" -ForegroundColor Gray
    Write-Host "      docker push esdkaiyuan/co-creation:latest" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3️⃣  使用自动化脚本构建并推送:" -ForegroundColor Yellow
    Write-Host "      .\build-and-push.bat v1.0.0" -ForegroundColor Gray
    Write-Host ""
    
    # 询问是否立即推送
    Write-Host ""
    $pushConfirm = Read-Host "是否现在推送到 Docker Hub? (y/n)"
    if ($pushConfirm -eq 'y' -or $pushConfirm -eq 'Y') {
        Write-Host ""
        Write-Host "📤 推送到 Docker Hub..." -ForegroundColor Cyan
        Write-Host ""
        
        # 检查是否已登录
        try {
            docker info | Select-String "Username" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️  未登录 Docker Hub,请先登录:" -ForegroundColor Yellow
                docker login
            }
        } catch {
            Write-Host "⚠️  未登录 Docker Hub,请先登录:" -ForegroundColor Yellow
            docker login
        }
        
        # 推送镜像
        Write-Host ""
        Write-Host "📤 推送中..." -ForegroundColor Cyan
        docker push esdkaiyuan/co-creation:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ 推送成功!" -ForegroundColor Green
            Write-Host "   查看镜像: https://hub.docker.com/r/esdkaiyuan/co-creation" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "❌ 推送失败" -ForegroundColor Red
            Write-Host "   可以稍后手动推送: docker push esdkaiyuan/co-creation:latest" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ 镜像构建失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 请检查上面的错误信息" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "常见问题:" -ForegroundColor Yellow
    Write-Host "   1. Dockerfile 语法错误" -ForegroundColor Gray
    Write-Host "   2. 网络连接问题(无法拉取基础镜像)" -ForegroundColor Gray
    Write-Host "   3. 磁盘空间不足" -ForegroundColor Gray
    Write-Host "   4. 文件路径问题" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
