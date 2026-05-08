# Docker Desktop 启动和镜像构建指南

## ⚠️ 当前问题

Docker Desktop 服务未运行,无法构建镜像。

**错误信息:**
- Docker Desktop is unable to start
- WSL service cannot start (错误代码: Wsl/0x80070422)

---

## 🔧 解决方案

### 方案一: 手动启动 Docker Desktop (推荐)

#### 步骤1: 以管理员身份启动必要的服务

1. **按 `Win + X`,选择 "Windows PowerShell (管理员)" 或 "终端(管理员)"**

2. **启动 LxssManager 服务:**
   ```powershell
   Start-Service LxssManager
   ```

3. **启动 Docker Desktop:**
   - 在开始菜单中找到 "Docker Desktop"
   - 右键点击 → "以管理员身份运行"

4. **等待 Docker Desktop 完全启动**
   - 系统托盘会出现 Docker 图标
   - 图标从动画变为静止表示启动完成
   - 通常需要 1-2 分钟

5. **验证 Docker 是否运行:**
   ```powershell
   docker --version
   docker info
   ```

#### 步骤2: 构建镜像

Docker 启动成功后,执行:

```powershell
cd "d:\treai项目\co-creation"
docker build -t esdkaiyuan/co-creation:latest .
```

---

### 方案二: 启用 WSL2 (如果方案一无效)

如果 WSL 服务无法启动,可能需要重新启用 WSL2:

#### 步骤1: 以管理员身份打开 PowerShell

#### 步骤2: 启用 WSL 功能

```powershell
# 启用 WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 启用虚拟机平台
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重启计算机
Restart-Computer
```

#### 步骤3: 设置 WSL2 为默认版本

重启后,以管理员身份打开 PowerShell:

```powershell
# 下载并安装 WSL2 内核更新包
# 访问: https://aka.ms/wsl2kernel

# 设置 WSL2 为默认
wsl --set-default-version 2

# 验证
wsl --list --verbose
```

#### 步骤4: 启动 Docker Desktop

---

### 方案三: 使用 Docker Toolbox (备选方案)

如果 Docker Desktop 无法在您的系统上运行,可以考虑:

1. **卸载 Docker Desktop**
2. **安装 Docker Toolbox** (适用于旧版 Windows)
   - 下载地址: https://github.com/docker/toolbox/releases
3. **使用 Docker Machine 创建虚拟机**

**注意:** 不推荐此方案,因为 Docker Toolbox 已过时。

---

## 📋 检查清单

在构建镜像前,请确保:

- [ ] Docker Desktop 已安装
- [ ] WSL2 已启用并设置为默认版本
- [ ] Docker Desktop 正在运行(系统托盘有图标)
- [ ] 可以执行 `docker info`  without errors
- [ ] 有足够的磁盘空间(至少 5GB)
- [ ] 网络连接正常(用于拉取基础镜像)

---

## 🚀 快速启动脚本

创建一个 PowerShell 脚本 `start-docker-and-build.ps1`:

```powershell
# start-docker-and-build.ps1
# 用法: .\start-docker-and-build.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Docker 启动和镜像构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
Write-Host "检查 Docker 状态..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker 已在运行" -ForegroundColor Green
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "⚠️  Docker 未运行,正在启动..." -ForegroundColor Yellow
    
    # 启动 LxssManager 服务
    Write-Host "启动 LxssManager 服务..." -ForegroundColor Yellow
    try {
        Start-Service LxssManager -ErrorAction Stop
        Write-Host "✅ LxssManager 服务已启动" -ForegroundColor Green
    } catch {
        Write-Host "❌ 无法启动 LxssManager 服务" -ForegroundColor Red
        Write-Host "请以管理员身份运行此脚本" -ForegroundColor Red
        exit 1
    }
    
    # 启动 Docker Desktop
    Write-Host "启动 Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    # 等待 Docker 启动
    Write-Host "等待 Docker Desktop 启动(最多2分钟)..." -ForegroundColor Yellow
    $maxWait = 120
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 5
        $waited += 5
        Write-Host "." -NoNewline
        
        try {
            docker info | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Docker Desktop 已启动! (耗时: ${waited}秒)" -ForegroundColor Green
                break
            }
        } catch {
            continue
        }
    }
    
    if ($waited -ge $maxWait) {
        Write-Host ""
        Write-Host "❌ Docker Desktop 启动超时" -ForegroundColor Red
        Write-Host "请手动启动 Docker Desktop 后再试" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  开始构建 Docker 镜像" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 进入项目目录
Set-Location "d:\treai项目\co-creation"

# 构建镜像
Write-Host "📦 构建镜像: esdkaiyuan/co-creation:latest" -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
docker build -t esdkaiyuan/co-creation:latest .

if ($LASTEXITCODE -eq 0) {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ 镜像构建成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏱️  构建耗时: ${duration}秒" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 镜像信息:" -ForegroundColor Cyan
    docker images esdkaiyuan/co-creation:latest
    Write-Host ""
    Write-Host "🚀 下一步:" -ForegroundColor Cyan
    Write-Host "   1. 测试镜像: docker run -p 3000:3000 esdkaiyuan/co-creation:latest"
    Write-Host "   2. 推送镜像: docker push esdkaiyuan/co-creation:latest"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 镜像构建失败" -ForegroundColor Red
    Write-Host "请检查上面的错误信息" -ForegroundColor Red
    exit 1
}
```

**使用方法:**

1. **以管理员身份打开 PowerShell**
2. **执行脚本:**
   ```powershell
   cd "d:\treai项目\co-creation"
   .\start-docker-and-build.ps1
   ```

---

## 🐛 常见问题

### Q1: Docker Desktop 启动后一直显示 "Docker Desktop is starting"

**解决方案:**
1. 重启计算机
2. 确保 BIOS 中启用了虚拟化技术(VT-x/AMD-V)
3. 检查是否有其他虚拟化软件冲突(如 VMware, VirtualBox)

### Q2: WSL2 安装失败

**解决方案:**
1. 确保 Windows 版本 >= 1903 (内部版本 18362)
2. 启用 Windows 功能:
   - 控制面板 → 程序和功能 → 启用或关闭 Windows 功能
   - 勾选 "适用于 Linux 的 Windows 子系统"
   - 勾选 "虚拟机平台"
3. 重启计算机

### Q3: 磁盘空间不足

**解决方案:**
```powershell
# 清理 Docker 缓存
docker system prune -a

# 清理 WSL
wsl --shutdown
# 然后删除未使用的发行版
```

### Q4: 网络问题导致拉取基础镜像失败

**解决方案:**
配置国内镜像加速器:

1. 右键点击系统托盘的 Docker 图标
2. 选择 "Settings" → "Docker Engine"
3. 添加镜像加速器:
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ]
   }
   ```
4. 点击 "Apply & Restart"

---

## 📞 技术支持

如果以上方案都无法解决问题,请提供以下信息:

1. **Windows 版本:**
   ```powershell
   winver
   ```

2. **Docker Desktop 版本:**
   ```powershell
   docker --version
   ```

3. **WSL 版本:**
   ```powershell
   wsl --list --verbose
   ```

4. **错误日志:**
   - Docker Desktop 日志位置: `%LOCALAPPDATA%\Docker`

---

**祝您顺利启动 Docker! 🚀**
