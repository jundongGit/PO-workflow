import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const PROCORE_COMPANY_URL = 'https://us02.procore.com/598134325648131/company/home/list';
const BROWSER_DATA_DIR = path.join(__dirname, '../../.browser-data');
const TIMEOUT_SHORT = 5000;    // 5 seconds
const TIMEOUT_MEDIUM = 10000;  // 10 seconds
const TIMEOUT_LONG = 60000;    // 60 seconds (increased for slow connections)

// Procore credentials
const PROCORE_EMAIL = process.env.PROCORE_EMAIL;
const PROCORE_PASSWORD = process.env.PROCORE_PASSWORD;

// Browser pool configuration
const MAX_CONCURRENT_BROWSERS = 5; // Maximum number of concurrent browser instances
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

/**
 * Browser Pool Manager
 * Uses MULTIPLE independent browser instances for concurrent automation
 * Each browser has its own temporary data directory for complete isolation
 */
class BrowserPool {
  constructor(maxConcurrent = MAX_CONCURRENT_BROWSERS) {
    this.maxConcurrent = maxConcurrent;
    this.activeBrowsers = new Map(); // taskId -> { context, page, dataDir, lastUsed }
    this.queue = []; // Tasks waiting for available slot
    this.taskIdCounter = 0;
  }

  /**
   * Acquire an independent browser for a task
   * Returns: { taskId, context, page }
   */
  async acquire() {
    const taskId = ++this.taskIdCounter;

    // If under limit, create new browser
    if (this.activeBrowsers.size < this.maxConcurrent) {
      log(`[Pool] Creating independent browser for task ${taskId} (${this.activeBrowsers.size + 1}/${this.maxConcurrent})`, 'INFO');
      const { context, page, dataDir } = await this.createBrowser(taskId);

      this.activeBrowsers.set(taskId, {
        context,
        page,
        dataDir,
        lastUsed: Date.now()
      });

      return { taskId, context, page };
    }

    // Otherwise, wait in queue
    log(`[Pool] Browser limit reached, task ${taskId} waiting in queue...`, 'WARN');

    return new Promise((resolve) => {
      this.queue.push({ taskId, resolve });
    });
  }

  /**
   * Release a browser after task completion
   */
  async release(taskId) {
    const browserData = this.activeBrowsers.get(taskId);

    if (!browserData) {
      log(`[Pool] Task ${taskId} not found in active browsers`, 'WARN');
      return;
    }

    log(`[Pool] Releasing browser for task ${taskId}`, 'INFO');

    // Close the browser context
    try {
      await browserData.context.close();
    } catch (error) {
      log(`[Pool] Error closing browser for task ${taskId}: ${error.message}`, 'ERROR');
    }

    // Clean up temporary data directory
    try {
      if (browserData.dataDir && fs.existsSync(browserData.dataDir)) {
        fs.rmSync(browserData.dataDir, { recursive: true, force: true });
        log(`[Pool] Cleaned up temp data directory for task ${taskId}`, 'INFO');
      }
    } catch (error) {
      log(`[Pool] Error cleaning temp directory for task ${taskId}: ${error.message}`, 'ERROR');
    }

    // Remove from active browsers
    this.activeBrowsers.delete(taskId);

    // Process queue if there are waiting tasks
    if (this.queue.length > 0) {
      const waiting = this.queue.shift();
      log(`[Pool] Processing queued task ${waiting.taskId}`, 'INFO');

      const { context, page, dataDir } = await this.createBrowser(waiting.taskId);

      this.activeBrowsers.set(waiting.taskId, {
        context,
        page,
        dataDir,
        lastUsed: Date.now()
      });

      waiting.resolve({ taskId: waiting.taskId, context, page });
    }
  }

  /**
   * Create a new independent browser instance with its own data directory
   */
  async createBrowser(taskId) {
    log(`[Pool] Launching independent browser for task ${taskId}...`, 'INFO');

    // Create temporary data directory for this browser instance
    const tempDataDir = path.join(
      __dirname,
      '../../.browser-temp',
      `task-${taskId}-${Date.now()}`
    );

    // Ensure temp directory exists
    if (!fs.existsSync(tempDataDir)) {
      fs.mkdirSync(tempDataDir, { recursive: true });
    }

    log(`[Pool] Created temp data directory: ${tempDataDir}`, 'INFO');

    // Launch browser with persistent context (own data directory)
    const context = await chromium.launchPersistentContext(tempDataDir, {
      headless: false,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      viewport: null,
      slowMo: 100,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--start-maximized'
      ]
    });

    // Get first page (automatically created)
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    // Listen for browser close event to clean up resources
    context.on('close', () => {
      log(`[Pool] Browser for task ${taskId} closed by user, cleaning up...`, 'INFO');

      // Clean up from activeBrowsers map
      if (this.activeBrowsers.has(taskId)) {
        this.activeBrowsers.delete(taskId);
      }

      // Clean up temporary directory
      try {
        if (fs.existsSync(tempDataDir)) {
          fs.rmSync(tempDataDir, { recursive: true, force: true });
          log(`[Pool] Cleaned up temp directory for task ${taskId}`, 'INFO');
        }
      } catch (error) {
        log(`[Pool] Error cleaning temp directory for task ${taskId}: ${error.message}`, 'ERROR');
      }
    });

    log(`[Pool] Browser launched successfully for task ${taskId}`, 'INFO');

    return { context, page, dataDir: tempDataDir };
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      active: this.activeBrowsers.size,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Cleanup all browsers (for shutdown)
   */
  async cleanup() {
    log('[Pool] Cleaning up all browsers...', 'INFO');

    // Close all active browsers
    for (const [taskId, browserData] of this.activeBrowsers.entries()) {
      try {
        await browserData.context.close();
        log(`[Pool] Closed browser for task ${taskId}`, 'INFO');

        // Clean up temp directory
        if (browserData.dataDir && fs.existsSync(browserData.dataDir)) {
          fs.rmSync(browserData.dataDir, { recursive: true, force: true });
        }
      } catch (error) {
        log(`[Pool] Error cleaning up task ${taskId}: ${error.message}`, 'ERROR');
      }
    }

    this.activeBrowsers.clear();
    this.queue = [];

    log('[Pool] Cleanup complete', 'INFO');
  }
}

// Global browser pool instance
const browserPool = new BrowserPool();

// Log listeners for real-time updates - organized by sessionId
let logListenersBySession = new Map(); // sessionId -> Set of listeners

// Current task context (used to automatically attach sessionId to logs)
let currentTaskContext = null;

/**
 * Extract project search keyword from Client Order Number
 * Example: "KIWIWASTE-006" => "KIWIWASTE"
 */
function extractProjectKeyword(clientOrderNumber) {
  // Remove common suffixes like -001, -006, etc.
  const keyword = clientOrderNumber.replace(/-\d+$/, '');
  log(`Extracted project keyword: "${keyword}" from "${clientOrderNumber}"`);
  return keyword;
}

/**
 * Logger with timestamps and real-time broadcasting
 * Automatically includes sessionId from currentTaskContext
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    sessionId: currentTaskContext?.sessionId || null,
    taskId: currentTaskContext?.taskId || null
  };

  // Console log
  console.log(`[${timestamp}] [${level}] ${message}`);

  // Broadcast to session-specific listeners
  if (logEntry.sessionId && logListenersBySession.has(logEntry.sessionId)) {
    const listeners = logListenersBySession.get(logEntry.sessionId);
    listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        // Ignore errors from listeners
      }
    });
  }
}

/**
 * Add a log listener for a specific session
 */
export function addLogListener(sessionId, listener) {
  if (!logListenersBySession.has(sessionId)) {
    logListenersBySession.set(sessionId, new Set());
  }

  logListenersBySession.get(sessionId).add(listener);

  return () => {
    const listeners = logListenersBySession.get(sessionId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        logListenersBySession.delete(sessionId);
      }
    }
  };
}

/**
 * Remove all log listeners for a session
 */
