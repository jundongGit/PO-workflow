/**
 * Procore Automation Content Script
 * Directly manipulates DOM to automate Procore workflows
 * Based on playwright automation logic
 */

// Configuration
const CONFIG = {
  TYPING_DELAY: 150, // ms between keystrokes
  SHORT_WAIT: 1000,
  MEDIUM_WAIT: 2000,
  LONG_WAIT: 5000
};

// Logger
class Logger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);

    // Send log to popup for display
    const logLevel = level.toLowerCase();
    chrome.runtime.sendMessage({
      type: 'AUTOMATION_LOG',
      data: {
        message,
        level: logLevel === 'error' ? 'error' :
               logLevel === 'warning' ? 'warning' :
               logLevel === 'success' ? 'success' : 'info'
      }
    }).catch(() => {
      // Popup might be closed, ignore error
    });
  }

  static info(message) {
    this.log(message, 'INFO');
  }

  static success(message) {
    this.log(message, 'SUCCESS');
  }

  static warning(message) {
    this.log(message, 'WARNING');
  }

  static error(message) {
    this.log(message, 'ERROR');
  }
}

// Automation state
let automationStopped = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    // Respond to ping to confirm script is loaded
    sendResponse({ ready: true });
    return true;
  } else if (request.type === 'START_AUTOMATION') {
    automationStopped = false;
    handleStartAutomation(request.data, sendResponse);
    return true; // Keep channel open
  } else if (request.type === 'STOP_AUTOMATION') {
    automationStopped = true;
    Logger.warning('用户已请求停止自动化');
    hideAutomationOverlay();
    sendResponse({ success: true });
    return true;
  }
});

// Check if automation should stop
function checkStopped() {
  if (automationStopped) {
    throw new Error('自动化已被用户停止');
  }
}

// Main automation handler
async function handleStartAutomation(data, sendResponse) {
  try {
    Logger.success('开始执行 Procore 自动化');
    Logger.info(`PO编号: ${data.clientOrderNumber}`);
    Logger.info(`发票号: ${data.invoiceNumber}`);

    // Save automation state BEFORE starting
    await chrome.storage.local.set({
      automationState: {
        active: true,
        data: data,
        currentStep: 0,
        timestamp: Date.now()
      }
    });
    Logger.info('自动化状态已保存');
    if (data.totalAmountExGST) {
      Logger.info(`金额: $${data.totalAmountExGST}`);
    }

    // Initialize steps for visual progress
    initializeSteps([
      '选择项目',
      '导航到 Commitments',
      '查找并打开 PO',
      '更新 PO 字段'
    ]);

    // Show overlay
    showAutomationOverlay('开始自动化...');

    // Execute automation steps with stop checks
    await sleep(CONFIG.SHORT_WAIT);
    checkStopped();

    nextStep();
    updateOverlayMessage('正在选择项目...');
    Logger.info('步骤 1/4: 选择项目');
    await selectProject(data.clientOrderNumber);

    await sleep(CONFIG.MEDIUM_WAIT);
    checkStopped();

    nextStep();
    updateOverlayMessage('正在导航到 Commitments...');
    Logger.info('步骤 2/4: 导航到 Commitments');
    await navigateToCommitments();

    await sleep(CONFIG.MEDIUM_WAIT);
    checkStopped();

    nextStep();
    updateOverlayMessage('正在查找 PO...');
    Logger.info('步骤 3/4: 查找并打开 PO');
    await findAndOpenPO(data.clientOrderNumber);

    await sleep(CONFIG.MEDIUM_WAIT);
    checkStopped();

    nextStep();
    updateOverlayMessage('正在更新字段...');
    Logger.info('步骤 4/4: 更新 PO 字段');
    await updatePOFields(data.invoiceNumber, data.totalAmountExGST);

    hideAutomationOverlay();
    showSuccessMessage('✅ 自动化完成！请检查并保存更改。');

    Logger.success('所有步骤执行完成！');
    Logger.info('请检查并保存更改');

    // Notify popup
    chrome.runtime.sendMessage({
      type: 'AUTOMATION_COMPLETE',
      data: { message: '自动化执行成功完成' }
    }).catch(() => {});

    sendResponse({ success: true });

  } catch (error) {
    Logger.error(`执行失败: ${error.message}`);
    hideAutomationOverlay();
    showErrorMessage(`❌ 自动化失败: ${error.message}`);

    chrome.runtime.sendMessage({
      type: 'AUTOMATION_ERROR',
      data: { error: error.message }
    }).catch(() => {});

    sendResponse({ success: false, error: error.message });
  }
}

