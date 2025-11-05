# Invoice Automation 快速启动脚本 (Windows PowerShell)
# 使用方法: 右键点击 -> "使用 PowerShell 运行" 或在 PowerShell 中执行 .\quick-start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Invoice Automation 启动脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: 未检测到 Node.js" -ForegroundColor Red
    Write-Host "请先安装 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm 版本: $npmVersion" -ForegroundColor Green
Write-Host ""

# 检查是否首次运行
$needInstall = $false
if (-not (Test-Path "server\node_modules")) {
    $needInstall = $true
}
if (-not (Test-Path "client\node_modules")) {
    $needInstall = $true
}

if ($needInstall) {
    Write-Host "检测到首次运行，正在安装依赖..." -ForegroundColor Yellow
    Write-Host ""

    # 安装服务器依赖
    Write-Host "📦 安装服务器依赖..." -ForegroundColor Cyan
    Set-Location server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 服务器依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Write-Host ""
        Write-Host "按任意键退出..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Set-Location ..

    # 安装客户端依赖
    Write-Host ""
    Write-Host "📦 安装客户端依赖..." -ForegroundColor Cyan
    Set-Location client
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 客户端依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Write-Host ""
        Write-Host "按任意键退出..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Set-Location ..

    Write-Host ""
    Write-Host "✓ 依赖安装完成!" -ForegroundColor Green
    Write-Host ""
}

# 检查 .env 文件
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  警告: 未找到 server\.env 文件" -ForegroundColor Yellow
    if (Test-Path "server\.env.example") {
        Write-Host "正在从 .env.example 创建 .env 文件..." -ForegroundColor Yellow
        Copy-Item "server\.env.example" "server\.env"
        Write-Host "✓ .env 文件已创建，请编辑 server\.env 配置您的 API 密钥" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "请手动创建 server\.env 文件并配置必要的环境变量" -ForegroundColor Red
        Write-Host ""
    }
}

# 检查 Playwright 浏览器是否安装
$playwrightPath = Join-Path $env:LOCALAPPDATA "ms-playwright"
$needPlaywright = $false

if (-not (Test-Path $playwrightPath)) {
    $needPlaywright = $true
} else {
    $chromiumPath = Join-Path $playwrightPath "chromium-*"
    $chromiumExists = Test-Path $chromiumPath
    if (-not $chromiumExists) {
        $needPlaywright = $true
    }
}

if ($needPlaywright) {
    Write-Host "🌐 检测到 Playwright 浏览器未安装" -ForegroundColor Yellow
    Write-Host "正在安装 Chromium 浏览器（约需 1-3 分钟，下载约 150MB）..." -ForegroundColor Yellow
    Write-Host ""
    Set-Location server
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Playwright 浏览器安装失败" -ForegroundColor Red
        Set-Location ..
        Write-Host ""
        Write-Host "按任意键退出..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Set-Location ..
    Write-Host ""
    Write-Host "✓ Playwright 浏览器安装完成!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✓ Playwright 浏览器已安装" -ForegroundColor Green
    Write-Host ""
}

# 检查并释放端口
function Stop-ProcessOnPort {
    param([int]$Port)

    $connections = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    if ($connections) {
        Write-Host "⚠️  端口 $Port 已被占用，正在尝试释放..." -ForegroundColor Yellow
        foreach ($connection in $connections) {
            $parts = $connection.ToString() -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            if ($pid -match '^\d+$') {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "  已释放端口 $Port (PID: $pid)" -ForegroundColor Green
                } catch {
                    Write-Host "  无法释放端口 $Port (PID: $pid)" -ForegroundColor Red
                }
            }
        }
    }
}

Stop-ProcessOnPort -Port 3000
Stop-ProcessOnPort -Port 3001

Write-Host ""
Write-Host "🚀 启动应用..." -ForegroundColor Cyan
Write-Host ""
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Green
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止应用" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 启动后端服务
Write-Host "启动后端服务..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location server
    node src/index.js
}

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "启动前端服务..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location client
    $env:BROWSER = "none"
    npm start
}

# 等待前端启动
Start-Sleep -Seconds 5

# 显示启动状态
Write-Host ""
Write-Host "✓ 服务启动完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 应用访问地址: http://localhost:3000" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host ""
Write-Host "监听日志输出中... (按 Ctrl+C 停止)" -ForegroundColor Yellow
Write-Host ""

# 监听作业输出
try {
    while ($true) {
        # 接收后端输出
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            Write-Host "[后端] $backendOutput" -ForegroundColor Magenta
        }

        # 接收前端输出
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            Write-Host "[前端] $frontendOutput" -ForegroundColor Cyan
        }

        # 检查作业是否还在运行
        if ($backendJob.State -ne 'Running' -or $frontendJob.State -ne 'Running') {
            Write-Host "⚠️ 检测到服务意外停止" -ForegroundColor Red
            break
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    # 清理作业
    Write-Host ""
    Write-Host "正在停止服务..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue

    # 再次尝试释放端口
    Stop-ProcessOnPort -Port 3000
    Stop-ProcessOnPort -Port 3001

    Write-Host "✓ 服务已停止" -ForegroundColor Green
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
