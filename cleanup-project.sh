#!/bin/bash

# 项目清理脚本 - 保留 Web 版本，删除 Chrome 扩展和不相关文件
# 日期: 2025-10-31

PROJECT_DIR="/Users/jundong/Documents/FREEAI/Dev/PO-workflow"
cd "$PROJECT_DIR"

echo "🧹 开始清理项目..."
echo "📁 当前目录: $(pwd)"
echo ""

# 创建备份目录
BACKUP_DIR="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 备份重要的配置文件
echo "💾 备份配置文件..."
cp server/.env "$BACKUP_DIR/" 2>/dev/null || true
cp .gitignore "$BACKUP_DIR/" 2>/dev/null || true

echo ""
echo "🗑️  删除 Chrome 扩展相关文件和目录..."

# 删除 Chrome 扩展目录
rm -rf chrome-extension/
rm -rf chrome-extension-backend/
rm -rf chrome-extension-installer/

# 删除 Chrome 扩展打包文件
rm -rf InvoiceAutomation-ChromeExtension-v*/
rm -f InvoiceAutomation-ChromeExtension-v*.zip

# 删除 Electron 相关
rm -rf electron/
rm -rf dist/

echo ""
echo "📄 删除 Chrome 扩展相关文档..."

# 删除 Chrome 扩展相关文档
rm -f CHROME_EXTENSION_DEPLOYMENT_GUIDE.md
rm -f CHROME_WEB_STORE_GUIDE.md
rm -f DEPLOY_CHROME_EXTENSION.md
rm -f IMPROVED_AUTO_UPDATE.md
rm -f ONLINE_UPDATE_GUIDE.md
rm -f ONLINE_UPDATE_TEST.md
rm -f AUTO_UPDATE_GUIDE.md
rm -f DEPLOYMENT_v1.4.3.md
rm -f VERSION_1.3.0_RELEASE.md
rm -f VERSION_1.4.1_BUGFIX.md
rm -f VERSION_MANAGEMENT.md
rm -f VISUAL_FEEDBACK_GUIDE.md

# 删除测试和调试文档
rm -f LOCAL_TEST_GUIDE.md
rm -f DEBUG_TEST_STEPS.md
rm -f FIX_v1.4.4_FINAL.md
rm -f FIX_PO_SEARCH_LOGIC.md
rm -f PAGE_NAVIGATION_FIX.md
rm -f TEST_PO_SEARCH_v1.4.4.md
rm -f TEST_v1.4.4.md
rm -f TEST_INNERTEXT_FIX_v1.4.4.md
rm -f TESTING_README.md
rm -f QUICK_TEST_v1.4.4.md
rm -f QUICK_TEST_GUIDE.md

# 删除 Electron 相关文档
rm -f ELECTRON_README.md
rm -f BUILD_PORTABLE_VERSION.md

# 删除更新和部署相关文档
rm -f UPDATE_SOLUTIONS_SUMMARY.md
rm -f DEPLOYMENT_COMPLETE.md
rm -f 一键更新使用指南.md
rm -f 如何分发安装包.md
rm -f WINDOWS_ENCODING_FIX.md
rm -f WINDOWS_SETUP.md
rm -f WINDOWS_USER_GUIDE.md

# 删除临时脚本
rm -f package-extension.sh
rm -f update-extension.sh
rm -f update-extension.bat
rm -f update-extension-en.bat
rm -f quick-test.sh
rm -f test-deployment.sh
rm -f configure-api.sh

echo ""
echo "🗑️  删除临时和构建文件..."

# 删除临时文件
rm -rf .playwright-mcp/
rm -rf .browser-data/
rm -rf node_modules/
rm -rf client/node_modules/
rm -rf server/node_modules/
rm -rf client/build/

# 删除系统文件
find . -name ".DS_Store" -delete
find . -name "*.log" -delete

# 清空 uploads 目录（保留目录本身）
rm -rf uploads/*
rm -rf document/*

echo ""
echo "✅ 清理完成！"
echo ""
echo "📊 保留的核心文件和目录:"
echo "  ✓ client/          - React 前端应用"
echo "  ✓ server/          - Express 后端服务"
echo "  ✓ uploads/         - PDF 上传目录（已清空）"
echo "  ✓ document/        - 文档存储目录（已清空）"
echo "  ✓ .gitignore       - Git 忽略配置"
echo "  ✓ package.json     - 根项目配置"
echo ""
echo "📦 备份位置: $BACKUP_DIR"
echo ""
echo "🚀 下一步："
echo "  1. 重新安装依赖: npm install"
echo "  2. 安装前端依赖: cd client && npm install"
echo "  3. 安装后端依赖: cd server && npm install"
echo "  4. 启动后端: cd server && npm start"
echo "  5. 启动前端: cd client && npm start"
echo ""
