#!/bin/bash

# 打包Chrome扩展为用户可分发的安装包

echo ""
echo "============================================"
echo "  Invoice Automation - 打包工具"
echo "============================================"
echo ""

# 创建输出目录
OUTPUT_DIR="InvoiceAutomation-ChromeExtension-v1.2.0"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "[1/6] 复制扩展文件..."
cp -r chrome-extension "$OUTPUT_DIR/extension"

echo "[2/6] 复制版本历史..."
cp chrome-extension/CHANGELOG.md "$OUTPUT_DIR/"

echo "[3/6] 复制安装脚本..."
cp chrome-extension-installer/auto-install.bat "$OUTPUT_DIR/"

echo "[4/6] 创建用户使用说明..."
cat > "$OUTPUT_DIR/使用说明.txt" << 'EOF'
============================================
Invoice Automation Chrome 扩展
安装使用指南
============================================

【安装步骤】（仅需1分钟）

1. 双击运行 "auto-install.bat"

2. 等待Chrome浏览器自动打开

3. 在Chrome页面右上角，开启"开发者模式"
   (Developer mode)

4. 点击"加载已解压的扩展程序"
   (Load unpacked)

5. 在弹出的窗口中，粘贴以下路径:

   %APPDATA%\InvoiceAutomation\Extension

   然后点击"选择文件夹"

6. 安装完成！
   扩展图标会出现在Chrome工具栏

============================================
【使用方法】
============================================

1. 点击Chrome工具栏的扩展图标 📄

2. 上传PDF发票
   - 点击"选择PDF文件"
   - 或直接拖拽PDF到窗口

3. 等待AI自动识别（约5-10秒）

4. 检查识别结果
   - 绿色✓ = 高置信度，可直接使用
   - 黄色⚠ = 建议检查
   - 如有错误，点击"修改信息"

5. 点击"开始自动化"按钮

6. 系统会自动:
   - 打开Procore网站
   - 搜索并选择项目
   - 导航到Commitments
   - 查找并打开PO
   - 填充Invoice信息

7. 请手动检查并保存！

============================================
【首次使用】
============================================

第一次使用时:
- 需要手动登录Procore
- 如果有2FA验证，请输入验证码
- 登录信息会自动保存
- 以后无需重复登录

============================================
【常见问题】
============================================

Q: 扩展图标不显示？
A: 点击Chrome工具栏的拼图图标 🧩
   找到"Invoice Automation"并固定

Q: 识别失败？
A: 1. 检查网络连接
   2. 确认PDF清晰可读
   3. 重试上传

Q: 自动化失败？
A: 1. 确保已登录Procore
   2. 检查Client Order Number是否正确
   3. 手动完成剩余步骤

Q: 如何更新扩展？
A: 1. 下载新版本
   2. 重新运行安装脚本
   3. 覆盖即可

Q: 如何卸载？
A: 1. 打开 chrome://extensions/
   2. 找到"Invoice Automation"
   3. 点击"移除"

============================================
【技术支持】
============================================

问题反馈: support@your-company.com
技术支持: xxx-xxxx-xxxx

============================================
【版本信息】
============================================

版本: 1.2.0
发布日期: 2025-10-30
更新内容:
  - 新增在线更新检查功能
  - 支持自动检查更新(每24小时)
  - 支持手动检查更新
  - 新版本发布时自动通知

支持浏览器: Chrome 88+
支持系统: Windows 7/8/10/11, macOS 10.13+

============================================
感谢使用 Invoice Automation！
============================================
EOF

echo "[5/6] 创建Mac安装脚本..."
cat > "$OUTPUT_DIR/install-mac.sh" << 'EOF'
#!/bin/bash
echo ""
echo "============================================"
echo "  Invoice Automation Chrome 扩展安装"
echo "============================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTENSION_DIR="$SCRIPT_DIR/extension"
USER_EXT_DIR="$HOME/Library/Application Support/InvoiceAutomation/Extension"

echo "[1/3] 准备安装环境..."
mkdir -p "$USER_EXT_DIR"
rm -rf "$USER_EXT_DIR"/*

echo "[2/3] 复制扩展文件..."
cp -R "$EXTENSION_DIR"/* "$USER_EXT_DIR/"

echo "[3/3] 打开Chrome扩展页面..."
open -a "Google Chrome" "chrome://extensions/"

echo ""
echo "✅ 准备完成！"
echo ""
echo "请在Chrome中:"
echo "1. 开启'开发者模式'"
echo "2. 点击'加载已解压的扩展程序'"
echo "3. 选择文件夹: $USER_EXT_DIR"
echo ""
EOF

chmod +x "$OUTPUT_DIR/install-mac.sh"

echo "[6/6] 创建压缩包..."
zip -r "${OUTPUT_DIR}.zip" "$OUTPUT_DIR" > /dev/null

echo ""
echo "============================================"
echo "  ✅ 打包完成！"
echo "============================================"
echo ""
echo "输出文件:"
echo "  📦 ${OUTPUT_DIR}.zip"
echo ""
echo "文件大小: $(du -h "${OUTPUT_DIR}.zip" | cut -f1)"
echo ""
echo "============================================"
echo "  分发说明"
echo "============================================"
echo ""
echo "将以下文件发送给用户:"
echo "  ${OUTPUT_DIR}.zip"
echo ""
echo "用户操作:"
echo "  1. 解压ZIP文件"
echo "  2. 双击 auto-install.bat (Windows)"
echo "     或运行 ./install-mac.sh (Mac)"
echo "  3. 按照提示完成安装"
echo ""
echo "============================================"
echo ""

# 显示内容清单
echo "📋 安装包内容:"
ls -lh "$OUTPUT_DIR/"
echo ""

echo "要测试安装包吗? (y/n)"
read -p "> " TEST_IT

if [[ "$TEST_IT" == "y" ]]; then
    echo ""
    echo "正在打开安装包目录..."
    open "$OUTPUT_DIR"
fi

echo ""
echo "🎉 完成！安装包已准备好分发。"
echo ""
