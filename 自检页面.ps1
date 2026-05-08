# 页面问题自检脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   共创平台 - 页面自检工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查1: 前端服务
Write-Host "[检查 1/4] 前端服务状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 前端服务运行正常 (http://localhost:3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 前端服务无法访问" -ForegroundColor Red
    Write-Host "   请检查前端服务是否启动" -ForegroundColor Yellow
}

# 检查2: 后端服务
Write-Host ""
Write-Host "[检查 2/4] 后端服务状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 3
    $content = $response.Content | ConvertFrom-Json
    if ($content.code -eq 200) {
        Write-Host "✅ 后端服务运行正常 (http://localhost:5000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 后端服务无法访问" -ForegroundColor Red
    Write-Host "   请检查后端服务是否启动" -ForegroundColor Yellow
}

# 检查3: 数据库连接
Write-Host ""
Write-Host "[检查 3/4] 数据库连接状态..." -ForegroundColor Yellow
try {
    $result = & "C:\mysql-enterprise\bin\mysql.exe" -u co_creation_esdk -pGchzPPQ8sM6Rc2Xn co_creation_esdk -e "SELECT COUNT(*) as count FROM users;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库连接正常" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 数据库连接失败" -ForegroundColor Red
    Write-Host "   请检查MySQL服务是否启动" -ForegroundColor Yellow
}

# 检查4: 配置文件
Write-Host ""
Write-Host "[检查 4/4] 关键文件检查..." -ForegroundColor Yellow

$files = @(
    "index.html",
    "main.js",
    "App.vue",
    "vite.config.js",
    "server.cjs"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (缺失)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   自检完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allFilesExist) {
    Write-Host "📋 如果页面仍然是空白,请尝试:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 清除浏览器缓存并刷新页面 (Ctrl + Shift + R)" -ForegroundColor White
    Write-Host "2. 打开浏览器开发者工具 (F12) 查看控制台错误" -ForegroundColor White
    Write-Host "3. 检查 Console 面板是否有红色错误信息" -ForegroundColor White
    Write-Host "4. 检查 Network 面板是否有请求失败" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 提示: 如果看到 Vue 或 Element Plus 相关错误,请检查浏览器控制台的详细错误信息" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  发现缺失文件,请检查项目完整性" -ForegroundColor Red
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
