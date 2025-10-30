# Chrome Extension 部署完整指南

## 📋 概述

本指南将帮助您完成 Invoice Automation Chrome 扩展的完整部署流程。

---

## 🚀 快速开始（3步完成）

### Step 1: 部署后端API (5分钟)

```bash
# 1. 进入后端目录
cd chrome-extension-backend

# 2. 安装Vercel CLI
npm install -g vercel

# 3. 登录Vercel
vercel login

# 4. 安装依赖
npm install

# 5. 部署
vercel --prod

# 6. 记录部署URL (例如: https://your-project.vercel.app)
```

### Step 2: 配置API密钥 (2分钟)

```bash
# 添加OpenAI API Key到Vercel
vercel env add OPENAI_API_KEY

# 按提示操作:
# - 输入你的OpenAI API Key
# - 选择: Production, Preview, Development (全选)

# 重新部署使配置生效
vercel --prod
```

### Step 3: 更新扩展配置 (1分钟)

编辑文件: `chrome-extension/background/service-worker.js`

修改第7行:
```javascript
const CONFIG = {
  API_URL: 'https://your-project.vercel.app/api'  // 替换为你的Vercel URL
};
```

完成！现在可以加载扩展到Chrome了。

---

## 📦 详细部署步骤

### 一、准备工作

#### 1.1 获取OpenAI API Key

1. 访问 https://platform.openai.com/api-keys
2. 登录或注册账号
3. 点击 "Create new secret key"
4. 复制密钥（只显示一次，务必保存）

**费用估算**:
- 每次识别 ~$0.01
- 500次/月 ~$5
- 免费额度: 新账号通常有$5-$18

#### 1.2 注册Vercel账号

1. 访问 https://vercel.com
2. 使用GitHub账号登录（推荐）
3. 免费套餐包含:
   - 100GB带宽/月
   - 无限函数调用
   - 完全够用！

### 二、部署后端API

#### 2.1 方式A：命令行部署（推荐）

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login
# 在浏览器中完成登录

# 进入后端目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension-backend

# 安装依赖
npm install

# 首次部署（预览）
vercel

# 生产部署
vercel --prod

# 输出示例:
# ✓ Deployed to production. Run `vercel --prod` to overwrite later.
# https://invoice-automation-api.vercel.app
```

#### 2.2 方式B：GitHub自动部署

1. 将代码推送到GitHub仓库
2. 访问 https://vercel.com/new
3. 选择GitHub仓库
4. 选择 `chrome-extension-backend` 目录
5. 点击 Deploy

每次push到main分支都会自动部署！

#### 2.3 配置环境变量

**命令行方式:**
```bash
vercel env add OPENAI_API_KEY
# 输入: sk-proj-xxxxxxxxxxxxx
# 选择: Production, Preview, Development (回车3次全选)

# 重新部署
vercel --prod
```

**网页方式:**
1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 添加:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-xxxxxxxxxxxxx`
   - Environments: Production ✓
5. Redeploy

#### 2.4 验证部署

```bash
# 测试API是否工作
curl -X POST https://your-project.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,iVBORw0K...", "fileName": "test.pdf"}'

# 应该返回JSON响应
```

### 三、配置Chrome扩展

#### 3.1 更新API地址

编辑: `chrome-extension/background/service-worker.js`

```javascript
// 第7行
const CONFIG = {
  API_URL: 'https://your-project.vercel.app/api', // 修改这里
  TIMEOUT: 60000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
};
```

#### 3.2 (可选) 添加图标

将你的图标文件放到 `chrome-extension/icons/` 目录:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

如果没有图标，扩展仍可正常工作（使用默认图标）。

### 四、安装扩展

#### 4.1 手动加载（开发测试）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹
6. 完成！

#### 4.2 打包分发（给用户）

**准备安装包:**
```bash
# 复制扩展文件夹
cp -r chrome-extension chrome-extension-installer/extension

# 复制安装脚本已创建好:
# - install.bat (Windows)
# - install.sh (Mac/Linux)
# - README.txt (说明文档)

# 打包为ZIP
cd chrome-extension-installer
zip -r InvoiceAutomation-v1.0.0.zip .

# 分发此ZIP文件给用户
```

**用户安装步骤:**
1. 下载并解压 ZIP 文件
2. Windows: 双击 `install.bat`
3. Mac/Linux: 运行 `./install.sh`
4. 按照提示完成安装

### 五、测试流程

#### 5.1 基础功能测试

```
1. 点击扩展图标
   ✓ 弹出窗口正常显示

2. 上传测试PDF
   ✓ 进度条显示
   ✓ AI识别成功
   ✓ 显示结果

3. 点击"开始自动化"
   ✓ 跳转到Procore页面
   ✓ 自动填充表单
   ✓ 完成流程
```

#### 5.2 错误处理测试

```
1. 上传无效文件
   ✓ 显示错误提示

2. 断开网络
   ✓ 显示连接错误
   ✓ 重试机制工作

3. 错误的Client Order Number
   ✓ 显示找不到项目
   ✓ 用户可重试
```

### 六、监控和维护

#### 6.1 查看API日志

```bash
# 实时日志
vercel logs --follow

# 最近日志
vercel logs

# 特定部署日志
vercel logs [deployment-url]
```

#### 6.2 监控API使用

