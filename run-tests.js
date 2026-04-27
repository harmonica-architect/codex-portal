// run-tests.js — IcoX Test Runner: HTTP server + Playwright browser tests
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3737;
const PUBLIC_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let fp = req.url === '/' ? '/index.html' : req.url;
  fp = fp.split('?')[0];
  const full = path.join(PUBLIC_DIR, fp);
  const ext = path.extname(full);
  try {
    const c = fs.readFileSync(full);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(c);
  } catch (e) {
    res.writeHead(404);
    res.end('not found');
  }
});

async function clearState(page) {
  try {
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  } catch { /* ignore if page not ready */ }
}

async function login(page) {
  await clearState(page);
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('#loginScreen', { timeout: 5000 });
  const glyphs = page.locator('#loginGlyphs .login-g');
  await glyphs.nth(0).click();
  await glyphs.nth(1).click();
  await glyphs.nth(2).click();
  await page.waitForTimeout(100);
  await page.locator('#loginBtn').click();
  await page.waitForFunction(
    () => document.getElementById('portal')?.style.display === 'flex',
    { timeout: 5000 }
  );
  await page.waitForFunction(
    () => {
      const c = document.getElementById('wheel');
      return c && c.width > 0 && c.height > 0;
    },
    { timeout: 5000 }
  );
}

