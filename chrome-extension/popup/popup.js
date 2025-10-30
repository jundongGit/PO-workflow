// Import PDF processor
import * as pdfProcessor from '../lib/pdf-processor.js';

// DOM Elements
const elements = {
  uploadSection: document.getElementById('uploadSection'),
  progressSection: document.getElementById('progressSection'),
  resultSection: document.getElementById('resultSection'),
  automationSection: document.getElementById('automationSection'),
  errorSection: document.getElementById('errorSection'),

  pdfFileInput: document.getElementById('pdfFileInput'),
  dropZone: document.getElementById('dropZone'),
  fileNameDisplay: document.getElementById('fileNameDisplay'),
  fileName: document.getElementById('fileName'),
  clearFileBtn: document.getElementById('clearFileBtn'),

  progressStatus: document.getElementById('progressStatus'),
  progressPercent: document.getElementById('progressPercent'),
  progressFill: document.getElementById('progressFill'),
  step1: document.getElementById('step1'),
  step2: document.getElementById('step2'),
  step3: document.getElementById('step3'),
  step4: document.getElementById('step4'),

  confidenceBadge: document.getElementById('confidenceBadge'),
  confidenceLevel: document.getElementById('confidenceLevel'),
  invoiceNumberInput: document.getElementById('invoiceNumberInput'),
  clientOrderNumberInput: document.getElementById('clientOrderNumberInput'),
  totalAmountInput: document.getElementById('totalAmountInput'),
  invoiceConfidence: document.getElementById('invoiceConfidence'),
  clientOrderConfidence: document.getElementById('clientOrderConfidence'),
  totalAmountConfidence: document.getElementById('totalAmountConfidence'),
  notesSection: document.getElementById('notesSection'),
  notesContent: document.getElementById('notesContent'),

  editBtn: document.getElementById('editBtn'),
  automateBtn: document.getElementById('automateBtn'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),

  // Automation section elements
  automationStatusText: document.getElementById('automationStatusText'),
  logContent: document.getElementById('logContent'),
  clearLogBtn: document.getElementById('clearLogBtn'),
  autoInvoiceNumber: document.getElementById('autoInvoiceNumber'),
  autoClientOrderNumber: document.getElementById('autoClientOrderNumber'),
  autoTotalAmount: document.getElementById('autoTotalAmount'),
  stopAutomationBtn: document.getElementById('stopAutomationBtn'),
  newTaskBtn: document.getElementById('newTaskBtn'),

  // Update banner elements
  updateBanner: document.getElementById('updateBanner'),
  updateVersion: document.getElementById('updateVersion'),
  updateMessage: document.getElementById('updateMessage'),
  updateDownloadBtn: document.getElementById('updateDownloadBtn'),
  updateDismissBtn: document.getElementById('updateDismissBtn'),

  settingsLink: document.getElementById('settingsLink'),
  helpLink: document.getElementById('helpLink'),
  checkUpdateLink: document.getElementById('checkUpdateLink'),
  versionText: document.getElementById('versionText')
};

// State
let currentFile = null;
let extractedData = null;
let automationStartTime = null;
let automationActive = false;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  loadPreviousData();
  setupMessageListener();
  checkAutomationStatus();
  checkForPendingUpdate();
  displayCurrentVersion();
}

// Setup message listener for logs from content script
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTOMATION_LOG') {
      addLog(message.data.message, message.data.level || 'info');
    } else if (message.type === 'AUTOMATION_STATUS') {
      updateAutomationStatus(message.data.status, message.data.message);
    } else if (message.type === 'AUTOMATION_COMPLETE') {
      handleAutomationComplete(message.data);
    } else if (message.type === 'AUTOMATION_ERROR') {
      handleAutomationError(message.data.error);
    }
    return true;
  });
}

