# Chrome 扩展在线更新功能指南

## 📋 功能概述

实现了完整的在线更新检查和提示功能：

### ✨ 主要特性
1. **自动检查更新** - 每24小时自动检查一次
2. **手动检查更新** - 用户可以随时手动检查
3. **版本比较** - 智能比较语义化版本号
4. **更新通知** - 发现新版本时显示通知和横幅
5. **Badge 提示** - 扩展图标显示 "NEW" 徽章
6. **更新日志** - 显示详细的更新内容
7. **一键下载** - 直接打开下载链接

## 🏗️ 架构说明

### 1. 版本信息文件 (version.json)

部署到您的服务器，供扩展检查最新版本：

```json
{
  "version": "1.2.0",
  "releaseDate": "2025-10-31",
  "downloadUrl": "https://your-server.com/downloads/InvoiceAutomation-ChromeExtension-v1.2.0.zip",
  "changeLog": [
    "新增在线更新功能",
    "优化性能",
    "修复已知问题"
  ],
  "minChromeVersion": "88",
  "critical": false,
  "announcement": "重要更新，建议尽快升级"
}
```

**字段说明：**
- `version`: 最新版本号
- `releaseDate`: 发布日期
- `downloadUrl`: 下载链接
- `changeLog`: 更新日志（数组）
- `minChromeVersion`: 最低 Chrome 版本要求
- `critical`: 是否为关键更新（强制提示）
- `announcement`: 公告消息

### 2. Background Service Worker

**已添加的功能：**
- ✅ 定时检查（每24小时）
- ✅ 版本比较算法
- ✅ 更新通知
- ✅ Badge 徽章显示
- ✅ 本地缓存更新信息

**配置项：**
```javascript
const CONFIG = {
  UPDATE_CHECK_URL: 'https://your-server.com/chrome-extension/version.json',
  UPDATE_CHECK_INTERVAL: 24 * 60 * 60 * 1000 // 24小时
};
```

### 3. Popup 界面

**更新横幅（Update Banner）：**
- 位置：页面顶部
- 显示：当有新版本时自动显示
- 内容：版本号、更新日志
- 操作：下载更新、稍后提醒

**Footer 链接：**
- "🔄 检查更新" - 手动检查
- 显示当前版本号

## 🚀 部署步骤

### 步骤 1: 准备版本信息文件

创建 `version.json` 文件并上传到服务器：

```bash
# 假设您的服务器是 your-server.com
# 上传到: https://your-server.com/chrome-extension/version.json
```

**示例目录结构：**
```
https://your-server.com/
├── chrome-extension/
│   ├── version.json           # 版本信息
│   └── downloads/
│       ├── v1.1.1.zip
│       └── v1.2.0.zip
```

### 步骤 2: 配置更新检查 URL

编辑 `background/service-worker.js`：

```javascript
const CONFIG = {
  // 方式1: 使用您自己的服务器
  UPDATE_CHECK_URL: 'https://your-server.com/chrome-extension/version.json',

  // 方式2: 使用 GitHub (推荐，免费且可靠)
  // UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/your-username/your-repo/main/chrome-extension/version.json',

  // 方式3: 使用 CDN
  // UPDATE_CHECK_URL: 'https://cdn.your-domain.com/invoice-automation/version.json',
};
```

### 步骤 3: 添加 CSS 样式

在 `popup/popup.css` 末尾添加：

```css
/* Update Banner */
.update-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.update-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.update-content {
  flex: 1;
}

.update-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.update-message {
  font-size: 11px;
  opacity: 0.9;
  line-height: 1.4;
}

.update-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.update-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.update-btn-primary {
  background: white;
  color: var(--primary-color);
}

.update-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.update-btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
}

.update-btn-secondary:hover {
  background: rgba(255,255,255,0.3);
}
```

### 步骤 4: 添加 JavaScript 逻辑

在 `popup/popup.js` 的 init 函数中添加：

