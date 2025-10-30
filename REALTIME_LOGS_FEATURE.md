# 实时日志显示功能 - 已完成

## 功能概述

现在系统会在 Web 界面上**实时显示**每一步自动化操作的日志！无需查看后端控制台，直接在浏览器中看到所有操作进度。

## 核心特性

### 1. 实时日志流 (Server-Sent Events)

使用 SSE 技术实现服务器到客户端的实时日志推送：

```
后端日志 → SSE 流 → 浏览器实时显示
```

### 2. 可视化日志控制台

- 深色主题，易于阅读
- 按日志级别颜色编码：
  - **绿色 (INFO)**: 正常操作信息
  - **橙色 (WARN)**: 警告信息
  - **红色 (ERROR)**: 错误信息
- 自动滚动到最新日志
- 显示时间戳
- 最多保留最近 100 条日志

### 3. 零配置

页面加载后自动连接日志流，无需任何额外操作。

## 技术实现

### 后端实现

#### 1. 日志广播系统 (playwrightAutomation.js:28-79)

```javascript
// 日志监听器数组
let logListeners = [];

// 增强的日志函数 - 广播到所有监听器
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message
  };

  // 控制台输出
  console.log(`[${timestamp}] [${level}] ${message}`);

  // 广播给所有监听器
  logListeners.forEach(listener => {
    try {
      listener(logEntry);
    } catch (error) {
      // 忽略监听器错误
    }
  });
}

// 添加日志监听器
export function addLogListener(listener) {
  logListeners.push(listener);
  // 返回移除函数
  return () => {
    logListeners = logListeners.filter(l => l !== listener);
  };
}

// 清除所有监听器
export function clearLogListeners() {
  logListeners = [];
}
```

#### 2. SSE 端点 (index.js:272-292)

```javascript
// Real-time automation logs (Server-Sent Events)
app.get('/api/automation-logs', (req, res) => {
  // 设置 SSE 头部
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送连接确认
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Log stream connected'
  })}\n\n`);

  // 添加日志监听器
  const removeListener = addLogListener((logEntry) => {
    res.write(`data: ${JSON.stringify({
      type: 'log',
      ...logEntry
    })}\n\n`);
  });

  // 处理客户端断开
  req.on('close', () => {
    removeListener();
    res.end();
  });
});
```

### 前端实现

#### 1. 日志控制台 UI (n8n-upload-page.html:237-284)

```css
.log-console {
    margin-top: 20px;
    background: #1e1e1e;        /* 深色背景 */
    border-radius: 10px;
    padding: 20px;
    max-height: 400px;          /* 最大高度 */
    overflow-y: auto;           /* 自动滚动 */
    font-family: "Monaco", "Courier New", monospace;
    font-size: 12px;
    display: none;              /* 默认隐藏 */
}

.log-console.show {
    display: block;             /* 有日志时显示 */
}

.log-entry {
    margin-bottom: 8px;
    padding: 6px 10px;
    border-left: 3px solid #667eea;
    background: rgba(255,255,255,0.05);
    border-radius: 4px;
}

