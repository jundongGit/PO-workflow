@echo off
title Invoice Automation - 安装向导
color 0A
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Invoice Automation Chrome 扩展安装
echo ========================================
echo.

:: 检查Chrome是否安装
echo [1/4] 检测Chrome浏览器...
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Chrome浏览器
    echo 请先安装Chrome浏览器后再运行此脚本
    echo.
    pause
    exit /b 1
)
echo [✓] Chrome浏览器已安装
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "EXTENSION_DIR=%SCRIPT_DIR%extension"

:: 检查扩展文件夹是否存在
echo [2/4] 检查扩展文件...
if not exist "%EXTENSION_DIR%" (
    echo [错误] 找不到扩展文件夹: %EXTENSION_DIR%
    echo 请确保extension文件夹与安装脚本在同一目录
    echo.
    pause
    exit /b 1
)
echo [✓] 扩展文件完整
echo.

:: 复制到桌面（方便拖拽安装）
echo [3/4] 准备安装文件...
set "DESKTOP=%USERPROFILE%\Desktop"
set "DESKTOP_EXT=%DESKTOP%\InvoiceAutomation-Extension"

:: 清理旧文件
if exist "%DESKTOP_EXT%" (
    rmdir /s /q "%DESKTOP_EXT%" 2>nul
)

:: 复制扩展文件夹到桌面
xcopy "%EXTENSION_DIR%" "%DESKTOP_EXT%\" /E /I /H /Y >nul
if %errorlevel% neq 0 (
    echo [错误] 复制文件失败
    pause
    exit /b 1
)
echo [✓] 文件已准备完成
echo.

:: 打开Chrome扩展页面
echo [4/4] 打开Chrome扩展页面...
start chrome://extensions/
timeout /t 2 >nul
echo [✓] Chrome扩展页面已打开
echo.

echo ========================================
echo   请按以下步骤完成安装:
echo ========================================
echo.
echo 1. 在打开的Chrome页面中，开启右上角的"开发者模式"
echo.
echo 2. 点击页面左上角的"加载已解压的扩展程序"按钮
echo.
echo 3. 选择桌面上的文件夹:
echo    %DESKTOP_EXT%
echo.
echo 4. 点击"选择文件夹"按钮
echo.
echo 5. 安装完成后，您会在Chrome工具栏看到扩展图标
echo.
echo ----------------------------------------
echo   提示: 安装完成后可以删除桌面文件夹
echo ----------------------------------------
echo.
pause
