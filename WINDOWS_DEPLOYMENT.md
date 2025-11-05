# Windows 系统部署指南

> Invoice Automation for Procore - Windows 终端启动方式

本指南详细说明如何在 Windows 系统上从终端运行此项目（**无需打包应用**）。

---

## 📋 前置要求

### 必需软件

1. **Node.js** (版本 >= 14.0.0)
   - 下载地址: https://nodejs.org/
   - 推荐安装 LTS 版本（目前是 v20.x 或更高）
   - 安装时勾选 "Add to PATH"

2. **Git** (可选，用于克隆项目)
   - 下载地址: https://git-scm.com/download/win

### 验证安装

打开 **命令提示符 (CMD)** 或 **PowerShell**，运行以下命令验证：

```cmd
node --version
npm --version
```

应该显示版本号，例如：
```
v20.10.0
10.2.3
```

---

## 🚀 快速启动（推荐）

### 方法 1: 使用 PowerShell 脚本 ⭐

**优点**: 自动化程度高，日志输出清晰

**步骤**:

1. **复制项目文件夹到 Windows 电脑**

2. **配置环境变量**（首次运行必需）
   ```powershell
   cd PO-workflow
   cd server
   copy .env.example .env
   notepad .env
   ```

3. **编辑 `.env` 文件**，添加必要配置:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   PROCORE_EMAIL=your-email@example.com
   PROCORE_PASSWORD=your-password
   ```

4. **运行启动脚本**

   **方式 A**: 右键点击 `quick-start.ps1` → 选择 "使用 PowerShell 运行"

   **方式 B**: 在 PowerShell 中执行:
   ```powershell
   .\quick-start.ps1
   ```

   > **注意**: 如果遇到 "无法加载文件，因为在此系统上禁止运行脚本" 错误，请参见下方故障排查。

5. **访问应用**

   脚本会自动：
   - ✅ 检查 Node.js 环境
   - ✅ 安装所有依赖（首次运行）
   - ✅ 安装 Playwright 浏览器（首次运行）
   - ✅ 检查并释放端口 3000 和 3001
   - ✅ 启动前后端服务

   等待启动完成后，打开浏览器访问: **http://localhost:3000**

6. **停止服务**: 按 `Ctrl + C`

---

### 方法 2: 使用批处理脚本

**优点**: 无需 PowerShell 权限，更兼容

**步骤**:

1. **配置环境变量**（同上）

2. **双击运行** `quick-start.bat` 文件

3. **访问应用**

   脚本会在两个独立的命令提示符窗口中启动：
   - 窗口 1: 后端服务 (Port 3001)
   - 窗口 2: 前端服务 (Port 3000)

   打开浏览器访问: **http://localhost:3000**

4. **停止服务**: 关闭对应的命令提示符窗口

---

## 🛠️ 手动启动（备选方案）

如果自动脚本无法运行，可以手动执行以下步骤：

### 步骤 1: 安装依赖（首次运行）

打开命令提示符 (CMD) 或 PowerShell:

```cmd
cd PO-workflow

REM 安装服务器依赖
cd server
npm install
cd ..

REM 安装客户端依赖
cd client
npm install
cd ..
```

### 步骤 2: 配置环境变量

```cmd
cd server
copy .env.example .env
notepad .env
```

编辑 `.env` 文件，添加必要的 API 密钥和凭据。

### 步骤 3: 安装 Playwright 浏览器（首次运行）

```cmd
cd server
npx playwright install chromium
cd ..
```

### 步骤 4: 启动服务

**方式 A: 使用两个终端窗口**

**终端 1 - 启动后端**:
```cmd
cd PO-workflow\server
node src\index.js
```

**终端 2 - 启动前端**:
```cmd
cd PO-workflow\client
set BROWSER=none
npm start
```

**方式 B: 使用单个终端（并发启动）**

1. 安装并发运行工具:
   ```cmd
   npm install -g concurrently
   ```

2. 在项目根目录创建 `package.json`:
   ```json
   {
     "name": "invoice-automation",
     "version": "1.0.0",
     "scripts": {
       "dev": "concurrently \"cd server && node src/index.js\" \"cd client && set BROWSER=none && npm start\""
     }
   }
   ```

3. 启动:
   ```cmd
   npm run dev
   ```

### 步骤 5: 访问应用

打开浏览器访问: **http://localhost:3000**

### 步骤 6: 停止服务

按 `Ctrl + C` 停止服务

---

## 🔧 故障排查

### 问题 1: PowerShell 脚本执行策略限制

**错误信息**:
```
无法加载文件 quick-start.ps1，因为在此系统上禁止运行脚本
```

**解决方案**:

以管理员身份运行 PowerShell，执行以下命令:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新运行脚本。

---

### 问题 2: 端口被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:

**方式 A: 使用脚本自动释放**（脚本会自动处理）

**方式 B: 手动释放端口**

1. 查找占用端口的进程:
   ```cmd
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