```javascript
function init() {
  setupEventListeners();
  loadPreviousData();
  setupMessageListener();
  checkAutomationStatus();

  // 添加这两行
  checkForPendingUpdate();
  displayCurrentVersion();
}

// 添加这些函数
async function checkForPendingUpdate() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_UPDATE_INFO' });
    if (response.success && response.data) {
      showUpdateBanner(response.data);
    }
  } catch (error) {
    console.error('Check pending update failed:', error);
  }
}

function showUpdateBanner(updateInfo) {
  const banner = document.getElementById('updateBanner');
  const versionSpan = document.getElementById('updateVersion');
  const messageDiv = document.getElementById('updateMessage');

  versionSpan.textContent = updateInfo.latestVersion;

  // 显示前3条更新日志
  const changelog = updateInfo.changeLog.slice(0, 3).join(' • ');
  messageDiv.textContent = changelog;

  banner.style.display = 'flex';
}

async function handleCheckUpdate(event) {
  event.preventDefault();

  const link = event.target;
  link.textContent = '⏳ 检查中...';
  link.style.pointerEvents = 'none';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' });

    if (response.success) {
      const updateInfo = response.data;

      if (updateInfo.hasUpdate) {
        showUpdateBanner(updateInfo);
        alert(`发现新版本 v${updateInfo.latestVersion}！\n\n更新内容：\n${updateInfo.changeLog.join('\n')}`);
      } else {
        alert(`当前已是最新版本 v${updateInfo.currentVersion}`);
      }
    } else {
      alert('检查更新失败: ' + response.error);
    }
  } catch (error) {
    alert('检查更新失败: ' + error.message);
  } finally {
    link.textContent = '🔄 检查更新';
    link.style.pointerEvents = '';
  }
}

async function handleUpdateDownload() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_UPDATE_INFO' });
    if (response.success && response.data) {
      // 打开下载页面
      chrome.tabs.create({ url: response.data.downloadUrl });

      // 可选：显示安装指引
      alert('下载完成后请：\n1. 解压ZIP文件\n2. 打开 chrome://extensions/\n3. 点击"加载已解压的扩展程序"\n4. 选择解压后的文件夹');
    }
  } catch (error) {
    console.error('Open download failed:', error);
  }
}

async function handleUpdateDismiss() {
  try {
    await chrome.runtime.sendMessage({ type: 'DISMISS_UPDATE' });
    document.getElementById('updateBanner').style.display = 'none';
  } catch (error) {
    console.error('Dismiss update failed:', error);
  }
}

function displayCurrentVersion() {
  const manifest = chrome.runtime.getManifest();
  const versionText = document.getElementById('versionText');
  if (versionText) {
    versionText.textContent = `v${manifest.version}`;
  }
}

// 在 setupEventListeners 中添加
elements.checkUpdateLink = document.getElementById('checkUpdateLink');
elements.updateDownloadBtn = document.getElementById('updateDownloadBtn');
elements.updateDismissBtn = document.getElementById('updateDismissBtn');

elements.checkUpdateLink.addEventListener('click', handleCheckUpdate);
elements.updateDownloadBtn.addEventListener('click', handleUpdateDownload);
elements.updateDismissBtn.addEventListener('click', handleUpdateDismiss);
```

## 📱 使用说明

### 用户视角

1. **自动检查**
   - 扩展启动1分钟后首次检查
   - 之后每24小时自动检查一次
   - 发现新版本时显示系统通知
   - 扩展图标显示 "NEW" 徽章

2. **手动检查**
   - 打开扩展弹窗
   - 点击底部"🔄 检查更新"
   - 立即检查并显示结果

3. **下载更新**
   - 看到更新横幅时
   - 点击"下载更新"按钮
   - 自动打开下载页面
   - 按照提示安装新版本

### 管理员视角

1. **发布新版本**
   ```bash
   # 1. 更新代码并修改版本号
   vim chrome-extension/manifest.json  # 改为 1.2.0

   # 2. 打包
   ./package-extension.sh

   # 3. 上传到服务器
   scp InvoiceAutomation-ChromeExtension-v1.2.0.zip user@server:/path/to/downloads/

   # 4. 更新 version.json
   vim version.json  # 更新版本号和下载链接
   scp version.json user@server:/path/to/chrome-extension/
   ```

2. **测试更新**
   ```bash
   # 临时修改本地扩展版本号为旧版本
   # manifest.json: "version": "1.0.0"

   # 重新加载扩展
   # chrome://extensions/ -> 点击刷新

   # 打开扩展，点击"检查更新"
   # 应该提示发现新版本
   ```

## 🛠️ 常见问题

### Q1: 更新检查失败？
**A:** 检查以下几点：
- version.json 文件是否可访问
- URL 配置是否正确
- 服务器是否支持 CORS
- 网络连接是否正常

### Q2: 如何禁用自动检查？
**A:** 在设置中关闭"自动检查更新"选项

### Q3: 版本号格式要求？
**A:** 必须使用语义化版本号：`主版本.次版本.修订号`
- 正确：1.0.0, 1.2.3, 2.0.0
- 错误：1.0, v1.2.3, 1.2.3-beta

### Q4: 如何配置 CORS？
**A:** 在服务器上添加响应头：
```nginx
# Nginx 配置
location /chrome-extension/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods GET;
}
```

## 🎯 推荐部署方案

### 方案 1: GitHub (推荐)

**优点：**
- 免费
- 可靠
- 版本控制
- CDN 加速

**步骤：**
1. 在 GitHub 仓库中创建 `chrome-extension/version.json`
2. 使用 GitHub Releases 发布版本
3. 配置 UPDATE_CHECK_URL 为 Raw URL

**示例：**
```javascript
UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/username/repo/main/chrome-extension/version.json'
```

### 方案 2: 自己的服务器

**优点：**
- 完全控制
- 可以收集统计数据
- 可以个性化定制

**步骤：**
1. 部署 version.json 到服务器
2. 配置 CORS
3. 设置 CDN 加速（可选）

## 📊 监控和统计

可以在服务器端记录更新检查请求：

```javascript
// 在 checkForUpdates 函数中添加
await fetch(CONFIG.UPDATE_CHECK_URL + '?client_version=' + currentVersion);
```

服务器端可以收集：
- 当前版本分布
- 检查更新频率
- 地理位置分布

## 🎉 完成！

现在您的 Chrome 扩展已经支持在线更新功能了！
