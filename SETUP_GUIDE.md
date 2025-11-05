# Invoice Automation - 部署运行指南

## 前置要求

在另一台 MacBook 上运行此项目，需要安装以下软件：

1. **Node.js** (v16 或更高版本)
   ```bash
   # 检查是否已安装
   node --version
   npm --version
   ```

2. **Git** (用于克隆代码)
   ```bash
   git --version
   ```

## 部署步骤

### 1. 获取代码

#### 方法 A: 使用 Git 克隆（如果代码已推送到 GitHub）
```bash
git clone <你的仓库地址>
cd PO-workflow
```

#### 方法 B: 直接复制代码
将整个项目文件夹复制到新 MacBook，然后进入项目目录：
```bash
cd /path/to/PO-workflow
```

### 2. 安装依赖

```bash
# 安装所有依赖（root、client、server）
npm run install-all
```

或者分别安装：
```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client && npm install && cd ..

# 安装服务端依赖
cd server && npm install && cd ..
```

### 3. 配置环境变量

创建服务端环境配置文件：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here

# Procore 配置（如果需要）
PROCORE_CLIENT_ID=your_procore_client_id
PROCORE_CLIENT_SECRET=your_procore_client_secret

# 服务器端口（默认）
PORT=3001
```

### 4. 运行项目

#### 方法 A: 开发模式（推荐）
在项目根目录运行：
```bash
npm run dev
```

这将同时启动：
- 后端服务器: http://localhost:3001
- 前端开发服务器: http://localhost:3000

#### 方法 B: 分别启动前后端

**终端 1 - 启动后端：**
```bash
cd server
npm start
```

**终端 2 - 启动前端：**
```bash
cd client
npm start
```

### 5. 访问应用

浏览器自动打开 http://localhost:3000，如果没有自动打开，请手动访问。

## 项目结构

```
PO-workflow/
├── client/                 # React 前端
│   ├── public/
│   ├── src/
│   │   ├── App.js         # 主应用组件
│   │   └── ...
│   └── package.json
├── server/                 # Node.js 后端
│   ├── src/
│   │   ├── index.js       # 服务器入口
│   │   ├── aiProcessor.js # AI 处理逻辑
│   │   └── playwrightAutomation.js
│   └── package.json
├── electron/              # Electron 桌面应用（可选）
│   └── main.js
└── package.json           # 根配置文件
```

## 常见问题

### 1. 端口被占用

如果端口 3000 或 3001 已被占用：

**查找占用端口的进程：**
```bash
lsof -i :3000
lsof -i :3001
```

**杀死进程：**
```bash
kill -9 <PID>
```

或修改端口配置：
- 前端：修改 `client/package.json` 中的启动命令
- 后端：修改 `server/.env` 中的 `PORT` 变量

### 2. 依赖安装失败

清理缓存后重新安装：
```bash
# 删除所有 node_modules
rm -rf node_modules client/node_modules server/node_modules

# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm run install-all
```

### 3. Playwright 浏览器未安装

如果看到 Playwright 相关错误：
```bash
cd server
npx playwright install chromium
```

### 4. API Key 未配置

确保在 `server/.env` 文件中配置了有效的 OpenAI API Key。

## 功能说明

1. **PDF 发票识别**
   - 上传 PDF 文件
   - AI 自动提取发票信息
   - 支持批量处理

2. **Procore 自动化**
   - 自动登录 Procore
   - 搜索和关联 PO
   - 提交发票数据

3. **实时日志**
   - 查看处理进度
   - 错误提示
   - 操作历史

## 开发命令

```bash
# 开发模式（前后端同时启动）
npm run dev

# 仅启动后端开发模式
npm run dev:server

# 仅启动前端开发模式
npm run dev:client

# 构建前端生产版本
cd client && npm run build

# Electron 开发模式
npm run electron:dev
```

## 技术栈

- **前端**: React, Ant Design, Axios
- **后端**: Node.js, Express, Multer
- **AI**: OpenAI GPT-4 Vision
- **自动化**: Playwright
- **桌面应用**: Electron (可选)

## 支持

如遇到问题，请检查：
1. Node.js 版本是否正确
2. 依赖是否完整安装
3. 环境变量是否正确配置
4. 端口是否被占用
5. 查看控制台错误日志

## 更新代码

如果代码有更新：
```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖（如果有变化）
npm run install-all

# 重启服务
npm run dev
```
