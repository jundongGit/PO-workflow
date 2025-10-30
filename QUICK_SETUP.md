# 快速配置 GitHub 在线更新

## ⚡ 3 步完成配置

### 1️⃣ 替换 GitHub 仓库信息

编辑 `chrome-extension/background/service-worker.js` 第14行：

```javascript
// 修改这一行，替换 YOUR_USERNAME 和 YOUR_REPO
UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/chrome-extension/version.json',

// 示例：
// UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/zhangsan/invoice-automation/main/chrome-extension/version.json',
```

### 2️⃣ 更新 version.json 的下载链接

编辑 `chrome-extension/version.json` 第4行：

```json
{
  "version": "1.2.0",
  "releaseDate": "2025-10-30",
  "downloadUrl": "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.2.0/InvoiceAutomation-ChromeExtension-v1.2.0.zip",
  ...
}

// 示例：
// "downloadUrl": "https://github.com/zhangsan/invoice-automation/releases/download/v1.2.0/InvoiceAutomation-ChromeExtension-v1.2.0.zip",
```

### 3️⃣ 推送到 GitHub 并创建 Release

```bash
# 提交更改
git add .
git commit -m "feat: 配置在线更新 v1.2.0"
git tag v1.2.0
git push && git push --tags

# 创建 Release（方式1：网页）
# 访问: https://github.com/YOUR_USERNAME/YOUR_REPO/releases/new
# 上传: InvoiceAutomation-ChromeExtension-v1.2.0.zip

# 创建 Release（方式2：命令行）
gh release create v1.2.0 \
  --title "v1.2.0 - 新增在线更新功能" \
  --notes "支持自动检查更新，再也不错过新版本！" \
  InvoiceAutomation-ChromeExtension-v1.2.0.zip
```

## ✅ 完成！

现在用户可以：
- 🔄 自动检查更新（每24小时）
- 🎉 收到新版本通知
- 📥 一键下载更新

## 📚 详细文档

- 完整指南：查看 `GITHUB_DEPLOYMENT_GUIDE.md`
- 在线更新说明：查看 `ONLINE_UPDATE_GUIDE.md`

## 🧪 测试

```bash
# 1. 修改本地版本为 1.0.0 测试
vim chrome-extension/manifest.json
# 改为 "version": "1.0.0"

# 2. 重新加载扩展
# chrome://extensions/ -> 点击刷新

# 3. 打开扩展弹窗，点击"检查更新"
# 应该提示：发现新版本 v1.2.0！
```

## ❓ 常见问题

**Q: 找不到 GitHub 仓库URL？**

A: 格式是 `https://github.com/用户名/仓库名`

在 GitHub 个人主页可以看到所有仓库列表。

**Q: 如何获取 Release 下载链接？**

A: 格式：
```
https://github.com/用户名/仓库名/releases/download/v版本号/文件名.zip
```

**Q: 更新检查失败？**

A: 检查：
1. version.json 文件是否已推送到 GitHub
2. URL 中的用户名、仓库名是否正确
3. 使用浏览器访问该 URL 是否能看到 JSON 内容

## 💡 提示

- 首次配置需要创建 GitHub 仓库
- 每次发布新版本都要创建 Release
- version.json 必须在 main 分支

---

**需要帮助？** 查看 `GITHUB_DEPLOYMENT_GUIDE.md` 获取详细步骤！