// Check if automation is running
async function checkAutomationStatus() {
  try {
    const result = await chrome.storage.local.get('automationStatus');
    if (result.automationStatus && result.automationStatus.active) {
      // Restore automation view
      const data = result.automationStatus.data;
      showAutomationSection(data);
      addLog('恢复自动化执行状态...', 'info');
    }
  } catch (error) {
    console.error('检查自动化状态失败:', error);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // File Input
  elements.pdfFileInput.addEventListener('change', handleFileSelect);

  // Drop Zone
  elements.dropZone.addEventListener('dragover', handleDragOver);
  elements.dropZone.addEventListener('dragleave', handleDragLeave);
  elements.dropZone.addEventListener('drop', handleDrop);
  elements.dropZone.addEventListener('click', () => elements.pdfFileInput.click());

  // Clear File
  elements.clearFileBtn.addEventListener('click', clearFile);

  // Action Buttons
  elements.editBtn.addEventListener('click', enableEditing);
  elements.automateBtn.addEventListener('click', startAutomation);
  elements.retryBtn.addEventListener('click', resetToUpload);

  // Footer Links
  elements.settingsLink.addEventListener('click', openSettings);
  elements.helpLink.addEventListener('click', openHelp);
  elements.checkUpdateLink.addEventListener('click', handleCheckUpdate);

  // Automation section
  elements.clearLogBtn.addEventListener('click', clearLogs);
  elements.stopAutomationBtn.addEventListener('click', stopAutomation);
  elements.newTaskBtn.addEventListener('click', resetToUpload);

  // Update banner
  elements.updateDownloadBtn.addEventListener('click', handleUpdateDownload);
  elements.updateDismissBtn.addEventListener('click', handleUpdateDismiss);
}

// File Selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    processFile(file);
  } else {
    showError('请选择有效的PDF文件');
  }
}

// Drag & Drop
function handleDragOver(event) {
  event.preventDefault();
  elements.dropZone.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  elements.dropZone.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  elements.dropZone.classList.remove('drag-over');

  const file = event.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    processFile(file);
  } else {
    showError('请拖拽有效的PDF文件');
  }
}

// Process PDF File
async function processFile(file) {
  try {
    currentFile = file;

    // Show file name
    elements.fileName.textContent = file.name;
    elements.fileNameDisplay.style.display = 'flex';

    // Switch to progress view
    showSection('progress');

    // Step 1: Read PDF (0-30%)
    updateProgress(0, '正在读取PDF文件...', 1);
    const arrayBuffer = await file.arrayBuffer();
    await sleep(300);
    updateProgress(30, 'PDF读取完成', 1, true);

    // Step 2: Convert to Image (30-60%)
    updateProgress(30, '正在转换为图片...', 2);
    const imageData = await pdfProcessor.processPDFFile(arrayBuffer, {
      scale: 2.0,
      format: 'png'
    });
    await sleep(300);
    updateProgress(60, '图片转换完成', 2, true);

    // Step 3: AI Analysis (60-90%)
    updateProgress(60, 'AI智能识别中...', 3);
    const result = await analyzeInvoice(imageData, file.name);
    await sleep(500);
    updateProgress(90, 'AI识别完成', 3, true);

    // Step 4: Complete (90-100%)
    updateProgress(100, '处理完成！', 4, true);
    await sleep(800);

    // Show results
    extractedData = result;
    displayResults(result);

  } catch (error) {
    console.error('PDF处理失败:', error);
    showError(error.message || 'PDF处理失败，请重试');
  }
}

// Analyze Invoice using Background Service
async function analyzeInvoice(imageData, fileName) {
  try {
    console.log('📤 Sending request to background service...');
    console.log('📄 File name:', fileName);
    console.log('📊 Data size:', Math.round(imageData.length / 1024), 'KB');

    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_INVOICE',
      data: {
        imageData: imageData,
        fileName: fileName
      }
    });

    console.log('📥 Response received:', response);

    if (response && response.success) {
      console.log('✅ Analysis successful:', response.data);
      return response.data;
    } else {
      const errorMsg = response?.error || '识别失败';
      console.error('❌ Analysis failed:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ AI识别失败 - 详细错误:', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);

    // 显示更详细的错误信息
    throw new Error(`AI识别失败: ${error.message}`);
  }
}

// Update Progress
function updateProgress(percent, status, activeStep, completed = false) {
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressStatus.textContent = status;
  elements.progressFill.style.width = `${percent}%`;

  // Update steps
  const steps = [elements.step1, elements.step2, elements.step3, elements.step4];
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 < activeStep) {
      step.classList.add('completed');
    } else if (index + 1 === activeStep) {
      step.classList.add(completed ? 'completed' : 'active');
    }
  });
}

