@echo off
setlocal EnableDelayedExpansion

REM Invoice Automation - One-Click Update Script (Windows)
REM Usage: Double-click update-extension-en.bat

set VERSION=1.4.3
set REPO=jundongGit/PO-workflow
set DOWNLOAD_URL=https://github.com/!REPO!/releases/download/v!VERSION!/InvoiceAutomation-ChromeExtension-v!VERSION!.zip
set INSTALL_DIR=%LOCALAPPDATA%\ChromeExtensions\InvoiceAutomation

echo.
echo ============================================
echo   Invoice Automation - One-Click Update
echo   Version: v!VERSION!
echo ============================================
echo.

REM Check curl (built-in Windows 10 1803+)
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Error: curl command required
    echo     Windows 10 1803+ includes curl
    echo     Or download: https://curl.se/windows/
    pause
    exit /b 1
)

REM Check tar (built-in Windows 10+)
where tar >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Error: tar command required
    echo     Windows 10+ includes tar
    pause
    exit /b 1
)

REM Step 1: Download
echo [1/5] Downloading v!VERSION!...
curl -L -f -o "%TEMP%\invoice-automation.zip" "!DOWNLOAD_URL!" 2>nul
if %errorlevel% neq 0 (
    echo [X] Download failed
    echo     Please check network or download manually:
    echo     !DOWNLOAD_URL!
    pause
    exit /b 1
)
echo [OK] Download complete

REM Step 2: Clean old version
echo.
echo [2/5] Cleaning old version...
if exist "!INSTALL_DIR!" (
    rd /s /q "!INSTALL_DIR!" 2>nul
    echo [OK] Old version removed
) else (
    echo [OK] First time installation
)

REM Step 3: Extract
echo.
echo [3/5] Extracting files...
mkdir "!INSTALL_DIR!" 2>nul
mkdir "%TEMP%\invoice-automation-tmp" 2>nul

tar -xf "%TEMP%\invoice-automation.zip" -C "%TEMP%\invoice-automation-tmp" 2>nul
if %errorlevel% neq 0 (
    echo [X] Extraction failed
    pause
    exit /b 1
)

REM Copy extension folder contents
if exist "%TEMP%\invoice-automation-tmp\InvoiceAutomation-ChromeExtension-v!VERSION!\extension" (
    xcopy "%TEMP%\invoice-automation-tmp\InvoiceAutomation-ChromeExtension-v!VERSION!\extension" "!INSTALL_DIR!" /E /I /Y /Q >nul
    echo [OK] Extraction complete
) else (
    echo [X] File structure error
    pause
    exit /b 1
)

REM Clean temp files
rd /s /q "%TEMP%\invoice-automation-tmp" 2>nul
del /f /q "%TEMP%\invoice-automation.zip" 2>nul

REM Step 4: Verify
echo.
echo [4/5] Verifying installation...
if exist "!INSTALL_DIR!\manifest.json" (
    echo [OK] Verification successful
) else (
    echo [X] Verification failed: manifest.json not found
    pause
    exit /b 1
)

REM Step 5: Open Chrome extension management
echo.
echo [5/5] Opening Chrome extension management...
start chrome chrome://extensions/
if %errorlevel% equ 0 (
    echo [OK] Chrome extension page opened
) else (
    echo [!] Please open manually: chrome://extensions/
)

REM Copy path to clipboard
echo !INSTALL_DIR! | clip
echo [OK] Installation path copied to clipboard

REM Final instructions
echo.
echo ============================================
echo   Ready to complete installation!
echo ============================================
echo.
echo Please complete the following in Chrome:
echo.
echo    1. Enable "Developer mode" (top-right toggle)
echo.
echo    2. If old version is installed:
echo       - Find 'Invoice Automation for Procore'
echo       - Click 'Remove' button
echo       - NOTE: Your API Key will be preserved
echo.
echo    3. Click 'Load unpacked' button
echo.
echo    4. Paste the path (already copied to clipboard):
echo       !INSTALL_DIR!
echo.
echo       Press Ctrl+V to paste, then click 'Select Folder'
echo.
echo    5. Done!
echo.
echo ============================================
echo.
echo Installation complete! Updated to v!VERSION!
echo.
echo Need help? Visit:
echo https://github.com/!REPO!/issues
echo.
pause
