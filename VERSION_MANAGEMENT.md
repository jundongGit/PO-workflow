# Chrome 扩展版本管理指南

## 📋 版本号规则

采用**语义化版本控制** (Semantic Versioning)：

```
主版本号.次版本号.修订号  (Major.Minor.Patch)
例如: 1.2.3
```

### 版本号更新规则

- **主版本号 (Major)**: 重大功能变更或不兼容的 API 修改
  - 例如: 1.x.x → 2.0.0
  - 示例: 完全重构UI、更换AI模型、改变核心架构

- **次版本号 (Minor)**: 向下兼容的新功能
  - 例如: 1.1.x → 1.2.0
  - 示例: 新增功能模块、增强现有功能

- **修订号 (Patch)**: 向下兼容的问题修正
  - 例如: 1.1.1 → 1.1.2
  - 示例: Bug修复、性能优化、文案修改

## 🔄 版本更新流程

### 1. 更新 manifest.json

```bash
# 编辑文件
vim chrome-extension/manifest.json

# 修改版本号
"version": "1.2.0"
```

### 2. 更新 package-extension.sh

```bash
# 编辑文件
vim package-extension.sh

# 修改 OUTPUT_DIR
OUTPUT_DIR="InvoiceAutomation-ChromeExtension-v1.2.0"

# 修改使用说明中的版本信息
版本: 1.2.0
发布日期: 2025-xx-xx
```

### 3. 更新 CHANGELOG.md

```bash
# 编辑文件
vim chrome-extension/CHANGELOG.md

# 添加新版本的更新日志
## v1.2.0 (2025-xx-xx)

### ✨ 新增功能
- 功能描述...

### 🐛 问题修复
- 修复描述...

### 🎨 界面改进
- 改进描述...
```

### 4. 重新打包

```bash
./package-extension.sh
```

### 5. 测试新版本

```bash
# 解压测试
unzip InvoiceAutomation-ChromeExtension-v1.2.0.zip

# 在 Chrome 中测试
# chrome://extensions/
```

### 6. 提交代码

```bash
git add .
git commit -m "chore: 发布 v1.2.0 版本"
git tag v1.2.0
git push && git push --tags
```

## 📦 版本历史

### v1.2.0 (2025-10-30)
- ✨ 新增在线更新检查功能
- ✨ 支持自动检查更新(每24小时)
- ✨ 支持手动检查更新
- 🎨 新增更新横幅和版本显示

### v1.1.1 (2025-10-30)
- 🐛 修复 content script 连接错误
- ✨ 新增自动注入和重试机制
- ⚡ 优化页面加载等待时间
- 📝 改进错误提示信息

### v1.1.0 (2025-10-30)
- ✨ 新增实时日志显示功能
- ✨ 弹窗保持打开状态
- ✨ 支持停止自动化执行
- 🎨 新增自动化执行界面

### v1.0.0 (2025-10-29)
- 🎉 初始版本发布
- ✨ PDF 发票智能识别
- ✨ Procore 自动化流程
- 🎨 现代化UI设计

## 📝 更新日志模板

每次发布新版本时，在 CHANGELOG.md 中使用以下模板：

```markdown
## v1.x.x (YYYY-MM-DD)

### ✨ 新增功能
- 功能1: 描述
- 功能2: 描述

### 🎨 界面改进
- 改进1: 描述
- 改进2: 描述

### 🐛 问题修复
- 修复1: 描述
- 修复2: 描述

### ⚡ 性能优化
- 优化1: 描述

### 📚 文档更新
- 更新1: 描述

### 🔧 其他变更
- 变更1: 描述
```

## 🎯 发布检查清单

发布新版本前，请确认以下事项：

- [ ] 已更新 `chrome-extension/manifest.json` 版本号
- [ ] 已更新 `package-extension.sh` 版本号和日期
- [ ] 已更新 `chrome-extension/CHANGELOG.md`
- [ ] 已在本地测试新功能
- [ ] 已修复所有已知 Bug
- [ ] 已更新使用文档（如有必要）
- [ ] 已运行 `./package-extension.sh` 打包
- [ ] 已测试安装包能否正常安装
- [ ] 已提交代码并打标签

## 🚀 快速发布命令

```bash
# 一键更新并打包（需要先手动修改版本号）
./package-extension.sh

# 提交并发布
git add .
git commit -m "chore: 发布 v1.x.x 版本"
git tag v1.x.x
git push && git push --tags
```

## 📂 文件结构

```
PO-workflow/
├── chrome-extension/
│   ├── manifest.json           # 版本号
│   └── CHANGELOG.md            # 版本历史
├── package-extension.sh        # 打包脚本（版本号）
├── VERSION_MANAGEMENT.md       # 本文件
└── InvoiceAutomation-ChromeExtension-v*.zip  # 发布包
```

## 💡 最佳实践

1. **版本号要准确反映变更级别**
   - 小改动用 Patch
   - 新功能用 Minor
   - 大变更用 Major

2. **CHANGELOG 要详细记录**
   - 每个变更都要列出
   - 用清晰的分类
   - 方便用户了解更新内容

3. **保留历史版本包**
   - 便于回滚
   - 便于对比测试
   - 便于用户下载旧版本

4. **测试后再发布**
   - 本地测试所有新功能
   - 检查是否有破坏性变更
   - 确认安装包可以正常安装

5. **使用 Git 标签**
   - 每个版本打标签
   - 便于版本管理
   - 便于回溯历史

## 当前版本

**最新版本**: v1.2.0
**发布日期**: 2025-10-30
**下一个计划版本**: v1.3.0（待定）
