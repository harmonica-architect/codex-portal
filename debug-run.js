const http = require('http');
const fs = require('fs');
const path = require('path');
const BASE = 'C:/Users/c/.openclaw/workspace/reg-codex/icox';
const PORT = 3737;
const server = http.createServer((req, res) => {
  let fp = req.url === '/' ? '/index.html' : req.url;
  fp = fp.split('?')[0];
  const full = path.join(BASE, fp);
  try {
    const c = fs.readFileSync(full);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(c);
  } catch(e) { res.writeHead(404); res.end('not found'); }
});
server.listen(PORT, async () => {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:' + PORT + '/', { timeout: 15000 });
  const glyphs = page.locator('#loginGlyphs .login-g');
  await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
  await page.waitForTimeout(100);
  await page.locator('#loginBtn').click();
  await page.waitForFunction(() => document.getElementById('portal').style.display === 'flex', { timeout: 5000 });
  
  const tabNames = await page.evaluate(() => 
    Array.from(document.querySelectorAll('.nav-tab')).map(t => t.dataset.tab)
  );
  console.log('Tabs:', tabNames);
  
  await page.locator('[data-tab="codex"]').click();
  await page.waitForTimeout(200);
  
  const matrixBtnVisible = await page.locator('#btnOpenMatrix').isVisible();
  console.log('Matrix btn visible:', matrixBtnVisible);
  
  await page.locator('[data-tab="wheel"]').click();
  await page.waitForTimeout(200);
  const glyphOverlayVisible = await page.locator('#btnGlyphOverlay').isVisible();
  console.log('Glyph overlay btn visible:', glyphOverlayVisible);
  
  // Check if toolsCollapse is open
  const toolsCollapse = await page.evaluate(() => {
    const tc = document.getElementById('toolsCollapse');
    return tc ? tc.classList.contains('open') : 'not found';
  });
  console.log('toolsCollapse open:', toolsCollapse);
  
  // Check if the collapse body is visible
  const collapseBodyDisplay = await page.evaluate(() => {
    const cb = document.querySelector('#toolsCollapse .collapse-body');
    return cb ? window.getComputedStyle(cb).display : 'not found';
  });
  console.log('collapse-body display:', collapseBodyDisplay);
  
  // Check if glyph overlay btn is inside collapse body
  const btnGlyphOverlayParent = await page.evaluate(() => {
    const btn = document.getElementById('btnGlyphOverlay');
    return btn ? btn.parentElement.className : 'not found';
  });
  console.log('btnGlyphOverlay parent class:', btnGlyphOverlayParent);
  
  // Get all button IDs
  const allBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.id || b.className)
  );
  console.log('All buttons:', allBtns.join(', '));
  
  await browser.close();
  server.close();
});