// Step 1: Select Project
async function selectProject(clientOrderNumber) {
  Logger.info(`正在搜索项目: ${clientOrderNumber}`);
  updateOverlayMessage('正在选择项目...');

  await sleep(CONFIG.MEDIUM_WAIT);

  // Find project picker
  const pickerSelectors = [
    'div[class*="StyledPicker"]',
    '[role="combobox"]',
    'button:has-text("Select a project")'
  ];

  const projectPicker = await findElement(pickerSelectors);
  if (!projectPicker) {
    throw new Error('找不到项目选择器');
  }

  Logger.info('找到项目选择器，正在点击...');
  await clickWithFeedback(projectPicker, '点击项目选择器');
  await sleep(CONFIG.SHORT_WAIT);

  // Type client order number character by character
  Logger.info(`正在输入项目编号...`);
  let searchKeyword = clientOrderNumber;

  // Try full search first
  for (const char of searchKeyword) {
    simulateKeyPress(char);
    await sleep(CONFIG.TYPING_DELAY);

    // Check for unique result
    const optionCount = await getOptionCount();
    if (optionCount === 1) {
      Logger.success('找到唯一匹配项目');
      break;
    }
  }

  await sleep(CONFIG.SHORT_WAIT);

  // Try to find matching option
  const optionSelectors = [
    `[role="option"]`,
    `[role="menuitem"]`,
    `li[class*="option"]`,
    `div[class*="option"]`
  ];

  // Strategy 1: Try exact match with full clientOrderNumber
  let matchingOption = await findElementContainingText(optionSelectors, clientOrderNumber);

  // Strategy 2: If not found, try partial match (first part before dash)
  if (!matchingOption) {
    const partialKeyword = clientOrderNumber.split('-')[0]; // e.g., "KIWIWASTE" from "KIWIWASTE-006"
    Logger.info(`尝试部分匹配: ${partialKeyword}`);
    matchingOption = await findElementContainingText(optionSelectors, partialKeyword);
  }

  // Strategy 3: If still not found, try case-insensitive partial match
  if (!matchingOption) {
    const keyword = clientOrderNumber.split('-')[0].toLowerCase().substring(0, 5); // e.g., "kiwiw"
    Logger.info(`尝试关键词匹配: ${keyword}`);

    // Get all visible options
    const allOptions = [];
    for (const selector of optionSelectors) {
      const elements = querySelectorWithText(selector);
      for (const el of elements) {
        if (isVisible(el)) {
          allOptions.push(el);
        }
      }
    }

    // Find option with keyword in text (case-insensitive)
    matchingOption = allOptions.find(el =>
      el.textContent.toLowerCase().includes(keyword)
    );
  }

  // Strategy 4: If only one option exists, use it
  if (!matchingOption) {
    Logger.info('尝试选择唯一选项');
    const optionCount = await getOptionCount();
    console.log('DEBUG: Total visible option count:', optionCount);

    if (optionCount === 1) {
      for (const selector of optionSelectors) {
        const elements = querySelectorWithText(selector);
        console.log(`DEBUG: Selector "${selector}" found ${elements.length} elements`);

        const visibleOptions = elements.filter(el => isVisible(el));
        console.log(`DEBUG: ${visibleOptions.length} visible options for selector "${selector}"`);

        if (visibleOptions.length === 1) {
          matchingOption = visibleOptions[0];
          console.log('DEBUG: Selected unique option:', matchingOption.textContent);
          Logger.success('找到唯一选项');
          break;
        }
      }
    }
  }

  if (!matchingOption) {
    console.error('DEBUG: No matching option found. Available options:');
    const allOptions = document.querySelectorAll('[role="option"], [role="menuitem"]');
    allOptions.forEach((opt, i) => {
      console.log(`  Option ${i}:`, {
        text: opt.textContent.trim(),
        visible: isVisible(opt),
        selector: opt.getAttribute('role')
      });
    });
    throw new Error(`找不到匹配的项目: ${clientOrderNumber}。请确认项目名称或搜索关键词是否正确。`);
  }

  Logger.info('正在选择项目...');
  console.log('DEBUG: About to click option with text:', matchingOption.textContent.trim());

  // Save current URL to detect navigation
  const beforeUrl = window.location.href;
  console.log('DEBUG: Current URL before click:', beforeUrl);

  await clickWithFeedback(matchingOption, `选择项目: ${clientOrderNumber}`);

  // Wait and check if URL changed
  await sleep(CONFIG.LONG_WAIT);

  const afterUrl = window.location.href;
  console.log('DEBUG: URL after click:', afterUrl);

  if (beforeUrl === afterUrl) {
    Logger.warn('警告: 点击后URL未改变，可能需要额外等待');
    // Wait additional time for page to respond
    await sleep(CONFIG.MEDIUM_WAIT);
  } else {
    Logger.success(`页面已导航: ${beforeUrl} → ${afterUrl}`);
  }

  Logger.success('项目选择完成');
}

