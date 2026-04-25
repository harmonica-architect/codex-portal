const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/c/.openclaw/workspace/reg-codex/icox';
const httpServer = http.createServer((req, res) => {
  let fp = req.url === '/' ? '/index.html' : req.url;
  fp = fp.split('?')[0];
  const full = path.join(BASE, fp);
  const ext = path.extname(full);
  const mimeTypes = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json' };
  try {
    const c = fs.readFileSync(full);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(c);
  } catch(e) { res.writeHead(404); res.end('not found'); }
});

httpServer.listen(3738, async () => {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', e => { console.log('PAGE ERROR:', e.message); errors.push(e.message); });
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });
  
  await page.goto('http://localhost:3738/', { timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const state = await page.evaluate(() => {
    return {
      loginVisible: document.getElementById('loginScreen')?.style.display !== 'none',
      portalHidden: document.getElementById('portal')?.style.display === 'none',
      glyphCount: document.querySelectorAll('.login-g').length,
      loginBtnDisabled: document.getElementById('loginBtn')?.disabled,
      setupControlsDefined: typeof window.setupControls === 'function',
      drawWheelDefined: typeof window.drawWheel === 'function',
      animateWheelDefined: typeof window.animateWheel === 'function',
      connectWebSocketDefined: typeof window.connectWebSocket === 'function',
      CodexStateDefined: typeof window.CodexState !== 'undefined',
      WHEEL_CONFIGdefined: typeof window.WHEEL_CONFIG !== 'undefined',
      PHASESdefined: typeof window.PHASES !== 'undefined',
    };
  });
  
  console.log('State:', JSON.stringify(state, null, 2));
  console.log('Errors:', errors);
  
  await browser.close();
  httpServer.close();
});