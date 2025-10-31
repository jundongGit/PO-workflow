/**
 * Background Service Worker
 * Handles API communication and context menu
 */

// Configuration
const CONFIG = {
  // OpenAI API Configuration
  // Please set your API key in chrome.storage or replace this value after deployment
  OPENAI_API_KEY: '',
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',

  // Update Configuration (GitHub 方案)
  // GitHub 仓库: https://github.com/jundongGit/PO-workflow
  UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/jundongGit/PO-workflow/main/chrome-extension/version.json',
  UPDATE_CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours

  TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // 2 seconds
};

// Initialize extension
chrome.runtime.onInstalled.addListener(handleInstall);

function handleInstall(details) {
  console.log('Extension installed/updated:', details.reason);

  // Create context menus
  createContextMenus();

  // Set default settings
  if (details.reason === 'install') {
    chrome.storage.local.set({
      settings: {
        apiUrl: CONFIG.API_URL,
        autoStartAutomation: false,
        showNotifications: true,
        autoCheckUpdates: true
      }
    });

    // Show welcome notification
    showNotification(
      '欢迎使用 Invoice Automation',
      '扩展已成功安装！点击工具栏图标开始使用。',
      'success'
    );
  } else if (details.reason === 'update') {
    const manifest = chrome.runtime.getManifest();
    showNotification(
      '扩展已更新',
      `Invoice Automation 已更新到 v${manifest.version}`,
      'success'
    );
  }

  // Schedule update check
  scheduleUpdateCheck();
}

// Create Context Menus
function createContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Menu for PDF links
    chrome.contextMenus.create({
      id: 'processInvoiceFromLink',
      title: '📄 用Invoice Automation处理此PDF',
      contexts: ['link'],
      targetUrlPatterns: ['*.pdf', '*/*.pdf']
    });

    // Menu for page
    chrome.contextMenus.create({
      id: 'uploadInvoicePDF',
      title: '📤 上传PDF到Invoice Automation',
      contexts: ['page']
    });
  });
}

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'processInvoiceFromLink') {
      await processInvoiceFromURL(info.linkUrl, tab);
    } else if (info.menuItemId === 'uploadInvoicePDF') {
      // Open popup or trigger file selection
      chrome.action.openPopup();
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
    showNotification('处理失败', error.message, 'error');
  }
});

// Process Invoice from URL
async function processInvoiceFromURL(url, tab) {
  try {
    showNotification('正在处理', '正在下载并分析PDF...', 'info');

    // Download PDF
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Convert to base64
    const base64 = await arrayBufferToBase64(arrayBuffer);

    // Analyze invoice
    const result = await analyzeInvoice(base64, 'downloaded.pdf');

    // Show result
    showNotification('识别完成', `Invoice: ${result.invoiceNumber}\nPO: ${result.clientOrderNumber}`, 'success');

    // Store result
    await chrome.storage.local.set({ lastExtractedData: result });

    // Open popup to review
    chrome.action.openPopup();

  } catch (error) {
    console.error('Process invoice from URL failed:', error);
    showNotification('处理失败', error.message, 'error');
  }
}

// Handle Messages from Popup and Content Scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.type);

  if (request.type === 'ANALYZE_INVOICE') {
    handleAnalyzeInvoice(request.data, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.type === 'GET_SETTINGS') {
    handleGetSettings(sendResponse);
    return true;
  }

  if (request.type === 'UPDATE_SETTINGS') {
    handleUpdateSettings(request.data, sendResponse);
    return true;
  }

  if (request.type === 'AUTOMATION_COMPLETE') {
    handleAutomationComplete(request.data, sendResponse);
    return true;
  }

  if (request.type === 'AUTOMATION_ERROR') {
    handleAutomationError(request.data, sendResponse);
    return true;
  }

  if (request.type === 'CHECK_UPDATE') {
    handleCheckUpdate(sendResponse);
    return true;
  }

  if (request.type === 'GET_UPDATE_INFO') {
    handleGetUpdateInfo(sendResponse);
    return true;
  }

  if (request.type === 'DISMISS_UPDATE') {
    handleDismissUpdate(sendResponse);
    return true;
  }
});

