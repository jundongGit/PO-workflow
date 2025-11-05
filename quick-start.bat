@echo off
chcp 65001 >nul
REM Invoice Automation 快速启动脚本 (Windows 批处理)
REM 使用方法: 双击运行此文件

echo ==================================
echo Invoice Automation v1.1.0 启动脚本
echo ==================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 显示版本信息
for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ Node.js 版本: %NODE_VERSION%
echo ✓ npm 版本: %NPM_VERSION%
echo.

REM 检查是否首次运行
if not exist "server\node_modules" goto install_deps
if not exist "client\node_modules" goto install_deps
goto check_env

:install_deps
echo 检测到首次运行，正在安装依赖...
echo.

REM 安装服务器依赖
echo 📦 安装服务器依赖...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ 服务器依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

REM 安装客户端依赖
echo.
echo 📦 安装客户端依赖...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ 客户端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ✓ 依赖安装完成!
echo.

:check_env
REM 检查 .env 文件
if not exist "server\.env" (
    echo ⚠️  警告: 未找到 server\.env 文件
    if exist "server\.env.example" (
        echo 正在从 .env.example 创建 .env 文件...
        copy "server\.env.example" "server\.env" >nul
        echo ✓ .env 文件已创建，请编辑 server\.env 配置您的 API 密钥
        echo.
    ) else (
        echo 请手动创建 server\.env 文件并配置必要的环境变量
        echo.
    )
)

REM 检查 Playwright 浏览器是否安装
set PLAYWRIGHT_PATH=%LOCALAPPDATA%\ms-playwright
if not exist "%PLAYWRIGHT_PATH%\chromium-*" (
    echo 🌐 检测到 Playwright 浏览器未安装
    echo 正在安装 Chromium 浏览器（约需 1-3 分钟，下载约 150MB）...
    echo.
    cd server
    call npx playwright install chromium
    if %errorlevel% neq 0 (
        echo ❌ Playwright 浏览器安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo.
    echo ✓ Playwright 浏览器安装完成!
    echo.
) else (
    echo ✓ Playwright 浏览器已安装
    echo.
)

REM 检查并释放端口 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo ⚠️  端口 3000 已被占用，正在尝试释放 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM 检查并释放端口 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo ⚠️  端口 3001 已被占用，正在尝试释放 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo 🚀 启动应用...
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 按 Ctrl+C 停止应用
echo ==================================
echo.

REM 启动后端服务（在新窗口中）
start "Invoice Automation - Backend" cmd /k "cd server && node src/index.js"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务（在新窗口中）
echo 前端已编译为静态文件，通过浏览器访问 http://localhost:3001

echo.
echo ✓ 服务启动完成!
echo.
echo 📱 应用访问地址: http://localhost:3000
echo.
echo 前端和后端服务已在独立窗口中启动
echo 关闭对应窗口即可停止服务
echo.
pause
