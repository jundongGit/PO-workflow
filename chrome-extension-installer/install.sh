#!/bin/bash

# Invoice Automation Chrome Extension Installer for Mac/Linux

echo ""
echo "========================================"
echo "  Invoice Automation Chrome 扩展安装"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTENSION_DIR="$SCRIPT_DIR/extension"

# Check if Chrome is installed
echo "[1/4] 检测Chrome浏览器..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [ ! -d "/Applications/Google Chrome.app" ]; then
        echo "[错误] 未检测到Chrome浏览器"
        echo "请先安装Chrome浏览器后再运行此脚本"
        exit 1
    fi
    CHROME_CMD="open -a 'Google Chrome'"
else
    # Linux
    if ! command -v google-chrome &> /dev/null; then
        echo "[错误] 未检测到Chrome浏览器"
        echo "请先安装Chrome浏览器后再运行此脚本"
        exit 1
    fi
    CHROME_CMD="google-chrome"
fi
echo "[✓] Chrome浏览器已安装"
echo ""

# Check extension directory
echo "[2/4] 检查扩展文件..."
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "[错误] 找不到扩展文件夹: $EXTENSION_DIR"
    echo "请确保extension文件夹与安装脚本在同一目录"
    exit 1
fi
echo "[✓] 扩展文件完整"
echo ""

# Copy to Desktop
echo "[3/4] 准备安装文件..."
DESKTOP="$HOME/Desktop"
DESKTOP_EXT="$DESKTOP/InvoiceAutomation-Extension"

# Clean old files
if [ -d "$DESKTOP_EXT" ]; then
    rm -rf "$DESKTOP_EXT"
fi

# Copy extension
cp -R "$EXTENSION_DIR" "$DESKTOP_EXT"
if [ $? -ne 0 ]; then
    echo "[错误] 复制文件失败"
    exit 1
fi
echo "[✓] 文件已准备完成"
echo ""

# Open Chrome extensions page
echo "[4/4] 打开Chrome扩展页面..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Google Chrome" "chrome://extensions/"
else
    $CHROME_CMD "chrome://extensions/" &
fi
sleep 2
echo "[✓] Chrome扩展页面已打开"
echo ""

echo "========================================"
echo "  请按以下步骤完成安装:"
echo "========================================"
echo ""
echo "1. 在打开的Chrome页面中，开启右上角的\"开发者模式\""
echo ""
echo "2. 点击页面左上角的\"加载已解压的扩展程序\"按钮"
echo ""
echo "3. 选择桌面上的文件夹:"
echo "   $DESKTOP_EXT"
echo ""
echo "4. 点击\"选择\"按钮"
echo ""
echo "5. 安装完成后，您会在Chrome工具栏看到扩展图标"
echo ""
echo "----------------------------------------"
echo "  提示: 安装完成后可以删除桌面文件夹"
echo "----------------------------------------"
echo ""