/* 按级别颜色编码 */
.log-entry.INFO { border-left-color: #4caf50; }   /* 绿色 */
.log-entry.WARN { border-left-color: #ff9800; }   /* 橙色 */
.log-entry.ERROR { border-left-color: #f44336; }  /* 红色 */

.log-level.INFO { background: #4caf50; color: white; }
.log-level.WARN { background: #ff9800; color: white; }
.log-level.ERROR { background: #f44336; color: white; }

.log-message {
    color: #e0e0e0;
}
```

#### 2. SSE 客户端连接 (n8n-upload-page.html:550-611)

```javascript
let eventSource = null;

// 连接日志流
function connectLogStream() {
    eventSource = new EventSource("http://localhost:3001/api/automation-logs");

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
            console.log("Log stream connected");
        } else if (data.type === "log") {
            addLogEntry(data);  // 添加日志到界面
        }
    };

    eventSource.onerror = function(error) {
        console.error("Log stream error:", error);
    };
}

// 添加日志条目
function addLogEntry(logData) {
    const logConsole = document.getElementById("logConsole");
    const logEntries = document.getElementById("logEntries");

    // 显示日志控制台
    logConsole.classList.add("show");

    // 创建日志条目
    const entry = document.createElement("div");
    entry.className = `log-entry ${logData.level}`;

    const time = new Date(logData.timestamp).toLocaleTimeString("zh-CN");

    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-level ${logData.level}">${logData.level}</span>
        <span class="log-message">${logData.message}</span>
    `;

    logEntries.appendChild(entry);

    // 自动滚动到底部
    logConsole.scrollTop = logConsole.scrollHeight;

    // 保留最近 100 条
    while (logEntries.children.length > 100) {
        logEntries.removeChild(logEntries.firstChild);
    }
}

// 页面加载时自动连接
window.addEventListener("load", function() {
    connectLogStream();
});

// 页面卸载时断开
window.addEventListener("beforeunload", function() {
    if (eventSource) {
        eventSource.close();
    }
});
```

## 使用流程

### 1. 打开上传页面

```bash
open /Users/jundong/Documents/FREEAI/Dev/PO-workflow/n8n-upload-page.html
```

或直接在浏览器中打开该文件。

### 2. 观察日志控制台

页面加载后，底部会自动连接日志流（初始隐藏）。

### 3. 上传 PDF 文件

- 点击或拖拽 PDF 文件到上传区域
- 点击"上传并开始自动化"按钮

### 4. 实时查看日志

日志控制台会自动显示，实时展示以下信息：

```
20:47:15  [INFO]  Initializing new browser instance...
20:47:18  [INFO]  Browser launched successfully
20:47:18  [INFO]  Navigating to Procore company projects page...
20:47:20  [INFO]  Login page detected, attempting auto-login...
20:47:20  [INFO]  Email field found with value: evelyn@maxion.co.nz
20:47:20  [INFO]  Clicking Continue button...
20:47:22  [INFO]  Auto-filling password...
20:47:22  [INFO]  Password filled
20:47:22  [INFO]  Clicking login button...
20:47:25  [INFO]  Login successful!
20:47:25  [INFO]  Starting automation for Client Order Number: PO12345
20:47:27  [INFO]  Searching for purchase order: PO12345
20:47:30  [INFO]  Found purchase order, opening details...
20:47:32  [INFO]  Uploading invoice PDF...
20:47:35  [INFO]  Invoice uploaded successfully
20:47:35  [INFO]  Automation completed successfully
```

## 日志示例

### 正常流程 (全部绿色 INFO)

```
[INFO] Reusing existing browser instance
[INFO] Already logged in
[INFO] Starting automation for Client Order Number: PO67890
[INFO] Searching for purchase order: PO67890
[INFO] Found purchase order
[INFO] Opening invoice modal...
[INFO] Uploading PDF file...
[INFO] PDF uploaded successfully
[INFO] Automation completed successfully
```

### 有警告的流程 (黄色 WARN)

```
[INFO] Login page detected, attempting auto-login...
[INFO] Auto-filling password...
[INFO] Clicking login button...
[WARN] Waiting for manual login completion (2FA may be required)...
[WARN] Please complete any additional verification in the browser
[INFO] Login successful!
```

### 错误情况 (红色 ERROR)

```
[INFO] Searching for purchase order: INVALID123
[ERROR] Purchase order not found: INVALID123
[ERROR] Automation failed: Could not find PO in the list
```

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         浏览器                                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │           n8n-upload-page.html                      │     │
│  │                                                     │     │
│  │  ┌──────────────────────────────────────┐         │     │
│  │  │     上传界面                          │         │     │
│  │  │  • 拖拽上传 PDF                        │         │     │
│  │  │  • 显示上传进度                        │         │     │
│  │  └──────────────────────────────────────┘         │     │
│  │                                                     │     │
│  │  ┌──────────────────────────────────────┐         │     │
│  │  │     日志控制台                         │         │     │
│  │  │  • 实时显示自动化日志                   │         │     │
│  │  │  • 按级别颜色编码                       │         │     │
│  │  │  • 自动滚动                            │         │     │
│  │  └──────────────────────────────────────┘         │     │
│  │                                                     │     │
│  │  EventSource: /api/automation-logs                 │     │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓ SSE                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Express 后端 (localhost:3001)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API 端点                                              │   │
│  │  • POST /api/upload-pdf    - 上传并提取 PDF           │   │
│  │  • POST /api/automate      - 触发自动化               │   │
│  │  • GET  /api/automation-logs - SSE 日志流             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  playwrightAutomation.js                              │   │
│  │  • log() 函数 → 广播到所有监听器                       │   │
│  │  • addLogListener() - 添加监听器                       │   │
│  │  • logListeners[] - 存储所有 SSE 连接                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Playwright 浏览器自动化                               │   │
│  │  • 打开 Chromium                                       │   │
│  │  • 自动登录 Procore                                    │   │
│  │  • 搜索 PO                                             │   │
│  │  • 上传发票                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 测试步骤

### 1. 确保服务运行

```bash
# 检查后端
curl http://localhost:3001/api/health
# 应返回: {"status":"ok","uploadedFiles":0}
```

### 2. 打开上传页面

```bash
open /Users/jundong/Documents/FREEAI/Dev/PO-workflow/n8n-upload-page.html
```

### 3. 上传测试 PDF

- 准备一个发票 PDF 文件
- 拖拽或点击上传
- 点击"上传并开始自动化"

### 4. 观察实时日志

在页面底部会看到：

```
📋 实时自动化日志
───────────────────────────────────────
20:47:15  INFO   Initializing browser...
20:47:18  INFO   Browser launched
20:47:20  INFO   Auto-filling password...
20:47:25  INFO   Login successful!
20:47:27  INFO   Starting automation...
...
```

## 日志级别说明

| 级别 | 颜色 | 用途 |
|------|------|------|
| INFO | 🟢 绿色 | 正常操作信息，如"登录成功"、"文件上传完成" |
| WARN | 🟠 橙色 | 警告信息，如"需要手动2FA验证"、"等待用户操作" |
| ERROR | 🔴 红色 | 错误信息，如"PO未找到"、"自动化失败" |

## 优势对比

| 特性 | 之前 | 现在 |
|------|------|------|
| 日志查看 | 需要查看后端控制台 | **Web 界面实时显示** ✅ |
| 用户体验 | 不知道进度，需要等待 | **实时看到每一步** ✅ |
| 问题排查 | 需要登录服务器 | **浏览器直接查看** ✅ |
| 操作可见性 | 黑盒操作 | **完全透明** ✅ |
| 技术复杂度 | 简单 | **SSE 实时流** ⭐ |

## 调试技巧

### 1. 查看 SSE 连接状态

打开浏览器开发者工具 (F12) → Network → 找到 `automation-logs`：

- Type: `eventsource`
- Status: `200 (pending)`
- 说明连接正常

### 2. 查看控制台日志

```javascript
// 浏览器控制台会显示：
Log stream connected
```

### 3. 手动测试 SSE 端点

```bash
curl -N http://localhost:3001/api/automation-logs
# 应立即返回连接消息，然后保持连接等待日志
```

## 故障排查

### 问题1: 日志控制台不显示

**可能原因**:
- SSE 连接失败
- 后端未运行

**解决方案**:
```bash
# 检查后端是否运行
lsof -ti:3001

# 查看后端日志
# 应该看到日志输出
```

### 问题2: 日志延迟显示

**可能原因**:
- 网络延迟
- 浏览器缓存

**解决方案**:
- 刷新页面 (Cmd+R)
- 清除浏览器缓存

### 问题3: 日志重复显示

**可能原因**:
- 多个页面同时打开
- SSE 连接未正确关闭

**解决方案**:
- 关闭其他上传页面
- 刷新当前页面

## 文件清单

### 修改的文件

1. **server/src/playwrightAutomation.js**
   - 添加 `logListeners` 数组
   - 增强 `log()` 函数支持广播
   - 导出 `addLogListener()` 和 `clearLogListeners()`

2. **server/src/index.js**
   - 添加 `/api/automation-logs` SSE 端点
   - 导入日志监听器函数

3. **n8n-upload-page.html**
   - 添加日志控制台 UI
   - 实现 SSE 客户端连接
   - 添加日志显示逻辑

## 总结

现在系统已经完全透明化！用户可以在 Web 界面上实时看到：

- ✅ 浏览器初始化状态
- ✅ 登录进度
- ✅ 自动化每一步操作
- ✅ 成功或失败信息
- ✅ 详细的时间戳

**下一步**: 上传一个 PDF 文件进行完整测试！

---

**更新日志**

**2025-10-24**
- ✅ 实现日志广播系统
- ✅ 添加 SSE 端点
- ✅ 创建日志控制台 UI
- ✅ 实现实时日志流
- ✅ 添加颜色编码
- ✅ 实现自动滚动
- ✅ 页面加载时自动连接

**现在可以实时看到所有自动化操作了！🎉**