export function clearLogListeners(sessionId) {
  if (sessionId) {
    logListenersBySession.delete(sessionId);
  } else {
    logListenersBySession.clear();
  }
}

/**
 * Load settings from settings.json for login credentials
 */
function loadSettingsForLogin() {
  try {
    const settingsPath = path.join(__dirname, '../../settings.json');

    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      return {
        procoreEmail: settings.procoreEmail || null,
        procorePassword: settings.procorePassword || null
      };
    }
  } catch (error) {
    log(`Warning: Could not load settings: ${error.message}`, 'WARN');
  }

  return { procoreEmail: null, procorePassword: null };
}

/**
 * Type text character by character with delay
 */
async function typeSlowly(page, selector, text, delay = 100) {
  log(`Typing text slowly into: ${selector}`);
  const element = await page.locator(selector);
  await element.click();

  for (const char of text) {
    await page.keyboard.type(char);
    await page.waitForTimeout(delay);
  }
  log(`Finished typing: ${text}`);
}

/**
 * Wait for element with multiple selector options
 */
async function waitForAnySelector(page, selectors, timeout = TIMEOUT_MEDIUM) {
  log(`Waiting for any of ${selectors.length} selectors...`);

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      log(`Found element with selector: ${selector}`);
      return selector;
    } catch (e) {
      // Try next selector
    }
  }

  throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
}

/**
 * Navigate to Procore and ensure user is logged in
 */
