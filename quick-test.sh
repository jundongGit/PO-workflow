#!/bin/bash

# Quick Test Script for Chrome Extension
# 快速测试脚本 - Chrome 扩展

echo ""
echo "============================================"
echo "  Invoice Automation - 快速测试"
echo "============================================"
echo ""

EXTENSION_DIR="/Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension"

echo "[1/3] 检查扩展目录..."
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ 错误: 扩展目录不存在"
    echo "路径: $EXTENSION_DIR"
    exit 1
fi
echo "✓ 扩展目录存在"

echo ""
echo "[2/3] 验证关键文件..."
FILES=(
    "manifest.json"
    "content-scripts/procore-automation.js"
    "popup/popup.html"
    "popup/popup.js"
    "background/service-worker.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$EXTENSION_DIR/$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file (缺失)"
    fi
done

echo ""
echo "[3/3] 读取版本信息..."
VERSION=$(grep '"version"' "$EXTENSION_DIR/manifest.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "✓ 当前版本: $VERSION"

echo ""
echo "============================================"
echo "  测试准备完成！"
echo "============================================"
echo ""
echo "📋 接下来的步骤:"
echo ""
echo "1. 打开 Chrome 浏览器"
echo "   访问: chrome://extensions/"
echo ""
echo "2. 启用开发者模式"
echo "   (右上角开关)"
echo ""
echo "3. 移除旧版本（如果有）"
echo "   找到 'Invoice Automation' → 点击'移除'"
echo ""
echo "4. 加载新版本"
echo "   点击'加载已解压的扩展程序'"
echo "   选择文件夹: $EXTENSION_DIR"
echo ""
echo "5. 打开 Procore 网站测试"
echo "   - 按 F12 打开 DevTools"
echo "   - 切换到 Console 标签"
echo "   - 筛选日志: 输入 'Invoice Automation'"
echo "   - 上传测试 PDF 并开始自动化"
echo ""
echo "============================================"
echo "  调试提示"
echo "============================================"
echo ""
echo "查看详细日志:"
echo "  • Console 日志会显示 DEBUG 信息"
echo "  • 包括选项查找、点击、URL变化等"
echo "  • 红色 = 错误，黄色 = 警告，蓝色 = 信息"
echo ""
echo "常见问题:"
echo "  • 如果项目找不到 → 查看 'Available options' 列表"
echo "  • 如果点击无效 → 查看 'URL before/after click'"
echo "  • 如果卡住 → 检查是否有 JavaScript 错误"
echo ""
echo "============================================"
echo ""

# Ask if user wants to open Chrome extensions page
read -p "是否现在打开 Chrome 扩展页面? (y/n): " OPEN_CHROME

if [[ "$OPEN_CHROME" == "y" || "$OPEN_CHROME" == "Y" ]]; then
    echo ""
    echo "正在打开 Chrome 扩展页面..."
    open -a "Google Chrome" "chrome://extensions/"
    echo "✓ 已打开"
fi

echo ""
echo "🎉 准备就绪！开始测试吧！"
echo ""
