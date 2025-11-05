# 🚀 如何发布新版本 - 快速指南

## ⚡ 3步发布新版本

### 第1步：更新版本号

**编辑 `VERSION.json`：**
```json
{
  "version": "1.3.0",           // ← 修改这里
  "releaseDate": "2025-11-06",  // ← 改为当前日期
  "changes": [
    "添加了什么新功能",          // ← 填写更新内容
    "修复了什么bug",
    "改进了什么"
  ]
}
```

**同时更新 `package.json`：**
```json
{
  "version": "1.3.0"  // ← 保持与 VERSION.json 一致
}
```

---

### 第2步：提交到 Git

**一键命令（推荐）：**
```bash
git add . && git commit -m "v1.3.0: 你的更新说明" && git tag v1.3.0 && git push origin main && git push origin v1.3.0
```

**或分步执行：**
```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "v1.3.0: 你的更新说明"

# 创建版本标签
git tag v1.3.0

# 推送代码
git push origin main

# 推送标签
git push origin v1.3.0
```

---

### 第3步：创建 GitHub Release

1. **访问 Release 页面**
   ```
   https://github.com/jundongGit/PO-workflow/releases/new
   ```

2. **填写表单**
   - **Choose a tag**: 选择 `v1.3.0`（刚才创建的）
   - **Release title**: `Version 1.3.0 - 简短功能描述`
   - **Describe this release**:
     ```markdown
     ## 🎉 版本 1.3.0

     ### ✨ 新功能
     - 添加了什么新功能

     ### 🐛 Bug 修复
     - 修复了什么问题

     ### 💡 改进
     - 改进了什么

     ---

     ### 📦 更新方法
     远程用户请双击 `auto-update.bat` 自动更新
     ```

3. **发布**
   - 确认 "Set as the latest release" 已勾选
   - 点击 **"Publish release"**

---

## 📋 版本号规则

```
主版本.次版本.修订号

例如：1.3.2

更新类型：
✅ 修复 bug      → 1.2.0 → 1.2.1
✅ 添加新功能    → 1.2.1 → 1.3.0
✅ 重大更改      → 1.9.0 → 2.0.0
```

---

## 💡 实际例子

### 例子 1：修复 Bug

**修改前版本：** v1.2.0
**修改后版本：** v1.2.1

**VERSION.json：**
```json
{
  "version": "1.2.1",
  "releaseDate": "2025-11-06",
  "changes": [
    "修复 PDF 上传时文件名包含特殊字符导致失败的问题"
  ]
}
```

**Git 命令：**
```bash
git add . && git commit -m "v1.2.1: Fix PDF upload with special characters" && git tag v1.2.1 && git push origin main && git push origin v1.2.1
```

---

### 例子 2：添加新功能

**修改前版本：** v1.2.1
**修改后版本：** v1.3.0

**VERSION.json：**
```json
{
  "version": "1.3.0",
  "releaseDate": "2025-11-10",
  "changes": [
    "添加批量上传 PDF 功能",
    "支持导出处理记录为 Excel",
    "优化 AI 识别准确度"
  ]
}
```

**Git 命令：**
```bash
git add . && git commit -m "v1.3.0: Add batch upload and Excel export" && git tag v1.3.0 && git push origin main && git push origin v1.3.0
```

---

## ⚠️ 常见错误

### ❌ 错误 1：版本号不一致

```
VERSION.json:  v1.3.0  ✅
package.json:  v1.2.0  ❌
Git tag:       v1.3.0  ✅
```

**解决：** 确保三个地方版本号完全一致

---

### ❌ 错误 2：忘记推送 tag

```bash
git push origin main      ✅
git push origin v1.3.0    ❌ 忘记了
```

**结果：** GitHub 找不到 tag，无法创建 Release

**解决：** 记得推送 tag

---

### ❌ 错误 3：提交消息不清晰

```bash
❌ git commit -m "update"
❌ git commit -m "fix bug"
✅ git commit -m "v1.3.0: Fix PDF upload bug with special characters"
```

---

## ✅ 检查清单

发布前确认：

- [ ] 已更新 VERSION.json 版本号
- [ ] 已更新 package.json 版本号
- [ ] 已填写 VERSION.json 更新内容
- [ ] 已在本地测试主要功能
- [ ] 已执行 git commit
- [ ] 已创建 git tag
- [ ] 已推送代码（git push origin main）
- [ ] 已推送标签（git push origin v1.3.0）
- [ ] 已在 GitHub 创建 Release

---

## 🔍 如何查看当前版本？

**方法 1：查看文件**
```bash
type VERSION.json
```

**方法 2：通过 API**
```bash
curl http://localhost:3001/api/version
```

**方法 3：通过 Git**
```bash
git describe --tags
```

**方法 4：在 GitHub**
```
https://github.com/jundongGit/PO-workflow/releases
```

---

## 🆘 出错了怎么办？

### 版本号写错了

```bash
# 删除错误的本地 tag
git tag -d v1.3.0

# 删除远程 tag
git push origin :refs/tags/v1.3.0

# 创建正确的 tag
git tag v1.3.1
git push origin v1.3.1
```

### 发布后发现严重 Bug

**立即发布修复版本：**
```bash
# 修复代码
# 更新版本号：1.3.0 → 1.3.1
git add .
git commit -m "v1.3.1: Hotfix - Critical bug fix"
git tag v1.3.1
git push origin main
git push origin v1.3.1
# 然后创建新的 Release
```

---

## 📚 相关文档

- **UPDATE-CHECKLIST.md** - 完整的更新检查清单（详细版）
- **QUICK-UPDATE-START.md** - 自动更新系统快速入门
- **REMOTE-UPDATE-GUIDE.md** - 远程更新完整指南

---

## 💬 快速参考

```bash
# 完整发布流程（一行命令）
git add . && git commit -m "v1.3.0: 更新说明" && git tag v1.3.0 && git push origin main && git push origin v1.3.0

# 然后去 GitHub 创建 Release:
# https://github.com/jundongGit/PO-workflow/releases/new
```

---

**保存此文档，每次发布前打开看一眼！** 🚀
