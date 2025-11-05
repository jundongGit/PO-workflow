@echo off
chcp 65001 >nul
REM 自动更新脚本 - PO Workflow
REM 从 GitHub 下载并安装最新版本

echo ================================================
echo PO Workflow 自动更新工具
echo ================================================
echo.

REM 检查 PowerShell 是否可用
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 PowerShell
    echo 此更新脚本需要 PowerShell 支持
    pause
    exit /b 1
)

REM 获取 GitHub 仓库信息
set GITHUB_REPO=jundongGit/PO-workflow
set TEMP_DIR=%TEMP%\po-workflow-update

echo 📡 正在检查最新版本...
echo.

REM 使用 PowerShell 获取最新版本信息
powershell -Command "$ErrorActionPreference='Stop'; try { $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/%GITHUB_REPO%/releases/latest'; Write-Host '最新版本:' $release.tag_name; Write-Host '发布日期:' $release.published_at; Write-Host ''; Write-Host '更新内容:'; Write-Host $release.body; $release.zipball_url | Out-File -FilePath '%TEMP%\po-update-url.txt' -Encoding ASCII } catch { Write-Host '❌ 无法获取更新信息'; Write-Host $_.Exception.Message; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 无法检查更新，可能的原因:
    echo   1. 无网络连接
    echo   2. GitHub 仓库不存在或设置为私有
    echo   3. GitHub API 访问限制
    echo.
    pause
    exit /b 1
)

echo.
set /p CONFIRM="是否继续更新? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 取消更新
    pause
    exit /b 0
)

echo.
echo 📦 正在准备更新...

REM 创建临时目录
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

REM 备份重要数据
echo 💾 正在备份用户数据...
set BACKUP_DIR=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

if exist data (
    xcopy /E /I /Y data "%BACKUP_DIR%\data" >nul
    echo ✓ 数据已备份到: %BACKUP_DIR%
)
if exist settings.json (
    copy settings.json "%BACKUP_DIR%\settings.json" >nul
)
if exist metadata.json (
    copy metadata.json "%BACKUP_DIR%\metadata.json" >nul
)
if exist server\.env (
    copy server\.env "%BACKUP_DIR%\.env" >nul
)

echo.
echo 📥 正在下载最新版本...

REM 读取下载 URL
set /p DOWNLOAD_URL=<"%TEMP%\po-update-url.txt"

REM 下载更新包
powershell -Command "$ErrorActionPreference='Stop'; try { $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%TEMP_DIR%\update.zip'; Write-Host '✓ 下载完成' } catch { Write-Host '❌ 下载失败:' $_.Exception.Message; exit 1 }"

if %errorlevel% neq 0 (
    echo 下载失败，更新已取消
    pause
    exit /b 1
)

echo.
echo 📂 正在解压更新包...

REM 解压更新包
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\update.zip' -DestinationPath '%TEMP_DIR%' -Force"

REM 查找解压后的目录（GitHub 压缩包会有一个以仓库名-提交hash命名的目录）
for /d %%i in ("%TEMP_DIR%\*") do set UPDATE_SOURCE=%%i

echo.
echo 🔄 正在更新程序文件...

REM 停止正在运行的服务
echo 正在停止现有服务...
taskkill /F /IM node.exe >nul 2>&1

REM 等待进程完全关闭
timeout /t 2 /nobreak >nul

REM 更新文件（只更新代码，保留用户数据）
if exist "%UPDATE_SOURCE%\server" (
    echo 更新服务器文件...
    xcopy /E /I /Y "%UPDATE_SOURCE%\server" server >nul
)

if exist "%UPDATE_SOURCE%\client" (
    echo 更新客户端文件...
    xcopy /E /I /Y "%UPDATE_SOURCE%\client" client >nul
)

if exist "%UPDATE_SOURCE%\quick-start.bat" (
    echo 更新启动脚本...
    copy /Y "%UPDATE_SOURCE%\quick-start.bat" quick-start.bat >nul
)

if exist "%UPDATE_SOURCE%\VERSION.json" (
    echo 更新版本信息...
    copy /Y "%UPDATE_SOURCE%\VERSION.json" VERSION.json >nul
)

if exist "%UPDATE_SOURCE%\package.json" (
    copy /Y "%UPDATE_SOURCE%\package.json" package.json >nul
)

REM 恢复用户配置
if exist "%BACKUP_DIR%\.env" (
    copy /Y "%BACKUP_DIR%\.env" server\.env >nul
)

echo.
echo 📦 正在更新依赖包...
cd server
call npm install --silent
cd ..

echo.
echo 🧹 正在清理临时文件...
rmdir /s /q "%TEMP_DIR%"
del "%TEMP%\po-update-url.txt"

echo.
echo ================================================
echo ✅ 更新完成！
echo ================================================
echo.
echo 备份位置: %BACKUP_DIR%
echo.
echo 按任意键启动应用...
pause >nul

call quick-start.bat
