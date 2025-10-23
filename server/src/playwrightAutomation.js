import { chromium } from 'playwright';

const PROCORE_URL = 'https://us02.procore.com/598134325648131/company/home/list';

/**
 * Type text character by character with delay
 */
async function typeSlowly(page, selector, text, delay = 100) {
  const element = await page.locator(selector);
  await element.click();

  for (const char of text) {
    await page.keyboard.type(char);
    await page.waitForTimeout(delay);
  }
}

/**
 * Main automation function for Procore
 */
export async function automateProcore(clientOrderNumber, invoiceNumber) {
  let browser;
  let context;

  try {
    console.log('Starting Procore automation...');
    console.log('Client Order Number:', clientOrderNumber);
    console.log('Invoice Number:', invoiceNumber);

    // Launch browser in non-headless mode so user can see what's happening
    browser = await chromium.launch({
      headless: false,
      slowMo: 100 // Slow down operations for visibility
    });

    // Create a new context (to preserve cookies for login)
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to Procore
    console.log('Navigating to Procore...');
    await page.goto(PROCORE_URL, { waitUntil: 'networkidle' });

    // Wait a bit for page to settle
    await page.waitForTimeout(2000);

    // Check if user is logged in
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('signin')) {
      console.log('User not logged in. Please log in manually...');

      // Wait for user to log in (wait for URL to change back to the target URL)
      await page.waitForURL('**/company/home/list', { timeout: 300000 }); // 5 min timeout
      console.log('Login successful!');

      await page.waitForTimeout(2000);
    }

    // Step 1: Find the picker element
    console.log('Looking for project picker...');

    // The class name you provided: "StyledPickerContainer-gUbfwb fkFJOK"
    // We'll use a more flexible selector
    const pickerSelector = '.StyledPickerContainer-gUbfwb, [class*="StyledPickerContainer"]';

    // Wait for the picker to be visible
    await page.waitForSelector(pickerSelector, { timeout: 10000 });

    // Find the input element within the picker
    const inputSelector = `${pickerSelector} input`;

    // Check if input exists
    const inputExists = await page.locator(inputSelector).count() > 0;

    if (!inputExists) {
      throw new Error('Could not find input field in picker');
    }

    console.log('Found picker input, typing Client Order Number...');

    // Click the input to focus
    await page.locator(inputSelector).click();
    await page.waitForTimeout(500);

    // Type the Client Order Number character by character
    for (const char of clientOrderNumber) {
      await page.keyboard.type(char);
      await page.waitForTimeout(150); // 150ms delay between characters
    }

    console.log('Finished typing, waiting for search results...');

    // Wait for dropdown/search results to appear
    await page.waitForTimeout(1000);

    // Look for dropdown results
    // Common selectors for dropdown menus
    const dropdownSelectors = [
      '[role="listbox"]',
      '[role="menu"]',
      '.dropdown-menu',
      '[class*="dropdown"]',
      '[class*="menu"]',
      '[class*="options"]'
    ];

    let dropdownVisible = false;
    let dropdownSelector = null;

    for (const selector of dropdownSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const isVisible = await page.locator(selector).first().isVisible();
        if (isVisible) {
          dropdownVisible = true;
          dropdownSelector = selector;
          console.log(`Found dropdown with selector: ${selector}`);
          break;
        }
      }
    }

    if (!dropdownVisible) {
      console.log('Dropdown not found, trying to find options by text...');
    }

    // Look for options that contain the Client Order Number
    const optionSelectors = [
      `[role="option"]:has-text("${clientOrderNumber}")`,
      `li:has-text("${clientOrderNumber}")`,
      `div:has-text("${clientOrderNumber}")`
    ];

    let matchedOption = null;

    for (const selector of optionSelectors) {
      const options = await page.locator(selector);
      const count = await options.count();

      if (count > 0) {
        console.log(`Found ${count} matching option(s) with selector: ${selector}`);

        // If only one match, select it
        if (count === 1) {
          matchedOption = options.first();
          break;
        } else {
          // Multiple matches - try to find exact match
          for (let i = 0; i < count; i++) {
            const option = options.nth(i);
            const text = await option.textContent();
            if (text && text.includes(clientOrderNumber)) {
              matchedOption = option;
              break;
            }
          }
          if (matchedOption) break;
        }
      }
    }

    if (matchedOption) {
      console.log('Found matching option, clicking...');
      await matchedOption.click();
      await page.waitForTimeout(1000);
      console.log('Option selected successfully!');
    } else {
      throw new Error('No matching option found for Client Order Number');
    }

    // Keep browser open for user to continue
    console.log('Step 1 completed successfully!');
    console.log('Browser will remain open for further operations...');

    return {
      success: true,
      message: 'Successfully selected project. Browser remains open for next steps.',
      step: 1
    };

  } catch (error) {
    console.error('Automation error:', error);

    // Don't close browser on error so user can see what happened
    throw error;
  }

  // Note: We're NOT closing browser/context here
  // The browser will stay open for user to continue or for next steps
}
