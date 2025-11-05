# 远程自动更新指南

本文档说明如何设置和使用 PO Workflow 的远程自动更新功能。

## 📋 目录

1. [方案选择](#方案选择)
2. [方案一：GitHub Release（推荐）](#方案一github-release推荐)
3. [方案二：简单HTTP服务器](#方案二简单http服务器)
4. [方案三：云存储同步](#方案三云存储同步)
5. [常见问题](#常见问题)

---

## 方案选择

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| GitHub Release | 免费、稳定、版本管理清晰 | 需要公开仓库或GitHub账号 | **推荐：最专业的方案** |
| HTTP服务器 | 完全可控、无需第三方 | 需要保持开发机在线 | 小团队内部使用 |
| 云存储 | 简单易用、不需要服务器 | 需要云存储账号 | 个人或小规模部署 |

---

## 方案一：GitHub Release（推荐）

### 步骤 1：创建 GitHub 仓库

```bash
# 在项目根目录
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/po-workflow.git
git push -u origin main
```

### 步骤 2：配置更新设置

编辑 `update-config.json`：

```json
{
  "updateSource": "github",
  "github": {
    "owner": "你的用户名",
    "repo": "po-workflow",
    "branch": "main"
  },
  "autoCheck": true,
  "notifyUser": true
}
```

同时编辑 `auto-update.bat` 第 14 行：

```batch
set GITHUB_REPO=你的用户名/po-workflow
```

### 步骤 3：创建 Release（每次更新时）

```bash
# 1. 更新版本号
编辑 VERSION.json，增加版本号

# 2. 提交更改
git add .
git commit -m "Release v1.2.0: 添加新功能"
git push

# 3. 在 GitHub 网站上创建 Release
- 访问: https://github.com/你的用户名/po-workflow/releases/new
- Tag: v1.2.0
- Title: Version 1.2.0
- Description: 更新内容说明
- 点击 "Publish release"
```

### 步骤 4：远程用户更新

远程用户只需双击 `auto-update.bat`，程序会自动：
1. ✅ 检查最新版本
2. ✅ 显示更新内容
3. ✅ 备份用户数据
4. ✅ 下载并安装更新
5. ✅ 恢复用户配置
6. ✅ 自动启动应用

### 应用内更新通知

在应用界面中会显示更新提示：

```
🔔 发现新版本 v1.2.0
当前版本：v1.1.0

更新内容：
- 修复了 API 连接问题
- 优化了 PDF 识别准确度
- 改进了界面响应速度

[立即更新] [稍后提醒]
```

点击"立即更新"会自动执行更新流程。

---

## 方案二：简单HTTP服务器

### 在开发机上运行更新服务器

创建 `update-server.js`：

```javascript
import express from 'express';
import path from 'path';

const app = express();
const PORT = 8080;

// 提供最新版本信息
app.get('/api/latest', (req, res) => {
  res.json({
    version: '1.2.0',
    downloadUrl: `http://你的IP:${PORT}/download/po-workflow-latest.zip`,
    releaseNotes: '更新内容...'
  });
});

// 提供下载
app.use('/download', express.static('releases'));

app.listen(PORT, () => {
  console.log(`更新服务器运行在 http://localhost:${PORT}`);
});
```

启动服务器：
```bash
node update-server.js
```

### 修改远程客户端配置

编辑远程机器的 `update-config.json`：

```json
{
  "updateSource": "http",
  "updateServerUrl": "http://开发机IP:8080",
  "autoCheck": true
}
```

---

## 方案三：云存储同步

### 使用 OneDrive / Google Drive

1. **打包新版本**
   ```bash
   # 创建发布包
   npm run package  # 或手动压缩
   ```

2. **上传到云存储**
   - 将 `po-workflow-v1.2.0.zip` 上传到云盘
   - 获取共享链接

3. **创建版本信息文件**

   创建 `latest.json` 并上传到同一目录：
   ```json
   {
     "version": "1.2.0",
     "downloadUrl": "https://云盘分享链接",
     "releaseDate": "2025-11-05",
     "notes": "更新内容..."
   }
   ```

4. **远程用户更新**
   - 手动下载最新的 zip
   - 解压并覆盖文件（保留 data 目录）
   - 运行 `quick-start.bat`

### 半自动化方案

创建 `sync-update.bat`：

```batch
@echo off
echo 正在从云盘同步最新版本...
REM 如果使用 OneDrive
robocopy "C:\Users\用户\OneDrive\PO-Workflow-Releases\latest" "." /MIR /XD data
echo 更新完成！
pause
```

---

## 使用流程对比

### GitHub Release 方式（推荐）

**开发者发布更新：**
```bash
git add .
git commit -m "v1.2.0: 新功能"
git push
# 在 GitHub 创建 Release
```

**远程用户更新：**
```
双击 auto-update.bat → 自动完成
```

### HTTP 服务器方式

**开发者发布更新：**
```bash
# 打包新版本
zip -r releases/po-workflow-latest.zip .
# 保持 update-server.js 运行
```

**远程用户更新：**
```
双击 auto-update.bat → 自动完成
```

### 云存储方式

**开发者发布更新：**
```bash
# 手动打包并上传到云盘
# 更新 latest.json
```

**远程用户更新：**
```
手动下载 → 解压 → 覆盖文件
```

---

## 版本发布检查清单

每次发布新版本前，请检查：

- [ ] 更新 `VERSION.json` 中的版本号
- [ ] 更新 `VERSION.json` 中的更新日志
- [ ] 测试所有功能正常工作
- [ ] 确认依赖包版本兼容
- [ ] 检查 `.env.example` 文件是否最新
- [ ] 更新相关文档
- [ ] 创建 Git tag
- [ ] 推送到 GitHub
- [ ] 创建 GitHub Release
- [ ] 通知用户更新

---

## 常见问题

### Q: 更新会覆盖用户配置吗？

A: 不会。自动更新脚本会：
- 自动备份 `data/`、`settings.json`、`metadata.json`、`.env` 文件
- 只更新程序代码（`server/`、`client/` 目录）
- 更新后自动恢复用户配置

### Q: 更新失败怎么办？

A: 脚本会在更新前创建备份，如果失败：
```batch
# 查看备份目录
dir backup_*
# 手动恢复
xcopy /E /I backup_20251105\data data
```

### Q: 如何跳过某个版本？

A: 编辑 `update-config.json`：
```json
{
  "skipVersions": ["1.2.0"]
}
```

### Q: 可以设置自动更新吗？

A: 可以。编辑 `update-config.json`：
```json
{
  "autoDownload": true,
  "autoInstall": true
}
```

但建议保持 `autoInstall: false`，让用户手动确认。

### Q: 更新需要重启应用吗？

A: 是的。更新脚本会自动：
1. 停止当前运行的应用
2. 安装更新
3. 自动重启应用

### Q: 如何禁用自动更新检查？

A: 编辑 `update-config.json`：
```json
{
  "autoCheck": false
}
```

---

## 技术支持

如有问题，请：
1. 查看 `application.log` 日志文件
2. 访问 GitHub Issues
3. 联系技术支持

---

**祝使用愉快！** 🚀
