const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + '\n' + (e.stack || '')));

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('Errors:');
  errors.forEach((e, i) => { console.log('--- Error ' + i + ' ---'); console.log(e); });

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