// Step 2: Navigate to Commitments
async function navigateToCommitments() {
  Logger.info('正在导航到 Commitments 页面...');
  updateOverlayMessage('正在导航到Commitments...');

  await sleep(CONFIG.MEDIUM_WAIT);

  // Find Commitments link
  const commitmentsLink = await findElement([
    'a[name="Commitments"]',
    'a:has-text("Commitments")',
    '[href*="commitments"]'
  ]);

  if (!commitmentsLink) {
    throw new Error('找不到Commitments链接');
  }

  Logger.info('找到 Commitments 链接，正在点击...');
  commitmentsLink.click();
  await sleep(CONFIG.LONG_WAIT);

  Logger.success('成功进入 Commitments 页面');
}

// Step 3: Find and Open PO
async function findAndOpenPO(clientOrderNumber) {
  Logger.info(`正在查找 PO: ${clientOrderNumber}`);
  updateOverlayMessage('正在查找PO...');

  await sleep(CONFIG.MEDIUM_WAIT);

  // Extract order number variants (e.g., "KIWIWASTE-006" => ["006", "06", "6"])
  const orderNumbers = extractOrderNumberVariants(clientOrderNumber);
  Logger.info(`搜索变体: ${orderNumbers.join(', ')}`);

  // Find PO link
  let poLink = null;
  for (const orderNum of orderNumbers) {
    const linkSelectors = [
      `a:has-text("${orderNum}")`,
      `td a:has-text("${orderNum}")`,
      `[role="gridcell"] a:has-text("${orderNum}")`
    ];

    poLink = await findElementContainingText(linkSelectors, orderNum);
    if (poLink) {
      Logger.success(`找到匹配的 PO: ${orderNum}`);
      break;
    }
  }

  if (!poLink) {
    throw new Error(`找不到PO: ${clientOrderNumber}`);
  }

  Logger.info('正在打开 PO...');
  poLink.click();
  await sleep(CONFIG.MEDIUM_WAIT);

  Logger.success('PO 已打开');
}

