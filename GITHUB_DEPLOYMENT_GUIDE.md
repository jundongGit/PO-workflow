# GitHub 在线更新部署指南

## 📋 概述

使用 GitHub 作为 Chrome 扩展的在线更新源，完全免费且可靠！

## 🚀 快速开始

### 第 1 步：创建 GitHub 仓库

如果还没有仓库，请先创建：

1. 访问 https://github.com/new
2. 输入仓库名称（例如：`invoice-automation`）
3. 选择 Public 或 Private（推荐 Public，便于分享）
4. 点击 "Create repository"

### 第 2 步：上传代码到 GitHub

```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow

# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 添加所有文件
git add .

# 提交
git commit -m "feat: 添加在线更新功能 v1.2.0"

# 推送到 main 分支
git push -u origin main
```

### 第 3 步：配置更新检查 URL

编辑 `chrome-extension/background/service-worker.js`，将第14行的 URL 改为您的仓库：

```javascript
// 修改前：
UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/chrome-extension/version.json',

// 修改为（示例）：
UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/username/invoice-automation/main/chrome-extension/version.json',
```

**URL 格式说明：**
```
https://raw.githubusercontent.com/用户名/仓库名/分支名/文件路径
```

### 第 4 步：创建 GitHub Release

每次发布新版本时，需要创建 Release：

#### 方式 1: 通过 GitHub 网页

1. 访问仓库页面
2. 点击右侧 "Releases" → "Create a new release"
3. 填写信息：
   - **Tag**: `v1.2.0`
   - **Title**: `v1.2.0 - 新增在线更新功能`
   - **Description**:
     ```markdown
     ## 更新内容
     - 新增在线更新检查功能
     - 支持自动检查更新(每24小时)
     - 支持手动检查更新
     - 新版本发布时自动通知

     ## 安装说明
     1. 下载下方的 ZIP 文件
     2. 解压
     3. 按照 README 安装
     ```
4. 上传文件：拖拽 `InvoiceAutomation-ChromeExtension-v1.2.0.zip`
5. 点击 "Publish release"

#### 方式 2: 使用命令行（推荐）

```bash
# 安装 GitHub CLI（如果还没有）
# macOS:
brew install gh

# Windows:
# 下载 https://github.com/cli/cli/releases

# 登录 GitHub
gh auth login

# 创建 Release
gh release create v1.2.0 \
  --title "v1.2.0 - 新增在线更新功能" \
  --notes "新增在线更新检查功能，支持自动和手动检查更新" \
  InvoiceAutomation-ChromeExtension-v1.2.0.zip
```

### 第 5 步：更新 version.json

编辑 `chrome-extension/version.json`，修改 `downloadUrl` 为 Release 的下载链接：

```json
{
  "version": "1.2.0",
  "releaseDate": "2025-10-30",
  "downloadUrl": "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.2.0/InvoiceAutomation-ChromeExtension-v1.2.0.zip",
  "changeLog": [
    "新增在线更新检查功能",
    "支持自动检查更新(每24小时)",
    "支持手动检查更新",
    "新版本发布时自动通知"
  ],
  "minChromeVersion": "88",
  "critical": false,
  "announcement": "重要更新！现在支持在线自动检查更新，再也不会错过新版本了！"
}
```

**获取 Release 下载链接：**
```
格式：https://github.com/用户名/仓库名/releases/download/标签名/文件名

示例：https://github.com/username/invoice-automation/releases/download/v1.2.0/InvoiceAutomation-ChromeExtension-v1.2.0.zip
```

### 第 6 步：提交更改

```bash
# 修改完 version.json 和 service-worker.js 后
git add chrome-extension/version.json
git add chrome-extension/background/service-worker.js
git commit -m "chore: 配置 GitHub 更新源"
git push
```

## ✅ 完成！测试更新功能

### 测试方法 1: 模拟旧版本

