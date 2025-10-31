# 🧪 Web 版自动化应用测试指南

## 🚀 应用已启动

### ✅ 当前状态
- **后端服务器**: http://localhost:3001 ✅ 运行中
- **前端应用**: http://localhost:3000 ✅ 运行中
- **浏览器**: 已自动打开 http://localhost:3000

---

## 📋 测试步骤

### 第 1 步：验证前端界面（1分钟）

**访问**: http://localhost:3000

**预期看到**:
```
📄 Invoice PDF 自动化上传
上传 PDF 发票，自动提取信息并同步到 Procore

[拖拽区域]
点击或拖拽 PDF 文件到这里
仅支持 PDF 格式，最大 10MB
```

**检查项**:
- ✅ 页面标题正确显示
- ✅ 拖拽上传区域可见
- ✅ 无控制台错误（按 F12 查看）

### 第 2 步：上传测试 PDF（2分钟）

**准备测试文件**:
- 查找任意发票 PDF（或使用 `uploads/` 目录中的示例文件）
- 文件大小 < 10MB

**操作**:
1. 点击上传区域或拖拽 PDF 文件
2. 等待文件上传和 AI 处理（10-30秒）

**预期结果**:
```
✅ 信息提取完成！请确认并修改（如需要）

请确认提取的信息:
- Invoice Number (发票号): [自动识别的值]
- Client Order Number (订单号/PO号): [自动识别的值]
- Total Amount Ex GST (不含税总金额): [自动识别的值]
```

**检查项**:
- ✅ 进度条显示（0% → 100%）
- ✅ PDF 预览正常显示
- ✅ 三个字段都有值（即使不准确）
- ✅ 可以手动编辑字段值

### 第 3 步：启动自动化（3-5分钟）

**前提条件**:
- ⚠️ **必须**: Procore 账户已在浏览器中登录（使用 `.env` 配置的账号）
- ⚠️ **必须**: Client Order Number 正确（例如: KIWIWASTE-006）

**操作**:
1. 确认/修改提取的信息
2. 点击 **"✅ 确认并开始自动化"** 按钮
3. 观察自动化执行过程

**预期看到**:

**A. 步骤指示器**:
```
⏳ 上传 PDF 文件  →  ✅ 已完成
⏳ AI 提取发票信息  →  ✅ 已完成
⏳ 浏览器自动化处理  →  🔄 执行中
⏳ 完成
```

**B. 实时日志（底部区域）**:
```
📋 实时自动化日志

09:10:25  [INFO]   === Starting Procore Automation ===
09:10:25  [INFO]   Client Order Number: KIWIWASTE-006
09:10:25  [INFO]   Invoice Number: 335397
09:10:26  [INFO]   Reusing existing browser instance
09:10:27  [INFO]   Step 1: Searching for project...
09:10:30  [INFO]   ✓ Unique result found after 8 characters
09:10:33  [INFO]   ✓ Step 1 completed: Project selected
09:10:33  [INFO]   Step 2: Navigating to Commitments page...
09:10:38  [INFO]   ✓ Step 2 completed: Navigated to Commitments
09:10:38  [INFO]   Step 3: Finding PO with Client Order Number...
09:10:42  [INFO]   Found matching PO with number: Kiwiwaste --006
09:10:45  [INFO]   ✓ Step 3 completed: PO opened for editing
09:10:45  [INFO]   Step 4: Updating PO with invoice information...
09:10:48  [INFO]   Looking for Edit button...
09:10:50  [INFO]   Found Title input field
09:10:52  [INFO]   ✓ Title updated successfully
09:10:53  [INFO]   Looking for Status dropdown...
09:10:56  [INFO]   ✓ Status set to "Received"
09:10:57  [INFO]   Step 4.3: Uploading PDF file...
09:11:02  [INFO]   ✓ PDF file uploaded successfully
09:11:05  [INFO]   ✓ Invoice number filled in Description field
09:11:07  [INFO]   ✓ Total amount filled in Amount field
09:11:08  [INFO]   ✓ Step 4 completed
09:11:08  [SUCCESS] === Automation Completed Successfully ===
```

**C. 新浏览器窗口**:
- 会自动打开 Chromium 浏览器
- 可以看到自动化执行过程：
  - 选择项目
  - 点击 Commitments
  - 查找 PO
  - 填充字段
  - 上传文件

**检查项**:
- ✅ 浏览器窗口自动打开（Chromium/Playwright）
- ✅ 实时日志持续更新
- ✅ 步骤指示器从 pending → active → completed
- ✅ 最终显示 "=== Automation Completed Successfully ==="
- ✅ Web UI 显示成功消息

