/**
 * Update Page Script
 * Handles the update process UI and interactions
 */

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const newVersion = urlParams.get('version');
const downloadUrl = urlParams.get('url');
const downloadId = urlParams.get('downloadId');

// DOM Elements
const elements = {
  versionText: document.getElementById('versionText'),
  statusIcon: document.getElementById('statusIcon'),
  statusText: document.getElementById('statusText'),
  statusSubtext: document.getElementById('statusSubtext'),
  downloadInfo: document.getElementById('downloadInfo'),
  downloadPath: document.getElementById('downloadPath'),
  stepsContainer: document.getElementById('stepsContainer'),
  openDownloadsBtn: document.getElementById('openDownloadsBtn'),
  openExtensionsBtn: document.getElementById('openExtensionsBtn')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (newVersion) {
    elements.versionText.textContent = `准备更新到 v${newVersion}`;
  }

  // Check if download is already in progress
  if (downloadId) {
    monitorDownload(parseInt(downloadId));
  } else if (downloadUrl) {
    startDownload(downloadUrl);
  } else {
    showError('缺少下载信息');
  }

  // Setup event listeners
  elements.openDownloadsBtn.addEventListener('click', openDownloadsFolder);
  elements.openExtensionsBtn.addEventListener('click', openExtensionsPage);
}

/**
 * Start downloading the new version
 */
async function startDownload(url) {
  try {
    updateStatus('⏬', '正在下载新版本...', '请稍候，不要关闭此页面', true);

    const downloadId = await chrome.downloads.download({
      url: url,
      filename: `InvoiceAutomation-ChromeExtension-v${newVersion}.zip`,
      saveAs: false
    });

    console.log('Download started:', downloadId);
    monitorDownload(downloadId);
  } catch (error) {
    console.error('Download failed:', error);
    showError('下载失败: ' + error.message);
  }
}

/**
 * Monitor download progress
 */
function monitorDownload(downloadId) {
  chrome.downloads.onChanged.addListener(function listener(delta) {
    if (delta.id === downloadId) {
      if (delta.state && delta.state.current === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        onDownloadComplete(downloadId);
      } else if (delta.error) {
        chrome.downloads.onChanged.removeListener(listener);
        showError('下载失败');
      }
    }
  });

  // Also check current state
  chrome.downloads.search({ id: downloadId }, (results) => {
    if (results && results.length > 0) {
      const download = results[0];
      if (download.state === 'complete') {
        onDownloadComplete(downloadId);
      } else if (download.error) {
        showError('下载失败');
      }
    }
  });
}

/**
 * Handle download completion
 */
async function onDownloadComplete(downloadId) {
  try {
    const [download] = await chrome.downloads.search({ id: downloadId });

    if (download && download.filename) {
      updateStatus('✅', '下载完成！', '请按照下方步骤完成更新', false);
      showDownloadInfo(download.filename);
      showSteps();

      // Show notification
      try {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Invoice Automation 更新',
          message: `v${newVersion} 已下载完成，请按照页面指引完成更新`,
          priority: 2
        });
      } catch (e) {
        console.error('Failed to show notification:', e);
      }
    }
  } catch (error) {
    console.error('Failed to get download info:', error);
    updateStatus('✅', '下载完成！', '请查看 Downloads 文件夹', false);
    showSteps();
  }
}

/**
 * Update status display
 */
function updateStatus(icon, text, subtext, loading) {
  elements.statusIcon.textContent = icon;
  elements.statusText.textContent = text;
  elements.statusSubtext.textContent = subtext;

  if (loading) {
    elements.statusIcon.classList.add('downloading');
  } else {
    elements.statusIcon.classList.remove('downloading');
  }
}

/**
 * Show download information
 */
function showDownloadInfo(filename) {
  elements.downloadPath.textContent = `保存位置：${filename}`;
  elements.downloadInfo.style.display = 'flex';
}

/**
 * Show update steps
 */
function showSteps() {
  elements.stepsContainer.style.display = 'block';
}

/**
 * Show error message
 */
function showError(message) {
  updateStatus('❌', '出现错误', message, false);

  // Show manual download option
  if (downloadUrl) {
    elements.stepsContainer.innerHTML = `
      <div class="step">
        <div class="step-number">!</div>
        <div class="step-content">
          <div class="step-title">手动下载</div>
          <div class="step-desc">
            自动下载失败，请点击下方按钮手动下载：
            <div style="margin-top: 12px;">
              <a href="${downloadUrl}" class="btn btn-primary" style="display: inline-flex; text-decoration: none;">
                📥 手动下载 v${newVersion}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    elements.stepsContainer.style.display = 'block';
  }
}

/**
 * Open downloads folder
 */
function openDownloadsFolder() {
  chrome.downloads.showDefaultFolder();
}

/**
 * Open extensions page
 */
function openExtensionsPage() {
  chrome.tabs.create({ url: 'chrome://extensions/' });
}