1. Vercel Dashboard: 查看请求数、错误率
2. OpenAI Dashboard: 查看API使用量和费用

#### 6.3 更新扩展

**发布新版本:**
1. 修改代码
2. 更新 `manifest.json` 中的版本号
3. 重新打包分发

**用户更新:**
- 开发模式: 在 chrome://extensions/ 点击刷新图标
- 正式版本: 覆盖安装即可

---

## 🔒 安全最佳实践

### 1. API密钥保护

```bash
# ❌ 不要将密钥硬编码在代码中
const API_KEY = "sk-proj-xxxxx"; // 危险！

# ✅ 使用环境变量
const API_KEY = process.env.OPENAI_API_KEY;

# ❌ 不要提交.env文件到Git
# ✅ 添加到.gitignore
echo ".env" >> .gitignore
```

### 2. CORS配置

后端API已配置CORS允许所有来源:
```javascript
'Access-Control-Allow-Origin': '*'
```

**生产环境建议:**
```javascript
// 仅允许Chrome扩展
'Access-Control-Allow-Origin': 'chrome-extension://your-extension-id'
```

### 3. 速率限制

**OpenAI API:**
- 免费层: 3 RPM (requests per minute)
- 付费层: 根据tier级别提升

**建议:**
- 在扩展中添加请求队列
- 显示"处理中"状态避免重复点击

---

## 💰 成本估算

### OpenAI API费用

**GPT-4o Pricing:**
- 输入: $2.50 / 1M tokens
- 输出: $10.00 / 1M tokens
- 每张图片: ~1500 tokens

**实际成本:**
- 每次识别: ~$0.01
- 100次/月: ~$1
- 500次/月: ~$5
- 1000次/月: ~$10

### Vercel托管费用

**Free Tier (免费):**
- 100GB带宽
- 100GB serverless执行时间
- 无限函数调用

**完全够用！** 除非每月处理>10,000张发票

---

## 🐛 常见问题解决

### Q1: API调用失败

**错误**: `Failed to fetch` or `Network error`

**解决方案:**
```bash
# 1. 检查Vercel部署状态
vercel ls

# 2. 测试API
curl https://your-project.vercel.app/api/analyze

# 3. 查看日志
vercel logs

# 4. 验证环境变量
vercel env ls

# 5. 重新部署
vercel --prod
```

### Q2: OpenAI API Key无效

**错误**: `401 Unauthorized`

**解决方案:**
```bash
# 1. 验证密钥格式 (应该以 sk- 开头)
# 2. 检查Vercel环境变量
vercel env ls

# 3. 重新添加
vercel env rm OPENAI_API_KEY
vercel env add OPENAI_API_KEY

# 4. 重新部署
vercel --prod
```

### Q3: 扩展无法加载

**错误**: Manifest file is invalid

**解决方案:**
1. 检查 manifest.json 语法是否正确
2. 确保所有文件路径存在
3. 检查Chrome版本 (需要88+)

### Q4: PDF处理失败

**错误**: Failed to convert PDF

**解决方案:**
1. 检查PDF文件大小 (<20MB)
2. 尝试其他PDF文件
3. 检查浏览器控制台错误
4. 确保网络稳定

---

## 📈 性能优化

### 1. PDF压缩

如果图片过大，在 `lib/pdf-processor.js` 中调整:

```javascript
export async function processPDFFile(pdfBuffer, options = {}) {
  const { scale = 1.5 } = options; // 降低scale提升速度
  // ...
}
```

### 2. API超时设置

在 `background/service-worker.js` 中调整:

```javascript
const CONFIG = {
  TIMEOUT: 30000, // 减少到30秒
  RETRY_ATTEMPTS: 2 // 减少重试次数
};
```

### 3. 缓存结果

可以在 Chrome Storage 中缓存识别结果:

```javascript
// 保存结果
await chrome.storage.local.set({
  [`cache_${pdfHash}`]: result
});

// 读取缓存
const cached = await chrome.storage.local.get(`cache_${pdfHash}`);
```

---

## 📞 技术支持

### 获取帮助

1. **查看日志**:
   - Chrome: F12 → Console
   - Vercel: `vercel logs`

2. **测试API**:
   ```bash
   curl -X POST https://your-api.vercel.app/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"image":"data:image/png;base64,test","fileName":"test.pdf"}'
   ```

3. **联系支持**:
   - Email: support@your-company.com
   - GitHub Issues: 创建issue
   - 文档: https://docs.your-company.com

---

## ✅ 部署检查清单

在正式发布前，请确认:

- [ ] 后端API已部署到Vercel
- [ ] OpenAI API Key已配置
- [ ] 扩展中的API_URL已更新
- [ ] 测试上传PDF功能正常
- [ ] 测试AI识别功能正常
- [ ] 测试Procore自动化功能正常
- [ ] 所有错误情况都能正确处理
- [ ] 用户文档已准备完整
- [ ] 安装脚本已测试
- [ ] 图标已添加（可选）

---

## 🎉 完成！

恭喜！你已经完成了 Invoice Automation Chrome Extension 的完整部署。

**下一步:**
- 分发给测试用户
- 收集反馈
- 持续优化

**Need Help?** 查看完整文档或联系技术支持。

---

**版本**: 1.0.0
**更新日期**: 2025-10-29
**状态**: ✅ Production Ready
