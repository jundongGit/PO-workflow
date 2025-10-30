# Windows用户终极指南 - 傻瓜式操作

## 🎯 两种方案任选

---

## ⭐⭐⭐⭐⭐ 方案1: Electron便携版（最推荐）

### 用户操作：**仅1步**

```
步骤1: 双击 Invoice Automation.exe
步骤2: 使用！
```

### 优点：
- ✅ **0配置**：下载即用
- ✅ **0依赖**：不需要Chrome
- ✅ **离线可用**：不依赖网络（识别需要网络）
- ✅ **完全自包含**：所有功能打包在exe中

### 文件大小：
- 约150MB（一次下载，永久使用）

### 分发方式：

**给用户发送:**
1. `Invoice Automation.exe` (便携版程序)
2. `使用说明.txt` (可选)

**用户操作:**
```
1. 下载 Invoice Automation.exe
2. 双击运行
3. 上传PDF → 识别 → 自动化 → 完成！
```

**就这么简单！**

---

## ⭐⭐⭐⭐ 方案2: Chrome扩展版（更轻量）

### 用户操作：**2步**

```
步骤1: 双击 auto-install.bat
步骤2: 按照屏幕提示完成（复制粘贴路径）
```

### 优点：
- ✅ **轻量级**：仅2MB
- ✅ **自动更新**：Chrome自动管理
- ✅ **集成体验**：浏览器原生

### 前置条件：
- 需要安装Chrome浏览器

### 分发方式：

**给用户发送:**
```
InvoiceAutomation-ChromeExtension.zip
```

内含：
- `auto-install.bat` (自动安装脚本)
- `extension/` (扩展文件夹)
- `使用说明.txt`

**用户操作:**
```
1. 解压 ZIP 文件
2. 双击 auto-install.bat
3. 看到Chrome页面后:
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 粘贴显示的路径
   - 选择文件夹
4. 完成！
```

---

## 📦 打包分发流程

### 方案1: Electron便携版

#### 您需要做的准备：

**Step 1: 构建exe文件**
```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow

# 确保.env已配置
# server/.env 包含:
# OPENAI_API_KEY=sk-proj-xxxxx
# PROCORE_EMAIL=evelyn@maxion.co.nz
# PROCORE_PASSWORD=Eve@Max1on

# 构建前端
cd client && npm run build && cd ..

# 构建Windows便携版
npm run electron:build:win
```

**Step 2: 输出文件**
```
dist/Invoice Automation 1.0.0.exe  (约150MB)
```

**Step 3: 创建使用说明**

创建 `使用说明.txt`:
```txt
============================================
Invoice Automation - 使用说明
============================================

【快速开始】
1. 双击 "Invoice Automation.exe"
2. 上传PDF发票
3. 点击"开始自动化"

【首次使用】
- 第一次打开会自动登录Procore
- 如果有2FA验证，手动输入验证码
- 登录信息会自动保存

【联系支持】
Email: support@your-company.com
电话: xxx-xxxx-xxxx

【版本信息】
版本: 1.0.0
发布日期: 2025-10-29
```

**Step 4: 打包分发**

**选项A: 直接分发exe (150MB)**
```
给用户发送:
- Invoice Automation.exe
- 使用说明.txt

网盘链接或USB
```

**选项B: 压缩后分发 (60MB)**
```bash
# 使用7-Zip压缩
# 下载: https://www.7-zip.org/

# 右键 Invoice Automation.exe
# → 7-Zip → 添加到压缩包
# → 压缩格式: 7z
# → 压缩级别: 最佳

# 输出: Invoice Automation.7z (约60MB)
```

---

### 方案2: Chrome扩展版

#### 您需要做的准备：

**Step 1: 部署后端API (一次性，5分钟)**

```bash
cd chrome-extension-backend

# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
npm install
vercel --prod

# 记录输出的URL，例如:
# https://invoice-automation-api.vercel.app
```

**Step 2: 配置环境变量**

```bash
# 添加OpenAI API Key
vercel env add OPENAI_API_KEY
# 粘贴: sk-proj-xxxxx
# 选择所有环境

# 重新部署
vercel --prod
```

**Step 3: 更新扩展配置**

编辑: `chrome-extension/background/service-worker.js`