### 第 4 步：验证 Procore 数据（2分钟）

**在自动化浏览器窗口中检查**:

**PO 页面应该显示**:
- ✅ Title: 原标题 + Invoice Number (例如: "xxx 335397")
- ✅ Status: "Received" (绿色状态)
- ✅ Attachments: 上传的 PDF 文件
- ✅ Schedule of Values: 新增一行
  - Description: Invoice Number (335397)
  - Amount: Total Amount (1,137.81)

**注意**:
⚠️ **不会自动保存** - 这是安全设计，需要手动点击 Save 确认

---

## 🔍 常见问题排查

### 问题 1: "上传失败: Failed to process PDF"

**原因**: OpenAI API 调用失败或 PDF 格式不支持

**解决方案**:
```bash
# 检查后端日志
# 查看 shell ID: 3ac859 的输出

# 检查 .env 配置
cat /Users/jundong/Documents/FREEAI/Dev/PO-workflow/server/.env

# 确认 OPENAI_API_KEY 有效
```

### 问题 2: "自动化失败: Could not find project"

**原因**: Client Order Number 不匹配

**解决方案**:
1. 检查 Client Order Number 格式（例如: KIWIWASTE-006）
2. 在 Procore 中手动搜索确认项目存在
3. 尝试输入项目的部分名称（例如: KIWIWASTE）

### 问题 3: 浏览器没有自动打开

**原因**: Playwright 浏览器未安装

**解决方案**:
```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow/server
npx playwright install chromium
```

### 问题 4: "Login page detected"

**原因**: Procore 会话过期

**解决方案**:
- 自动化会尝试自动登录（使用 .env 中的凭据）
- 如果需要 2FA，会在浏览器中等待手动验证（最长 5 分钟）
- 完成 2FA 后自动继续

### 问题 5: "Could not find PO"

**原因**: PO 编号格式不匹配

**解决方案**:
- 检查 Commitments 页面的 Number 列格式
- 可能是 "Kiwiwaste --006" vs "KIWIWASTE-006"
- 自动化会尝试 3 种匹配策略：
  1. 完整编号
  2. 数字变体 (006, 06, 6)
  3. 项目名 + 数字

---

## 📊 测试数据示例

### 测试用例 1: 标准发票
```json
{
  "invoiceNumber": "335397",
  "clientOrderNumber": "KIWIWASTE-006",
  "totalAmount": "1137.81"
}
```

### 测试用例 2: 不同格式
```json
{
  "invoiceNumber": "INV-2024-001",
  "clientOrderNumber": "PROJECT-001",
  "totalAmount": "5000.00"
}
```

---

## 🎯 成功标准

### ✅ 测试通过条件

1. **前端功能**:
   - PDF 上传成功
   - AI 提取信息正确（或可手动修改）
   - 实时日志正常显示

2. **后端 API**:
   - `/api/upload-pdf` 返回成功
   - `/api/automate` 启动自动化
   - SSE 日志流正常工作

3. **Playwright 自动化**:
   - 浏览器自动打开
   - 4 个步骤全部完成
   - PO 字段正确填充
   - PDF 文件成功上传

4. **Procore 数据**:
   - Title 已更新
   - Status 改为 Received
   - Schedule of Values 新增一行
   - PDF 文件在 Attachments 中

---

## 🛑 停止服务

### 方法 1: 手动停止
```bash
# 前端
Ctrl + C (在运行 npm start 的终端)

# 后端
Ctrl + C (在运行 npm start 的终端)
```

### 方法 2: 使用 pkill
```bash
pkill -f "react-scripts"  # 停止前端
pkill -f "node src/index.js"  # 停止后端
```

---

## 📝 日志文件位置

- **后端日志**: 控制台输出（shell ID: 3ac859）
- **前端日志**: 浏览器控制台 (F12)
- **Playwright 日志**: `.browser-data/` 目录
- **上传文件**: `/uploads/` 目录
- **文档存储**: `/document/` 目录

---

## 🚀 下一步

### 测试成功后可以:
1. 对比 Web 版和 Chrome 扩展版的差异
2. 将 Web 版的改进移植到 Chrome 扩展
3. 部署到生产服务器（使用 Docker）
4. 添加更多测试用例

### 生产部署:
查看 `DEPLOYMENT.md` 了解如何部署到服务器

---

**版本**: Web v1.0.0 (Playwright)
**测试日期**: 2025-10-31
**状态**: ✅ 服务运行中
