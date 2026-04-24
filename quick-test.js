const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('1. Page loaded');

  await page.locator('.login-g').nth(0).click();
  await page.waitForTimeout(100);
  await page.locator('.login-g').nth(1).click();
  await page.waitForTimeout(100);
  await page.locator('.login-g').nth(2).click();
  await page.waitForTimeout(100);
  await page.locator('#loginBtn').click();
  await page.waitForTimeout(1000);
  console.log('2. Logged in');

  const drawerVis = await page.locator('#mobileNavDrawer').isVisible();
  console.log('3. Mobile drawer visible:', drawerVis);
  const drawerDisplay = await page.evaluate(() => window.getComputedStyle(document.getElementById('mobileNavDrawer')).display);
  console.log('   Drawer display:', drawerDisplay);

  for (const tab of ['home','wheel','codex','dream','journal','profile']) {
    await page.locator('.mnd-item[data-tab="' + tab + '"]').click({ force: true });
    await page.waitForTimeout(400);
    const vis = await page.locator('#tab-' + tab).isVisible();
    console.log('   Tab', tab + ':', vis ? 'OK' : 'FAIL');
  }

  await page.locator('.mnd-item[data-tab="wheel"]').click();
  await page.waitForTimeout(400);
  await page.locator('#btnStart').click({ force: true });
  await page.waitForTimeout(1000);
  const breathPhase = await page.locator('#phaseNum').textContent();
  console.log('4. Breath phase display:', breathPhase);

  await page.locator('.mnd-item[data-tab="dream"]').click({ force: true });
  await page.waitForTimeout(400);
  await page.locator('#mirrorInput').fill('light');
  await page.locator('#mirrorSubmit').click();
  await page.waitForTimeout(500);
  const mirrorOut = await page.locator('#mirrorOutput').textContent();
  console.log('5. Mirror output:', mirrorOut.slice(0, 80));

  const critErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
  console.log('\nCritical errors:', critErrors.length === 0 ? 'None' : critErrors.join(', '));

  // Desktop viewport test
  console.log('\n--- DESKTOP (1280x900) ---');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page2 = await ctx2.newPage();
  const errors2 = [];
  page2.on('pageerror', e => errors2.push(e.message));
  page2.on('console', m => { if (m.type() === 'error') errors2.push(m.text()); });

  await page2.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  await page2.locator('.login-g').nth(0).click();
  await page2.waitForTimeout(100);
  await page2.locator('.login-g').nth(1).click();
  await page2.waitForTimeout(100);
  await page2.locator('.login-g').nth(2).click();
  await page2.waitForTimeout(100);
  await page2.locator('#loginBtn').click();
  await page2.waitForTimeout(1000);

  const drawerHidden = !(await page2.locator('#mobileNavDrawer').isVisible());
  console.log('Desktop drawer hidden:', drawerHidden);

  for (const [idx, tab] of [[1,'wheel'],[2,'codex'],[3,'dream'],[4,'journal'],[7,'profile']]) {
    await page2.locator('.sn-dot-' + idx).click({ force: true });
    await page2.waitForTimeout(500);
    const vis = await page2.locator('#tab-' + tab).isVisible();
    console.log('  Tab', tab + ':', vis ? 'OK' : 'FAIL');
  }

  const crit2 = errors2.filter(e => !e.includes('favicon') && !e.includes('net::'));
  console.log('Desktop errors:', crit2.length === 0 ? 'None' : crit2.join(', '));

  await browser.close();
  console.log('\nDone.');
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
