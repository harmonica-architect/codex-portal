const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CON: ' + m.text()); });
  page.on('response', res => { if (res.status() >= 400) requests.push('HTTP ' + res.status() + ': ' + res.url()); });

  await page.goto('http://localhost:3737/', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('Page loaded');

  // Check which scripts loaded — avoid typeof checks that throw
  const scriptsLoaded = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return {
      scriptCount: scripts.length,
      scripts: scripts.map(s => s.src.split('/').pop()),
    };
  });
  console.log('Scripts loaded:', JSON.stringify(scriptsLoaded));

  // Check window keys that exist
  const windowKeys = await page.evaluate(() => {
    const keys = [];
    // Check a sample of window properties
    for (const k of ['glyphLinker','COHERENCE_BUS','breathCtrl','mirrorMode','SPIRAL_LOG','COMMUNITY_FIELD','initGlyphLinker','initMirrorMode']) {
      try { keys.push(k + ':' + (window[k] !== undefined ? typeof window[k] : 'UNDEF')); } catch(e) { keys.push(k + ':ERROR'); }
    }
    return keys;
  });
  console.log('Window keys:', JSON.stringify(windowKeys));

  console.log('\n404 responses:', requests.length ? requests : 'None');
  const critErrors = errors.filter(e => !e.includes('favicon'));
  console.log('Errors:', critErrors.length ? critErrors : 'None');

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
