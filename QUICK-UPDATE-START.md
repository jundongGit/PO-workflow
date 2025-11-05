# 🚀 远程更新快速入门

## 5分钟设置指南

### 方案对比

| 特性 | GitHub Release | HTTP服务器 | 手动更新 |
|------|----------------|------------|----------|
| 设置难度 | ⭐⭐ | ⭐ | ⭐ |
| 自动化程度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| 需要服务器 | ❌ | ✅ | ❌ |
| 适用场景 | 多台远程部署 | 局域网内部署 | 1-2台电脑 |
| **推荐指数** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 🎯 方案一：GitHub Release（推荐）

### 第一次设置（5分钟）

1. **创建 GitHub 仓库**
   ```bash
   # 如果还没有 git 仓库
   git init
   git add .
   git commit -m "Initial commit"

   # 在 GitHub 上创建仓库后
   git remote add origin https://github.com/你的用户名/po-workflow.git
   git push -u origin main
   ```

2. **配置更新设置**

   编辑 `update-config.json`：
   ```json
   {
     "github": {
       "owner": "你的用户名",
       "repo": "po-workflow"
     }
   }
   ```

   编辑 `auto-update.bat` 第 14 行：
   ```batch
   set GITHUB_REPO=你的用户名/po-workflow
   ```

3. **部署到远程电脑**
   - 将整个项目文件夹复制到远程电脑
   - 双击 `quick-start.bat` 启动

✅ 设置完成！

### 每次发布更新（3步骤）

1. **提交代码**
   ```bash
   git add .
   git commit -m "v1.3.0: 新功能说明"
   git push
   ```

2. **更新版本号**

   编辑 `VERSION.json`:
   ```json
   {
     "version": "1.3.0",
     "changes": [
       "添加了新功能",
       "修复了某个bug"
     ]
   }
   ```

3. **创建 GitHub Release**
   - 访问: `https://github.com/你的用户名/po-workflow/releases/new`
   - Tag: `v1.3.0`
   - Title: `Version 1.3.0`
   - Description: 复制粘贴 VERSION.json 中的 changes
   - 点击 "Publish release"

### 远程用户更新（1步骤）

双击 `auto-update.bat` → 自动完成！

---

## 🖥️ 方案二：HTTP服务器（局域网）

### 在开发机设置（一次性）

1. **启动更新服务器**
   ```bash
   node update-server.js
   ```

   显示：
   ```
   ╔════════════════════════════════════════╗
   ║  更新服务器已启动                    ║
   ║  访问: http://localhost:8080          ║
   ╚════════════════════════════════════════╝
   ```

2. **查看你的IP地址**
   ```bash
   ipconfig
   # 找到 IPv4 地址，例如: 192.168.1.100
   ```

### 在远程电脑配置

编辑 `update-config.json`:
```json
{
  "updateSource": "http",
  "updateServerUrl": "http://192.168.1.100:8080"
}
```

### 发布更新

1. **打包项目**
   ```bash
   # 压缩整个项目为 zip
   # 命名: po-workflow-v1.3.0.zip
   ```

2. **放到 releases 目录**
   ```bash
   cp po-workflow-v1.3.0.zip releases/
   ```

3. **更新 VERSION.json**

远程用户双击 `auto-update.bat` 即可更新。

---

## 📁 方案三：手动更新（最简单）

### 打包发布

```bash
# 1. 压缩项目
zip -r po-workflow-v1.3.0.zip . -x "node_modules/*" "data/*" ".git/*"

# 2. 发送给用户（QQ、微信、U盘等）
```

### 用户安装

1. 解压新版本到临时文件夹
2. 复制以下文件夹，覆盖到旧版本：
   - `server/`
   - `client/`
   - `quick-start.bat`
   - `VERSION.json`
3. **不要覆盖**：
   - `data/`（用户数据）
   - `settings.json`（用户配置）
   - `server/.env`（环境变量）
4. 运行 `quick-start.bat`

---

## 📋 更新对比表

### 开发者操作

| 步骤 | GitHub | HTTP服务器 | 手动 |
|------|--------|-----------|------|
| 提交代码 | git push | - | 打包 |
| 发布版本 | 网页操作 | 复制文件 | 发送文件 |
| 所需时间 | 2分钟 | 1分钟 | 5分钟 |

### 用户操作

| 步骤 | GitHub | HTTP服务器 | 手动 |
|------|--------|-----------|------|
| 检查更新 | 自动 | 自动 | - |
| 下载更新 | 自动 | 自动 | 手动下载 |
| 安装更新 | 自动 | 自动 | 手动复制 |
| 所需时间 | 1分钟 | 1分钟 | 10分钟 |
| 出错风险 | 很低 | 低 | 中等 |

---

## 🔍 常见问题

### Q1: 我应该选择哪个方案？

- **多台远程电脑**：GitHub Release（最佳）
- **同一局域网内的 2-3 台电脑**：HTTP 服务器
- **只有 1 台远程电脑，不常更新**：手动更新

### Q2: GitHub Release 需要公开仓库吗？

不需要！可以创建私有仓库：
- 免费的 GitHub 账号支持无限私有仓库
- Release 功能在私有仓库中完全可用
- 只有有权限的人才能访问

### Q3: 更新会覆盖用户数据吗？

不会！自动更新脚本会：
- ✅ 自动备份用户数据到 `backup_日期时间/` 目录
- ✅ 只更新程序代码（`server/`、`client/` 目录）
- ✅ 保留用户配置（`.env`、`settings.json`、`data/`）

### Q4: 更新失败怎么办？

1. 检查备份目录 `backup_*/`
2. 手动恢复：
   ```bash
   xcopy /E /I backup_20251105\data data
   ```
3. 查看日志 `application.log`

### Q5: 能否实现完全自动更新（无需用户操作）？

可以，但**不推荐**。建议让用户确认后再更新，避免：
- 用户正在使用时突然重启
- 更新出错导致数据丢失
- 用户不知道有更新而困惑

如果确实需要，编辑 `update-config.json`：
```json
{
  "autoDownload": true,
  "autoInstall": true
}
```

### Q6: HTTP服务器需要一直运行吗？

- 如果启用自动更新检查：是的
- 如果用户手动检查更新：只需要在发布时运行

建议：
```json
{
  "autoCheck": false  // 关闭自动检查
}
```
用户需要更新时手动运行 `auto-update.bat`

---

## 🎯 推荐工作流程

### GitHub Release 方式（推荐）

```
开发 → 测试 → 提交 → 创建Release → 通知用户 → 用户一键更新
                                              ↓
                                        自动备份+更新+恢复
```

**开发者时间：5分钟**
**用户时间：1分钟（点击一下）**

---

## 📞 需要帮助？

查看详细文档：
- 📖 [REMOTE-UPDATE-GUIDE.md](./REMOTE-UPDATE-GUIDE.md) - 完整指南
- 🔧 [update-config.json](./update-config.json) - 配置说明
- 🎬 [auto-update.bat](./auto-update.bat) - 更新脚本

---

**开始使用远程更新，让您的部署更轻松！** 🚀
