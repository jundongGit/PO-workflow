# 🚀 Chrome扩展完整部署指南（傻瓜式）

## ⏱️ 总耗时：15分钟

---

## 📋 准备工作

### 您需要：
1. ✅ OpenAI API Key（从 https://platform.openai.com/api-keys 获取）
2. ✅ 终端/命令行工具
3. ✅ 10分钟时间

---

## 🎯 完整流程（3步）

```
步骤1: 部署后端API (5分钟)
步骤2: 配置扩展 (2分钟)
步骤3: 打包分发 (3分钟)
```

---

## 📍 步骤1：部署后端API到Vercel

### 1.1 安装Vercel CLI

```bash
npm install -g vercel
```

### 1.2 登录Vercel

```bash
vercel login
```

**会打开浏览器：**
- 选择GitHub登录（推荐）
- 完全免费
- 授权后关闭浏览器

### 1.3 部署API

```bash
# 进入后端目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension-backend

# 安装依赖
npm install

# 首次部署
vercel
```

**按提示操作：**
```
? Set up and deploy? Y
? Which scope? [选择你的账号]
? Link to existing project? n
? Project name? invoice-automation-api
? Directory? ./
```

**等待部署...**

✅ **部署成功！记下URL:**
```
https://invoice-automation-api-xxxxx.vercel.app
```

### 1.4 生产部署

```bash
vercel --prod
```

📝 **记下生产URL:**
```
https://invoice-automation-api.vercel.app
```

### 1.5 配置API Key

```bash
vercel env add OPENAI_API_KEY
```

**输入您的OpenAI API Key:**
```
? Value: sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**选择所有环境:**
```
? Environments:
  ◉ Production
  ◉ Preview
  ◉ Development
```

### 1.6 重新部署（生效配置）

```bash
vercel --prod
```

✅ **后端部署完成！**

---

## 📍 步骤2：配置Chrome扩展

### 2.1 自动配置（推荐）

```bash
# 返回项目根目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow

# 添加执行权限
chmod +x configure-api.sh

# 运行配置脚本
./configure-api.sh
```

**按提示输入您的API URL:**
```
API URL: https://invoice-automation-api.vercel.app
```

✅ **配置完成！**

### 2.2 手动配置（备选）

如果自动脚本失败，手动编辑：

文件：`chrome-extension/background/service-worker.js`

找到第7行，修改为：
```javascript
const CONFIG = {
  API_URL: 'https://invoice-automation-api.vercel.app/api',  // 替换成你的URL
  TIMEOUT: 60000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
};
```

保存文件。

---

## 📍 步骤3：打包给用户

### 3.1 运行打包脚本

```bash
# 添加执行权限
chmod +x package-extension.sh

# 打包
./package-extension.sh
```

**输出：**
```
✅ 打包完成！

输出文件:
  📦 InvoiceAutomation-ChromeExtension-v1.0.0.zip

文件大小: 2.1M
```

### 3.2 获取安装包

安装包位于：
```
InvoiceAutomation-ChromeExtension-v1.0.0.zip
```

包含：
- ✅ Chrome扩展文件
- ✅ Windows自动安装脚本
- ✅ Mac安装脚本
- ✅ 详细使用说明

---

## 📤 步骤4：分发给用户

### 方式1：网盘分享

```
1. 上传ZIP到OneDrive/Google Drive/百度云
2. 获取分享链接
3. 发送给用户
```

### 方式2：邮件发送

```
1. ZIP文件大小约2MB
2. 可直接作为邮件附件
3. 发送给用户
```

### 方式3：公司内网

```
1. 上传到文件服务器
2. \\server\software\InvoiceAutomation.zip
3. 通知用户下载
```

---

## 👤 用户安装流程

### Windows用户（3步，1分钟）

```
步骤1: 解压ZIP文件
步骤2: 双击 auto-install.bat
步骤3: 按屏幕提示完成
```

**详细步骤：**
1. 解压`InvoiceAutomation-ChromeExtension-v1.0.0.zip`
2. 双击`auto-install.bat`
3. Chrome会自动打开扩展页面
4. 在Chrome右上角开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 粘贴显示的路径：`%APPDATA%\InvoiceAutomation\Extension`
7. 点击"选择文件夹"
8. ✅ 安装完成！

### Mac用户

```bash
1. 解压ZIP文件
2. 打开终端，进入解压目录
3. chmod +x install-mac.sh
4. ./install-mac.sh
5. 按提示完成
```

---

## ✅ 验证安装

### 测试清单

**后端API测试：**
```bash
# 测试API
curl https://your-api.vercel.app/api/analyze

# 应该返回错误（正常），而不是404
```

**扩展测试：**
1. ✅ 点击扩展图标，弹窗正常显示
2. ✅ 上传测试PDF
3. ✅ 进度条显示正常
4. ✅ AI识别返回结果
5. ✅ 可以点击"开始自动化"

---

## 💰 成本估算

### Vercel（免费）
- ✅ 100GB带宽/月
- ✅ 100GB执行时间
- ✅ 无限函数调用
- **成本：$0**

### OpenAI API
- 每次识别：~$0.01
- 500次/月：~$5
- 1000次/月：~$10
- **可控预算**

### 总计
**支持500用户，每月500次识别 = ~$5/月**

---

## 🔧 维护和更新

### 更新扩展

**修改代码后：**
```bash
# 1. 测试修改
# 2. 重新打包
./package-extension.sh

# 3. 分发新版本ZIP
# 4. 用户重新安装即可
```

### 更新后端

```bash
cd chrome-extension-backend

# 修改代码后
vercel --prod

# 自动部署，无需用户操作
```

### 查看日志

```bash
# 查看API日志
vercel logs

# 实时日志
vercel logs --follow
```

---

## ❓ 故障排除

### 问题1: vercel命令找不到

```bash
# 重新安装
npm install -g vercel

# 或使用npx
npx vercel login
npx vercel --prod
```

### 问题2: 部署失败

```bash
# 清理重试
rm -rf .vercel
vercel --prod
```

### 问题3: API返回500错误

```bash
# 检查环境变量
vercel env ls

# 查看日志
vercel logs

# 重新部署
vercel --prod
```

### 问题4: 扩展无法连接API

**检查API地址：**
1. 打开`chrome-extension/background/service-worker.js`
2. 确认第7行URL正确
3. 在Chrome中打开`chrome://extensions/`
4. 点击扩展的"刷新"图标

---

## 📞 技术支持

### 检查清单

- [ ] Vercel账号已创建
- [ ] API已成功部署
- [ ] OpenAI API Key已配置
- [ ] 扩展API地址已更新
- [ ] 安装包已打包完成
- [ ] 已测试完整流程

### 获取帮助

**Vercel相关：**
- 文档：https://vercel.com/docs
- 支持：https://vercel.com/support

**OpenAI相关：**
- 文档：https://platform.openai.com/docs
- 支持：https://help.openai.com

**扩展相关：**
- Chrome扩展文档：https://developer.chrome.com/docs/extensions

---

## 🎉 完成！

恭喜！您已完成Chrome扩展的完整部署。

**下一步：**
1. ✅ 将`InvoiceAutomation-ChromeExtension-v1.0.0.zip`发给用户
2. ✅ 提供`使用说明.txt`
3. ✅ 收集用户反馈
4. ✅ 持续优化

**需要帮助？**
- 查看`使用说明.txt`
- 检查故障排除部分
- 联系技术支持

---

**版本：** 1.0.0
**更新日期：** 2025-10-29
**状态：** ✅ 生产就绪
