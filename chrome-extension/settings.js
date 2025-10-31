/**
 * Settings Page
 * Configuration interface for API keys and update settings
 */

// DOM Elements
const elements = {
  apiKeyInput: document.getElementById('apiKeyInput'),
  apiUrlInput: document.getElementById('apiUrlInput'),
  toggleVisibilityBtn: document.getElementById('toggleVisibilityBtn'),
  eyeIcon: document.getElementById('eyeIcon'),
  testApiBtn: document.getElementById('testApiBtn'),
  saveBtn: document.getElementById('saveBtn'),
  autoUpdateCheck: document.getElementById('autoUpdateCheck'),
  currentVersion: document.getElementById('currentVersion'),
  lastCheckTime: document.getElementById('lastCheckTime'),
  checkUpdateBtn: document.getElementById('checkUpdateBtn'),
  statusMessage: document.getElementById('statusMessage'),
  statusIcon: document.getElementById('statusIcon'),
  statusText: document.getElementById('statusText')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  displayVersion();
  await loadLastCheckTime();
});

/**
 * Load saved settings from chrome.storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'openai_api_key',
      'openai_api_url',
      'auto_update_enabled'
    ]);

    // Load API Key (masked for security)
    if (result.openai_api_key) {
      elements.apiKeyInput.value = result.openai_api_key;
    }

    // Load API URL
    if (result.openai_api_url) {
      elements.apiUrlInput.value = result.openai_api_url;
    } else {
      elements.apiUrlInput.value = 'https://api.openai.com/v1/chat/completions';
    }

    // Load auto update setting
    elements.autoUpdateCheck.checked = result.auto_update_enabled !== false;
  } catch (error) {
    console.error('Load settings failed:', error);
    showStatus('error', '加载设置失败');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle API Key visibility
  elements.toggleVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);

  // Test API connection
  elements.testApiBtn.addEventListener('click', testApiConnection);

  // Save settings
  elements.saveBtn.addEventListener('click', saveSettings);

  // Check for updates
  elements.checkUpdateBtn.addEventListener('click', checkForUpdates);

  // Auto update checkbox
  elements.autoUpdateCheck.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ auto_update_enabled: e.target.checked });
    showStatus('success', e.target.checked ? '已启用自动更新' : '已禁用自动更新');
  });
}

/**
 * Toggle API Key visibility
 */
function toggleApiKeyVisibility() {
  const isPassword = elements.apiKeyInput.type === 'password';
  elements.apiKeyInput.type = isPassword ? 'text' : 'password';

  // Update icon
  if (isPassword) {
    elements.eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    elements.eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

/**
 * Test API connection
 */
async function testApiConnection() {
  const apiKey = elements.apiKeyInput.value.trim();
  const apiUrl = elements.apiUrlInput.value.trim();

  if (!apiKey) {
    showStatus('error', '请输入 API Key');
    return;
  }

  // Show loading
  elements.testApiBtn.disabled = true;
  elements.testApiBtn.textContent = '🔄 测试中...';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: 'Test connection' }
        ],
        max_tokens: 5
      })
    });

    if (response.ok) {
      showStatus('success', '✅ API 连接测试成功！');
    } else {
      const error = await response.json();
      showStatus('error', `❌ API 测试失败: ${error.error?.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('API test failed:', error);
    showStatus('error', `❌ 连接失败: ${error.message}`);
  } finally {
    elements.testApiBtn.disabled = false;
    elements.testApiBtn.textContent = '🧪 测试连接';
  }
}

/**
 * Save settings to chrome.storage
 */
async function saveSettings() {
  const apiKey = elements.apiKeyInput.value.trim();
  const apiUrl = elements.apiUrlInput.value.trim();

  if (!apiKey) {
    showStatus('error', '请输入 API Key');
    return;
  }

  if (!apiUrl) {
    showStatus('error', '请输入 API 地址');
    return;
  }

  // Validate API URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    showStatus('error', 'API 地址格式不正确');
    return;
  }

  // Show loading
  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = '💾 保存中...';

  try {
    await chrome.storage.local.set({
      openai_api_key: apiKey,
      openai_api_url: apiUrl,
      auto_update_enabled: elements.autoUpdateCheck.checked
    });

    showStatus('success', '✅ 设置保存成功！');

    // Reload extension to apply settings
    setTimeout(() => {
      showStatus('info', '正在重新加载扩展...');
    }, 1000);

    setTimeout(() => {
      chrome.runtime.reload();
    }, 2000);
  } catch (error) {
    console.error('Save settings failed:', error);
    showStatus('error', `❌ 保存失败: ${error.message}`);
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.textContent = '💾 保存设置';
  }
}

/**
 * Display current version
 */
function displayVersion() {
  const manifest = chrome.runtime.getManifest();
  elements.currentVersion.textContent = `v${manifest.version}`;
}

/**
 * Load last check time
 */
async function loadLastCheckTime() {
  try {
    const result = await chrome.storage.local.get(['last_update_check']);
    if (result.last_update_check) {
      const date = new Date(result.last_update_check);
      elements.lastCheckTime.textContent = formatDateTime(date);
    } else {
      elements.lastCheckTime.textContent = '从未检查';
    }
  } catch (error) {
    console.error('Load last check time failed:', error);
  }
}

/**
 * Check for updates
 */
async function checkForUpdates() {
  elements.checkUpdateBtn.disabled = true;
  elements.checkUpdateBtn.textContent = '🔄 检查中...';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' });

    if (response.success) {
      const updateInfo = response.data;

      if (updateInfo.hasUpdate) {
        showStatus('info', `🎉 发现新版本 ${updateInfo.latestVersion}！点击扩展图标查看详情`);
      } else {
        showStatus('success', `✅ 当前已是最新版本 ${updateInfo.currentVersion}`);
      }

      // Update last check time
      await loadLastCheckTime();
    } else {
      showStatus('error', `❌ 检查更新失败: ${response.error}`);
    }
  } catch (error) {
    console.error('Check update failed:', error);
    showStatus('error', `❌ 检查更新失败: ${error.message}`);
  } finally {
    elements.checkUpdateBtn.disabled = false;
    elements.checkUpdateBtn.textContent = '🔄 立即检查更新';
  }
}

/**
 * Show status message
 */
function showStatus(type, message) {
  elements.statusMessage.className = `status-message ${type}`;
  elements.statusMessage.style.display = 'flex';

  // Set icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  elements.statusIcon.textContent = icons[type] || 'ℹ️';
  elements.statusText.textContent = message;

  // Auto hide after 5 seconds
  setTimeout(() => {
    elements.statusMessage.style.display = 'none';
  }, 5000);
}

/**
 * Format date time
 */
function formatDateTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