2. 记下 PID（最后一列的数字），然后结束进程:
   ```cmd
   taskkill /F /PID <PID>
   ```

   例如:
   ```cmd
   taskkill /F /PID 12345
   ```

---

### 问题 3: npm 安装依赖失败

**可能原因**: 网络问题或 npm 源问题

**解决方案**:

1. 切换到淘宝镜像源:
   ```cmd
   npm config set registry https://registry.npmmirror.com
   ```

2. 重新安装:
   ```cmd
   cd server
   npm install
   cd ..\client
   npm install
   ```

3. 如果还是失败，尝试清除缓存:
   ```cmd
   npm cache clean --force
   ```

---

### 问题 4: Playwright 浏览器下载失败

**可能原因**: 网络问题或防火墙限制

**解决方案**:

1. 使用 Playwright 镜像源:
   ```cmd
   set PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
   cd server
   npx playwright install chromium
   ```

2. 或者手动下载并安装浏览器后重试

---

### 问题 5: "Failed to process PDF" 或 AI 识别失败

**可能原因**: OpenAI API Key 未配置或无效

**解决方案**:

1. 检查 `server\.env` 文件中的 `OPENAI_API_KEY` 是否正确

2. 验证 API Key 是否有效:
   ```cmd
   cd server
   node
   ```

   然后在 Node.js 环境中测试:
   ```javascript
   require('dotenv').config();
   console.log(process.env.OPENAI_API_KEY);
   ```

3. 如果 API Key 无效，请前往 OpenAI 官网重新生成

---

### 问题 6: 前端无法连接后端

**可能原因**: CORS 或代理配置问题

**解决方案**:

1. 确认后端服务已启动（访问 http://localhost:3001/api/health）

2. 检查 `client\package.json` 中的 proxy 配置:
   ```json
   "proxy": "http://localhost:3001"
   ```

3. 重启前端服务

---

## 📝 环境变量说明

`server\.env` 文件配置说明:

```env
# OpenAI API 配置（必需）
OPENAI_API_KEY=sk-proj-xxxxx

# 应用设置
PORT=3001
NODE_ENV=development

# Procore 登录凭据（必需）
PROCORE_EMAIL=your-email@example.com
PROCORE_PASSWORD=your-password
```

**重要提示**:
- `OPENAI_API_KEY`: 必需，用于 AI 识别发票信息
- `PROCORE_EMAIL` 和 `PROCORE_PASSWORD`: 必需，用于自动登录 Procore

---

## 🎯 验证安装

启动服务后，进行以下验证:

1. **后端健康检查**:
   ```
   http://localhost:3001/api/health
   ```
   应返回: `{"status":"ok"}`

2. **前端页面**:
   ```
   http://localhost:3000
   ```
   应显示上传界面

3. **上传测试 PDF**，验证 AI 识别功能

4. **执行自动化**，验证 Playwright 功能

---

## 📂 项目结构

```
PO-workflow/
├── server/                    # 后端服务
│   ├── src/
│   │   ├── index.js          # API 服务器 (Port 3001)
│   │   ├── playwrightAutomation.js  # Playwright 自动化
│   │   ├── aiProcessor.js    # OpenAI AI 处理
│   │   └── pdfProcessor.js   # PDF 处理
│   ├── .env                  # 环境变量配置
│   └── package.json
│
├── client/                    # 前端服务
│   ├── src/
│   │   ├── App.js            # React 主组件
│   │   └── App.css
│   └── package.json          # proxy: http://localhost:3001
│
├── quick-start.ps1           # PowerShell 启动脚本
├── quick-start.bat           # 批处理启动脚本
├── quick-start.sh            # macOS/Linux 启动脚本
└── README.md                 # 项目说明
```

---

## 🔗 相关资源

- **主文档**: [README.md](README.md)
- **macOS 启动脚本**: [quick-start.sh](quick-start.sh)
- **Node.js 官网**: https://nodejs.org/
- **OpenAI API**: https://platform.openai.com/
- **Playwright 文档**: https://playwright.dev/

---

## 💡 常用命令速查

```cmd
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 安装依赖
npm install

# 启动开发服务器
npm start

# 查看端口占用
netstat -ano | findstr :3000

# 结束进程
taskkill /F /PID <PID>

# 清除 npm 缓存
npm cache clean --force
```

---

## 📞 支持

如遇到其他问题，请查看:
- 后端日志（终端输出）
- 前端控制台（浏览器 F12）
- Playwright 浏览器窗口

---

**版本**: 1.0.0
**最后更新**: 2025-11-04
**适用系统**: Windows 10/11
