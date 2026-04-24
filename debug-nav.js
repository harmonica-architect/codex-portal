const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });

  // Login
  for (let i = 0; i < 3; i++) {
    await page.locator('.login-g').nth(i).click();
    await page.waitForTimeout(80);
  }
  await page.locator('#loginBtn').click();
  await page.waitForTimeout(1500);
  console.log('Logged in');

  // Use page.evaluate to test navigation directly (bypass click stability)
  const navResult = await page.evaluate(() => {
    const result = {};
    // Check current state
    result.activeTab = document.querySelector('.nav-tab.active')?.dataset?.tab;
    result.homeVisible = document.getElementById('tab-home')?.classList.contains('active');
    result.drawerItems = document.querySelectorAll('.mnd-item').length;

    // Simulate wheel tab click via nav tab
    const wheelTab = document.querySelector('.nav-tab[data-tab="wheel"]');
    if (wheelTab) {
      wheelTab.click();
      result.wheelClicked = true;
    } else {
      result.wheelClicked = false;
      result.error = 'wheel tab not found';
    }

    // Check result after a microtask
    return new Promise(resolve => {
      setTimeout(() => {
        result.activeTabAfter = document.querySelector('.nav-tab.active')?.dataset?.tab;
        result.wheelVisible = document.getElementById('tab-wheel')?.classList.contains('active');
        resolve(result);
      }, 200);
    });
  });
  console.log('Navigation test:', JSON.stringify(navResult, null, 2));

  // Try clicking via JavaScript directly (no pointer events)
  const jsClickResult = await page.evaluate(() => {
    const result = {};
    const wheelItem = document.querySelector('.mnd-item[data-tab="wheel"]');
    if (wheelItem) {
      // Dispatch a click event directly
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
      wheelItem.dispatchEvent(evt);
      result.dispatched = true;
    } else {
      result.dispatched = false;
    }
    return new Promise(resolve => {
      setTimeout(() => {
        result.activeTab = document.querySelector('.nav-tab.active')?.dataset?.tab;
        result.wheelVisible = document.getElementById('tab-wheel')?.classList.contains('active');
        resolve(result);
      }, 300);
    });
  });
  console.log('JS click result:', JSON.stringify(jsClickResult, null, 2));

  // Try calling navTo directly
  const navToResult = await page.evaluate(() => {
    const result = {};
    if (typeof navTo === 'function') {
      navTo('journal');
      result.navToCalled = true;
    } else {
      result.navToCalled = false;
      result.navToType = typeof navTo;
    }
    return new Promise(resolve => {
      setTimeout(() => {
        result.activeTab = document.querySelector('.nav-tab.active')?.dataset?.tab;
        result.journalVisible = document.getElementById('tab-journal')?.classList.contains('active');
        resolve(result);
      }, 300);
    });
  });
  console.log('navTo result:', JSON.stringify(navToResult, null, 2));

  // Check sigil nav
  const sigilResult = await page.evaluate(() => {
    const result = {};
    result.sigilNavExists = typeof sigilNav !== 'undefined';
    result.navigateToSigilExists = typeof navigateToSigil === 'function';
    if (typeof navigateToSigil === 'function') {
      navigateToSigil(7); // profile
    }
    return new Promise(resolve => {
      setTimeout(() => {
        result.activeTab = document.querySelector('.nav-tab.active')?.dataset?.tab;
        result.profileVisible = document.getElementById('tab-profile')?.classList.contains('active');
        resolve(result);
      }, 300);
    });
  });
  console.log('sigilNav result:', JSON.stringify(sigilResult, null, 2));

  const critErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::') && !e.includes('Failed to load'));
  console.log('\nCritical JS errors:', critErrors.length ? critErrors : 'None');

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
