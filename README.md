# Invoice自动化处理系统

这是一个基于React和Node.js的Web应用，使用AI技术自动化处理Invoice PDF并在Procore网站上执行自动化操作。

## 🌟 核心特性

### 1. **AI智能识别** 🤖
   - **GPT-4 Vision识别**：使用OpenAI GPT-4o模型进行智能文档识别
   - **高准确度**：自动提取Invoice Number和Client Order Number
   - **智能备注**：AI提供识别说明和置信度评估
   - **容错机制**：AI识别失败时自动回退到正则表达式识别
   - **支持手动修正**：识别结果可人工确认和修改

### 2. **实时进度追踪** 📊
   - **动态进度条**：显示上传、转换、识别各阶段进度
   - **流光动画**：视觉反馈提升用户体验
   - **状态信息**：实时显示当前处理阶段

### 3. **文件管理** 📁
   - **智能存储**：保留原始文件名和元数据
   - **文件列表API**：查看所有已上传文件
   - **文件操作**：支持查询和删除操作
   - **10MB限制**：自动文件大小验证

### 4. **Procore自动化** 🔄
   - 自动打开Procore网站
   - 逐字符输入Client Order Number进行搜索
   - 智能识别并选择匹配的选项
   - 浏览器会话保持

## 💻 技术栈

### 前端
- **React 19**：最新版React框架
- **CSS3**：响应式设计，支持桌面/平板/移动端
- **动画效果**：流光进度条、过渡动画

### 后端
- **Node.js + Express**：服务器框架
- **OpenAI GPT-4 Vision**：AI智能文档识别
- **Poppler (pdftoppm)**：PDF转图片处理
- **pdf-parse**：PDF文本提取（备用方案）
- **Playwright**：浏览器自动化
- **Multer**：文件上传处理
- **dotenv**：环境变量管理

## 📂 项目结构

```
PO-workflow/
├── client/                      # React前端
│   ├── src/
│   │   ├── App.js              # 主应用组件（含进度条）
│   │   ├── App.css             # 样式文件（含动画）
│   │   └── index.js            # 入口文件
│   └── package.json
├── server/                      # Node.js后端
│   ├── src/
│   │   ├── index.js            # Express服务器 + 文件管理API
│   │   ├── pdfProcessor.js     # 正则表达式识别（备用）
│   │   ├── aiProcessor.js      # AI智能识别（主要）
│   │   └── playwrightAutomation.js # Playwright自动化
│   ├── .env                    # 环境变量配置
│   └── package.json
├── uploads/                     # PDF存储目录
│   └── temp/                   # PDF转图片临时目录
├── .gitignore                  # Git忽略文件配置
└── package.json                # 根配置（Workspace）
```

## ⚙️ 安装与配置

### 1. 系统依赖

**必需**：
- Node.js (v14+)
- npm或yarn
- **Poppler**: PDF转图片工具

安装Poppler（macOS）:
```bash
brew install poppler
```

### 2. 环境变量配置

在 `server/` 目录创建 `.env` 文件：

```env
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 应用配置
PORT=3001
NODE_ENV=development
```

**获取OpenAI API Key**：
1. 访问 https://platform.openai.com/api-keys
2. 创建新的API Key
3. 复制并粘贴到 `.env` 文件

### 3. 安装依赖

```bash
npm install
```

### 4. 启动应用

#### 方式一：同时启动前后端（推荐）

```bash
npm run dev
```

这将同时启动：
- 后端服务器：http://localhost:3001
- 前端应用：http://localhost:3000

#### 方式二：分别启动

**启动后端：**
```bash
cd server
npm start
```

**启动前端：**
```bash
cd client
npm start
```

## 📖 使用流程

### 步骤1: 上传PDF 📤
1. 打开浏览器访问 **http://localhost:3000**
2. 点击"选择文件"上传Invoice PDF
3. 点击"上传并识别"按钮
4. **实时进度条显示**：
   - 10% - 上传PDF文件中...
   - 30% - PDF转图片处理中...
   - 60% - AI智能识别中...
   - 100% - 识别完成

### 步骤2: 确认识别结果 ✅
1. **AI自动识别**：系统使用GPT-4 Vision识别Invoice Number和Client Order Number
2. **查看结果**：
   - ✓ 高置信度（绿色）
   - ⚠ 请手动检查（黄色）
3. **手动修正**：如有错误可直接修改输入框内容

### 步骤3: 启动自动化 🚀
1. 确认信息无误后，点击"确认并开始自动化"
2. Playwright自动打开Chromium浏览器
3. 首次使用需手动登录Procore（登录状态会保存）
4. 系统自动执行：
   - 导航到Procore页面
   - 找到项目选择器
   - 逐字符输入Client Order Number（150ms延迟）
   - 智能识别并选择匹配项

### 步骤4: 后续操作 🎯
- 浏览器保持打开状态
- 可继续手动操作或等待后续自动化步骤

## 🔧 配置说明

### AI识别配置
**主识别方式**：`server/src/aiProcessor.js`
- 使用 GPT-4o Vision API
- PDF转图片：系统 `pdftoppm` 命令
- 自动提取结构化JSON数据

**备用方式**：`server/src/pdfProcessor.js`
- 正则表达式模式匹配
- 支持多种Invoice格式

### Procore自动化配置
**URL配置**：`server/src/playwrightAutomation.js:3`
```javascript
const PROCORE_URL = 'https://us02.procore.com/598134325648131/company/home/list';
```

