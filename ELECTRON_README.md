# Invoice Automation - Electron 桌面应用

## 概述

本项目已成功集成Electron，可以打包成独立的桌面应用程序。用户无需安装Node.js等开发环境即可使用。

## 主要特性

✅ **完整功能集成**
- React前端界面
- Node.js后端服务
- Playwright浏览器自动化（可见窗口）
- OpenAI Vision API发票识别
- 实时日志显示

✅ **用户友好**
- 一键启动应用
- 自动化操作过程可视化
- 无需技术背景即可使用

✅ **跨平台支持**
- macOS (.dmg / .zip)
- Windows (.exe / portable)
- Linux (AppImage / .deb)

## 开发模式运行

### 1. 开发环境测试

```bash
# 启动Electron开发模式（推荐在终端前台运行）
npm run electron:dev
```

这个命令会：
1. 启动后端服务器 (port 3001)
2. 启动前端开发服务器 (port 3000)
3. 打开Electron应用窗口

**注意**：首次启动需要等待React编译完成（约30-60秒），然后Electron窗口会自动打开。

### 2. 查看运行状态

启动后您会看到：
- Electron应用主窗口（显示前端界面）
- Playwright浏览器窗口（执行自动化时可见）
- 终端显示实时日志

## 生产环境打包

### 打包前准备

1. **准备应用图标**（可选）
   - Mac: `assets/icon.icns`
   - Windows: `assets/icon.ico`
   - Linux: `assets/icon.png`

   如果没有图标，应用会使用Electron默认图标（不影响功能）。

2. **设置应用信息**

编辑 `package.json` 中的构建配置：

```json
{
  "author": "您的公司名称",
  "build": {
    "appId": "com.yourcompany.invoiceautomation",
    "productName": "Invoice Automation"
  }
}
```

### 打包命令

```bash
# 打包当前平台（Mac/Windows/Linux）
npm run electron:build

# 仅打包Mac版本
npm run electron:build:mac

# 仅打包Windows版本
npm run electron:build:win

# 同时打包Mac和Windows版本
npm run electron:build:all
```

### 打包输出

打包完成后，安装包会生成在 `dist/` 目录：

**Mac:**
- `Invoice Automation-1.0.0.dmg` - DMG安装包
- `Invoice Automation-1.0.0-mac.zip` - ZIP压缩包

**Windows:**
- `Invoice Automation Setup 1.0.0.exe` - 安装版
- `Invoice Automation 1.0.0.exe` - 便携版（无需安装）

## 应用使用流程

### 用户侧操作步骤

1. **安装应用**
   - Mac: 打开.dmg文件，拖拽到Applications文件夹
   - Windows: 运行.exe安装程序或直接运行便携版

2. **启动应用**
   - 双击应用图标启动

3. **使用功能**
   - 上传PDF发票
   - AI自动识别发票信息
   - 点击"开始自动化"按钮
   - 浏览器窗口会自动打开并执行Procore workflow
   - 在最后一步手动点击保存
   - 完成！

### 首次使用配置

**重要：** 首次运行自动化前，需要：

1. 确保Procore账号已登录（自动化会记住登录状态）
2. 如果有2FA验证，需要手动完成首次登录
3. 登录状态会被保存，后续无需重复登录

## 技术架构

### 应用结构

```
Invoice Automation (Electron App)
├── Frontend (React - Port 3000)
│   ├── 文件上传界面
│   ├── 数据展示
│   └── 实时日志
├── Backend (Node.js/Express - Port 3001)
│   ├── PDF处理
│   ├── OpenAI Vision API
│   └── Playwright自动化
└── Browser (Chromium - 可见窗口)
    └── Procore自动化操作
```

### 数据存储

应用数据存储位置：

- **Mac**: `~/Library/Application Support/Invoice Automation/`
- **Windows**: `%APPDATA%/Invoice Automation/`
- **Linux**: `~/.config/Invoice Automation/`

包含：
- `.browser-data/` - Playwright浏览器数据（保存登录状态）
- `uploads/` - 上传的PDF文件
- `document/` - 处理后的文档

## 常见问题

### Q1: Electron窗口没有打开？

**解决方法：**
```bash
# 停止后台进程
lsof -ti:3000 -ti:3001 | xargs kill -9

# 在前台重新运行
npm run electron:dev
```

### Q2: Playwright浏览器窗口不显示？

**检查配置：**
确保 `server/src/playwrightAutomation.js` 中设置为：
```javascript
headless: false
```

### Q3: 打包失败？

**常见原因：**
1. 没有先构建前端：运行 `npm run electron:build:client`
2. 依赖未安装：运行 `npm install`
3. 磁盘空间不足：打包需要约500MB空间

### Q4: 打包后的应用很大？

**正常情况：**
- Mac应用: ~200-300MB
- Windows应用: ~150-250MB

包含了完整的Node.js运行时、Chromium浏览器和所有依赖。

### Q5: 如何更新应用？

用户侧：
1. 下载新版本安装包
2. 覆盖安装即可
3. 数据会自动保留

开发侧：
1. 更新代码
2. 修改 `package.json` 中的版本号
3. 重新打包发布

## 部署建议

### 分发给最终用户

1. **创建安装指南**（Word/PDF文档）
   - 系统要求
   - 安装步骤截图
   - 使用教程

2. **准备下载链接**
   - 使用云存储（如OneDrive、Google Drive）
   - 或搭建简单的下载页面

3. **提供技术支持**
   - 常见问题文档
   - 联系方式

### 后续维护

- 定期更新依赖包保证安全性
- 根据用户反馈优化功能
- 发布更新版本

## 开发者信息

### 项目结构

```
PO-workflow/
├── client/          # React前端
├── server/          # Node.js后端
├── electron/        # Electron主进程
│   └── main.js
├── assets/          # 应用图标
├── dist/            # 打包输出目录
└── package.json     # 项目配置
```

### 相关脚本

```json
{
  "electron:dev": "开发模式运行",
  "electron:build": "打包当前平台",
  "electron:build:mac": "打包Mac版本",
  "electron:build:win": "打包Windows版本",
  "electron:build:all": "打包所有平台"
}
```

## 授权与许可

根据您的需求修改此部分。

---

**享受使用Invoice Automation桌面应用！**

如有问题，请联系开发团队。
