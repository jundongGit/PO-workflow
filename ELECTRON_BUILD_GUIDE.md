# Electron 桌面应用打包指南

本指南将帮助您将 Invoice Automation 应用打包成 macOS 和 Windows 桌面应用。

## 目录
- [前置要求](#前置要求)
- [准备图标](#准备图标)
- [打包 macOS 应用](#打包-macos-应用)
- [打包 Windows 应用](#打包-windows-应用)
- [跨平台打包](#跨平台打包)
- [常见问题](#常见问题)

---

## 前置要求

### 1. 安装依赖
确保所有依赖已安装：
```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client && npm install

# 安装服务器端依赖
cd ../server && npm install

# 返回根目录
cd ..
```

### 2. 系统要求
- **macOS 打包**: 需要在 macOS 系统上进行
- **Windows 打包**: 可以在 macOS、Linux 或 Windows 上进行
- **Node.js**: 版本 ≥ 16.x
- **npm**: 版本 ≥ 8.x

---

## 准备图标

应用图标需要放置在 `assets` 目录中，不同平台需要不同格式的图标。

### macOS 图标 (.icns)

**推荐尺寸**: 1024x1024px

**创建步骤**:

1. **准备图片**: 创建一个 1024x1024px 的 PNG 图片

2. **使用在线工具转换**:
   - 访问 https://cloudconvert.com/png-to-icns
   - 上传您的 PNG 图片
   - 下载生成的 .icns 文件

3. **或使用命令行**（仅 macOS）:
   ```bash
   # 创建 iconset 目录
   mkdir icon.iconset

   # 生成不同尺寸
   sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
   sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
   sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
   sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
   sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png

   # 生成 icns 文件
   iconutil -c icns icon.iconset -o assets/icon.icns
   ```

4. **保存到**: `assets/icon.icns`

### Windows 图标 (.ico)

**推荐尺寸**: 256x256px（包含多个尺寸）

**创建步骤**:

1. **使用在线工具**:
   - 访问 https://icoconvert.com/
   - 上传您的 PNG 图片
   - 选择多个尺寸：16x16, 32x32, 48x48, 64x64, 128x128, 256x256
   - 下载生成的 .ico 文件

2. **保存到**: `assets/icon.ico`

### Linux 图标 (.png)

**推荐尺寸**: 512x512px

- 保存为: `assets/icon.png`

---

## 打包 macOS 应用

### 方法 1: 打包 DMG 和 ZIP

```bash
# 确保在项目根目录
npm run electron:build:mac
```

**输出位置**: `dist/` 目录
- `Invoice Automation-1.0.0.dmg` - DMG 安装包
- `Invoice Automation-1.0.0-mac.zip` - ZIP 压缩包

### 方法 2: 仅打包 DMG

修改 `package.json`:
```json
"mac": {
  "target": ["dmg"],
  ...
}
```

然后运行：
```bash
npm run electron:build:mac
```

### 签名和公证（可选，用于分发）

如果要在 App Store 或公开分发，需要：

1. **Apple Developer 账户**
2. **证书配置**:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist",
     "entitlementsInherit": "build/entitlements.mac.plist"
   }
   ```

3. **公证**:
   ```bash
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   npm run electron:build:mac
   ```

---

## 打包 Windows 应用

### 在 macOS/Linux 上打包 Windows 应用

**要求**: 需要安装 `wine` (仅用于代码签名)

```bash
# macOS 安装 wine (可选)
brew install --cask wine-stable

# 打包 Windows 应用
npm run electron:build:win
```

**输出位置**: `dist/` 目录
- `Invoice Automation Setup 1.0.0.exe` - NSIS 安装程序
- `Invoice Automation 1.0.0.exe` - 便携版（无需安装）

### 在 Windows 上打包

```bash
# Windows PowerShell 或 CMD
npm run electron:build:win
```

### 自定义安装程序

修改 `package.json`:
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64", "ia32"]  // 支持 32 位和 64 位
    }
  ],
  "icon": "assets/icon.ico"
}
```

### NSIS 安装程序选项

添加到 `package.json`:
```json
"nsis": {
  "oneClick": false,           // 允许用户选择安装路径
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "Invoice Automation"
}
```

---

## 跨平台打包

### 同时打包 macOS 和 Windows

```bash
npm run electron:build:all
```

**注意**:
- 在 macOS 上运行：可以同时打包 macOS 和 Windows
- 在 Linux 上运行：可以同时打包 Linux 和 Windows
- 在 Windows 上运行：只能打包 Windows

---

## 打包配置说明

### 文件包含/排除

在 `package.json` 中配置：

```json
"build": {
  "files": [
    "electron/**/*",
    "client/build/**/*",
    "!client/src",
    "!client/public"
  ],
  "extraResources": [
    {
      "from": "server",
      "to": "server",
      "filter": [
        "**/*",
        "!node_modules/@playwright/test",
        "!node_modules/playwright/.local-browsers",
        "!test",
        "!*.test.js"
      ]
    }
  ]
}
```

### 减小应用体积

1. **排除开发依赖**:
   - 确保开发依赖在 `devDependencies` 中
   - 生产依赖在 `dependencies` 中

2. **压缩选项**:
   ```json
   "build": {
     "compression": "maximum",  // maximum | normal | store
     "asar": true              // 启用 asar 打包
   }
   ```

3. **删除不需要的文件**:
   ```json
   "files": [
     "!**/*.map",       // 排除 source maps
     "!**/*.md",        // 排除 markdown 文件
     "!**/test/**"      // 排除测试文件
   ]
   ```

---

## 开发模式测试

在打包前，建议先在开发模式测试 Electron 应用：

```bash
# 启动 Electron 开发模式
npm run electron:dev
```

这将：
1. 启动后端服务器（端口 3001）
2. 启动前端开发服务器（端口 3000）
3. 打开 Electron 窗口

---

## 常见问题

### 1. 打包后应用无法启动

**症状**: 双击应用没有反应

**解决方案**:
```bash
# 查看日志
# macOS
/Applications/Invoice\ Automation.app/Contents/MacOS/Invoice\ Automation

# Windows
运行 cmd: "Invoice Automation.exe" --trace-warnings
```

### 2. 后端服务器启动失败

**症状**: 应用启动后显示空白页面

**原因**: 后端 Node.js 可能未正确打包

**解决方案**:
1. 检查 `extraResources` 配置
2. 确保 `server` 目录的 `node_modules` 已安装
3. 在 `electron/main.js` 中添加更多日志

### 3. Playwright 浏览器未找到

**症状**: 自动化功能报错 "Browser not found"

**解决方案**:
在打包前确保 Playwright 浏览器已安装：
```bash
cd server
npx playwright install chromium
```

然后在打包时包含浏览器：
```json
"extraResources": [
  {
    "from": "server/node_modules/playwright/.local-browsers",
    "to": "playwright-browsers"
  }
]
```

### 4. macOS "已损坏" 错误

**症状**: macOS 提示 "应用程序已损坏，无法打开"

**解决方案**:
```bash
# 移除隔离属性
xattr -cr /Applications/Invoice\ Automation.app

# 或允许任何来源
sudo spctl --master-disable
```

### 5. Windows 安全警告

**症状**: Windows Defender 或 SmartScreen 拦截

**解决方案**:
- 获取代码签名证书
- 或在打包配置中添加：
  ```json
  "win": {
    "signingHashAlgorithms": ["sha256"],
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
  ```

### 6. 应用体积过大

**症状**: 打包后的应用超过 500MB

**优化方案**:
1. 排除不必要的依赖
2. 使用 `asar` 打包
3. 开启最大压缩
4. 移除开发工具和测试文件

```json
"build": {
  "asar": true,
  "compression": "maximum",
  "files": [
    "!**/*.map",
    "!**/test/**",
    "!**/*.md"
  ]
}
```

---

## 自动更新（可选）

添加自动更新功能：

1. **安装依赖**:
   ```bash
   npm install electron-updater
   ```

2. **修改 `electron/main.js`**:
   ```javascript
   const { autoUpdater } = require('electron-updater');

   app.whenReady().then(() => {
     autoUpdater.checkForUpdatesAndNotify();
   });
   ```

3. **配置更新服务器**:
   ```json
   "build": {
     "publish": {
       "provider": "github",
       "owner": "your-username",
       "repo": "your-repo"
     }
   }
   ```

---

## 发布流程

### GitHub Releases

1. **创建 GitHub Token**
2. **设置环境变量**:
   ```bash
   export GH_TOKEN="your-github-token"
   ```

3. **打包并发布**:
   ```bash
   npm run electron:build:all
   ```

### 手动分发

1. 将打包好的文件上传到您的服务器
2. 提供下载链接给用户
3. 包含安装说明

---

## 总结

完整的打包流程：

```bash
# 1. 确保依赖已安装
npm install
cd client && npm install
cd ../server && npm install
cd ..

# 2. 准备图标（放到 assets/ 目录）

# 3. 构建前端（会自动执行）
cd client && npm run build && cd ..

# 4. 打包应用
# macOS:
npm run electron:build:mac

# Windows:
npm run electron:build:win

# 或同时打包:
npm run electron:build:all

# 5. 测试打包后的应用
# 在 dist/ 目录找到安装包并测试
```

---

## 技术支持

如有问题，请查看：
- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [项目 Issues](https://github.com/your-repo/issues)

---

**注意**: 首次打包可能需要较长时间，因为需要下载平台相关的依赖。后续打包会快很多。