async function ensureLoggedIn(page) {
  log('Navigating to Procore company projects page...');

  // Use 'domcontentloaded' instead of 'networkidle' for faster loading
  await page.goto(PROCORE_COMPANY_URL, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_LONG
  });

  // Wait a bit for page to settle
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  log(`Current URL: ${currentUrl}`);

  if (currentUrl.includes('login') || currentUrl.includes('signin')) {
    log('Login page detected, attempting auto-login...', 'INFO');

    // Load saved credentials from settings
    const settings = loadSettingsForLogin();
    const savedEmail = settings.procoreEmail;
    const savedPassword = settings.procorePassword;

    log(`Loaded credentials - Email: ${savedEmail ? savedEmail : '(not set)'}, Password: ${savedPassword ? '(set)' : '(not set)'}`, 'INFO');

    try {
      // Check if email field exists and has value
      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      const emailCount = await emailInput.count();

      if (emailCount > 0) {
        const emailValue = await emailInput.inputValue();
        log(`Email field found with value: ${emailValue || '(empty)'}`);

        // If email is empty and we have saved credentials, fill it
        if (!emailValue && savedEmail) {
          log(`Auto-filling email: ${savedEmail}`);
          await emailInput.click();
          await emailInput.fill(savedEmail);
          await page.waitForTimeout(500);
          log('Email filled');
        } else if (emailValue) {
          log('Email already filled, looking for Continue button...');
        } else {
          log('No saved email credentials found', 'WARN');
        }
      }

      // Look for Continue button
      const continueButtonSelectors = [
        'button:has-text("Continue")',
        'button:text("Continue")',
        'input[type="submit"]',
        'button[type="submit"]'
      ];

      let continueButton = null;
      for (const selector of continueButtonSelectors) {
        try {
          const buttons = await page.locator(selector).all();
          if (buttons.length > 0) {
            continueButton = buttons[0];
            log('Found Continue button');
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (continueButton) {
        log('Clicking Continue button...');
        await continueButton.click();
        await page.waitForTimeout(3000); // Wait for password page to load
        log('Continue button clicked, waiting for password page...');

        // Now fill in the password
        if (savedPassword) {
          log('Auto-filling password...');

          try {
            // Look for password input
            const passwordInputSelectors = [
              'input[type="password"]',
              'input[name="password"]',
              'input[id*="password"]'
            ];

            let passwordInput = null;
            for (const selector of passwordInputSelectors) {
              try {
                const inputs = await page.locator(selector).all();
                if (inputs.length > 0) {
                  passwordInput = inputs[0];
                  log('Found password input');
                  break;
                }
              } catch (e) {
                // Try next selector
              }
            }

            if (passwordInput) {
              await passwordInput.click();
              await passwordInput.fill(savedPassword);
              log('Password filled');
              await page.waitForTimeout(500);

              // Look for login/sign in button
              const loginButtonSelectors = [
                'button:has-text("Sign In")',
                'button:has-text("Login")',
                'button:has-text("Log In")',
                'button[type="submit"]',
                'input[type="submit"]'
              ];

              let loginButton = null;
              for (const selector of loginButtonSelectors) {
                try {
                  const buttons = await page.locator(selector).all();
                  if (buttons.length > 0) {
                    loginButton = buttons[0];
                    log('Found login button');
                    break;
                  }
                } catch (e) {
                  // Try next selector
                }
              }

              if (loginButton) {
                log('Clicking login button...');
                await loginButton.click();
                await page.waitForTimeout(2000);
                log('Login button clicked');
              }
            } else {
              log('Could not find password input', 'WARN');
            }
          } catch (error) {
            log(`Password auto-fill failed: ${error.message}`, 'WARN');
          }
        } else {
          log('No password saved in settings', 'WARN');
        }
      }
    } catch (error) {
      log(`Auto-login attempt failed: ${error.message}`, 'WARN');
    }

    // Wait for login to complete (may need 2FA or other verification)
    log('Waiting for login to complete...', 'INFO');

    try {
      // Wait for URL to change to company home page
      await page.waitForURL('**/company/home/list', { timeout: 60000 }); // 60 seconds
      log('Login successful!');
    } catch (error) {
      // If timeout, may need manual intervention (2FA, etc.)
      log('Waiting for manual login completion (2FA may be required)...', 'WARN');
      log('Please complete any additional verification in the browser', 'WARN');
      await page.waitForURL('**/company/home/list', { timeout: 300000 }); // 5 min timeout
      log('Login successful!');
    }

    await page.waitForTimeout(3000);
  } else {
    log('User already logged in - using saved session');
  }
}

/**
 * Step 1: Search and select project using dropdown
 */
async function selectProject(page, clientOrderNumber) {
  log(`Step 1: Searching for project using Client Order Number: ${clientOrderNumber}`);

  // Check PO mappings for a matching rule
  let mappedProjectName = null;
  try {
    // Settings file is in project root, two levels up from this file
    const settingsPath = path.join(__dirname, '../../settings.json');
    log(`Loading PO mappings from: ${settingsPath}`);

    if (fs.existsSync(settingsPath)) {
      log('Settings file exists, reading...');
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      log(`Settings loaded. poMappings count: ${settings.poMappings ? settings.poMappings.length : 0}`);

      if (settings.poMappings && Array.isArray(settings.poMappings)) {
        log(`Checking ${settings.poMappings.length} mapping rule(s) for PO: ${clientOrderNumber}`);
        // Check if clientOrderNumber matches any PO pattern
        for (const mapping of settings.poMappings) {
          log(`  Checking pattern: "${mapping.poPattern}"`);
          if (mapping.poPattern && mapping.projectName) {
            // Case-insensitive match
            if (clientOrderNumber.toUpperCase().includes(mapping.poPattern.toUpperCase())) {
              mappedProjectName = mapping.projectName;
              log(`✅ Found PO mapping rule:`);
              log(`   Pattern: "${mapping.poPattern}" → Project: "${mapping.projectName}"`);
              log(`   Using mapped project name instead of searching by PO number`);
              break;
            } else {
              log(`  No match: "${clientOrderNumber.toUpperCase()}" does not include "${mapping.poPattern.toUpperCase()}"`);
            }
          }
        }
      } else {
        log('No poMappings array found in settings');
      }
    } else {
      log('Settings file does not exist');
    }
  } catch (error) {
    log(`Warning: Could not load PO mappings: ${error.message}`, 'WARN');
    log(`Error stack: ${error.stack}`, 'WARN');
  }

  // Wait for the page to be ready
  await page.waitForTimeout(2000);

  // Find and click the project picker element (StyledPicker div)
  log('Looking for project picker element...');
  const projectPickerSelectors = [
    'div[class*="StyledPicker"]',
    'div:has-text("Select a project")',
    '[role="combobox"]',
    'div[class*="Picker"]:has-text("Select a project")',
    'button:has-text("Select a project")'
  ];

  let projectPicker = null;
  for (const selector of projectPickerSelectors) {
    try {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        // Find the visible one with "Select a project" text
        for (const element of elements) {
          const isVisible = await element.isVisible();
          const text = await element.textContent();
          if (isVisible && text && text.includes('Select a project')) {
            projectPicker = element;
            log(`Found project picker element with selector: ${selector}`);
            break;
          }
        }
        if (projectPicker) break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!projectPicker) {
    throw new Error('Could not find project picker element');
  }

  // Click the project picker element to activate it
  log('Clicking project picker element...');
  await projectPicker.click();
  await page.waitForTimeout(1000);

  // Determine what to search for - mapped project name or client order number
  const searchTerm = mappedProjectName || clientOrderNumber;
  log(`Typing search term with smart detection: ${searchTerm}`);
  if (mappedProjectName) {
    log(`(Using mapped project name from PO mapping rule)`);
  }

  let projectOption = null;
  let inputComplete = false;

  for (let i = 0; i < searchTerm.length; i++) {
    const char = searchTerm[i];
    await page.keyboard.type(char);
    await page.waitForTimeout(150); // Slow typing to trigger search

    // After typing at least 3 characters, start checking for results
    if (i >= 2 && (i + 1) % 2 === 0) { // Check every 2 characters after the 3rd
      await page.waitForTimeout(500); // Wait for search to update

      // Try to find options/items in the dropdown
      const optionSelectors = [
        '[role="option"]',
        '[role="menuitem"]',
        'li[class*="option"]',
        'div[class*="option"]'
      ];

      let foundOptions = [];
      for (const selector of optionSelectors) {
        try {
          const options = await page.locator(selector).all();
          if (options.length > 0) {
            // Filter visible options
            for (const option of options) {
              const isVisible = await option.isVisible();
              if (isVisible) {
                foundOptions.push(option);
              }
            }
            if (foundOptions.length > 0) {
              log(`Found ${foundOptions.length} visible option(s) after typing ${i + 1} characters`);
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }

      // If exactly one result found, click it immediately
      if (foundOptions.length === 1) {
        projectOption = foundOptions[0];
        const text = await projectOption.textContent();
        log(`✓ Unique result found after ${i + 1} characters: ${text?.trim()}`);
        log('Stopping input and selecting project...');
        inputComplete = true;
        break;
      } else if (foundOptions.length > 1) {
        log(`Multiple results (${foundOptions.length}) found, continuing to type...`);
      }
    }
  }

  // If we didn't find a unique result during typing, search after complete input
  if (!projectOption) {
    log('Input complete, waiting for search results...');
    await page.waitForTimeout(2000);

    log('Looking for matching project in dropdown results...');

    const optionSelectors = [
      '[role="option"]',
      '[role="menuitem"]',
      'li[class*="option"]',
      'div[class*="option"]',
      `a:has-text("${searchTerm}")`,
      `div:has-text("${searchTerm}")`
    ];

    for (const selector of optionSelectors) {
      try {
        const options = await page.locator(selector).all();
        if (options.length > 0) {
          log(`Found ${options.length} option(s) with selector: ${selector}`);

          // Find option that matches the search term
          // When using mapped project name, do exact match
          // When using PO number, do contains match
          for (const option of options) {
            const isVisible = await option.isVisible();
            if (!isVisible) continue;

            const text = await option.textContent();
            if (text) {
              const normalizedText = text.trim();
              let isMatch = false;

              if (mappedProjectName) {
                // For mapped project names, look for exact match or close match
                isMatch = normalizedText.includes(mappedProjectName) ||
                         mappedProjectName.includes(normalizedText) ||
                         normalizedText === mappedProjectName;
              } else {
                // For PO numbers, check if text contains the PO number
                isMatch = normalizedText.includes(clientOrderNumber);
              }

              if (isMatch) {
                projectOption = option;
                log(`Found matching option with text: ${normalizedText}`);
                break;
              }
            }
          }

          // If only one result, select it
          if (options.length === 1 && !projectOption) {
            projectOption = options[0];
            const text = await projectOption.textContent();
            log(`Only one result found, selecting: ${text?.trim()}`);
          }

          if (projectOption) break;
        }
      } catch (e) {
        log(`Selector ${selector} failed: ${e.message}`, 'WARN');
      }
    }
  }

  if (!projectOption) {
    const searchContext = mappedProjectName
      ? `mapped project name: ${mappedProjectName}`
      : `Client Order Number: ${clientOrderNumber}`;
    throw new Error(`No project found matching ${searchContext}`);
  }

  // Click the matching project option
  log('Clicking matching project option...');
  await projectOption.click();
  await page.waitForTimeout(5000); // Wait for project page to load

  log('✓ Step 1 completed: Project selected and entered');
}

/**
 * Step 2: Navigate to Commitments page
 */
async function navigateToCommitments(page) {
  log('Step 2: Navigating to Commitments page...');

  try {
    // Wait for page to load after entering project
    await page.waitForTimeout(3000);

    // Look for Commitments link in Favourites menu
    const commitmentsSelectors = [
      'link[name="Commitments"]',
      'a:has-text("Commitments")',
      '[href*="commitments"]'
    ];

    log('Looking for Commitments link...');
    let commitmentsLink = null;

    // Try to find Commitments link using role
    try {
      commitmentsLink = page.getByRole('link', { name: 'Commitments' });
      const count = await commitmentsLink.count();
      if (count > 0) {
        log('Found Commitments link');
      } else {
        throw new Error('Commitments link not found with role selector');
      }
    } catch (e) {
      // Try alternative selectors
      for (const selector of commitmentsSelectors) {
        try {
          const links = await page.locator(selector).all();
          if (links.length > 0) {
            commitmentsLink = links[0];
            log(`Found Commitments link with selector: ${selector}`);
            break;
          }
        } catch (err) {
          log(`Selector ${selector} failed: ${err.message}`, 'WARN');
        }
      }
    }

    if (!commitmentsLink) {
      throw new Error('Could not find Commitments link');
    }

    await commitmentsLink.click();
    log('Clicked Commitments link, waiting for page to load...');
    await page.waitForTimeout(5000);

    log('✓ Step 2 completed: Navigated to Commitments page');
  } catch (error) {
    log(`Failed to navigate to Commitments: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Step 3: Find and open PO for editing
 */
async function findAndOpenPO(page, clientOrderNumber) {
  log(`Step 3: Finding PO with Client Order Number: ${clientOrderNumber}`);

  try {
    // Wait for the initial page load
    await page.waitForTimeout(2000);

    // Wait for table to load with data
    log('Waiting for commitments table to load...');
    try {
      // Wait for table rows to appear
      await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
      await page.waitForTimeout(2000); // Additional wait for data to populate
      log('✓ Table loaded');
    } catch (e) {
      log('Table selector not found, proceeding anyway...', 'WARN');
    }

    // Extract number from client order number
    // e.g., "KIWIWASTE-006" => ["006", "06", "6"]
    const orderNumbers = extractOrderNumberVariants(clientOrderNumber);
    log(`Extracted order number variants: ${orderNumbers.join(', ')}`);

    // Look for the order number in the left side Number column
    log(`Searching in Number column for: ${orderNumbers.join(', ')}`);

    let poLink = null;

    // Strategy 1: Get all links in the Number column and match with JavaScript
    log('Strategy 1: Searching all links with JavaScript matching...');
    try {
      // Get all links on the page
      const allLinks = await page.locator('a').all();
      log(`Found ${allLinks.length} total links on page`);

      for (const link of allLinks) {
        try {
          const text = await link.textContent();
          if (!text) continue;

          const normalizedText = text.trim().replace(/\s+/g, ' '); // Normalize whitespace

          // Check each variant
          for (const orderNum of orderNumbers) {
            const normalizedOrderNum = orderNum.trim().replace(/\s+/g, ' ');

            // Check for exact match or contains
            if (normalizedText === normalizedOrderNum ||
                normalizedText.includes(normalizedOrderNum) ||
                normalizedText.toLowerCase() === normalizedOrderNum.toLowerCase() ||
                normalizedText.toLowerCase().includes(normalizedOrderNum.toLowerCase())) {
              poLink = link;
              log(`✅ Found matching PO link: "${normalizedText}" (matched with: "${orderNum}")`);
              break;
            }
          }

          if (poLink) break;
        } catch (e) {
          // Continue to next link
        }
      }
    } catch (e) {
      log(`Strategy 1 failed: ${e.message}`, 'WARN');
    }

    // Strategy 2: Try original selector-based approach if Strategy 1 didn't work
    if (!poLink) {
      log('Strategy 2: Trying selector-based approach...');
      for (const orderNum of orderNumbers) {
        log(`Trying to find job with number: ${orderNum}`);

        // Try to find a link in the Number column containing this number
        const poLinkSelectors = [
          `a:has-text("${orderNum}")`,
          `link:has-text("${orderNum}")`,
          `td a:has-text("${orderNum}")`,
          `[role="gridcell"] a:has-text("${orderNum}")`
        ];

        for (const selector of poLinkSelectors) {
          try {
            const links = await page.locator(selector).all();
            if (links.length > 0) {
              log(`Found ${links.length} link(s) with order number ${orderNum}`);
              // Filter links to make sure it's in the Number column (usually the first column)
              for (const link of links) {
                const text = await link.textContent();
                // Check if the link text contains the number
                if (text && (text.includes(orderNum) || text.trim() === orderNum)) {
                  poLink = link;
                  log(`Found matching PO with number: ${text.trim()}`);
                  break;
                }
              }
              if (poLink) break;
            }
          } catch (e) {
            log(`Selector ${selector} failed: ${e.message}`, 'WARN');
          }
        }

        if (poLink) break;
      }
    }

    if (!poLink) {
      // If order number not found directly, try searching and scrolling
      log('Order number not found directly, trying search and scroll strategies...');

      // Strategy 1: Try using search box with full client order number
      const searchInputSelectors = [
        'input[type="search"]',
        'input[placeholder*="Search" i]',
        'input[placeholder*="搜索" i]',
        '[role="searchbox"]',
        'input.search',
        '.search-input input'
      ];

      let searchInput = null;
      for (const selector of searchInputSelectors) {
        try {
          const input = await page.locator(selector).first();
          if (await input.isVisible({ timeout: 1000 })) {
            searchInput = input;
            log(`Found search input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (searchInput) {
        // IMPORTANT: Generate search terms without leading zeros to match system format
        // e.g., "Meadowood-052" should search for "Meadowood-52"
        const parts = clientOrderNumber.split('-');
        const numberPart = parts[parts.length - 1];
        const projectPart = parts.slice(0, -1).join('-');
        const withoutLeadingZeros = numberPart.replace(/^0+/, '');

        // Build search terms: try without leading zeros first, then with
        const searchTerms = [];
        if (withoutLeadingZeros && withoutLeadingZeros !== numberPart && projectPart) {
          // Try full PO number without leading zeros first (e.g., "Meadowood-52")
          searchTerms.push(`${projectPart}-${withoutLeadingZeros}`);
        }
        // Then try original (with leading zeros)
        searchTerms.push(clientOrderNumber);

        log(`Will try searching with terms: ${searchTerms.join(', ')}`);

        // Try each search term
        for (const searchTerm of searchTerms) {
          log(`Using search box to find: ${searchTerm}`);
          await searchInput.click();
          await page.waitForTimeout(500);

          // Clear and type the search term
          await searchInput.fill('');
          await page.waitForTimeout(200);
          await searchInput.type(searchTerm, { delay: 50 });
          await page.waitForTimeout(500);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);

          // Try to find the link after this search
          for (const orderNum of [searchTerm, clientOrderNumber, ...orderNumbers]) {
            const poLinkSelectors = [
              `a:has-text("${orderNum}")`,
              `link:has-text("${orderNum}")`,
              `td a:has-text("${orderNum}")`,
              `[role="gridcell"] a:has-text("${orderNum}")`
            ];

            for (const selector of poLinkSelectors) {
              try {
                const links = await page.locator(selector).all();
                if (links.length > 0) {
                  poLink = links[0];
                  log(`✅ Found PO after searching for "${searchTerm}": ${await poLink.textContent()}`);
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
            if (poLink) break;
          }

          if (poLink) break; // Found it, stop searching
        }
      }

      // Strategy 2: If search didn't work, try scrolling to load more data
      if (!poLink) {
        log('Search did not find PO, trying to scroll and load more data...');

        // Find the table or list container
        const containerSelectors = [
          '[role="grid"]',
          'table tbody',
          '.data-table',
          '[class*="table-container"]',
          '[class*="list-container"]'
        ];

        let container = null;
        for (const selector of containerSelectors) {
          try {
            const elem = await page.locator(selector).first();
            if (await elem.isVisible({ timeout: 1000 })) {
              container = elem;
              log(`Found scrollable container: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (container) {
          // Scroll down multiple times to load more data
          for (let i = 0; i < 10; i++) {
            log(`Scroll attempt ${i + 1}/10 - loading more POs...`);

            // Scroll to bottom
            await container.evaluate(el => {
              el.scrollTop = el.scrollHeight;
            });

            await page.waitForTimeout(1500);

            // Try to find the PO after each scroll
            for (const orderNum of [clientOrderNumber, ...orderNumbers]) {
              const poLinkSelectors = [
                `a:has-text("${orderNum}")`,
                `td a:has-text("${orderNum}")`,
                `[role="gridcell"] a:has-text("${orderNum}")`
              ];

              for (const selector of poLinkSelectors) {
                try {
                  const links = await page.locator(selector).all();
                  if (links.length > 0) {
                    for (const link of links) {
                      const text = await link.textContent();
                      if (text && text.includes(orderNum)) {
                        poLink = link;
                        log(`✅ Found PO after scroll ${i + 1}: ${text.trim()}`);
                        break;
                      }
                    }
                    if (poLink) break;
                  }
                } catch (e) {
                  // Continue
                }
              }
              if (poLink) break;
            }

            if (poLink) break;
          }
        } else {
          log('Could not find scrollable container', 'WARN');
        }
      }
    }

    if (!poLink) {
      throw new Error(`Could not find PO with Client Order Number: ${clientOrderNumber} (tried: ${orderNumbers.join(', ')})`);
    }

    log('Found PO, clicking to open...');
    await poLink.click();
    await page.waitForTimeout(3000);

    log('✓ Step 3 completed: PO opened for editing');
  } catch (error) {
    log(`Failed to find and open PO: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Extract order number variants from client order number
 * e.g., "KIWIWASTE-006" => ["006", "06", "6", "Kiwiwaste --006", "KIWIWASTE --006", "Kiwiwaste-006"]
 * Enhanced to handle leading zero differences: "Meadowood-052" => includes "Meadowood-52"
 */
function extractOrderNumberVariants(clientOrderNumber) {
  // Extract the number part after the last hyphen
  const parts = clientOrderNumber.split('-');
  const numberPart = parts[parts.length - 1];
  const projectPart = parts.slice(0, -1).join('-');

  // Generate variants: "006", "06", "6"
  const variants = [];

  // Add original number
  variants.push(numberPart);

  // Try removing leading zeros
  const withoutLeadingZeros = numberPart.replace(/^0+/, '');
  if (withoutLeadingZeros && withoutLeadingZeros !== numberPart) {
    variants.push(withoutLeadingZeros);
  }

  // Try with one leading zero removed (if has more than one)
  if (numberPart.startsWith('00')) {
    const oneZeroRemoved = numberPart.substring(1);
    if (!variants.includes(oneZeroRemoved)) {
      variants.push(oneZeroRemoved);
    }
  }

  // Add project-based variants (for formats like "Kiwiwaste --006")
  if (projectPart) {
    // Title case version with double hyphen
    const titleCase = projectPart.charAt(0).toUpperCase() + projectPart.slice(1).toLowerCase();
    variants.push(`${titleCase} --${numberPart}`);
    variants.push(`${titleCase}--${numberPart}`);

    // Upper case version with double hyphen
    variants.push(`${projectPart.toUpperCase()} --${numberPart}`);
    variants.push(`${projectPart.toUpperCase()}--${numberPart}`);

    // Original format with single hyphen
    variants.push(`${titleCase}-${numberPart}`);
    variants.push(`${projectPart.toUpperCase()}-${numberPart}`);

    // IMPORTANT: Add variants with number without leading zeros
    // This handles cases like "Meadowood-052" matching "Meadowood-52"
    if (withoutLeadingZeros && withoutLeadingZeros !== numberPart) {
      variants.push(`${titleCase}-${withoutLeadingZeros}`);
      variants.push(`${projectPart.toUpperCase()}-${withoutLeadingZeros}`);
      variants.push(`${titleCase} --${withoutLeadingZeros}`);
      variants.push(`${titleCase}--${withoutLeadingZeros}`);
      variants.push(`${projectPart.toUpperCase()} --${withoutLeadingZeros}`);
      variants.push(`${projectPart.toUpperCase()}--${withoutLeadingZeros}`);

      // Also add original case from input (preserves exact casing)
      variants.push(`${projectPart}-${withoutLeadingZeros}`);
    }
  }

  return variants;
}

/**
 * Step 4: Update PO fields (Title and Status)
 */
async function uploadPDFAndUpdate(page, pdfFilePaths, invoiceNumber, totalAmount = null) {
  log('Step 4: Updating PO with invoice information...');

  // Normalize pdfFilePaths to array for backward compatibility
  let filePathsArray = [];
  if (pdfFilePaths) {
    if (Array.isArray(pdfFilePaths)) {
      filePathsArray = pdfFilePaths.filter(p => p);
    } else if (typeof pdfFilePaths === 'string') {
      filePathsArray = [pdfFilePaths];
    }
  }

  log(`Files to upload: ${filePathsArray.length}`);
  filePathsArray.forEach((path, index) => {
    log(`  File ${index + 1}: ${path.split('/').pop()}`);
  });

  // Track what was successfully completed
  const completedSteps = {
    editModeEntered: false,
    titleUpdated: false,
    statusUpdated: false,
    fileUploaded: false,
    lineItemAdded: false
  };

  try {
    // Wait for PO detail page to load completely
    log('Waiting for PO detail page to load...');
    await page.waitForTimeout(3000);

    // Wait for main content to appear (either Edit button or form fields)
    try {
      await page.waitForSelector('button:has-text("Edit"), input[name="title"], div[class*="PillSelect"]', { timeout: 10000 });
      log('✓ PO detail page loaded');
    } catch (e) {
      log('Warning: Could not confirm page load, but proceeding...', 'WARN');
    }

    // Look for Edit button to enable editing mode
    log('Looking for Edit button...');
    const editButtonSelectors = [
      'button:has-text("Edit")',
      'button:has-text("Edit contract")',  // More specific text
      'button[aria-label*="Edit"]',
      'link:has-text("Edit")'
    ];

    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          // Check if button is visible
          for (const btn of buttons) {
            const isVisible = await btn.isVisible();
            if (isVisible) {
              editButton = btn;
              const text = await btn.textContent();
              log(`Found Edit button: "${text}"`);
              break;
            }
          }
          if (editButton) break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (editButton) {
      await editButton.click();
      log('Clicked Edit button, entering edit mode...');
      await page.waitForTimeout(3000); // Wait longer for edit mode to activate

      // Wait for edit form to appear
      try {
        await page.waitForSelector('input[name="title"], textbox[name="Title"]', { timeout: 5000 });
        log('✓ Edit mode activated');
        completedSteps.editModeEntered = true;
      } catch (e) {
        log('Warning: Could not confirm edit mode activation', 'WARN');
      }
    } else {
      log('Edit button not found, assuming already in edit mode', 'WARN');
      // Wait a bit anyway in case form is loading
      await page.waitForTimeout(2000);
      // Assume edit mode if Edit button not found (might already be in edit mode)
      completedSteps.editModeEntered = true;
    }

    // Step 4.1: Update Title field with Invoice Number
    log('Looking for Title input field...');
    const titleInputSelectors = [
      'input[name="title"]',
      'input[placeholder*="Title"]',
      'label:has-text("Title") + input',
      'textbox[name="Title"]'
    ];

    let titleInput = null;
    for (const selector of titleInputSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          titleInput = inputs[0];
          log('Found Title input field');
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Try using getByRole
    if (!titleInput) {
      try {
        titleInput = page.getByRole('textbox', { name: /title/i });
        const count = await titleInput.count();
        if (count > 0) {
          log('Found Title input using role selector');
        } else {
          titleInput = null;
        }
      } catch (e) {
        titleInput = null;
      }
    }

    if (titleInput) {
      // Get current title value
      const currentTitle = await titleInput.inputValue();
      log(`Current Title: "${currentTitle}"`);

      // Append Invoice Number to title
      const newTitle = `${currentTitle} ${invoiceNumber}`;
      log(`Updating Title to: "${newTitle}"`);

      // Clear and fill new title
      await titleInput.click();
      await page.waitForTimeout(500);

      // Select all and replace
      await page.keyboard.press('Control+a'); // or Meta+a on Mac
      await page.waitForTimeout(200);
      await titleInput.fill(newTitle);

      log('✓ Title updated successfully');
      completedSteps.titleUpdated = true;
      await page.waitForTimeout(1000);
    } else {
      log('Title input field not found', 'WARN');
    }

    // Step 4.2: Update Status to "Received"
    log('Looking for Status dropdown (PillSelect)...');

    // Look for Status label and its associated dropdown
    const statusSelectors = [
      'div[class*="PillSelectLabelWrapper"]',
      'div[class*="PillSelect"]',
      'label:has-text("Status") ~ div',
      'div[class*="Select"]:near(label:has-text("Status"))',
      'select[name="status"]',
      '[role="combobox"][name*="status"]'
    ];

    let statusDropdown = null;

    // Try to find the PillSelect element near a Status label
    try {
      // First look for a "Status" label and find the clickable element nearby
      const statusLabels = await page.locator('label:has-text("Status"), div:has-text("Status")').all();

      for (const label of statusLabels) {
        // Check if this is actually a label (not the dropdown itself)
        const labelText = await label.textContent();
        if (labelText && labelText.trim().toLowerCase() === 'status') {
          log('Found Status label');

          // Try to find the PillSelect element nearby
          const parent = label.locator('xpath=ancestor::div[1]');
          const parentCount = await parent.count();

          if (parentCount > 0) {
            // Look for PillSelect within the parent or siblings
            const pillSelects = await parent.locator('div[class*="PillSelect"]').all();
            if (pillSelects.length > 0) {
              statusDropdown = pillSelects[0];
              log('Found PillSelect element near Status label');
              break;
            }
          }
        }
      }
    } catch (e) {
      log(`Label-based search failed: ${e.message}`, 'WARN');
    }

    // Fallback: Try direct selectors
    if (!statusDropdown) {
      for (const selector of statusSelectors) {
        try {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            // Check if it's visible and clickable
            for (const element of elements) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                statusDropdown = element;
                log(`Found Status dropdown with selector: ${selector}`);
                break;
              }
            }
            if (statusDropdown) break;
          }
        } catch (e) {
          // Try next selector
        }
      }
    }

    if (statusDropdown) {
      log('Clicking Status dropdown to open options...');
      await statusDropdown.click();
      await page.waitForTimeout(1500); // Wait for dropdown menu to appear

      // Look for "Received" option (it's a green button/option in the dropdown)
      log('Looking for "Received" option...');
      const receivedOptionSelectors = [
        'button:has-text("Received")',
        'div[role="option"]:has-text("Received")',
        'li:has-text("Received")',
        '[class*="option"]:has-text("Received")',
        'div:has-text("Received")'
      ];

      let receivedOption = null;
      for (const selector of receivedOptionSelectors) {
        try {
          const options = await page.locator(selector).all();
          log(`Found ${options.length} element(s) with selector: ${selector}`);

          for (const option of options) {
            const isVisible = await option.isVisible();
            if (!isVisible) continue;

            const text = await option.textContent();
            // Exact match for "Received" (not "Partially received")
            if (text && text.trim() === 'Received') {
              receivedOption = option;
              log(`Found "Received" option: ${text.trim()}`);
              break;
            }
          }

          if (receivedOption) break;
        } catch (e) {
          log(`Selector ${selector} failed: ${e.message}`, 'WARN');
        }
      }

      if (receivedOption) {
        log('Clicking "Received" option...');
        await receivedOption.click();
        await page.waitForTimeout(1000);
        log('✓ Status set to "Received"');
        completedSteps.statusUpdated = true;
      } else {
        log('"Received" option not found in dropdown', 'WARN');
      }
    } else {
      log('Status dropdown not found', 'WARN');
    }

    // Step 4.3: Upload PDF file if provided
    if (filePathsArray.length > 0) {
      log(`Step 4.3: Uploading ${filePathsArray.length} PDF file(s)...`);

      try {
        // Look for "Attach files" button
        log('Looking for "Attach files" button...');
        const attachFilesSelectors = [
          'button:has-text("Attach files")',
          'button[class*="StyledButton"]:has-text("Attach files")',
          'button[name="Attach files"]',
          '[role="button"]:has-text("Attach files")'
        ];

        let attachButton = null;
        for (const selector of attachFilesSelectors) {
          try {
            const buttons = await page.locator(selector).all();
            for (const button of buttons) {
              const isVisible = await button.isVisible();
              const text = await button.textContent();
              if (isVisible && text && text.includes('Attach files')) {
                attachButton = button;
                log('Found "Attach files" button');
                break;
              }
            }
            if (attachButton) break;
          } catch (e) {
            // Try next selector
          }
        }

        if (!attachButton) {
          log('Attach files button not found, skipping file upload', 'WARN');
        } else {
          // Click "Attach files" button
          log('Clicking "Attach files" button...');
          await attachButton.click();
          await page.waitForTimeout(1500);

          // Look for "Upload files" button
          log('Looking for "Upload files" button...');
          const uploadFilesSelectors = [
            'span:has-text("Upload files")',
            'button:has-text("Upload files")',
            '[class*="StyledLabel"]:has-text("Upload files")',
            'label:has-text("Upload files")'
          ];

          let uploadButton = null;
          for (const selector of uploadFilesSelectors) {
            try {
              const elements = await page.locator(selector).all();
              for (const element of elements) {
                const isVisible = await element.isVisible();
                const text = await element.textContent();
                if (isVisible && text && text.includes('Upload files')) {
                  uploadButton = element;
                  log('Found "Upload files" button/label');
                  break;
                }
              }
              if (uploadButton) break;
            } catch (e) {
              // Try next selector
            }
          }

          if (!uploadButton) {
            log('Upload files button not found, skipping file upload', 'WARN');
          } else {
            // Click "Upload files" to trigger file chooser
            log('Triggering file chooser...');

            // Set up file chooser handler
            const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 });
            await uploadButton.click();

            try {
              const fileChooser = await fileChooserPromise;
              log(`Selecting ${filePathsArray.length} file(s)...`);

              // 验证所有文件路径是否存在
              const fs = await import('fs');
              for (let i = 0; i < filePathsArray.length; i++) {
                const path = filePathsArray[i];
                const fileName = path.split('/').pop();
                const exists = fs.existsSync(path);
                log(`  ${i + 1}. ${fileName} - ${exists ? '✓ exists' : '✗ NOT FOUND'}`);
                if (!exists) {
                  log(`     Full path: ${path}`, 'ERROR');
                }
              }

              // 只上传存在的文件
              const validPaths = filePathsArray.filter(path => fs.existsSync(path));
              if (validPaths.length === 0) {
                log('No valid file paths found! Skipping file selection.', 'ERROR');
                throw new Error('No valid file paths');
              }

              log(`Setting ${validPaths.length} valid file(s) to file chooser...`);
              await fileChooser.setFiles(validPaths);
              log('Files selected, waiting for upload...');
              await page.waitForTimeout(3000); // Wait for upload to complete

              log(`✓ ${validPaths.length} PDF file(s) uploaded successfully`);
              completedSteps.fileUploaded = true;

              // Step 4.4: Click "Attach" button after file upload
              log('Step 4.4: Looking for "Attach" button...');
              await page.waitForTimeout(2000);

              const attachButtonSelectors = [
                'span:has-text("Attach")',
                'button:has-text("Attach")',
                '[class*="StyledLabel"]:has-text("Attach")'
              ];

              let attachButton = null;
              for (const selector of attachButtonSelectors) {
                try {
                  const elements = await page.locator(selector).all();
                  for (const element of elements) {
                    const isVisible = await element.isVisible();
                    const text = await element.textContent();
                    if (isVisible && text && text.trim() === 'Attach') {
                      attachButton = element;
                      log('Found "Attach" button');
                      break;
                    }
                  }
                  if (attachButton) break;
                } catch (e) {
                  // Try next selector
                }
              }

              if (attachButton) {
                log('Clicking "Attach" button...');
                await attachButton.click();
                await page.waitForTimeout(2000);
                log('✓ "Attach" button clicked');

                // Step 4.5: Click "Add line" button
                log('Step 4.5: Looking for "Add line" button...');

                const addLineButtonSelectors = [
                  'span:has-text("Add line")',
                  'button:has-text("Add line")',
                  '[class*="StyledLabel"]:has-text("Add line")'
                ];

                let addLineButton = null;
                for (const selector of addLineButtonSelectors) {
                  try {
                    const elements = await page.locator(selector).all();
                    for (const element of elements) {
                      const isVisible = await element.isVisible();
                      const text = await element.textContent();
                      if (isVisible && text && text.includes('Add line')) {
                        addLineButton = element;
                        log('Found "Add line" button');
                        break;
                      }
                    }
                    if (addLineButton) break;
                  } catch (e) {
                    // Try next selector
                  }
                }

                if (addLineButton) {
                  log('Clicking "Add line" button...');
                  await addLineButton.click();
                  await page.waitForTimeout(2000);
                  log('✓ "Add line" button clicked, new row added');

                  // Step 4.6: Find and fill Description field in the new row
                  log('Step 4.6: Looking for Description field in new row...');

                  // Wait longer for the new row to fully render
                  await page.waitForTimeout(3000);

                  // Strategy 1: Look for table rows and get the last one
                  log('Strategy 1: Looking for table rows in Schedule of Values...');
                  const tableRowSelectors = [
                    'table tbody tr',
                    'tr[role="row"]',
                    '[role="row"]',
                    'div[class*="TableRow"]',
                    'div[role="row"]'
                  ];

                  let descriptionInput = null;

                  for (const rowSelector of tableRowSelectors) {
                    try {
                      const rows = await page.locator(rowSelector).all();
                      if (rows.length > 0) {
                        log(`Found ${rows.length} rows with selector: ${rowSelector}`);

                        // Get the last row (newly added)
                        const lastRow = rows[rows.length - 1];
                        const isVisible = await lastRow.isVisible();

                        if (isVisible) {
                          log('Found last row, looking for Description field...');

                          // First, try to find the Description column header to determine the column index
                          try {
                            const headers = await page.locator('th, [role="columnheader"]').all();
                            let descriptionColumnIndex = -1;

                            for (let i = 0; i < headers.length; i++) {
                              const headerText = await headers[i].textContent();
                              if (headerText && headerText.toLowerCase().includes('description')) {
                                descriptionColumnIndex = i;
                                log(`Found Description column at index ${i}`);
                                break;
                              }
                            }

                            // If we found the column index, try to get that specific cell
                            if (descriptionColumnIndex >= 0) {
                              const cells = await lastRow.locator('td, [role="gridcell"]').all();
                              if (cells.length > descriptionColumnIndex) {
                                const descriptionCell = cells[descriptionColumnIndex];
                                log(`Targeting Description cell at index ${descriptionColumnIndex}`);

                                // Look for input within this specific cell
                                const cellInputs = await descriptionCell.locator('input, textarea, [contenteditable="true"]').all();
                                if (cellInputs.length > 0) {
                                  descriptionInput = cellInputs[0];
                                  log('Found Description input in the correct column');
                                  break;
                                }
                              }
                            }
                          } catch (headerError) {
                            log(`Header-based search failed: ${headerError.message}`, 'WARN');
                          }

                          // Fallback: Look for Description field within this row by placeholder
                          if (!descriptionInput) {
                            log('Trying fallback: looking for input with Description placeholder...');
                            const descriptionFieldSelectors = [
                              'input[placeholder*="Description"]',
                              'input[placeholder*="description"]',
                              'textarea[placeholder*="Description"]',
                              'textarea[placeholder*="description"]'
                            ];

                            for (const fieldSelector of descriptionFieldSelectors) {
                              try {
                                const fields = await lastRow.locator(fieldSelector).all();
                                if (fields.length > 0) {
                                  log(`Found ${fields.length} field(s) with Description placeholder`);
                                  descriptionInput = fields[0];
                                  log('Using first field with Description placeholder');
                                  break;
                                }
                              } catch (e) {
                                // Try next field selector
                              }
                            }
                          }

                          // Last resort: Get all inputs and skip the first one (which is usually the # column)
                          if (!descriptionInput) {
                            log('Last resort: getting all inputs and skipping first column...');
                            const allInputs = await lastRow.locator('td input, [role="gridcell"] input').all();
                            if (allInputs.length > 1) {
                              // Skip the first input (usually # or row number) and use the second one
                              descriptionInput = allInputs[1];
                              log(`Found ${allInputs.length} inputs, using the second one (skipping # column)`);
                            } else if (allInputs.length === 1) {
                              descriptionInput = allInputs[0];
                              log('Only one input found, using it');
                            }
                          }

                          if (descriptionInput) break;
                        }
                      }
                    } catch (e) {
                      log(`Row selector ${rowSelector} failed: ${e.message}`, 'WARN');
                    }
                  }

                  // Strategy 2: If table-based search failed, try direct input search
                  if (!descriptionInput) {
                    log('Strategy 2: Looking for all Description inputs and selecting the last one...');
                    const descriptionSelectors = [
                      'input[placeholder*="Description"]',
                      'input[name*="description"]',
                      'textarea[placeholder*="Description"]',
                      'textarea[name*="description"]',
                      '[contenteditable="true"]'
                    ];

                    for (const selector of descriptionSelectors) {
                      try {
                        const inputs = await page.locator(selector).all();
                        if (inputs.length > 0) {
                          log(`Found ${inputs.length} Description field(s) with selector: ${selector}`);
                          // Get the last input (most recently added)
                          descriptionInput = inputs[inputs.length - 1];
                          const isVisible = await descriptionInput.isVisible();
                          if (isVisible) {
                            log(`Using last Description input (${inputs.length})`);
                            break;
                          } else {
                            descriptionInput = null;
                          }
                        }
                      } catch (e) {
                        // Try next selector
                      }
                    }
                  }

                  // Strategy 3: Try to find the Schedule of Values section and its inputs
                  if (!descriptionInput) {
                    log('Strategy 3: Looking for Schedule of Values section...');
                    try {
                      const sovSectionSelectors = [
                        'div:has-text("Schedule of Values")',
                        'section:has-text("Schedule of Values")',
                        '[class*="ScheduleOfValues"]'
                      ];

                      for (const sovSelector of sovSectionSelectors) {
                        try {
                          const sections = await page.locator(sovSelector).all();
                          if (sections.length > 0) {
                            const section = sections[0];
                            log('Found Schedule of Values section');

                            // Look for all inputs within this section
                            const allInputs = await section.locator('input, textarea, [contenteditable="true"]').all();
                            if (allInputs.length > 0) {
                              log(`Found ${allInputs.length} input(s) in Schedule of Values section`);
                              // Get the last visible one
                              for (let i = allInputs.length - 1; i >= 0; i--) {
                                const input = allInputs[i];
                                const isVisible = await input.isVisible();
                                if (isVisible) {
                                  descriptionInput = input;
                                  log('Using last input in Schedule of Values section');
                                  break;
                                }
                              }
                              if (descriptionInput) break;
                            }
                          }
                        } catch (e) {
                          // Try next selector
                        }
                      }
                    } catch (e) {
                      log(`Schedule of Values section search failed: ${e.message}`, 'WARN');
                    }
                  }

                  if (descriptionInput) {
                    log(`Filling Description field with Invoice Number: ${invoiceNumber}`);
                    try {
                      await descriptionInput.click();
                      await page.waitForTimeout(500);
                      await descriptionInput.fill(invoiceNumber);
                      await page.waitForTimeout(500);
                      log('✓ Invoice number filled in Description field');
                      completedSteps.lineItemAdded = true;
                    } catch (fillError) {
                      log(`Failed to fill Description field: ${fillError.message}`, 'ERROR');
                      // Try alternative method: type instead of fill
                      try {
                        log('Trying alternative method: typing text...');
                        await descriptionInput.click();
                        await page.waitForTimeout(500);
                        for (const char of invoiceNumber) {
                          await page.keyboard.type(char);
                          await page.waitForTimeout(50);
                        }
                        log('✓ Invoice number typed in Description field');
                      } catch (typeError) {
                        log(`Failed to type in Description field: ${typeError.message}`, 'ERROR');
                      }
                    }

                    // Step 4.7: Fill Amount field with totalAmount if provided
                    if (totalAmount) {
                      log(`Step 4.7: Looking for Amount field in new row...`);
                      await page.waitForTimeout(1000);

                      // Look for Amount column header to determine the column index
                      try {
                        const headers = await page.locator('th, [role="columnheader"]').all();
                        let amountColumnIndex = -1;

                        for (let i = 0; i < headers.length; i++) {
                          const headerText = await headers[i].textContent();
                          if (headerText && headerText.toLowerCase().includes('amount')) {
                            amountColumnIndex = i;
                            log(`Found Amount column at index ${i}`);
                            break;
                          }
                        }

                        // Get the last row again
                        const rows = await page.locator('[role="row"]').all();
                        if (rows.length > 0) {
                          const lastRow = rows[rows.length - 1];

                          let amountInput = null;

                          // If we found the column index, target that specific cell
                          if (amountColumnIndex >= 0) {
                            const cells = await lastRow.locator('td, [role="gridcell"]').all();
                            if (cells.length > amountColumnIndex) {
                              const amountCell = cells[amountColumnIndex];
                              log(`Targeting Amount cell at index ${amountColumnIndex}`);

                              // Look for input within this specific cell
                              const cellInputs = await amountCell.locator('input, textarea').all();
                              if (cellInputs.length > 0) {
                                amountInput = cellInputs[0];
                                log('Found Amount input in the correct column');
                              }
                            }
                          }

                          // Fallback: Get all inputs and use the third one (skip #, Description)
                          if (!amountInput) {
                            log('Fallback: looking for third input (Amount column)...');
                            const allInputs = await lastRow.locator('td input, [role="gridcell"] input').all();
                            if (allInputs.length >= 3) {
                              amountInput = allInputs[2]; // Third input (after # and Description)
                              log(`Found ${allInputs.length} inputs, using the third one (Amount column)`);
                            }
                          }

                          if (amountInput) {
                            log(`Filling Amount field with: ${totalAmount}`);
                            try {
                              await amountInput.click();
                              await page.waitForTimeout(500);
                              await amountInput.fill(String(totalAmount));
                              await page.waitForTimeout(500);
                              log('✓ Total amount filled in Amount field');
                            } catch (amountFillError) {
                              log(`Failed to fill Amount field: ${amountFillError.message}`, 'ERROR');
                            }
                          } else {
                            log('Amount input field not found in new row', 'WARN');
                          }
                        }
                      } catch (amountError) {
                        log(`Error finding Amount field: ${amountError.message}`, 'ERROR');
                      }
                    } else {
                      log('Total amount not provided, skipping Amount field', 'INFO');
                    }
                  } else {
                    log('Description input field not found in new row after all strategies', 'WARN');
                    log('Please verify the Schedule of Values table structure', 'WARN');
                  }
                } else {
                  log('"Add line" button not found', 'WARN');
                }
              } else {
                log('"Attach" button not found, skipping Add line step', 'WARN');
              }

            } catch (fileChooserError) {
              log(`Failed to select file: ${fileChooserError.message}`, 'WARN');
            }
          }
        }
      } catch (uploadError) {
        log(`File upload failed: ${uploadError.message}`, 'WARN');
        log('Continuing without file upload...', 'INFO');
      }
    } else {
      log('No PDF files provided, skipping file upload', 'INFO');
    }

    // Generate completion summary based on what was actually completed
    const completedCount = Object.values(completedSteps).filter(v => v).length;
    const totalSteps = Object.keys(completedSteps).length;

    log('\n=== Step 4 Summary ===');
    log(`Edit mode: ${completedSteps.editModeEntered ? '✓' : '✗'}`);
    log(`Title updated: ${completedSteps.titleUpdated ? '✓' : '✗'}`);
    log(`Status updated: ${completedSteps.statusUpdated ? '✓' : '✗'}`);
    log(`File uploaded: ${completedSteps.fileUploaded ? '✓' : '✗'}`);
    log(`Line item added: ${completedSteps.lineItemAdded ? '✓' : '✗'}`);
    log(`Completed: ${completedCount}/${totalSteps} steps`);

    // Only mark as completed if at least some critical steps succeeded
    if (completedCount >= 2) {
      log('✓ Step 4 completed with partial success', 'INFO');
      log('Note: Changes are NOT saved yet - Save button intentionally skipped', 'INFO');
    } else {
      log(`✗ Step 4 failed - only ${completedCount}/${totalSteps} steps completed`, 'WARN');
      throw new Error(`Insufficient steps completed (${completedCount}/${totalSteps}). Please check if the page loaded correctly.`);
    }

  } catch (error) {
    log(`Failed to update PO fields: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Step 5: Submit the form (NOT IMPLEMENTED - waiting for user confirmation)
 * This is commented out for safety - will only submit when user explicitly confirms
 */
async function submitForm(page) {
  log('Step 5: Form submission - SKIPPED FOR SAFETY', 'WARN');
  log('To enable submission, uncomment the code in submitForm() function', 'WARN');

  // Uncomment below when ready to enable submission
  /*
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("提交")',
    'input[type="submit"]'
  ];

  try {
    const submitSelector = await waitForAnySelector(page, submitSelectors);
    await page.locator(submitSelector).click();
    log('✓ Step 5 completed: Form submitted');
    await page.waitForTimeout(3000);
  } catch (error) {
    log('Failed to submit form', 'ERROR');
    throw error;
  }
  */
}

/**
 * Main automation function for Procore
 * Implements complete unattended automation workflow
 * @param {string} clientOrderNumber - The client order number
 * @param {string} invoiceNumber - The invoice number
 * @param {string|null} totalAmount - The total amount (optional)
 * @param {string|string[]|null} pdfFilePaths - Single file path or array of file paths
 */
export async function automateProcore(clientOrderNumber, invoiceNumber, totalAmount = null, pdfFilePaths = null, sessionId = null) {
  let taskId = null;
  let context = null;
  let page = null;

  // Generate sessionId if not provided
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Normalize pdfFilePaths to array
  let filePathsArray = [];
  if (pdfFilePaths) {
    if (Array.isArray(pdfFilePaths)) {
      filePathsArray = pdfFilePaths.filter(p => p); // Remove null/undefined
    } else if (typeof pdfFilePaths === 'string') {
      filePathsArray = [pdfFilePaths];
    }
  }

  try {
    // Acquire browser from pool first to get taskId
    const browserInstance = await browserPool.acquire();
    taskId = browserInstance.taskId;
    context = browserInstance.context;
    page = browserInstance.page;

    // Set task context for automatic log tagging
    currentTaskContext = { sessionId, taskId };

    log('=== Starting Procore Automation ===');
    log(`Client Order Number: ${clientOrderNumber}`);
    log(`Invoice Number: ${invoiceNumber}`);
    log(`Total Amount Ex GST: ${totalAmount || 'Not provided'}`);
    log(`PDF Files Count: ${filePathsArray.length}`);
    filePathsArray.forEach((path, index) => {
      log(`  File ${index + 1}: ${path}`);
    });

    log(`[Task ${taskId}] Browser acquired from pool`, 'INFO');

    // Ensure user is logged in
    await ensureLoggedIn(page);

    // Execute automation steps
    await selectProject(page, clientOrderNumber);
    await navigateToCommitments(page);
    await findAndOpenPO(page, clientOrderNumber);
    await uploadPDFAndUpdate(page, filePathsArray, invoiceNumber, totalAmount);

    log(`[Task ${taskId}] === Automation Completed Successfully ===`);
    log(`[Task ${taskId}] Browser will remain open for you to check the results`, 'INFO');
    log(`[Task ${taskId}] Please close the browser window manually when done`, 'INFO');

    // Log pool statistics
    const stats = browserPool.getStats();
    log(`[Pool Stats] Active: ${stats.active}, Queued: ${stats.queued}, Max: ${stats.maxConcurrent}`, 'INFO');

    return {
      success: true,
      message: 'Automation completed successfully. Browser will remain open for verification.',
      completedSteps: ['login', 'selectProject', 'navigateToCommitments', 'findAndOpenPO', 'uploadPDFAndUpdate'],
      sessionId: sessionId,
      details: {
        taskId: taskId,
        sessionId: sessionId,
        project: clientOrderNumber,
        invoice: invoiceNumber,
        filesUploaded: filePathsArray.length
      }
    };

  } catch (error) {
    log(`[Task ${taskId || 'unknown'}] Automation failed: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');

    // Keep browser open even on error for debugging
    log(`[Task ${taskId}] Browser will remain open for debugging`, 'WARN');
    log(`[Task ${taskId}] Please close the browser window manually when done`, 'INFO');

    // Log pool statistics
    const stats = browserPool.getStats();
    log(`[Pool Stats] Active: ${stats.active}, Queued: ${stats.queued}, Max: ${stats.maxConcurrent}`, 'INFO');

    throw error;

  } finally {
    // Clear task context
    currentTaskContext = null;
  }
}

/**
 * Close all browser instances in the pool
 */
export async function closeBrowser() {
  log('Closing all browser instances in pool...');

  try {
    await browserPool.cleanup();
    log('All browsers closed successfully');
  } catch (error) {
    log(`Failed to close browsers: ${error.message}`, 'ERROR');
  }
}

/**
 * Get browser pool statistics
 */
export function getBrowserPoolStats() {
  return browserPool.getStats();
}

/**
 * Clean browser session data (for testing/debugging)
 */
export async function cleanBrowserSession() {
  log('Cleaning browser session data...');

  // Close browser first
  await closeBrowser();

  const fs = await import('fs');
  const fsPromises = fs.promises;

  try {
    await fsPromises.rm(BROWSER_DATA_DIR, { recursive: true, force: true });
    log('Browser session data cleaned');
  } catch (error) {
    log(`Failed to clean browser session: ${error.message}`, 'ERROR');
  }
}
