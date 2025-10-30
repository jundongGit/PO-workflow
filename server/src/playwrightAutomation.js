import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

// Global browser instance (singleton pattern)
let globalBrowserContext = null;
let globalBrowserPage = null;

// Log listeners for real-time updates
let logListeners = [];

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
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message
  };

  // Console log
  console.log(`[${timestamp}] [${level}] ${message}`);

  // Broadcast to all listeners (for real-time web display)
  logListeners.forEach(listener => {
    try {
      listener(logEntry);
    } catch (error) {
      // Ignore errors from listeners
    }
  });
}

/**
 * Add a log listener for real-time updates
 */
export function addLogListener(listener) {
  logListeners.push(listener);
  return () => {
    logListeners = logListeners.filter(l => l !== listener);
  };
}

/**
 * Remove all log listeners
 */
export function clearLogListeners() {
  logListeners = [];
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
 * Initialize browser with persistent context (singleton pattern)
 * Reuses existing browser instance if available
 */
async function initBrowser() {
  // Check if browser is already running and still valid
  if (globalBrowserContext && globalBrowserPage) {
    try {
      // Test if the browser is still alive
      await globalBrowserPage.evaluate(() => true);
      log('Reusing existing browser instance');

      // Navigate to home page to reset state
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

  log('Initializing new browser instance...');

  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: false,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    viewport: { width: 1920, height: 1080 },
    slowMo: 100,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  // Store globally for reuse
  globalBrowserContext = context;
  globalBrowserPage = page;

  log('Browser initialized successfully');

  return { context, page };
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

    try {
      // Check if email field exists and has value
      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      const emailCount = await emailInput.count();

      if (emailCount > 0) {
        const emailValue = await emailInput.inputValue();
        log(`Email field found with value: ${emailValue || '(empty)'}`);

        // If email is already filled, just click Continue
        if (emailValue) {
          log('Email already filled, looking for Continue button...');
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
        if (PROCORE_PASSWORD) {
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
              await passwordInput.fill(PROCORE_PASSWORD);
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
          log('No password configured in environment variables', 'WARN');
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

  // Type the Client Order Number character by character
  // Check for unique result after each few characters
  log(`Typing Client Order Number with smart detection: ${clientOrderNumber}`);

  let projectOption = null;
  let inputComplete = false;

  for (let i = 0; i < clientOrderNumber.length; i++) {
    const char = clientOrderNumber[i];
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
      `a:has-text("${clientOrderNumber}")`,
      `div:has-text("${clientOrderNumber}")`
    ];

    for (const selector of optionSelectors) {
      try {
        const options = await page.locator(selector).all();
        if (options.length > 0) {
          log(`Found ${options.length} option(s) with selector: ${selector}`);

          // Find option that contains the Client Order Number
          for (const option of options) {
            const isVisible = await option.isVisible();
            if (!isVisible) continue;

            const text = await option.textContent();
            if (text && text.includes(clientOrderNumber)) {
              projectOption = option;
              log(`Found matching option with text: ${text.trim()}`);
              break;
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
    throw new Error(`No project found matching Client Order Number: ${clientOrderNumber}`);
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
    await page.waitForTimeout(2000);

    // Extract number from client order number
    // e.g., "KIWIWASTE-006" => ["006", "06", "6"]
    const orderNumbers = extractOrderNumberVariants(clientOrderNumber);
    log(`Extracted order number variants: ${orderNumbers.join(', ')}`);

    // Look for the order number in the left side Number column
    log(`Searching in Number column for: ${orderNumbers.join(', ')}`);

    let poLink = null;

    // Try each variant of the order number
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

    if (!poLink) {
      // If order number not found directly, try searching in the page
      log('Order number not found directly, trying page search...');

      // Look for search input
      const searchInput = page.getByRole('textbox', { name: /search/i });
      const count = await searchInput.count();

      if (count > 0) {
        // Try searching with the first variant (e.g., "006")
        const searchTerm = orderNumbers[0];
        log(`Found search input, searching for: ${searchTerm}`);
        await searchInput.click();
        await page.waitForTimeout(500);

        // Clear existing text
        await page.keyboard.press('Control+a');
        await page.waitForTimeout(200);

        // Type search term
        for (const char of searchTerm) {
          await page.keyboard.type(char);
          await page.waitForTimeout(100);
        }

        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Try to find the link again with all variants
        for (const orderNum of orderNumbers) {
          const poLinkSelectors = [
            `a:has-text("${orderNum}")`,
            `link:has-text("${orderNum}")`,
            `td a:has-text("${orderNum}")`
          ];

          for (const selector of poLinkSelectors) {
            try {
              const links = await page.locator(selector).all();
              if (links.length > 0) {
                poLink = links[0];
                log(`Found PO after search: ${await poLink.textContent()}`);
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }

          if (poLink) break;
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
 * e.g., "KIWIWASTE-006" => ["006", "06", "6"]
 */
function extractOrderNumberVariants(clientOrderNumber) {
  // Extract the number part after the last hyphen
  const parts = clientOrderNumber.split('-');
  const numberPart = parts[parts.length - 1];

  // Generate variants: "006", "06", "6"
  const variants = [];

  // Add original
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

  return variants;
}

/**
 * Step 4: Update PO fields (Title and Status)
 */
async function uploadPDFAndUpdate(page, pdfFilePath, invoiceNumber, totalAmount = null) {
  log('Step 4: Updating PO with invoice information...');

  try {
    // Wait for PO page to load
    await page.waitForTimeout(2000);

    // Look for Edit button to enable editing mode
    log('Looking for Edit button...');
    const editButtonSelectors = [
      'button:has-text("Edit")',
      'button[aria-label*="Edit"]',
      'link:has-text("Edit")'
    ];

    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          editButton = buttons[0];
          log('Found Edit button');
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (editButton) {
      await editButton.click();
      log('Clicked Edit button, entering edit mode...');
      await page.waitForTimeout(3000); // Wait longer for edit mode to activate
    } else {
      log('Edit button not found, assuming already in edit mode', 'WARN');
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
      } else {
        log('"Received" option not found in dropdown', 'WARN');
      }
    } else {
      log('Status dropdown not found', 'WARN');
    }

    // Step 4.3: Upload PDF file if provided
    if (pdfFilePath) {
      log('Step 4.3: Uploading PDF file...');

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
              log(`Selecting file: ${pdfFilePath}`);
              await fileChooser.setFiles(pdfFilePath);
              log('File selected, waiting for upload...');
              await page.waitForTimeout(3000); // Wait for upload to complete

              log('✓ PDF file uploaded successfully');

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
      log('No PDF file path provided, skipping file upload', 'INFO');
    }

    log('✓ Step 4 completed: PO fields updated (Title, Status, File Upload, and Schedule of Values)');
    log('Note: Changes are NOT saved yet - Save button intentionally skipped', 'INFO');

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
 */
export async function automateProcore(clientOrderNumber, invoiceNumber, totalAmount = null, pdfFilePath = null) {
  let context = null;
  let page = null;

  try {
    log('=== Starting Procore Automation ===');
    log(`Client Order Number: ${clientOrderNumber}`);
    log(`Invoice Number: ${invoiceNumber}`);
    log(`Total Amount Ex GST: ${totalAmount || 'Not provided'}`);
    log(`PDF File Path: ${pdfFilePath || 'Not provided'}`);

    // Initialize browser with persistent context
    ({ context, page } = await initBrowser());

    // Ensure user is logged in
    await ensureLoggedIn(page);

    // Execute automation steps
    await selectProject(page, clientOrderNumber);
    await navigateToCommitments(page);
    await findAndOpenPO(page, clientOrderNumber);
    await uploadPDFAndUpdate(page, pdfFilePath, invoiceNumber, totalAmount);

    log('=== Automation Completed Successfully ===');
    log('Browser will remain open for inspection', 'INFO');

    return {
      success: true,
      message: 'Automation completed successfully. PO updated with invoice information.',
      completedSteps: ['login', 'selectProject', 'navigateToCommitments', 'findAndOpenPO', 'uploadPDFAndUpdate'],
      details: {
        project: clientOrderNumber,
        invoice: invoiceNumber,
        pdfUploaded: pdfFilePath ? true : false
      }
    };

  } catch (error) {
    log(`Automation failed: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');

    // Don't close browser on error so user can see what happened
    log('Browser will remain open for debugging', 'WARN');

    throw error;
  }

  // Note: Browser context stays open for inspection
  // User can manually close it or it will persist for next run
}

/**
 * Close the global browser instance
 */
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