```bash
# 1. 临时将本地版本改为 1.0.0
vim chrome-extension/manifest.json
# 修改 "version": "1.0.0"

# 2. 重新加载扩展
# chrome://extensions/ -> 点击刷新按钮

# 3. 打开扩展弹窗，点击"检查更新"
# 应该提示：发现新版本 v1.2.0

# 4. 改回正确版本
vim chrome-extension/manifest.json
# 修改 "version": "1.2.0"
```

### 测试方法 2: 检查 URL 是否可访问

在浏览器中访问您的 version.json URL：
```
https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/chrome-extension/version.json
```

应该能看到 JSON 内容。

## 📝 后续发布流程

当您要发布新版本（例如 v1.3.0）时：

```bash
# 1. 更新版本号
vim chrome-extension/manifest.json  # 改为 1.3.0
vim package-extension.sh            # 改为 v1.3.0
vim chrome-extension/CHANGELOG.md  # 添加更新日志

# 2. 打包
./package-extension.sh

# 3. 提交代码
git add .
git commit -m "chore: 发布 v1.3.0"
git tag v1.3.0
git push && git push --tags

# 4. 创建 GitHub Release
gh release create v1.3.0 \
  --title "v1.3.0 - 新功能标题" \
  --notes "更新说明..." \
  InvoiceAutomation-ChromeExtension-v1.3.0.zip

# 5. 更新 version.json
vim chrome-extension/version.json
# 修改 version、downloadUrl、changeLog

# 6. 提交 version.json
git add chrome-extension/version.json
git commit -m "chore: 更新到 v1.3.0"
git push
```

## 🎯 重要提示

### ✅ 注意事项

1. **version.json 必须在 main 分支**
   - Raw URL 默认访问 main 分支
   - 确保文件已推送到 GitHub

2. **downloadUrl 必须是 Release 下载链接**
   - 格式：`https://github.com/用户名/仓库名/releases/download/标签名/文件名`
   - 不要使用 Raw 链接

3. **版本号必须严格遵循语义化版本**
   - 格式：`主版本.次版本.修订号`
   - 示例：1.2.0, 1.2.1, 2.0.0

4. **Git 标签名要加 v 前缀**
   - 正确：`v1.2.0`
   - 错误：`1.2.0`

### 🔧 故障排查

**问题 1: 检查更新失败**
- 检查 version.json URL 是否可访问
- 检查 JSON 格式是否正确
- 检查网络连接

**问题 2: 下载链接无效**
- 确认已创建 Release
- 确认文件已上传到 Release
- 检查下载 URL 格式

**问题 3: 版本号不匹配**
- manifest.json 中的 version
- version.json 中的 version
- Git 标签名
三者必须一致（标签名多了个 v 前缀）

## 📚 相关链接

- [GitHub Releases 文档](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

## 💡 高级技巧

### 自动化发布脚本

创建 `release.sh`：

```bash
#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "用法: ./release.sh 1.3.0"
  exit 1
fi

echo "发布版本 v$VERSION"

# 1. 更新版本号（需要手动编辑这些文件）
echo "请先手动更新以下文件的版本号："
echo "  - chrome-extension/manifest.json"
echo "  - package-extension.sh"
echo "  - chrome-extension/CHANGELOG.md"
read -p "已更新？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# 2. 打包
./package-extension.sh

# 3. Git 操作
git add .
git commit -m "chore: 发布 v$VERSION"
git tag v$VERSION
git push && git push --tags

# 4. 创建 Release
gh release create v$VERSION \
  --title "v$VERSION" \
  --generate-notes \
  InvoiceAutomation-ChromeExtension-v$VERSION.zip

echo "✅ Release 创建完成！"
echo "📝 请手动更新 chrome-extension/version.json"
```

使用方法：
```bash
chmod +x release.sh
./release.sh 1.3.0
```

## 🎉 完成！

现在您的扩展已经支持 GitHub 在线更新了！

用户将会：
- ✅ 自动接收更新通知
- ✅ 查看更新日志
- ✅ 一键下载新版本
- ✅ 始终保持最新版本