// Display Results
function displayResults(data) {
  showSection('result');

  // Fill form fields
  elements.invoiceNumberInput.value = data.invoiceNumber || '';
  elements.clientOrderNumberInput.value = data.clientOrderNumber || '';
  elements.totalAmountInput.value = data.totalAmountExGST || '';

  // Set confidence badges
  setConfidence(elements.invoiceConfidence, data.confidence?.invoiceNumber);
  setConfidence(elements.clientOrderConfidence, data.confidence?.clientOrderNumber);
  setConfidence(elements.totalAmountConfidence, data.confidence?.totalAmountExGST);

  // Overall confidence
  const overallConfidence = calculateOverallConfidence(data.confidence);
  elements.confidenceBadge.className = `confidence-badge ${overallConfidence}`;
  elements.confidenceLevel.textContent = getConfidenceText(overallConfidence);

  // Show notes if available
  if (data.notes) {
    elements.notesContent.textContent = data.notes;
    elements.notesSection.style.display = 'block';
  }

  // Set fields to readonly initially
  setFieldsReadonly(true);

  // Save to storage
  saveExtractedData(data);
}

// Set Confidence Display
function setConfidence(element, level) {
  element.className = `field-confidence ${level || 'none'}`;
  element.textContent = getConfidenceText(level);
}

function getConfidenceText(level) {
  const texts = {
    high: '高置信度',
    medium: '中等置信度，建议检查',
    low: '低置信度，请仔细核对',
    none: '未识别'
  };
  return texts[level] || '';
}

function calculateOverallConfidence(confidence) {
  if (!confidence) return 'low';

  const values = Object.values(confidence);
  const highCount = values.filter(v => v === 'high').length;
  const mediumCount = values.filter(v => v === 'medium').length;

  if (highCount >= 2) return 'high';
  if (highCount >= 1 || mediumCount >= 2) return 'medium';
  return 'low';
}

// Enable/Disable Editing
function setFieldsReadonly(readonly) {
  elements.invoiceNumberInput.readOnly = readonly;
  elements.clientOrderNumberInput.readOnly = readonly;
  elements.totalAmountInput.readOnly = readonly;
}

function enableEditing() {
  setFieldsReadonly(false);
  elements.invoiceNumberInput.focus();
  elements.editBtn.textContent = '✓ 保存修改';
  elements.editBtn.removeEventListener('click', enableEditing);
  elements.editBtn.addEventListener('click', saveEdits);
}

function saveEdits() {
  setFieldsReadonly(true);
  elements.editBtn.textContent = '✏️ 修改信息';
  elements.editBtn.removeEventListener('click', saveEdits);
  elements.editBtn.addEventListener('click', enableEditing);

  // Update extracted data
  extractedData.invoiceNumber = elements.invoiceNumberInput.value;
  extractedData.clientOrderNumber = elements.clientOrderNumberInput.value;
  extractedData.totalAmountExGST = elements.totalAmountInput.value;

  saveExtractedData(extractedData);
}

// Check if content script is ready
async function isContentScriptReady(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return response && response.ready === true;
  } catch (error) {
    return false;
  }
}

// Ensure content script is injected
async function ensureContentScriptInjected(tabId) {
  try {
    addLog('检查 content script 状态...', 'info');

    // Check if already injected
    const isReady = await isContentScriptReady(tabId);
    if (isReady) {
      addLog('Content script 已就绪', 'success');
      return true;
    }

    addLog('正在注入 content script...', 'info');

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-scripts/procore-automation.js']
    });

    // Inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['styles/content.css']
    });

    addLog('Content script 注入完成', 'success');

    // Wait a bit for initialization
    await sleep(1000);

    return true;
  } catch (error) {
    addLog('注入 content script 失败: ' + error.message, 'error');
    throw new Error('无法注入自动化脚本，请刷新页面后重试');
  }
}

// Send message with retry
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      addLog(`发送消息到 content script (尝试 ${i + 1}/${maxRetries})...`, 'info');

      const response = await chrome.tabs.sendMessage(tabId, message);

      if (response) {
        addLog('消息发送成功', 'success');
        return response;
      }
    } catch (error) {
      console.error(`发送消息失败 (尝试 ${i + 1}/${maxRetries}):`, error);

      if (i < maxRetries - 1) {
        addLog(`连接失败，${2}秒后重试...`, 'warning');
        await sleep(2000);

        // Try to re-inject content script
        try {
          await ensureContentScriptInjected(tabId);
        } catch (injectError) {
          console.error('重新注入失败:', injectError);
        }
      } else {
        throw error;
      }
    }
  }

  throw new Error('无法连接到页面，请确保页面已完全加载');
}