// Handle Analyze Invoice Request
async function handleAnalyzeInvoice(data, sendResponse) {
  try {
    const { imageData, fileName } = data;

    console.log(`Analyzing invoice: ${fileName}`);

    // Call backend API with retry logic
    const result = await analyzeInvoice(imageData, fileName);

    console.log('Analysis result:', result);

    sendResponse({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Analyze invoice failed:', error);

    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get API configuration from storage
 */
async function getApiConfig() {
  const result = await chrome.storage.local.get(['openai_api_key', 'openai_api_url']);

  const apiKey = result.openai_api_key || CONFIG.OPENAI_API_KEY;
  const apiUrl = result.openai_api_url || CONFIG.OPENAI_API_URL;

  if (!apiKey) {
    throw new Error('未配置 OpenAI API Key，请在设置页面中配置');
  }

  return { apiKey, apiUrl };
}

// Analyze Invoice using OpenAI API
async function analyzeInvoice(imageData, fileName, attempt = 1) {
  try {
    console.log(`Calling OpenAI API (attempt ${attempt}/${CONFIG.RETRY_ATTEMPTS})`);

    // Get API configuration from storage
    const { apiKey, apiUrl } = await getApiConfig();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this invoice image and extract the following information:
1. Invoice Number
2. Client Order Number (or PO Number)
3. Total Amount

Return the data in JSON format with this structure:
{
  "invoiceNumber": "extracted invoice number",
  "clientOrderNumber": "extracted client order/PO number",
  "amount": "extracted total amount",
  "confidence": {
    "invoiceNumber": "high|medium|low",
    "clientOrderNumber": "high|medium|low",
    "amount": "high|medium|low"
  }
}

If you cannot find certain information, use "N/A" for the value and "low" for confidence.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API returned ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();

    // Extract the JSON response from OpenAI
    const content = result.choices[0].message.content;

    // Parse JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire response as JSON
        extractedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('无法解析AI返回的数据格式');
    }

    // Validate and normalize response
    const normalizedResult = {
      invoiceNumber: extractedData.invoiceNumber || 'N/A',
      clientOrderNumber: extractedData.clientOrderNumber || 'N/A',
      amount: extractedData.amount || 'N/A',
      confidence: {
        invoiceNumber: extractedData.confidence?.invoiceNumber || 'low',
        clientOrderNumber: extractedData.confidence?.clientOrderNumber || 'low',
        amount: extractedData.confidence?.amount || 'low'
      },
      fileName: fileName,
      extractedAt: new Date().toISOString()
    };

    return normalizedResult;

  } catch (error) {
    console.error(`OpenAI API call failed (attempt ${attempt}):`, error);

    // Retry logic
    if (attempt < CONFIG.RETRY_ATTEMPTS && error.name !== 'AbortError') {
      console.log(`Retrying in ${CONFIG.RETRY_DELAY}ms...`);
      await sleep(CONFIG.RETRY_DELAY);
      return analyzeInvoice(imageData, fileName, attempt + 1);
    }

    // All attempts failed
    if (error.name === 'AbortError') {
      throw new Error('API请求超时，请检查网络连接');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到OpenAI API，请检查网络连接');
    } else {
      throw new Error(`AI识别失败: ${error.message}`);
    }
  }
}

// Get Settings
async function getSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    return result.settings || {};
  } catch (error) {
    console.error('Get settings failed:', error);
    return {};
  }
}

async function handleGetSettings(sendResponse) {
  try {
    const settings = await getSettings();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Update Settings
async function handleUpdateSettings(data, sendResponse) {
  try {
    await chrome.storage.local.set({ settings: data });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle Automation Complete
async function handleAutomationComplete(data, sendResponse) {
  console.log('Automation completed:', data);

  showNotification(
    '自动化完成',
    `已成功处理Invoice: ${data.invoiceNumber}`,
    'success'
  );

  // Save to history
  await saveToHistory(data);

  sendResponse({ success: true });
}

// Handle Automation Error
async function handleAutomationError(data, sendResponse) {
  console.error('Automation error:', data);

  showNotification(
    '自动化失败',
    data.error || '操作过程中出现错误',
    'error'
  );

  sendResponse({ success: true });
}

// Save to History
async function saveToHistory(data) {
  try {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];

    history.unshift({
      ...data,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });

    // Keep last 50 entries
    if (history.length > 50) {
      history.splice(50);
    }

    await chrome.storage.local.set({ history });
  } catch (error) {
    console.error('Save to history failed:', error);
  }
}

// Show Notification
function showNotification(title, message, type = 'info') {
  const iconMap = {
    success: 'icons/icon128.png',
    error: 'icons/icon128.png',
    info: 'icons/icon128.png'
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconMap[type] || iconMap.info,
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1
  });
}

// Utility Functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function arrayBufferToBase64(buffer) {
  const blob = new Blob([buffer]);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================
// Update Check Functions
// ============================================

// Schedule periodic update check
function scheduleUpdateCheck() {
  // Clear existing alarms
  chrome.alarms.clear('updateCheck');

  // Create new alarm for daily check
  chrome.alarms.create('updateCheck', {
    delayInMinutes: 1, // Check on startup after 1 minute
    periodInMinutes: 60 * 24 // Check every 24 hours
  });

  console.log('Update check scheduled');
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateCheck') {
    checkForUpdatesAuto();
  }
});

// Auto check for updates (silent unless new version found)
async function checkForUpdatesAuto() {
  try {
    const settings = await getSettings();
    if (settings.autoCheckUpdates === false) {
      console.log('Auto update check disabled');
      return;
    }

    const updateInfo = await checkForUpdates();

    if (updateInfo.hasUpdate) {
      // Save update info
      await chrome.storage.local.set({
        pendingUpdate: {
          ...updateInfo,
          checkedAt: Date.now()
        }
      });

      // Show notification
      showNotification(
        '发现新版本',
        `Invoice Automation v${updateInfo.latestVersion} 已发布！\n点击扩展图标查看详情。`,
        'info'
      );

      // Set badge
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }
  } catch (error) {
    console.error('Auto update check failed:', error);
  }
}

// Manual check for updates (always show result)
async function handleCheckUpdate(sendResponse) {
  try {
    console.log('Manual update check triggered');

    const updateInfo = await checkForUpdates();

    if (updateInfo.hasUpdate) {
      // Save update info
      await chrome.storage.local.set({
        pendingUpdate: {
          ...updateInfo,
          checkedAt: Date.now()
        }
      });

      // Set badge
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }

    sendResponse({
      success: true,
      data: updateInfo
    });

  } catch (error) {
    console.error('Manual update check failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Check for updates
async function checkForUpdates() {
  try {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;

    console.log(`Current version: ${currentVersion}`);
    console.log(`Checking for updates at: ${CONFIG.UPDATE_CHECK_URL}`);

    // Fetch version info
    const response = await fetch(CONFIG.UPDATE_CHECK_URL, {
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const versionInfo = await response.json();
    const latestVersion = versionInfo.version;

    console.log(`Latest version: ${latestVersion}`);

    // Compare versions
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseDate: versionInfo.releaseDate,
      downloadUrl: versionInfo.downloadUrl,
      changeLog: versionInfo.changeLog,
      critical: versionInfo.critical || false,
      announcement: versionInfo.announcement || ''
    };

  } catch (error) {
    console.error('Check for updates failed:', error);
    throw new Error('无法检查更新: ' + error.message);
  }
}

// Compare version strings (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

// Get update info
async function handleGetUpdateInfo(sendResponse) {
  try {
    const result = await chrome.storage.local.get('pendingUpdate');
    sendResponse({
      success: true,
      data: result.pendingUpdate || null
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Dismiss update notification
async function handleDismissUpdate(sendResponse) {
  try {
    await chrome.storage.local.remove('pendingUpdate');
    chrome.action.setBadgeText({ text: '' });

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (default behavior, but we can add custom logic here)
  console.log('Extension icon clicked');
});

console.log('Background service worker initialized');