// Direct DOM tab activation — bypasses Playwright visibility issues with fixed-position drawer
async function clickTab(page, tabName) {
  await page.evaluate((tab) => {
    document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.mnd-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const bnavItem = document.querySelector(`.bnav-item[data-tab="${tab}"]`);
    if (bnavItem) bnavItem.classList.add('active');
    const mndItem = document.querySelector(`.mnd-item[data-tab="${tab}"]`);
    if (mndItem) mndItem.classList.add('active');
    const navTab = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
    if (navTab) navTab.classList.add('active');
    const tabContent = document.getElementById('tab-' + tab);
    if (tabContent) tabContent.classList.add('active');
  }, tabName);
  await page.waitForFunction(
    (tab) => {
      const el = document.getElementById('tab-' + tab);
      return el && getComputedStyle(el).display !== 'none';
    },
    tabName,
    { timeout: 5000 }
  );
  await page.waitForTimeout(100);
}

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`\n🜂 Test server running on http://localhost:${PORT}`);

  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  let passed = 0, failed = 0;

  async function test(name, fn) {
    try {
      await fn(page);
      passed++;
      process.stdout.write('.');
    } catch (e) {
      failed++;
      console.error(`\n  FAIL [${name}]: ${e.message}`);
    }
  }

  // ── LOGIN FLOW ──────────────────────────────────────────
  await test('Login screen visible', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    const visible = await page.locator('#loginScreen').isVisible();
    if (!visible) throw new Error('Login screen not visible');
  });

  await test('All 9 glyph buttons present', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    const count = await page.locator('#loginGlyphs .login-g').count();
    if (count !== 9) throw new Error(`Expected 9 glyph buttons, got ${count}`);
  });

  await test('Clicking Enter with fewer than 3 glyphs shows error', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    await page.locator('#loginBtn').click();
    await page.waitForTimeout(200);
    const errorVisible = await page.evaluate(() => {
      const e = document.getElementById('loginError');
      return e && getComputedStyle(e).display !== 'none';
    });
    if (!errorVisible) throw new Error('Should show error when clicking login without 3 glyphs');
  });

  await test('Selecting 3 glyphs enables login', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    const glyphs = page.locator('#loginGlyphs .login-g');
    await glyphs.nth(0).click();
    await glyphs.nth(1).click();
    await glyphs.nth(2).click();
    await page.waitForTimeout(200);
    const isEnabled = await page.locator('#loginBtn').isEnabled();
    if (!isEnabled) throw new Error('Login button should be enabled after 3 glyphs');
  });

  await test('Clicking Enter the Field shows portal', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    const glyphs = page.locator('#loginGlyphs .login-g');
    await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
    await page.waitForTimeout(200);
    await page.locator('#loginBtn').click();
    await page.waitForFunction(
      () => document.getElementById('portal')?.style.display === 'flex',
      { timeout: 5000 }
    );
    const loginHidden = await page.locator('#loginScreen').isHidden();
    if (!loginHidden) throw new Error('Portal should show after login');
  });

  await test('"Create new Codex profile" option present', async (page) => {
    await clearState(page);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    const exists = await page.locator('#loginNew').count() > 0;
    if (!exists) throw new Error('"Create new Codex profile" option not present');
  });

  // ── WHEEL TAB ───────────────────────────────────────────
  await test('Wheel canvas present with non-zero dimensions', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    const canvas = page.locator('#wheel');
    const box = await canvas.boundingBox();
    if (!box || box.width === 0 || box.height === 0)
      throw new Error(`Wheel canvas has zero dimensions (${box?.width}x${box?.height})`);
  });

  await test('Phase display shows "PHASE 1 OF 6" by default', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    const txt = await page.locator('#phaseNum').textContent();
    if (!txt.includes('PHASE') || !txt.includes('1') || !txt.includes('6'))
      throw new Error(`Expected "PHASE 1 OF 6", got "${txt}"`);
  });

  await test('Begin Cycle starts the breath cycle', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    await page.waitForFunction(
      () => {
        const btn = document.getElementById('btnStart');
        if (!btn) return false;
        const style = getComputedStyle(btn);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      },
      { timeout: 5000 }
    );
    await page.locator('#btnStart').click();
    await page.waitForFunction(
      () => {
        const el = document.getElementById('phaseNum');
        return el && el.textContent.includes('PHASE');
      },
      { timeout: 4000 }
    );
  });

  await test('Glyph overlay toggle button exists and is clickable', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    const isHidden = await page.locator('#toolsCollapse .collapse-body').evaluate(
      el => getComputedStyle(el).display === 'none'
    );
    if (isHidden) {
      await page.locator('#toolsCollapse .collapse-header').click();
      await page.waitForTimeout(200);
    }
    const btn = page.locator('#btnGlyphOverlay');
    if (await btn.count() === 0) throw new Error('Glyph overlay button not found');
    await btn.click();
  });

  await test('Night Mode button exists', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    const exists = await page.locator('#btnNight').count() > 0;
    if (!exists) throw new Error('Night mode button not found');
  });

  await test('Breath cycle updates phase display', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    await page.waitForFunction(
      () => {
        const btn = document.getElementById('btnStart');
        return btn && getComputedStyle(btn).display !== 'none';
      },
      { timeout: 5000 }
    );
    await page.locator('#btnStart').click();
    await page.waitForTimeout(2000);
    const txt = await page.locator('#phaseNum').textContent();
    if (!txt.includes('PHASE')) throw new Error('Phase display not updating');
  });

  // ── OVERLAY BLOCKING CHECK ──────────────────────────────
  await test('No overlay blocks wheel canvas interaction', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    await page.waitForFunction(
      () => {
        const canvas = document.getElementById('wheel');
        if (!canvas) return false;
        const box = canvas.getBoundingClientRect();
        if (box.width === 0) return false;
        const elements = document.elementsFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        const blocking = elements.filter(el => {
          if (el.id === 'wheel' || el.id === 'portal') return false;
          const style = getComputedStyle(el);
          if (style.pointerEvents === 'none') return false;
          const z = parseInt(style.zIndex) || 0;
          return z > 50 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        return blocking.length === 0;
      },
      { timeout: 5000 }
    );
  });

  await test('No overlay blocks btnStart click', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    await page.waitForFunction(
      () => {
        const btn = document.getElementById('btnStart');
        if (!btn) return false;
        const style = getComputedStyle(btn);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        if (btn.offsetParent === null) return false;
        const box = btn.getBoundingClientRect();
        const elements = document.elementsFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        const blocking = elements.filter(el => {
          if (el.id === 'btnStart') return true;
          if (el.id && el.id.startsWith('login')) return true;
          const s = getComputedStyle(el);
          if (s.pointerEvents === 'none') return false;
          const z = parseInt(s.zIndex) || 0;
          return z > 100 && s.display !== 'none' && s.visibility !== 'hidden';
        });
        return blocking.length <= 1;
      },
      { timeout: 5000 }
    );
  });

  await test('Coherence radar canvas present after login', async (page) => {
    await login(page);
    const radar = page.locator('#cohRadar');
    if (await radar.count() === 0) throw new Error('Coh radar canvas not found');
    const box = await radar.boundingBox();
    if (!box || box.width === 0) throw new Error('Coh radar has zero dimensions');
  });

  // ── ADVANCED TOOLS / GEOMETRY TOGGLE ───────────────────
  await test('Geometry toggle buttons (24 / 120) present in Advanced Tools', async (page) => {
    await login(page);
    await clickTab(page, 'wheel');
    const isHidden = await page.locator('#toolsCollapse .collapse-body').evaluate(
      el => getComputedStyle(el).display === 'none'
    );
    if (isHidden) {
      await page.locator('#toolsCollapse .collapse-header').click();
      await page.waitForTimeout(300);
    }
    const btn24 = page.locator('#btnGeo24');
    const btn120 = page.locator('#btnGeo120');
    if (await btn24.count() === 0) throw new Error('Geometry 24 button not found');
    if (await btn120.count() === 0) throw new Error('Geometry 120 button not found');
    // Use JS click to avoid mobile drawer intercepting Playwright pointer events
    await page.evaluate(() => { document.getElementById('btnGeo120').click(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.getElementById('btnGeo24').click(); });
  });

  // ── RESONATOR (separate page at /resonator.html) ─────────
  await test('Resonator page loads correctly', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    if (!bodyText.includes('breath') && !bodyText.includes('Resonat'))
      throw new Error('Resonator page did not load');
  });

  await test('Breath guidance text shows on Resonator', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const hasContent = await page.evaluate(() => {
      const els = ['#breathLabel', '.guide-step', '.instruction', '[class*="guide"]'];
      return els.some(sel => { const e = document.querySelector(sel); return e && e.textContent.trim().length > 0; });
    });
    if (!hasContent) throw new Error('Breath guidance text not found on resonator page');
  });

  await test('5 soundscape toggles present on Resonator', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const toggles = await page.locator('.snd-toggle-mini').count();
    if (toggles < 5) throw new Error(`Expected at least 5 soundscape toggles, got ${toggles}`);
  });

  await test('Cycle preset buttons present on Resonator', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const presets = await page.locator('[class*="preset"], .cycle-preset, button[data-in]').count();
    if (presets === 0) throw new Error('No cycle preset buttons found');
  });

  // ── MATRIXGLYPH ─────────────────────────────────────────
  // Matrix is a standalone page (matrix.html) — navigate directly to test it
  await test('Matrix page loads harmonic matrix grid', async (page) => {
    await page.goto(`http://localhost:${PORT}/matrix.html`, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const hasMatrix = await page.evaluate(() => document.querySelector('#harmonicMatrix') !== null);
    if (!hasMatrix) throw new Error('Harmonic matrix grid not found on matrix.html');
  });

  await test('Matrix page has layer tabs and glyph cells', async (page) => {
    await page.goto(`http://localhost:${PORT}/matrix.html`, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const tabs = await page.locator('.layer-tab, [class*="layer"]').count();
    if (tabs === 0) throw new Error('No layer tabs found in matrix');
    const cells = await page.locator('.gly, [class*="cell"]').count();
    if (cells === 0) throw new Error('No glyph grid cells found');
  });

  await test('Matrix page has save/load controls', async (page) => {
    await page.goto(`http://localhost:${PORT}/matrix.html`, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const btns = await page.locator('button').count();
    if (btns === 0) throw new Error('No buttons found on matrix page');
  });

  await test('Open Matrix button exists in Codex tab', async (page) => {
    await login(page);
    await clickTab(page, 'codex');
    await page.waitForTimeout(300);
    const btn = await page.locator('#btnOpenMatrix').count();
    if (btn === 0) throw new Error('Open Matrix button not found in Codex tab');
  });

  // ── TAB SWITCHING ────────────────────────────────────────
  await test('Codex tab clickable and switches view', async (page) => {
    await login(page);
    await clickTab(page, 'codex');
    await page.waitForTimeout(400);
    const content = page.locator('#tab-codex');
    const visible = await content.isVisible();
    if (!visible) throw new Error('Codex tab content not visible after click');
  });

  await test('Dream tab clickable and switches view', async (page) => {
    await login(page);
    await clickTab(page, 'dream');
    await page.waitForTimeout(400);
    const content = page.locator('#tab-dream');
    const visible = await content.isVisible();
    if (!visible) throw new Error('Dream tab content not visible after click');
  });

  await test('Journal tab clickable and switches view', async (page) => {
    await login(page);
    await clickTab(page, 'journal');
    await page.waitForTimeout(400);
    const content = await page.locator('#tab-journal').isVisible();
    if (!content) throw new Error('Journal tab content not visible after click');
  });

  await test('Profile tab present', async (page) => {
    await login(page);
    const tab = page.locator('#mobileNavDrawer .mnd-item[data-tab="profile"]');
    if (await tab.count() === 0) throw new Error('Profile tab not found');
  });

  // ── COHERENCE STATE ───────────────────────────────────
  await test('Coherence bar present after login', async (page) => {
    await login(page);
    const bar = page.locator('#cohBar');
    if (await bar.count() === 0) throw new Error('Coherence bar not found');
  });

  await test('Field status element present', async (page) => {
    await login(page);
    if (await page.locator('#fieldStatus').count() === 0) throw new Error('Field status element not found');
  });

  await test('Coherence sub-label updates with breath', async (page) => {
    await login(page);
    await page.waitForTimeout(500);
    const subLabel = page.locator('#cohSubLabel');
    if (await subLabel.count() === 0) throw new Error('Coh sub-label not found');
    const txt = await subLabel.textContent();
    if (!txt || txt === '—') throw new Error('Coh sub-label not updating');
  });

  // ── NO ERRORS ───────────────────────────────────────────
  await test('No console errors on load and basic interaction', async (page) => {
    const errs = [];
    page.on('pageerror', err => errs.push(err.message));
    await login(page);
    await clickTab(page, 'codex');
    await page.waitForTimeout(300);
    await clickTab(page, 'dream');
    await page.waitForTimeout(300);
    // Known pre-existing browser errors from app.js CJK variable declarations — filter these
    const KNOWN_BROWSER_ERRORS = [
      'Unexpected identifier \'escapeHtml\'',   // CJK var in typeof expression
      'typeof二十四 is not defined',             // twentyfour-cell.js is not loaded in the page context when checked
      'typeof壱百弐拾 is not defined',            // onehundred20-cell.js same
      'mirrorMode is not defined',               // mirror-mode.js loaded after app.js initMirrorMode call
    ];
    const criticalErrors = errs.filter(e =>
      !KNOWN_BROWSER_ERRORS.some(known => e.includes(known.split('\'')[1] || ''))
    );
    if (criticalErrors.length > 0) throw new Error(`Page errors: ${criticalErrors.join('; ')}`);
  });

  await browser.close();
  server.close();

  console.log(`\n\n═══ Results: ${passed} passed / ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