第7行改为:
```javascript
const CONFIG = {
  API_URL: 'https://invoice-automation-api.vercel.app/api'  // 你的Vercel URL
};
```

**Step 4: 打包分发**

```bash
# 复制扩展文件夹
cp -r chrome-extension chrome-extension-installer/extension

# 打包为ZIP
cd chrome-extension-installer
zip -r InvoiceAutomation-ChromeExtension.zip auto-install.bat extension/ 使用说明.txt

# Windows用户使用右键 → 发送到 → 压缩文件夹
```

**Step 5: 分发**

```
给用户发送:
InvoiceAutomation-ChromeExtension.zip (约2MB)

网盘链接或邮件附件
```

---

## 📊 方案对比

### 推荐给不同用户：

| 用户类型 | 推荐方案 | 原因 |
|---------|---------|------|
| **完全不懂电脑** | Electron便携版 | 双击即用，0操作 |
| **只想快速用** | Electron便携版 | 最省事 |
| **已有Chrome** | Chrome扩展版 | 更轻量，集成好 |
| **追求最新** | Chrome扩展版 | 自动更新 |
| **在意体积** | Chrome扩展版 | 仅2MB |

### 我的建议：

**对于您的场景（Windows客户端，不会编程）**

👉 **强烈推荐: Electron便携版**

**原因:**
1. ✅ 用户操作最简单：下载 → 双击 → 完成
2. ✅ 无需Chrome浏览器
3. ✅ 无需任何配置
4. ✅ 无需网络部署
5. ✅ 完全自包含
6. ✅ 删除即卸载

**用户体验流程:**
```
收到文件 → 双击exe → 开始使用
(总耗时: 10秒)
```

---

## 🚀 立即开始

### 方案1: Electron便携版（推荐）

**您现在就可以构建:**

```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow

# 一键构建
npm run electron:build:win

# 完成后，文件位于:
# dist/Invoice Automation 1.0.0.exe
```

**然后:**
1. 复制exe文件到U盘或上传网盘
2. 发送给用户
3. 告诉用户：双击即可使用

---

### 方案2: Chrome扩展版

**需要我帮您部署后端API吗？**

如果需要，请提供：
1. 您的OpenAI API Key
2. 我帮您部署到Vercel
3. 配置好所有设置
4. 给您打包好的用户安装包

**或者您也可以:**
1. 按照上面的Step 1-5自己操作
2. 大约需要10分钟
3. 然后给用户分发ZIP文件

---

## 💡 终极建议

### 🏆 最佳方案组合:

**阶段1: 快速上线**
- 使用Electron便携版
- 立即可用，无需配置
- 发给所有用户

**阶段2: 长期维护**
- 迁移到Chrome扩展版
- 更好的更新机制
- 更轻量的体积

### 📝 用户文档模板

我为您准备了完整的用户文档：

**发送给用户的邮件模板:**
```
主题: Invoice Automation 自动化工具 - 使用指南

各位同事，

附件是Invoice自动化处理工具，可以自动识别发票信息并填充到Procore系统。

【使用方法】
1. 下载附件 "Invoice Automation.exe"
2. 双击运行
3. 上传PDF发票
4. 点击"开始自动化"
5. 完成！

【首次使用】
- 第一次打开会自动登录Procore
- 登录信息会保存，以后无需重复登录

【常见问题】
- 如果显示错误，请检查网络连接
- 如有疑问，请联系IT部门

【技术支持】
Email: support@your-company.com
电话: xxx-xxxx-xxxx

IT部门
2025-10-29
```

---

## ❓ 需要帮助？

### 我可以帮您：

**选项1: 直接构建Electron便携版**
- 我现在就帮您构建
- 提供下载链接
- 您直接分发给用户

**选项2: 部署Chrome扩展后端**
- 我帮您部署Vercel API
- 配置好所有设置
- 打包好用户安装包

**选项3: 提供完整演示视频**
- 录制用户操作视频
- 包含所有步骤
- 发送给用户培训

---

## ✅ 现在开始

**告诉我您想要哪个方案，我立即帮您准备！**

1. **Electron便携版** - 我现在就构建
2. **Chrome扩展版** - 我帮您部署后端
3. **两个都要** - 给用户提供选择

**需要哪个？** 🚀