// Step 4: Update PO Fields
async function updatePOFields(invoiceNumber, totalAmount) {
  Logger.info('正在更新 PO 字段...');
  updateOverlayMessage('正在更新PO信息...');

  await sleep(CONFIG.MEDIUM_WAIT);

  // Click Edit button if present
  const editBtn = await findElement([
    'button:has-text("Edit")',
    'button[aria-label*="Edit"]'
  ]);

  if (editBtn) {
    Logger.info('进入编辑模式...');
    await clickWithFeedback(editBtn, '点击编辑按钮');
    await sleep(CONFIG.MEDIUM_WAIT);
  }

  // Update Title field
  const titleInput = await findElement([
    'input[name="title"]',
    'input[placeholder*="Title"]',
    'textbox[name="Title"]'
  ]);

  if (titleInput) {
    const currentTitle = titleInput.value;
    const newTitle = `${currentTitle} ${invoiceNumber}`;
    Logger.info(`更新标题: ${newTitle}`);

    await fillWithFeedback(titleInput, newTitle, `填写发票号: ${invoiceNumber}`);

    Logger.success('标题已更新');
  }

  // Update Status to "Received"
  const statusDropdown = await findElement([
    'div[class*="PillSelect"]',
    '[role="combobox"][name*="status"]'
  ]);

  if (statusDropdown) {
    Logger.info('正在更新状态为 Received...');
    await clickWithFeedback(statusDropdown, '点击状态下拉菜单');
    await sleep(CONFIG.SHORT_WAIT);

    const receivedOption = await findElementWithExactText([
      'button:has-text("Received")',
      'div[role="option"]:has-text("Received")'
    ], 'Received');

    if (receivedOption) {
      await clickWithFeedback(receivedOption, '选择状态: Received');
      await sleep(CONFIG.SHORT_WAIT);
      Logger.success('状态已更新为 Received');
    }
  }

  Logger.success('所有 PO 字段已更新完成');
  Logger.warning('请手动检查并保存更改');
}

// Helper Functions

/**
 * Find element by multiple selectors
 */
async function findElement(selectors, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      try {
        // Handle pseudo-selectors like :has-text()
        const elements = querySelectorWithText(selector);
        if (elements.length > 0) {
          const visibleElement = elements.find(el => isVisible(el));
          if (visibleElement) {
            return visibleElement;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }
    await sleep(100);
  }

  return null;
}

/**
 * Find element containing specific text
 */
async function findElementContainingText(selectors, text, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const elements = querySelectorWithText(selector);
      for (const el of elements) {
        if (isVisible(el) && el.textContent.includes(text)) {
          return el;
        }
      }
    }
    await sleep(100);
  }

  return null;
}

/**
 * Find element with exact text match
 */
async function findElementWithExactText(selectors, text, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const elements = querySelectorWithText(selector);
      for (const el of elements) {
        if (isVisible(el) && el.textContent.trim() === text) {
          return el;
        }
      }
    }
    await sleep(100);
  }

  return null;
}

/**
 * Query selector with :has-text() pseudo-selector support
 */
function querySelectorWithText(selector) {
  // Handle :has-text("...") pseudo-selector
  const hasTextMatch = selector.match(/:has-text\("([^"]+)"\)/);

  if (hasTextMatch) {
    const text = hasTextMatch[1];
    const baseSelector = selector.replace(/:has-text\("[^"]+"\)/, '').trim() || '*';

    const elements = document.querySelectorAll(baseSelector);
    return Array.from(elements).filter(el =>
      el.textContent && el.textContent.includes(text)
    );
  }

  // Regular selector
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (e) {
    return [];
  }
}

/**
 * Check if element is visible
 */
function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetParent !== null;
}

/**
 * Simulate key press
 */
