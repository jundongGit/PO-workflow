# ⚡ 快速开始 - Chrome扩展版

## 🎯 3步完成部署（15分钟）

---

## 📋 准备

**您需要有：**
1. OpenAI API Key（从 https://platform.openai.com/api-keys 获取）

**就这些！**

---

## 🚀 Step 1: 部署后端 (5分钟)

### 打开终端，复制粘贴以下命令：

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录Vercel（会打开浏览器）
vercel login

# 3. 进入后端目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension-backend

# 4. 安装依赖
npm install

# 5. 部署
vercel --prod
```

### 重要提示：

**部署时会询问：**
- `Set up and deploy?` → 输入 `Y`
- `Project name?` → 输入 `invoice-automation-api`
- `Directory?` → 直接回车

**部署成功后，您会看到类似：**
```
✅ Deployed to production
https://invoice-automation-api-xxxxx.vercel.app
```

📝 **复制这个URL，下一步需要！**

### 配置API Key：

```bash
# 添加OpenAI API Key
vercel env add OPENAI_API_KEY

# 粘贴你的API Key（以sk-proj-开头）
# 选择所有环境（按空格选择，回车确认）

# 重新部署使配置生效
vercel --prod
```

✅ **Step 1 完成！**

---

## 🔧 Step 2: 配置扩展 (2分钟)

### 返回项目根目录：

```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow
```

### 运行配置脚本：

```bash
./configure-api.sh
```

### 按提示输入：

```
请输入您的Vercel API地址：
API URL: https://invoice-automation-api-xxxxx.vercel.app
```

**粘贴Step 1中获得的URL**

✅ **Step 2 完成！**

---

## 📦 Step 3: 打包分发 (3分钟)

### 运行打包脚本：

```bash
./package-extension.sh
```

### 等待完成，您会看到：

```
✅ 打包完成！

输出文件:
  📦 InvoiceAutomation-ChromeExtension-v1.0.0.zip

文件大小: 2.1M
```

✅ **Step 3 完成！**

---

## 📤 Step 4: 分发给用户

### 将这个文件发给用户：

```
InvoiceAutomation-ChromeExtension-v1.0.0.zip
```

**分发方式：**
- 📧 邮件附件（2MB，可直接发送）
- ☁️ 网盘分享（OneDrive/Google Drive）
- 💾 USB拷贝
- 🌐 公司内网

---

## 👤 用户安装（1分钟）

**Windows用户只需3步：**

```
1. 解压ZIP文件
2. 双击 auto-install.bat
3. 按屏幕提示操作（复制粘贴路径）
```

**就这么简单！**

---

## 🎯 用户使用流程

```
1. 点击Chrome工具栏的扩展图标 📄
   ↓
2. 上传PDF发票（点击或拖拽）
   ↓
3. 等待AI识别（5-10秒）
   ↓
4. 检查结果（可手动修正）
   ↓
5. 点击"开始自动化"
   ↓
6. 完成！
```

---

## ✅ 验证部署

### 测试后端API：

```bash
curl https://your-api-url.vercel.app/api/analyze
```

应该返回响应（即使是错误也说明API在工作）

### 测试扩展：

1. 自己先安装测试
2. 上传一个PDF
3. 看能否正常识别
4. 确认自动化功能正常

---

## 💰 成本

**Vercel：** 免费 ✅
**OpenAI：** ~$5/月（500次识别）

**总计：** <$10/月

---

## 📞 遇到问题？

### 常见问题：

**Q1: vercel命令找不到？**
```bash
# 重新安装
npm install -g vercel
```

**Q2: API部署失败？**
```bash
# 重试
rm -rf .vercel
vercel --prod
```

**Q3: 扩展无法识别？**
- 检查网络连接
- 查看Chrome控制台错误（F12）
- 确认API地址配置正确

**Q4: 用户安装失败？**
- 确保用户已安装Chrome
- 检查是否开启了"开发者模式"
- 让用户查看`使用说明.txt`

---

## 📚 完整文档

**详细文档：**
- `DEPLOY_CHROME_EXTENSION.md` - 完整部署指南
- `WINDOWS_USER_GUIDE.md` - Windows用户指南
- `使用说明.txt` - 用户操作手册（在ZIP包中）

**后端相关：**
- `chrome-extension-backend/DEPLOY_NOW.md` - 后端部署详解
- `chrome-extension-backend/README.md` - API文档

**扩展相关：**
- `chrome-extension/README.md` - 扩展功能说明

---

## 🎉 完成！

**您现在拥有：**
- ✅ 部署好的后端API
- ✅ 配置好的Chrome扩展
- ✅ 可分发的用户安装包
- ✅ 完整的使用文档

**立即分发给用户，开始使用！** 🚀

---

## 💡 下一步（可选）

### 如果需要优化：

**功能增强：**
- 批量处理多个PDF
- 添加处理历史记录
- 支持更多发票格式

**体验优化：**
- 添加键盘快捷键
- 优化错误提示
- 增加进度提示

**分发优化：**
- 发布到Chrome商店（需审核）
- 创建演示视频
- 制作用户培训PPT

---

**有任何问题随时联系！** 😊
