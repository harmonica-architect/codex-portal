const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', e.message));

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  for (let i = 0; i < 3; i++) { await page.locator('.login-g').nth(i).click(); await page.waitForTimeout(80); }
  await page.locator('#loginBtn').click();
  await page.waitForTimeout(800);
  console.log('Logged in');

  // Try all mobile navigation approaches and check which tab-wheel ends up active
  const result = await page.evaluate(() => {
    return new Promise(async resolve => {
      // Try direct nav-tab click
      const navTab = document.querySelector('.nav-tab[data-tab="wheel"]');
      navTab.click();
      await new Promise(r => setTimeout(r, 400));
      const afterNavClick = {
        wheelDisplay: window.getComputedStyle(document.getElementById('tab-wheel')).display,
        wheelActive: document.getElementById('tab-wheel').classList.contains('active')
      };

      // Now click home
      const homeNavTab = document.querySelector('.nav-tab[data-tab="home"]');
      homeNavTab.click();
      await new Promise(r => setTimeout(r, 300));

      // Try mnd-wheel click
      const mndWheel = document.querySelector('.mnd-item[data-tab="wheel"]');
      mndWheel.click();
      await new Promise(r => setTimeout(r, 400));

      const afterMndClick = {
        wheelDisplay: window.getComputedStyle(document.getElementById('tab-wheel')).display,
        wheelActive: document.getElementById('tab-wheel').classList.contains('active')
      };

      resolve({ afterNavClick, afterMndClick, sigilNavActiveIdx: sigilNav?.activeIndex });
    });
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