// Start Automation
async function startAutomation() {
  try {
    // Validate fields
    if (!elements.clientOrderNumberInput.value || !elements.invoiceNumberInput.value) {
      showError('请确保Invoice Number和Client Order Number已填写');
      return;
    }

    // Get current data
    const automationData = {
      invoiceNumber: elements.invoiceNumberInput.value,
      clientOrderNumber: elements.clientOrderNumberInput.value,
      totalAmountExGST: elements.totalAmountInput.value
    };

    // Switch to automation view
    showAutomationSection(automationData);

    // Save automation status
    await chrome.storage.local.set({
      automationStatus: {
        active: true,
        data: automationData,
        startTime: Date.now()
      }
    });

    automationStartTime = Date.now();
    automationActive = true;

    addLog('正在查找或打开 Procore 页面...', 'info');

    // Find Procore tab or open new one
    const tabs = await chrome.tabs.query({ url: 'https://*.procore.com/*' });
    let targetTab;
    let isNewTab = false;

    if (tabs.length > 0) {
      targetTab = tabs[0];
      await chrome.tabs.update(targetTab.id, { active: true });
      addLog('找到 Procore 页面,切换到该标签页', 'success');

      // Reload the tab to ensure fresh state
      addLog('刷新页面以确保状态正常...', 'info');
      await chrome.tabs.reload(targetTab.id);
      await sleep(3000);
    } else {
      addLog('未找到 Procore 页面,正在打开新标签页...', 'info');
      targetTab = await chrome.tabs.create({
        url: 'https://us02.procore.com/598134325648131/company/home/list'
      });
      isNewTab = true;
      addLog('等待页面加载...', 'info');
      await sleep(5000); // New tab needs more time to load
    }

    // Ensure content script is loaded
    await ensureContentScriptInjected(targetTab.id);

    addLog('开始执行自动化脚本...', 'info');

    // Send message with retry
    await sendMessageWithRetry(targetTab.id, {
      type: 'START_AUTOMATION',
      data: automationData
    });

    addLog('自动化脚本已启动', 'success');

  } catch (error) {
    console.error('启动自动化失败:', error);
    addLog('启动自动化失败: ' + error.message, 'error');
    handleAutomationError(error.message);
  }
}

// Clear File
function clearFile() {
  currentFile = null;
  elements.pdfFileInput.value = '';
  elements.fileNameDisplay.style.display = 'none';
  elements.fileName.textContent = '';
}

// Show Error
function showError(message) {
  elements.errorMessage.textContent = message;
  showSection('error');
}

// Reset to Upload
function resetToUpload() {
  clearFile();
  showSection('upload');
}

// Show Section
function showSection(section) {
  elements.uploadSection.style.display = section === 'upload' ? 'block' : 'none';
  elements.progressSection.style.display = section === 'progress' ? 'block' : 'none';
  elements.resultSection.style.display = section === 'result' ? 'block' : 'none';
  elements.automationSection.style.display = section === 'automation' ? 'block' : 'none';
  elements.errorSection.style.display = section === 'error' ? 'block' : 'none';
}

