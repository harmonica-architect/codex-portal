const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', e.message));

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  for (let i = 0; i < 3; i++) { await page.locator('.login-g').nth(i).click(); await page.waitForTimeout(80); }
  await page.locator('#loginBtn').click();
  await page.waitForTimeout(1500);
  console.log('Logged in');

  // Test initSigilNav effect
  const before = await page.evaluate(() => {
    const dot = document.querySelector('.sn-dot-1');
    return {
      dotHasHandler: dot.onclick !== null,
      dotHasListener: dot.dataset.idx
    };
  });
  console.log('Before initSigilNav:', JSON.stringify(before));

  // Run initSigilNav manually
  await page.evaluate(() => { initSigilNav(); });
  console.log('initSigilNav called');

  const afterInit = await page.evaluate(() => {
    const dot = document.querySelector('.sn-dot-1');
    return { dotIdx: dot.dataset.idx };
  });
  console.log('After initSigilNav:', JSON.stringify(afterInit));

  // Now try clicking
  await page.locator('.sn-dot-1').click({ force: true });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    return {
      activeTab: document.querySelector('.nav-tab.active')?.dataset?.tab,
      tabWheelActive: document.getElementById('tab-wheel')?.classList.contains('active'),
      snDot1Active: document.querySelector('.sn-dot-1')?.classList.contains('active'),
      sigilNavIdx: sigilNav?.activeIndex
    };
  });
  console.log('After sn-dot-1 click:', JSON.stringify(result));

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