function simulateKeyPress(char) {
  const activeElement = document.activeElement;
  if (!activeElement) return;

  // Dispatch keyboard events
  const keydownEvent = new KeyboardEvent('keydown', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    charCode: char.charCodeAt(0),
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true
  });

  const keypressEvent = new KeyboardEvent('keypress', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    charCode: char.charCodeAt(0),
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true
  });

  const inputEvent = new InputEvent('input', {
    data: char,
    inputType: 'insertText',
    bubbles: true,
    cancelable: true
  });

  activeElement.dispatchEvent(keydownEvent);
  activeElement.dispatchEvent(keypressEvent);

  // Update value
  if (activeElement.value !== undefined) {
    activeElement.value += char;
  }

  activeElement.dispatchEvent(inputEvent);
}

/**
 * Get option count in dropdown
 */
async function getOptionCount() {
  const options = document.querySelectorAll('[role="option"], [role="menuitem"], li[class*="option"]');
  return Array.from(options).filter(el => isVisible(el)).length;
}

/**
 * Extract order number variants
 */
function extractOrderNumberVariants(clientOrderNumber) {
  const parts = clientOrderNumber.split('-');
  const numberPart = parts[parts.length - 1];

  const variants = [numberPart];

  // Remove leading zeros
  const withoutLeadingZeros = numberPart.replace(/^0+/, '');
  if (withoutLeadingZeros && withoutLeadingZeros !== numberPart) {
    variants.push(withoutLeadingZeros);
  }

  // Try with one leading zero removed
  if (numberPart.startsWith('00')) {
    const oneZeroRemoved = numberPart.substring(1);
    if (!variants.includes(oneZeroRemoved)) {
      variants.push(oneZeroRemoved);
    }
  }

  return variants;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// UI Overlay Functions

function showAutomationOverlay(message) {
  // Remove existing overlay
  hideAutomationOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'ia-automation-overlay';
  overlay.innerHTML = `
    <div class="ia-overlay-content">
      <div class="ia-spinner"></div>
      <p class="ia-overlay-message">${message}</p>
      <div class="ia-overlay-logo">
        <span>🤖</span>
        <span>Invoice Automation</span>
      </div>
      <div class="ia-step-progress" id="ia-step-progress"></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function updateOverlayMessage(message) {
  const messageEl = document.querySelector('.ia-overlay-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

function hideAutomationOverlay() {
  const overlay = document.getElementById('ia-automation-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function showSuccessMessage(message) {
  showToast(message, 'success');
}

function showErrorMessage(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `ia-toast ia-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('ia-toast-show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('ia-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Visual feedback functions
 */

// Track automation steps
const automationSteps = [];
let currentStepIndex = -1;

function initializeSteps(steps) {
  automationSteps.length = 0;
  automationSteps.push(...steps);
  currentStepIndex = -1;
  updateStepProgress();
}

function updateStepProgress() {
  const progressContainer = document.getElementById('ia-step-progress');
  if (!progressContainer) return;

  progressContainer.innerHTML = automationSteps.map((step, index) => {
    let status = 'pending';
    let icon = '⏳';

    if (index < currentStepIndex) {
      status = 'completed';
      icon = '✓';
    } else if (index === currentStepIndex) {
      status = 'active';
      icon = '🔄';
    }

    return `
      <div class="ia-step-item">
        <div class="ia-step-icon ${status}">${icon}</div>
        <div class="ia-step-text ${status}">${step}</div>
      </div>
    `;
  }).join('');
}

function nextStep() {
  currentStepIndex++;
  updateStepProgress();
}

function completeCurrentStep() {
  if (currentStepIndex < automationSteps.length) {
    updateStepProgress();
  }
}

// Highlight element being operated on
let currentHighlight = null;

function highlightElement(element, action) {
  // Remove previous highlight
  removeHighlight();

  if (!element) return;

  // Add highlight class
  element.classList.add('ia-highlight-element');
  currentHighlight = element;

  // Show action tooltip
  showActionTooltip(element, action);

  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeHighlight() {
  if (currentHighlight) {
    currentHighlight.classList.remove('ia-highlight-element');
    currentHighlight = null;
  }
  removeActionTooltip();
}

// Show action tooltip above element
function showActionTooltip(element, text) {
  removeActionTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'ia-action-tooltip';
  tooltip.textContent = text;
  tooltip.id = 'ia-current-tooltip';

  document.body.appendChild(tooltip);

  // Position tooltip above element
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 40}px`;
  tooltip.style.transform = 'translateX(-50%)';
}

function removeActionTooltip() {
  const tooltip = document.getElementById('ia-current-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

/**
 * Enhanced action wrappers with visual feedback
 */

async function clickWithFeedback(element, description) {
  highlightElement(element, description);
  await sleep(800);

  // Log click attempt
  Logger.info(`点击元素: ${description}`);
  console.log('Clicking element:', element);

  // Trigger comprehensive mouse events for better compatibility
  const mouseEvents = ['mousedown', 'mouseup', 'click'];
  mouseEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0
    });
    element.dispatchEvent(event);
  });

  // Also try native click
  element.click();

  Logger.success(`已点击: ${description}`);
  await sleep(500);
  removeHighlight();
}

async function fillWithFeedback(element, value, description) {
  highlightElement(element, description);
  await sleep(800);
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(500);
  removeHighlight();
}

async function selectWithFeedback(element, value, description) {
  highlightElement(element, description);
  await sleep(800);
  element.value = value;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(500);
  removeHighlight();
}

Logger.log('Content script loaded and ready');

// Auto-resume automation after page navigation
(async function checkAndResumeAutomation() {
  try {
    await sleep(1000); // Wait for page to stabilize

    const result = await chrome.storage.local.get('automationState');
    if (!result.automationState || !result.automationState.active) {
      return; // No pending automation
    }

    const state = result.automationState;
    const elapsed = Date.now() - state.timestamp;

    // Only resume if less than 30 seconds ago (page navigation scenario)
    if (elapsed > 30000) {
      Logger.warn('自动化任务已过期，清除状态');
      await chrome.storage.local.remove('automationState');
      return;
    }

    // Check current step
    const currentStep = state.currentStep;
    const data = state.data;

    if (currentStep === 0) {
      // We just selected a project and page navigated
      // Now we're on the project home page, continue with step 1
      Logger.success('检测到页面导航，项目选择已完成');
      Logger.info('继续执行步骤 2/4: 导航到 Commitments');

      // Update to step 1
      await chrome.storage.local.set({
        automationState: {
          ...state,
          currentStep: 1,
          timestamp: Date.now()
        }
      });

      // Show overlay
      showAutomationOverlay('正在导航到 Commitments...');
      initializeSteps([
        '✓ 选择项目',
        '导航到 Commitments',
        '查找并打开 PO',
        '更新 PO 字段'
      ]);
      nextStep(); // Mark step 0 as complete
      nextStep(); // Start step 1

      // Continue with step 1
      await navigateToCommitments();

      // Step 2: Find and open PO
      nextStep();
      Logger.info('步骤 3/4: 查找并打开 PO');
      await findAndOpenPO(data.clientOrderNumber);

      // Step 3: Update PO fields
      nextStep();
      Logger.info('步骤 4/4: 更新 PO 字段');
      await updatePOFields(data);

      // Success
      Logger.success('✅ 自动化执行成功！');
      hideAutomationOverlay();
      showSuccessMessage('自动化执行成功！请检查并保存PO信息。');

      // Clear automation state
      await chrome.storage.local.remove('automationState');

    } else if (currentStep === 1) {
      // Continue from Commitments page
      Logger.info('继续执行步骤 3/4: 查找并打开 PO');

      // Continue automation...
      // (similar logic for other steps)
    }

  } catch (error) {
    Logger.error('恢复自动化失败: ' + error.message);
    console.error('Resume automation error:', error);
    await chrome.storage.local.remove('automationState');
    hideAutomationOverlay();
    showErrorMessage('恢复自动化失败: ' + error.message);
  }
})();