// Storage Functions
async function saveExtractedData(data) {
  try {
    await chrome.storage.local.set({ lastExtractedData: data });
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

async function loadPreviousData() {
  try {
    const result = await chrome.storage.local.get('lastExtractedData');
    if (result.lastExtractedData) {
      // Optionally show previous data
      // extractedData = result.lastExtractedData;
      // displayResults(extractedData);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

// Footer Links
function openSettings(event) {
  event.preventDefault();
  // TODO: Implement settings page
  alert('设置功能即将推出');
}

function openHelp(event) {
  event.preventDefault();
  chrome.tabs.create({
    url: chrome.runtime.getURL('help.html')
  });
}

// Automation Section Functions
function showAutomationSection(data) {
  showSection('automation');

  // Clear previous logs
  elements.logContent.innerHTML = '';

  // Display automation data
  elements.autoInvoiceNumber.textContent = data.invoiceNumber || '-';
  elements.autoClientOrderNumber.textContent = data.clientOrderNumber || '-';
  elements.autoTotalAmount.textContent = data.totalAmountExGST ? `$${data.totalAmountExGST}` : '-';

  // Reset buttons
  elements.stopAutomationBtn.style.display = 'block';
  elements.newTaskBtn.style.display = 'none';

  // Update status
  updateAutomationStatus('running', '正在执行...');

  // Add initial log
  addLog('自动化任务已启动', 'info');
}

function addLog(message, level = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${level}`;

  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = time;

  const messageSpan = document.createElement('span');
  messageSpan.className = 'log-message';
  messageSpan.textContent = message;

  logEntry.appendChild(timeSpan);
  logEntry.appendChild(messageSpan);

  elements.logContent.appendChild(logEntry);

  // Auto scroll to bottom
  elements.logContent.scrollTop = elements.logContent.scrollHeight;

  console.log(`[${level.toUpperCase()}] ${time} - ${message}`);
}

function clearLogs() {
  elements.logContent.innerHTML = '';
  addLog('日志已清除', 'info');
}

function updateAutomationStatus(status, message) {
  elements.automationStatusText.textContent = message;

  const statusDot = elements.automationSection.querySelector('.status-dot');
  if (statusDot) {
    statusDot.className = `status-dot status-${status}`;
  }
}

async function stopAutomation() {
  try {
    addLog('正在停止自动化...', 'warning');

    // Send stop message to content script
    const tabs = await chrome.tabs.query({ url: 'https://*.procore.com/*' });
    if (tabs.length > 0) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'STOP_AUTOMATION'
      });
    }

    // Update status
    automationActive = false;
    await chrome.storage.local.set({
      automationStatus: {
        active: false,
        data: null,
        startTime: null
      }
    });

    updateAutomationStatus('stopped', '已停止');
    addLog('自动化已停止', 'warning');

    // Show new task button
    elements.stopAutomationBtn.style.display = 'none';
    elements.newTaskBtn.style.display = 'block';

  } catch (error) {
    console.error('停止自动化失败:', error);
    addLog('停止自动化失败: ' + error.message, 'error');
  }
}

function handleAutomationComplete(data) {
  automationActive = false;
  updateAutomationStatus('completed', '执行完成');
  addLog('✅ 自动化执行成功完成！', 'success');

  if (data.message) {
    addLog(data.message, 'success');
  }

  // Update storage
  chrome.storage.local.set({
    automationStatus: {
      active: false,
      data: null,
      startTime: null
    }
  });

  // Show new task button
  elements.stopAutomationBtn.style.display = 'none';
  elements.newTaskBtn.style.display = 'block';
}

function handleAutomationError(error) {
  automationActive = false;
  updateAutomationStatus('error', '执行失败');
  addLog('❌ 自动化执行失败: ' + error, 'error');

  // Update storage
  chrome.storage.local.set({
    automationStatus: {
      active: false,
      data: null,
      startTime: null
    }
  });

  // Show new task button
  elements.stopAutomationBtn.style.display = 'none';
  elements.newTaskBtn.style.display = 'block';
}

// Utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert File to Base64 Data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// ============================================
// Update Check Functions
// ============================================

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
  if (!elements.updateBanner || !elements.updateVersion || !elements.updateMessage) {
    console.error('Update banner elements not found');
    return;
  }

  elements.updateVersion.textContent = updateInfo.latestVersion;

  // 显示前3条更新日志
  const changelog = updateInfo.changeLog.slice(0, 3).join(' • ');
  elements.updateMessage.textContent = changelog;

  elements.updateBanner.style.display = 'flex';
}

async function handleCheckUpdate(event) {
  event.preventDefault();

  const link = event.target;
  const originalText = link.textContent;
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
    link.textContent = originalText;
    link.style.pointerEvents = '';
  }
}

async function handleUpdateDownload() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_UPDATE_INFO' });
    if (response.success && response.data) {
      // 打开下载页面
      chrome.tabs.create({ url: response.data.downloadUrl });

      // 显示安装指引
      setTimeout(() => {
        alert('下载完成后请按照以下步骤安装：\n\n' +
          '1. 解压 ZIP 文件\n' +
          '2. 打开 Chrome 扩展页面 (chrome://extensions/)\n' +
          '3. 开启"开发者模式"\n' +
          '4. 点击"加载已解压的扩展程序"\n' +
          '5. 选择解压后的 extension 文件夹\n\n' +
          '提示：安装新版本会自动覆盖旧版本');
      }, 500);
    }
  } catch (error) {
    console.error('Open download failed:', error);
    alert('打开下载页面失败: ' + error.message);
  }
}

async function handleUpdateDismiss() {
  try {
    await chrome.runtime.sendMessage({ type: 'DISMISS_UPDATE' });
    elements.updateBanner.style.display = 'none';
  } catch (error) {
    console.error('Dismiss update failed:', error);
  }
}

function displayCurrentVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    if (elements.versionText) {
      elements.versionText.textContent = `v${manifest.version}`;
    }
  } catch (error) {
    console.error('Display version failed:', error);
  }
}
