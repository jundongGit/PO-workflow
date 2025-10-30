# ✅ 浏览器复用功能 - 已优化

## 问题：每次上传都打开新浏览器？

**之前的行为**：
- 上传第1个PDF → 打开 Chromium 窗口 #1
- 上传第2个PDF → 打开 Chromium 窗口 #2
- 上传第3个PDF → 打开 Chromium 窗口 #3
- ...结果：N个窗口同时运行 ❌

**问题**：
1. 多个浏览器窗口浪费内存
2. 可能导致浏览器锁定冲突
3. 资源浪费

## 解决方案：浏览器单例模式 ✅

**现在的行为**：
- 上传第1个PDF → 打开 Chromium 窗口 #1
- 上传第2个PDF → **复用** 窗口 #1
- 上传第3个PDF → **复用** 窗口 #1
- ...结果：始终只有1个窗口 ✅

## 技术实现

### 1. 全局浏览器实例（playwrightAutomation.js:15-17）

```javascript
// Global browser instance (singleton pattern)
let globalBrowserContext = null;
let globalBrowserPage = null;
```

### 2. 智能浏览器初始化（playwrightAutomation.js:76-119）

```javascript
async function initBrowser() {
  // 检查是否已有浏览器实例
  if (globalBrowserContext && globalBrowserPage) {
    try {
      // 测试浏览器是否还活着
      await globalBrowserPage.evaluate(() => true);
      log('Reusing existing browser instance');

      // 重置到首页
      await globalBrowserPage.goto(PROCORE_COMPANY_URL, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT_LONG
      });

      return { context: globalBrowserContext, page: globalBrowserPage };
    } catch (error) {
      log('Existing browser instance is invalid, creating new one', 'WARN');
      globalBrowserContext = null;
      globalBrowserPage = null;
    }
  }

  // 如果没有浏览器或浏览器已失效，创建新实例
  log('Initializing new browser instance...');
  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    slowMo: 100,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  // 保存为全局实例
  globalBrowserContext = context;
  globalBrowserPage = page;

  return { context, page };
}
```

### 3. 手动关闭浏览器（playwrightAutomation.js:620-638）

```javascript
export async function closeBrowser() {
  log('Closing browser instance...');

  try {
    if (globalBrowserContext) {
      await globalBrowserContext.close();
      globalBrowserContext = null;
      globalBrowserPage = null;
      log('Browser closed successfully');
    } else {
      log('No browser instance to close');
    }
  } catch (error) {
    log(`Failed to close browser: ${error.message}`, 'ERROR');
    // Force reset
    globalBrowserContext = null;
    globalBrowserPage = null;
  }
}
```

### 4. API 端点（index.js:272-288）

```javascript
// Close browser
app.post('/api/browser/close', async (req, res) => {
  try {
    await closeBrowser();
    res.json({
      success: true,
      message: 'Browser closed successfully'
    });
  } catch (error) {
    console.error('Error closing browser:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close browser',
      details: error.message
    });
  }
});
```

## 使用场景

### 场景1：连续上传多个PDF

```
用户上传 invoice1.pdf
    ↓
浏览器打开 → 自动化完成
    ↓
用户上传 invoice2.pdf
    ↓
**复用同一浏览器** → 自动化完成
    ↓
用户上传 invoice3.pdf
    ↓
**复用同一浏览器** → 自动化完成
```

**优势**：
- 只有1个浏览器窗口
- 更快的启动速度（复用已登录的会话）
- 节省内存和资源

### 场景2：手动关闭浏览器

如果你想关闭浏览器，可以：

**方法1：使用 API**
```bash
curl -X POST http://localhost:3001/api/browser/close
```

**方法2：手动关闭浏览器窗口**
- 直接点击浏览器的关闭按钮
- 下次上传时会自动创建新实例

## 日志示例

### 第一次上传（创建新浏览器）
```
[INFO] Initializing new browser instance...
[INFO] Browser initialized successfully
[INFO] Navigating to Procore company projects page...
[INFO] User already logged in - using saved session
[INFO] Step 1: Searching for project...
...
```

### 第二次上传（复用浏览器）
```
[INFO] Reusing existing browser instance
[INFO] Navigating to Procore company projects page...
[INFO] User already logged in - using saved session
[INFO] Step 1: Searching for project...
...
```

**注意差异**：第二次不会显示 "Initializing new browser instance"

## 优势总结

| 特性 | 之前 | 现在 |
|------|------|------|
| 浏览器窗口数量 | N个 | 1个 |
| 启动速度 | 慢（每次启动） | 快（复用） |
| 内存使用 | 高（N倍） | 低（1倍） |
| 会话保持 | 每次重新登录 | 保持登录 |
| 资源浪费 | ❌ 严重 | ✅ 优化 |

## 注意事项

1. **浏览器自动检测**
   - 系统会自动检测浏览器是否还活着
   - 如果浏览器崩溃或关闭，会自动创建新实例

2. **会话保持**
   - 浏览器复用意味着登录状态保持
   - 不需要每次重新登录 Procore

3. **状态重置**
   - 每次复用时，会自动导航回首页
   - 确保每次自动化从干净的状态开始

4. **手动关闭**
   - 你可以随时手动关闭浏览器
   - 也可以调用 API 关闭：`POST /api/browser/close`

## 测试验证

### 测试步骤：

1. **上传第1个PDF**
   - 观察是否打开新浏览器窗口
   - 检查日志：应该看到 "Initializing new browser instance"

2. **上传第2个PDF**
   - 观察是否复用已有窗口
   - 检查日志：应该看到 "Reusing existing browser instance"

3. **关闭浏览器**
   ```bash
   curl -X POST http://localhost:3001/api/browser/close
   ```

4. **上传第3个PDF**
   - 观察是否重新打开浏览器
   - 检查日志：应该再次看到 "Initializing new browser instance"

### 预期结果：

✅ 连续上传多个PDF时，只有1个浏览器窗口
✅ 浏览器窗口可以被复用
✅ 手动关闭后，下次自动创建新实例

---

## 更新日志

**2025-10-24**
- ✅ 实现浏览器单例模式
- ✅ 添加浏览器实例检测和复用逻辑
- ✅ 添加手动关闭浏览器功能
- ✅ 添加 API 端点 `/api/browser/close`
- ✅ 优化内存使用和启动速度

---

**文件修改**：
- `server/src/playwrightAutomation.js` - 添加浏览器复用逻辑
- `server/src/index.js` - 添加关闭浏览器 API 端点
