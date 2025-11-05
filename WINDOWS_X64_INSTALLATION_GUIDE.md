# Invoice Automation - Windows x64 系统安装运行文档

> 适用于 Windows 10/11 (64位) 系统的完整安装和配置指南

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

---

## 📋 目录

- [系统要求](#系统要求)
- [预安装准备](#预安装准备)
- [快速安装（推荐）](#快速安装推荐)
- [详细安装步骤](#详细安装步骤)
- [环境配置](#环境配置)
- [启动应用](#启动应用)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [高级配置](#高级配置)
- [卸载说明](#卸载说明)

---

## 系统要求

### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 处理器 | Intel Core i3 或 AMD 同等产品 (x64) | Intel Core i5 或更高 |
| 内存 | 4 GB RAM | 8 GB RAM 或更多 |
| 硬盘空间 | 2 GB 可用空间 | 5 GB 可用空间 |
| 显示器 | 1280x720 分辨率 | 1920x1080 分辨率 |

### 软件要求

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| 操作系统 | Windows 10 (64位) 或 Windows 11 | 运行环境 |
| Node.js | 14.0.0 或更高（推荐 LTS 版本） | JavaScript 运行环境 |
| npm | 6.0.0 或更高（随 Node.js 安装） | 包管理器 |
| 浏览器 | Chrome / Edge / Firefox 最新版 | 访问 Web 界面 |

### 网络要求

- 稳定的互联网连接（用于下载依赖包和 API 调用）
- 能够访问以下服务：
  - npm registry (https://registry.npmjs.org)
  - OpenAI API (https://api.openai.com)
  - Procore 网站 (https://us02.procore.com)

---

## 预安装准备

### 1. 检查系统架构

确认您的 Windows 系统为 64 位：

**方法 1：通过系统信息**
1. 按 `Win + Pause/Break` 键
2. 在"系统类型"中查看，应显示"基于 x64 的电脑"

**方法 2：通过命令行**
```cmd
systeminfo | findstr /C:"系统类型"
```
应显示：`系统类型: x64-based PC`

### 2. 准备管理员权限

部分安装步骤需要管理员权限，请确保：
- 您拥有管理员账户或知道管理员密码
- 能够以管理员身份运行命令提示符

### 3. 获取必要的凭证

准备以下信息：
- **OpenAI API Key**：从 https://platform.openai.com/api-keys 获取
- **Procore 账户凭证**：您的 Procore 邮箱和密码

---

## 快速安装（推荐）

### 🚀 一键启动（最快方式）

如果您已经拥有项目文件夹：

1. **双击运行** `quick-start.bat` 文件
2. 等待自动安装和启动（首次约需 5-10 分钟）
3. 打开浏览器访问 http://localhost:3000

脚本会自动完成：
- ✅ 检查 Node.js 环境
- ✅ 安装所有依赖（server 和 client）
- ✅ 安装 Playwright Chromium 浏览器
- ✅ 创建 .env 配置文件
- ✅ 释放占用的端口
- ✅ 启动前后端服务

> **注意**：首次运行时，请在脚本创建 `.env` 文件后，停止脚本并编辑 `server\.env` 添加您的 API 密钥，然后重新运行脚本。

---

## 详细安装步骤

### 步骤 1：安装 Node.js

#### 1.1 下载 Node.js

1. 访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS（长期支持版）** Windows Installer (.msi) - 64位
3. 当前推荐版本：Node.js 18.x 或 20.x LTS

#### 1.2 安装 Node.js

1. 运行下载的 `.msi` 安装程序
2. 按照安装向导操作：
   - 接受许可协议
   - 选择安装路径（默认：`C:\Program Files\nodejs\`）
   - **重要**：确保勾选 "Add to PATH" 选项
   - 可选：勾选 "Automatically install necessary tools" 安装构建工具
3. 点击 "Install" 完成安装
4. 安装完成后点击 "Finish"

#### 1.3 验证安装

打开**命令提示符**（按 `Win + R`，输入 `cmd`，回车）：

```cmd
node --version
```
应显示：`v18.x.x` 或 `v20.x.x`

```cmd
npm --version
```
应显示：`9.x.x` 或更高

如果命令无法识别，请：
1. 重启命令提示符
2. 重启计算机
3. 检查 PATH 环境变量（见下文）

#### 1.4 配置 npm 镜像（可选，加速下载）

如果在中国大陆，推荐配置国内镜像：

```cmd
npm config set registry https://registry.npmmirror.com
```

验证配置：
```cmd
npm config get registry
```

---

### 步骤 2：获取项目文件

#### 方法 1：从压缩包解压

1. 将项目压缩包（如 `PO-workflow.zip`）复制到您希望安装的位置
   - 推荐路径：`C:\Projects\` 或 `D:\Projects\`
   - 避免包含中文或特殊字符的路径
2. 右键点击压缩包，选择"解压到当前文件夹"
3. 解压后应得到 `PO-workflow` 文件夹

#### 方法 2：从 Git 仓库克隆（如果可用）

```cmd
cd C:\Projects
git clone <repository-url> PO-workflow
cd PO-workflow
```

#### 验证项目结构

```cmd
cd C:\Projects\PO-workflow
dir
```

应看到以下文件夹和文件：
```
client\               # 前端 React 应用
server\               # 后端 Express 服务
document\             # 文档存储目录
uploads\              # 上传文件临时目录
quick-start.bat       # Windows 批处理启动脚本
quick-start.ps1       # PowerShell 启动脚本
README.md             # 项目说明文档
WINDOWS_X64_INSTALLATION_GUIDE.md  # 本文档
```

---

### 步骤 3：安装项目依赖

#### 3.1 安装后端依赖

打开命令提示符，导航到项目目录：

```cmd
cd C:\Projects\PO-workflow\server
npm install
```

安装过程约需 2-5 分钟，会下载以下主要依赖：
- express (Web 框架)
- playwright (浏览器自动化)
- openai (OpenAI API 客户端)
- multer (文件上传处理)
- sharp (图像处理)
- pdf-poppler (PDF 处理)

如果遇到网络问题，可以重试：
```cmd
npm install --verbose
```

#### 3.2 安装前端依赖

```cmd
cd ..\client
npm install
```

安装过程约需 2-5 分钟，会下载以下主要依赖：
- react (前端框架)
- antd (UI 组件库)
- react-scripts (构建工具)

#### 3.3 安装 Playwright 浏览器

返回 server 目录并安装 Chromium 浏览器：

```cmd
cd ..\server
npx playwright install chromium
```

此步骤会：
- 下载 Chromium 浏览器（约 150-200 MB）
- 安装到：`%LOCALAPPDATA%\ms-playwright\`
- 耗时约 2-5 分钟（取决于网络速度）

验证安装：
```cmd
npx playwright --version
```

---

### 步骤 4：配置环境变量

#### 4.1 创建 .env 文件

```cmd
cd C:\Projects\PO-workflow\server
copy .env.example .env
```

#### 4.2 编辑 .env 文件

使用记事本打开配置文件：

```cmd
notepad .env
```

或使用其他文本编辑器（VS Code、Notepad++ 等）：

```cmd
code .env
```

#### 4.3 配置必要参数

编辑 `.env` 文件内容如下：

```env
# OpenAI API Configuration
# 从 https://platform.openai.com/api-keys 获取
OPENAI_API_KEY=sk-proj-your-actual-api-key-here

# Application Settings
PORT=3001
NODE_ENV=development

# Procore Login Credentials
# 您的 Procore 账户凭证
PROCORE_EMAIL=your-email@example.com
PROCORE_PASSWORD=your-actual-password-here
```

**配置说明**：

| 参数 | 说明 | 必需 | 示例值 |
|------|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ 是 | `sk-proj-abc123...` |
| `PORT` | 后端服务端口 | ❌ 否 | `3001` (默认) |
| `NODE_ENV` | 运行环境 | ❌ 否 | `development` |
| `PROCORE_EMAIL` | Procore 登录邮箱 | ✅ 是 | `user@company.com` |
| `PROCORE_PASSWORD` | Procore 登录密码 | ✅ 是 | `your-password` |

#### 4.4 保存文件

按 `Ctrl + S` 保存文件，然后关闭编辑器。

#### 4.5 验证配置

```cmd
type .env
```

确认配置已正确保存。

---

## 启动应用

### 方法 1：使用批处理脚本（最简单）

#### 启动

双击项目根目录下的 `quick-start.bat` 文件，或在命令提示符中：

```cmd
cd C:\Projects\PO-workflow
quick-start.bat
```

脚本会自动：
1. 检查 Node.js 环境
2. 检查并释放端口 3000 和 3001
3. 在新窗口启动后端服务
4. 在新窗口启动前端服务

#### 停止

关闭标题为 "Invoice Automation - Backend" 和 "Invoice Automation - Frontend" 的命令提示符窗口。

---

### 方法 2：使用 PowerShell 脚本

#### 启动

右键点击 `quick-start.ps1`，选择"使用 PowerShell 运行"

或在 PowerShell 中：

```powershell
cd C:\Projects\PO-workflow
.\quick-start.ps1
```

**如果遇到执行策略错误**：

以管理员身份运行 PowerShell：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新运行脚本。

#### 停止

在 PowerShell 窗口按 `Ctrl + C`，或关闭窗口。

---

### 方法 3：手动启动（用于调试）

#### 启动后端

打开第一个命令提示符窗口：

```cmd
cd C:\Projects\PO-workflow\server
node src\index.js
```

应看到：
```
Server running on port 3001
Playwright automation engine initialized
```

#### 启动前端

打开第二个命令提示符窗口：

```cmd
cd C:\Projects\PO-workflow\client
set BROWSER=none
npm start
```

应看到：
```
Compiled successfully!
You can now view client in the browser.
Local: http://localhost:3000
```

#### 停止

在每个窗口按 `Ctrl + C`。

---

## 验证安装

### 1. 检查服务状态

#### 后端健康检查

打开浏览器访问：
```
http://localhost:3001/api/health
```

应返回：
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T10:00:00.000Z",
  "uptime": 123.456
}
```

#### 前端界面

打开浏览器访问：
```
http://localhost:3000
```

应看到 Invoice Automation 的上传界面，包含：
- 文件拖放上传区域
- "选择 PDF 文件" 按钮
- Ant Design 样式的 UI

### 2. 测试 PDF 上传

1. 准备一个测试 PDF 发票文件
2. 在 http://localhost:3000 界面上传文件
3. 观察：
   - 上传进度显示
   - AI 提取信息显示（Invoice Number, Client Order Number, Total Amount）
   - 预览区域显示 PDF 缩略图

### 3. 检查日志

#### 后端日志

查看后端命令提示符窗口，应看到：
```
Received upload request
Processing PDF: invoice.pdf
OpenAI API call successful
Extracted information: {...}
```

#### 前端日志

在浏览器中按 `F12` 打开开发者工具，查看 Console 标签：
- 无错误信息
- 可能有网络请求日志

### 4. 测试自动化（可选）

1. 在上传界面确认提取的信息
2. 点击 "✅ Confirm and Start Automation" 按钮
3. 观察：
   - 自动打开 Chromium 浏览器窗口
   - 界面底部显示实时自动化日志
   - 浏览器自动导航到 Procore 网站

---

## 常见问题

### 问题 1：Node.js 命令无法识别

**错误信息**：
```
'node' 不是内部或外部命令，也不是可运行的程序
```

**解决方案**：

1. **重启命令提示符**：关闭并重新打开 cmd
2. **验证安装**：检查 `C:\Program Files\nodejs\` 是否存在
3. **手动添加到 PATH**：
   - 右键"此电脑" → 属性 → 高级系统设置
   - 点击"环境变量"
   - 在"系统变量"中找到 `Path`
   - 点击"编辑"，添加：
     - `C:\Program Files\nodejs\`
     - `%APPDATA%\npm`
   - 点击"确定"，重启命令提示符

---

### 问题 2：端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案 1：自动释放（推荐）**

`quick-start.bat` 脚本会自动处理端口占用。

**解决方案 2：手动释放端口**

```cmd
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 杀死进程（替换 <PID> 为实际进程 ID）
taskkill /F /PID <PID>
```

同样方法处理 3001 端口。

**解决方案 3：更改端口**

编辑 `server\.env`：
```env
PORT=3002
```

编辑 `client\package.json`：
```json
"proxy": "http://localhost:3002"
```

---

### 问题 3：npm 安装依赖失败

**错误信息**：
```
npm ERR! network timeout
npm ERR! network This is a problem related to network connectivity
```

**解决方案**：

1. **切换 npm 镜像**：
   ```cmd
   npm config set registry https://registry.npmmirror.com
   ```

2. **清理缓存**：
   ```cmd
   npm cache clean --force
   ```

3. **重试安装**：
   ```cmd
   npm install --verbose
   ```

4. **使用代理**（如果您在公司网络）：
   ```cmd
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

---

### 问题 4：Playwright 浏览器安装失败

**错误信息**：
```
Failed to download browser
```

**解决方案**：

1. **手动安装**：
   ```cmd
   cd server
   npx playwright install chromium --with-deps
   ```

2. **配置 Playwright 下载镜像**（中国大陆）：
   ```cmd
   set PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
   npx playwright install chromium
   ```

3. **验证安装**：
   ```cmd
   npx playwright --version
   ```

---

### 问题 5：OpenAI API 调用失败

**错误信息**：
```
Error: OpenAI API key not configured
```

**解决方案**：

1. **检查 .env 文件**：
   ```cmd
   type server\.env
   ```
   确认 `OPENAI_API_KEY` 已正确设置

2. **验证 API Key**：
   访问 https://platform.openai.com/api-keys
   - 确认 Key 有效且未过期
   - 确认账户有余额

3. **重启后端服务**：
   配置文件修改后需要重启

---

### 问题 6：无法访问 Procore

**错误信息**：
```
Navigation timeout exceeded
```

**解决方案**：

1. **检查网络连接**：
   在浏览器访问 https://us02.procore.com
   确认可以正常访问

2. **检查凭证**：
   验证 `server\.env` 中的 `PROCORE_EMAIL` 和 `PROCORE_PASSWORD` 正确

3. **手动登录一次**：
   第一次运行时，如果启用了 2FA，可能需要手动验证

4. **增加超时时间**（高级）：
   编辑 `server\src\playwrightAutomation.js`，增加 timeout 值

---

### 问题 7：PowerShell 脚本无法运行

**错误信息**：
```
无法加载文件 quick-start.ps1，因为在此系统上禁止运行脚本
```

**解决方案**：

以管理员身份运行 PowerShell：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

选择 `Y` (Yes) 确认。

---

### 问题 8：前端界面空白或无法加载

**可能原因**：
- 后端未启动或端口错误
- 浏览器缓存问题
- 代理配置错误

**解决方案**：

1. **检查后端状态**：
   访问 http://localhost:3001/api/health

2. **清除浏览器缓存**：
   按 `Ctrl + Shift + Delete`，清除缓存和 Cookie

3. **验证代理配置**：
   检查 `client\package.json` 中的 `"proxy": "http://localhost:3001"`

4. **查看控制台错误**：
   按 `F12`，查看 Console 和 Network 标签的错误信息

---

## 高级配置

### 1. 配置为 Windows 服务（开机自启）

使用 `node-windows` 将应用配置为 Windows 服务。

#### 安装 node-windows

```cmd
cd C:\Projects\PO-workflow\server
npm install node-windows --save
```

#### 创建服务脚本

创建 `install-service.js`：

```javascript
import { Service } from 'node-windows';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: 'Invoice Automation Backend',
  description: 'Invoice Automation Express Backend Service',
  script: join(__dirname, 'src', 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', () => {
  console.log('Service installed successfully!');
  svc.start();
});

svc.install();
```

#### 安装服务

```cmd
node install-service.js
```

#### 管理服务

- **启动**：`net start "Invoice Automation Backend"`
- **停止**：`net stop "Invoice Automation Backend"`
- **卸载**：创建 `uninstall-service.js` 并运行

---

### 2. 性能优化

#### 调整 Node.js 内存限制

编辑启动命令，增加内存限制：

```cmd
node --max-old-space-size=4096 src\index.js
```

#### 启用生产模式

编辑 `server\.env`：
```env
NODE_ENV=production
```

构建前端生产版本：
```cmd
cd client
npm run build
```

使用静态文件服务器（如 `serve`）：
```cmd
npm install -g serve
serve -s build -l 3000
```

---

### 3. 配置 HTTPS（可选）

#### 生成自签名证书

使用 OpenSSL 或 mkcert 生成证书：

```cmd
# 使用 mkcert (需要先安装)
choco install mkcert
mkcert -install
mkcert localhost 127.0.0.1
```

#### 修改后端配置

编辑 `server\src\index.js`，添加 HTTPS 支持：

```javascript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('path/to/localhost-key.pem'),
  cert: fs.readFileSync('path/to/localhost.pem')
};

const server = https.createServer(options, app);
server.listen(3001, () => {
  console.log('HTTPS Server running on port 3001');
});
```

---

### 4. 日志管理

#### 配置日志文件

安装日志库：
```cmd
npm install winston --save
```

创建日志配置（`server\src\logger.js`）：

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

在代码中使用：
```javascript
import logger from './logger.js';
logger.info('Application started');
logger.error('Error occurred', { error: err });
```

---

### 5. 数据库集成（可选）

如果需要持久化数据，可以集成数据库：

#### SQLite（轻量级）

```cmd
npm install better-sqlite3 --save
```

#### PostgreSQL（生产环境）

```cmd
npm install pg --save
```

配置连接字符串到 `.env`：
```env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_automation
```

---

## 卸载说明

### 1. 停止所有服务

关闭所有相关的命令提示符窗口，或：

```cmd
# 查找并停止 Node 进程
tasklist | findstr "node.exe"
taskkill /F /IM node.exe
```

### 2. 删除项目文件

```cmd
cd C:\Projects
rmdir /S /Q PO-workflow
```

### 3. 删除 Playwright 浏览器

```cmd
rmdir /S /Q "%LOCALAPPDATA%\ms-playwright"
```

### 4. 卸载 Node.js（可选）

1. 打开"控制面板" → "程序和功能"
2. 找到 "Node.js"，右键选择"卸载"
3. 按照向导完成卸载

### 5. 清理环境变量（可选）

1. 右键"此电脑" → 属性 → 高级系统设置
2. 环境变量 → Path
3. 删除与 Node.js 相关的路径

### 6. 清理 npm 缓存和配置

```cmd
rmdir /S /Q "%APPDATA%\npm"
rmdir /S /Q "%APPDATA%\npm-cache"
```

---

## 附录

### A. 系统路径说明

| 路径 | 说明 |
|------|------|
| `C:\Program Files\nodejs\` | Node.js 安装目录 |
| `%APPDATA%\npm\` | npm 全局模块目录 |
| `%LOCALAPPDATA%\ms-playwright\` | Playwright 浏览器缓存 |
| `C:\Projects\PO-workflow\` | 项目根目录（示例） |
| `C:\Projects\PO-workflow\server\.env` | 后端环境变量配置 |
| `C:\Projects\PO-workflow\.browser-data\` | Playwright 会话数据 |
| `C:\Projects\PO-workflow\uploads\` | 上传的 PDF 临时存储 |
| `C:\Projects\PO-workflow\document\` | 处理后的文档存储 |

---

### B. 有用的命令

#### 查看端口占用

```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

#### 查看 Node.js 进程

```cmd
tasklist | findstr node.exe
```

#### 清理项目依赖（重新安装）

```cmd
# 删除 node_modules 和 package-lock.json
cd server
rmdir /S /Q node_modules
del package-lock.json
npm install

cd ..\client
rmdir /S /Q node_modules
del package-lock.json
npm install
```

#### 查看 npm 全局配置

```cmd
npm config list
npm config get registry
npm config get proxy
```

#### 重置 npm 配置

```cmd
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
```

---

### C. 防火墙配置

如果需要从局域网其他设备访问：

1. 打开"Windows Defender 防火墙"
2. 点击"高级设置"
3. 新建入站规则：
   - 端口：3000, 3001
   - 协议：TCP
   - 操作：允许连接
   - 配置文件：全选
   - 名称：Invoice Automation

---

### D. 系统要求检查脚本

创建 `check-system.bat` 进行系统检查：

```batch
@echo off
echo ========================================
echo System Requirements Check
echo ========================================
echo.

echo Checking System Architecture...
systeminfo | findstr /C:"系统类型"
echo.

echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    npm --version
) else (
    echo Node.js is NOT installed
)
echo.

echo Checking Available Disk Space...
wmic logicaldisk get caption,freespace,size /format:table
echo.

echo Checking Network Connectivity...
ping -n 1 registry.npmjs.org >nul 2>&1
if %errorlevel% equ 0 (
    echo npm registry: OK
) else (
    echo npm registry: FAILED
)

ping -n 1 api.openai.com >nul 2>&1
if %errorlevel% equ 0 (
    echo OpenAI API: OK
) else (
    echo OpenAI API: FAILED
)
echo.

pause
```

---

### E. 备份和恢复

#### 备份配置

```cmd
cd C:\Projects\PO-workflow
copy server\.env server\.env.backup
copy client\package.json client\package.json.backup
```

#### 备份数据

```cmd
xcopy /E /I uploads uploads_backup
xcopy /E /I document document_backup
xcopy /E /I .browser-data .browser-data-backup
```

#### 恢复配置

```cmd
copy server\.env.backup server\.env
```

---

## 技术支持

### 获取帮助

- **项目文档**：参考 `README.md` 和其他文档
- **查看日志**：
  - 后端日志：命令提示符窗口
  - 前端日志：浏览器开发者工具 (F12)
- **检查配置**：验证 `.env` 文件和 `package.json`

### 报告问题

请提供以下信息：
1. 操作系统版本（如 Windows 10 Pro x64 Build 19044）
2. Node.js 版本（`node --version`）
3. npm 版本（`npm --version`）
4. 错误信息截图或日志
5. 复现步骤

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2025-11-05 | 初始版本，完整 Windows x64 安装指南 |

---

## 许可证

MIT License

---

**文档版本**: 1.0.0
**最后更新**: 2025-11-05
**适用于**: Invoice Automation v1.0.0
**平台**: Windows 10/11 (64位)

---

**🎉 恭喜！您已完成 Invoice Automation 在 Windows x64 系统上的安装和配置！**

如有问题，请参考常见问题章节或查阅项目其他文档。
