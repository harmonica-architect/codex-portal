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
  await page.locator('.login-g').nth(0).click();
  await page.waitForTimeout(100);
  await page.locator('.login-g').nth(1).click();
  await page.waitForTimeout(100);
  await page.locator('.login-g').nth(2).click();
  await page.waitForTimeout(100);
  await page.locator('#loginBtn').click();
  await page.waitForTimeout(1500);
  console.log('Logged in');

  // Check initial state
  const homeTabActive = await page.evaluate(() => document.querySelector('.nav-tab.active')?.dataset.tab);
  const homeTabVisible = await page.locator('#tab-home').isVisible();
  const drawerVisible0 = await page.evaluate(() => {
    const el = document.getElementById('mobileNavDrawer');
    const cs = window.getComputedStyle(el);
    return { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, classes: el.className };
  });
  console.log('Home tab active:', homeTabActive, '| Home tab visible:', homeTabVisible);
  console.log('Drawer initial state:', JSON.stringify(drawerVisible0));

  // Click home nav item
  await page.locator('.mnd-item[data-tab="home"]').click({ force: true });
  await page.waitForTimeout(600);

  const homeTabActive2 = await page.evaluate(() => document.querySelector('.nav-tab.active')?.dataset.tab);
  const drawerState1 = await page.evaluate(() => {
    const el = document.getElementById('mobileNavDrawer');
    const cs = window.getComputedStyle(el);
    return { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, classes: el.className };
  });
  console.log('\nAfter home click:');
  console.log('  Home tab active:', homeTabActive2);
  console.log('  Drawer:', JSON.stringify(drawerState1));

  // Check if mnd-items are present and visible
  const mndItems = await page.evaluate(() => {
    const items = document.querySelectorAll('.mnd-item');
    return Array.from(items).map(el => {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return { tab: el.dataset.tab, display: cs.display, visibility: cs.visibility, w: rect.width, h: rect.height };
    });
  });
  console.log('\nMND items:', JSON.stringify(mndItems, null, 2));

  // Try to click wheel
  const wheelBefore = await page.evaluate(() => {
    const el = document.querySelector('.mnd-item[data-tab="wheel"]');
    if (!el) return 'NOT FOUND';
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return { display: cs.display, visibility: cs.visibility, w: rect.width, h: rect.height, top: rect.top, left: rect.left };
  });
  console.log('\nWheel item before click:', JSON.stringify(wheelBefore));

  await page.locator('.mnd-item[data-tab="wheel"]').click({ force: true });
  await page.waitForTimeout(600);
  const wheelTabVis = await page.locator('#tab-wheel').isVisible();
  console.log('Wheel tab visible after click:', wheelTabVis);

  const critErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
  console.log('\nCritical errors:', critErrors.length ? critErrors : 'None');

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