**选择器配置**：`server/src/playwrightAutomation.js:67`
```javascript
const pickerSelector = '.StyledPickerContainer-gUbfwb, [class*="StyledPickerContainer"]';
```

## 📡 API文档

### 上传和识别PDF
```http
POST /api/upload-pdf
Content-Type: multipart/form-data

参数:
- pdf: PDF文件（最大10MB）
- useAI: 是否使用AI识别（默认true）

响应:
{
  "success": true,
  "data": {
    "invoiceNumber": "38183",
    "clientOrderNumber": "3scott-06",
    "confidence": {
      "invoiceNumber": "high",
      "clientOrderNumber": "high"
    },
    "aiModel": "gpt-4o",
    "notes": "..."
  },
  "fileInfo": {
    "id": "invoice-xxx.pdf",
    "originalName": "Tax Invoice_335397.pdf",
    "fileSize": 815450,
    "uploadDate": "2025-10-24T09:41:24.000Z",
    "processingMethod": "vision-api"
  }
}
```

### 获取文件列表
```http
GET /api/files

响应:
{
  "success": true,
  "files": [...],
  "count": 10
}
```

### 删除文件
```http
DELETE /api/files/:id

响应:
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 触发自动化
```http
POST /api/automate
Content-Type: application/json

Body:
{
  "clientOrderNumber": "3scott-06",
  "invoiceNumber": "38183"
}

响应:
{
  "success": true,
  "data": {
    "message": "Successfully selected project...",
    "step": 1
  }
}
```

## ⚠️ 注意事项

### 1. OpenAI API使用
- **费用**：GPT-4 Vision API按使用量计费
- **配额**：注意API配额限制
- **备用方案**：AI识别失败时自动回退到正则表达式

### 2. 浏览器登录
- 首次使用需在Playwright打开的浏览器中手动登录Procore
- 登录状态会保存，后续无需重复登录
- 不要关闭Playwright浏览器窗口

### 3. PDF格式要求
- **推荐**：文本型PDF（AI识别准确度高）
- **支持**：扫描版PDF（通过图像识别）
- **限制**：单文件最大10MB

### 4. 网络要求
- 稳定的互联网连接
- 能访问OpenAI API (api.openai.com)
- 能访问Procore网站

## 🔍 故障排除

### AI识别失败
**症状**：返回"AI extraction failed"错误

**解决方案**：
1. 检查OpenAI API Key是否正确配置
2. 验证Poppler是否正确安装：`which pdftoppm`
3. 查看server日志了解详细错误
4. 系统会自动回退到正则表达式识别

### PDF转图片失败
**症状**：错误信息包含"pdftoppm"

**解决方案**：
```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils

# Windows
# 下载并安装 Poppler for Windows
```

### 端口占用
**症状**：服务器启动失败，提示端口已占用

**解决方案**：
```bash
# 查看端口占用
lsof -i :3000  # 前端
lsof -i :3001  # 后端

# 修改端口（可选）
# 前端：client/package.json 添加 PORT=3002
# 后端：server/.env 修改 PORT=3002
```

### OpenAI API错误
**常见错误码**：
- `401 Unauthorized`: API Key无效
- `429 Too Many Requests`: 超过配额限制
- `500 Internal Server Error`: OpenAI服务问题

**解决方案**：
- 验证API Key
- 检查OpenAI账户余额
- 稍后重试或使用备用识别方式（添加 `?useAI=false`）

## 🚀 路线图

### ✅ 已完成 (v1.0)
- [x] AI智能识别（GPT-4 Vision）
- [x] 实时进度条显示
- [x] 文件管理系统
- [x] Procore自动化（第一步）
- [x] 容错机制和备用方案

### 📋 计划中
1. **Procore深度自动化**
   - 自动填写Invoice表单
   - 自动上传PDF附件
   - 完成提交流程

2. **批量处理**
   - 多文件上传队列
   - 批量处理进度跟踪
   - 结果批量导出

3. **数据持久化**
   - 文件元数据数据库（MongoDB/SQLite）
   - 处理历史记录
   - 操作日志系统

4. **错误处理增强**
   - 自动重试机制
   - 错误通知系统
   - 详细错误分类

5. **用户体验优化**
   - 文件拖拽上传
   - 实时预览功能
   - 历史记录查看

## 👨‍💻 开发者信息

### 核心文件
| 文件 | 说明 |
|------|------|
| `client/src/App.js` | React主应用，包含UI和进度条逻辑 |
| `client/src/App.css` | 样式表，包含动画效果 |
| `server/src/index.js` | Express服务器和文件管理API |
| `server/src/aiProcessor.js` | AI智能识别（主要方式） |
| `server/src/pdfProcessor.js` | 正则识别（备用方式） |
| `server/src/playwrightAutomation.js` | Procore浏览器自动化 |
| `server/.env` | 环境变量配置 |

### 技术架构
```
用户界面 (React)
    ↓
Express API Server
    ├── AI识别流程：PDF → 图片 → OpenAI Vision → JSON
    ├── 备用流程：PDF → 文本提取 → 正则匹配 → JSON
    └── 自动化流程：数据 → Playwright → Procore操作
```

### 贡献指南
欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请创建Issue。

---

**最后更新**: 2025-10-24
**版本**: v1.0.0
**状态**: ✅ 生产就绪
