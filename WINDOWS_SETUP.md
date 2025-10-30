# Windows 开发环境配置指南

## 系统要求

- Windows 10/11 (64位)
- Node.js 18+ ([下载地址](https://nodejs.org/))
- Git ([下载地址](https://git-scm.com/download/win))
- Visual Studio Code 或其他代码编辑器
- Claude Code CLI

## 快速开始

### 1. 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序，勾选 "Add to PATH"
4. 安装完成后，打开 PowerShell 或 CMD，验证安装：

```bash
node --version
npm --version
```

### 2. 安装项目依赖

在项目根目录打开终端（PowerShell 或 CMD）：

```bash
# 安装根目录依赖
npm install

# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install

# 返回根目录
cd ..
```

或者使用一键安装命令：

```bash
npm run install-all
```

### 3. 配置环境变量

创建 `server/.env` 文件（复制自 `.env.example`）：

```env
OPENAI_API_KEY=your_openai_api_key_here
PROCORE_EMAIL=your_procore_email
PROCORE_PASSWORD=your_procore_password
```

### 4. 启动开发环境

#### 方式1：Web开发模式（推荐）

```bash
# 启动前后端开发服务器
npm run dev
```

访问：http://localhost:3000

#### 方式2：Electron开发模式

```bash
# 启动Electron桌面应用开发模式
npm run electron:dev
```

### 5. 构建生产版本

#### 构建Web版本

```bash
# 构建客户端
cd client
npm run build

# 启动生产服务器
cd ../server
npm start
```

#### 构建Electron桌面应用

```bash
# 仅构建Windows版本
npm run electron:build:win

# 构建所有平台（需要在相应平台上运行）
npm run electron:build:all
```

安装包位置：`dist/`

## Windows特定配置

### 安装Playwright浏览器

首次运行时，Playwright会自动下载Chromium浏览器。如果需要手动安装：

```bash
cd server
npx playwright install chromium
```

### 端口占用问题

如果端口3000或3001被占用：

```bash
# 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 结束进程（替换<PID>为实际进程ID）
taskkill /PID <PID> /F
```

### Windows Defender 警告

首次运行Electron应用时可能触发Windows Defender警告：
1. 点击"更多信息"
2. 点击"仍要运行"

## 项目结构

```
PO-workflow/
├── client/              # React前端
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Node.js后端
│   ├── src/
│   │   ├── index.js             # 服务器入口
│   │   ├── playwrightAutomation.js  # 自动化脚本
│   │   └── routes/
│   └── package.json
├── electron/            # Electron主进程
│   └── main.js
├── assets/              # 应用图标
├── package.json         # 根配置
└── README.md
```

## 常用命令

```bash
# 开发模式
npm run dev                    # 启动Web开发服务器
npm run electron:dev           # 启动Electron开发模式

# 构建
npm run electron:build:win     # 构建Windows安装包
npm run electron:build:mac     # 构建Mac安装包（需在Mac上运行）
npm run electron:build:all     # 构建所有平台

# 运行测试
cd server
npm test                       # 运行后端测试

cd ../client
npm test                       # 运行前端测试
```

## 在Windows上使用Claude Code

### 安装Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 初始化项目

```bash
claude-code init
```

### 常用Claude Code命令

```bash
# 启动Claude Code
claude-code

# 在项目中使用
cd PO-workflow
claude-code
```

## 故障排查

### 问题1：npm install 失败

**可能原因**：网络问题或权限不足

**解决方法**：
```bash
# 清除npm缓存
npm cache clean --force

# 使用淘宝镜像（如果网络慢）
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 问题2：Playwright下载失败

**解决方法**：
```bash
# 使用国内镜像
set PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright install chromium
```

### 问题3：端口已被占用

**解决方法**：
```bash
# 修改端口配置
# 编辑 server/.env，添加：
PORT=3002
```

### 问题4：构建失败

**解决方法**：
```bash
# 删除所有node_modules和锁文件
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json

# 重新安装
npm run install-all

# 清理构建缓存
cd client
rm -rf build

# 重新构建
cd ..
npm run electron:build:win
```

## 开发提示

1. **使用PowerShell或Windows Terminal**，体验更好
2. **安装Git Bash**，可以使用Unix命令
3. **使用VS Code**，集成终端和Git支持
4. **配置.gitignore**，避免提交node_modules和.env文件
5. **定期备份**，使用Git版本控制

## 技术栈

- **前端**：React 18, Axios, CSS
- **后端**：Node.js 18+, Express.js, Playwright
- **AI**：OpenAI GPT-4 Vision API
- **桌面应用**：Electron
- **自动化**：Playwright (Chromium)

## 下一步

1. 配置OpenAI API密钥
2. 配置Procore账号信息
3. 测试上传PDF发票功能
4. 测试自动化workflow
5. 根据需求调整界面和功能

## 联系与支持

如遇到问题，请查看：
- [项目README.md](./README.md)
- [Electron配置文档](./ELECTRON_README.md)
- 日志文件位置：
  - 开发模式：终端输出
  - 生产模式：`%APPDATA%\Invoice Automation\logs\app.log`

---

**祝开发顺利！**
