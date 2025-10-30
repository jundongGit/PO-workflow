@echo off
title Invoice Automation - 一键自动安装
color 0A
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Invoice Automation Chrome 扩展
echo   一键自动安装程序
echo ============================================
echo.
echo 此程序将自动完成以下操作:
echo   1. 检测Chrome浏览器
echo   2. 复制扩展文件
echo   3. 配置API连接
echo   4. 打开安装页面
echo.
echo 按任意键开始安装...
pause >nul
cls

echo.
echo ============================================
echo   开始安装...
echo ============================================
echo.

:: 检查Chrome是否安装
echo [1/5] 检测Chrome浏览器...
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [×] 错误: 未检测到Chrome浏览器
    echo.
    echo 请先安装Chrome浏览器:
    echo 下载地址: https://www.google.com/chrome/
    echo.
    echo 安装Chrome后，请重新运行此程序
    echo.
    pause
    exit /b 1
)
echo [√] Chrome浏览器已安装
echo.

:: 获取脚本目录
set "SCRIPT_DIR=%~dp0"
set "EXTENSION_DIR=%SCRIPT_DIR%extension"

:: 检查扩展文件
echo [2/5] 检查扩展文件...
if not exist "%EXTENSION_DIR%" (
    echo [×] 错误: 找不到扩展文件夹
    echo 请确保extension文件夹与安装程序在同一目录
    pause
    exit /b 1
)
echo [√] 扩展文件完整
echo.

:: 创建用户目录
echo [3/5] 准备安装环境...
set "USER_EXT_DIR=%APPDATA%\InvoiceAutomation\Extension"

:: 清理旧版本
if exist "%USER_EXT_DIR%" (
    echo 检测到旧版本，正在更新...
    rmdir /s /q "%USER_EXT_DIR%" 2>nul
)

:: 创建目录
mkdir "%USER_EXT_DIR%" 2>nul

:: 复制扩展文件
xcopy "%EXTENSION_DIR%" "%USER_EXT_DIR%\" /E /I /H /Y >nul
if %errorlevel% neq 0 (
    echo [×] 错误: 复制文件失败
    pause
    exit /b 1
)
echo [√] 扩展文件已准备完成
echo.

:: 创建桌面快捷方式（指向安装说明）
echo [4/5] 创建桌面说明文件...
set "DESKTOP=%USERPROFILE%\Desktop"
set "HELP_FILE=%DESKTOP%\Invoice Automation - 完成安装.txt"

(
echo ============================================
echo   Invoice Automation Chrome 扩展
echo   最后一步: 加载扩展到Chrome
echo ============================================
echo.
echo Chrome扩展页面将自动打开
echo.
echo 请按照以下步骤完成安装:
echo.
echo 1. 在Chrome页面右上角，开启"开发者模式"
echo    ^(Developer mode^)
echo.
echo 2. 点击"加载已解压的扩展程序"
echo    ^(Load unpacked^)
echo.
echo 3. 在弹出的文件选择窗口中，粘贴以下路径:
echo.
echo    %USER_EXT_DIR%
echo.
echo 4. 点击"选择文件夹"
echo.
echo 5. 看到扩展图标出现在Chrome工具栏，安装完成！
echo.
echo ============================================
echo   如何使用:
echo ============================================
echo.
echo 1. 点击Chrome工具栏的扩展图标 📄
echo 2. 上传PDF发票
echo 3. 点击"开始自动化"
echo 4. 完成！
echo.
echo ============================================
echo   技术支持:
echo ============================================
echo.
echo 如有问题，请联系:
echo Email: support@your-company.com
echo 电话: xxx-xxxx-xxxx
echo.
echo ============================================
echo   注意:
echo ============================================
echo.
echo - 扩展已安装到: %USER_EXT_DIR%
echo - 可以删除此说明文件
echo - 卸载: 在chrome://extensions/页面移除扩展
echo.
) > "%HELP_FILE%"

echo [√] 桌面说明文件已创建
echo.

:: 打开Chrome扩展页面
echo [5/5] 打开Chrome扩展页面...
start chrome://extensions/
timeout /t 2 >nul

:: 打开说明文件
start notepad "%HELP_FILE%"

echo [√] 安装程序已完成！
echo.
echo ============================================
echo   安装成功！
echo ============================================
echo.
echo 请查看桌面上的说明文件完成最后步骤
echo.
echo 扩展安装位置:
echo %USER_EXT_DIR%
echo.
echo ============================================
echo.

timeout /t 10

:: 询问是否直接打开文件夹
echo 是否现在打开扩展文件夹? (Y/N)
set /p OPEN_FOLDER=
if /i "%OPEN_FOLDER%"=="Y" (
    explorer "%USER_EXT_DIR%"
)

echo.
echo 感谢使用 Invoice Automation！
echo.
pause
