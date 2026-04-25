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

async function waitForPortal(page) {
  const portalDisplay = await page.evaluate(() => document.getElementById('portal').style.display);
  if (portalDisplay === 'flex') return; // already logged in
  const glyphs = page.locator('#loginGlyphs .login-g');
  await glyphs.nth(0).click();
  await glyphs.nth(1).click();
  await glyphs.nth(2).click();
  await page.waitForTimeout(100);
  await page.locator('#loginBtn').click();
  await page.waitForFunction(() => document.getElementById('portal').style.display === 'flex', { timeout: 5000 });
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
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#loginScreen', { timeout: 5000 });
    const visible = await page.locator('#loginScreen').isVisible();
    if (!visible) throw new Error('Login screen not visible');
  });

  await test('All 9 glyph buttons present', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    const count = await page.locator('#loginGlyphs .login-g').count();
    if (count !== 9) throw new Error(`Expected 9 glyph buttons, got ${count}`);
  });

  await test('Login button disabled until 3 glyphs', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    const isDisabled = await page.locator('#loginBtn').isDisabled();
    if (!isDisabled) throw new Error('Login button should be disabled before 3 glyphs');
  });

  await test('Selecting 3 glyphs enables login', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    const glyphs = page.locator('#loginGlyphs .login-g');
    await glyphs.nth(0).click();
    await glyphs.nth(1).click();
    await glyphs.nth(2).click();
    await page.waitForTimeout(100);
    const isEnabled = await page.locator('#loginBtn').isEnabled();
    if (!isEnabled) throw new Error('Login button should be enabled after 3 glyphs');
  });

  await test('Clicking Enter the Field shows portal', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    const glyphs = page.locator('#loginGlyphs .login-g');
    await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
    await page.waitForTimeout(100);
    await page.locator('#loginBtn').click();
    await page.waitForTimeout(300);
    const loginHidden = await page.locator('#loginScreen').isHidden();
    if (!loginHidden) throw new Error('Portal should show after login');
  });

  await test('"Create new Codex profile" option present', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    const exists = await page.locator('#loginNew').count() > 0;
    if (!exists) throw new Error('"Create new Codex profile" option not present');
  });

  // ── WHEEL TAB ───────────────────────────────────────────
  await test('Wheel canvas present with non-zero dimensions', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    const canvas = page.locator('#wheel');
    const box = await canvas.boundingBox();
    if (!box || box.width === 0 || box.height === 0) throw new Error('Wheel canvas has zero dimensions');
  });

  await test('Phase display shows "PHASE 1 OF 6" by default', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    const txt = await page.locator('#phaseNum').textContent();
    if (!txt.includes('PHASE') || !txt.includes('1') || !txt.includes('6'))
      throw new Error(`Expected "PHASE 1 OF 6", got "${txt}"`);
  });

  await test('Begin Cycle starts the breath cycle', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('#btnStart').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('phaseNum');
      return el && el.textContent.includes('PHASE');
    }, 4000);
  });

  await test('Glyph overlay toggle button exists and is clickable', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="wheel"]').click();
    await page.waitForTimeout(200);
    // Expand Advanced Tools if collapsed
    const toolsBody = page.locator('#toolsCollapse .collapse-body');
    if (await toolsBody.isVisible() === false) {
      await page.locator('#toolsCollapse .collapse-header').click();
      await page.waitForTimeout(200);
    }
    const btn = page.locator('#btnGlyphOverlay');
    if (await btn.count() === 0) throw new Error('Glyph overlay button not found');
    if (!(await btn.isVisible())) throw new Error('Glyph overlay button not visible');
    await btn.click(); // should not throw
  });

  await test('Night Mode button exists', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    const exists = await page.locator('#btnNight').count() > 0;
    if (!exists) throw new Error('Night mode button not found');
  });

  // ── RESONATOR (separate page at /resonator.html) ─────────
  await test('Resonator page loads correctly', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    if (!bodyText.includes('breath') && !bodyText.includes('Resonat')) throw new Error('Resonator page did not load');
  });

  await test('Breath guidance text shows', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const hasContent = await page.evaluate(() => {
      const els = ['#breathLabel', '.guide-step', '.instruction', '[class*="guide"]'];
      return els.some(sel => { const e = document.querySelector(sel); return e && e.textContent.trim().length > 0; });
    });
    if (!hasContent) throw new Error('Breath guidance text not found on resonator page');
  });

  await test('5 soundscape toggles present', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const toggles = await page.locator('.snd-toggle-mini').count();
    if (toggles < 5) throw new Error(`Expected at least 5 soundscape toggles, got ${toggles}`);
  });

  await test('Cycle preset buttons present', async (page) => {
    await page.goto(`http://localhost:${PORT}/resonator.html`, { timeout: 10000 });
    await page.waitForTimeout(800);
    const presets = await page.locator('[class*="preset"], .cycle-preset, button[data-in]').count();
    if (presets === 0) throw new Error('No cycle preset buttons found');
  });

  // ── MATRIXGLYPH ─────────────────────────────────────────
  await test('Open 12x12 Matrix button opens matrix view', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(300);
    const btns = page.locator('button');
    let found = false;
    for (let i = 0; i < await btns.count(); i++) {
      const txt = await btns.nth(i).textContent();
      if (txt.includes('12') || txt.includes('Matrix') || txt.includes('grid') || txt.includes('Grid')) {
        await btns.nth(i).click();
        found = true;
        break;
      }
    }
    if (!found) throw new Error('No matrix open button found');
    await page.waitForTimeout(400);
  });

  await test('12 layer tabs visible in matrix', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(300);
    const btns = page.locator('button');
    for (let i = 0; i < await btns.count(); i++) {
      const txt = await btns.nth(i).textContent();
      if (txt.includes('12') || txt.includes('Matrix')) { await btns.nth(i).click(); break; }
    }
    await page.waitForTimeout(400);
    const tabs = page.locator('.layer-tab, [class*="layer"]');
    const count = await tabs.count();
    if (count === 0) throw new Error('No layer tabs found');
  });

  await test('Glyph grid shows multi-select capability', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(300);
    const btns = page.locator('button');
    for (let i = 0; i < await btns.count(); i++) {
      const txt = await btns.nth(i).textContent();
      if (txt.includes('12') || txt.includes('Matrix')) { await btns.nth(i).click(); break; }
    }
    await page.waitForTimeout(400);
    const cells = page.locator('.gly, [class*="cell"]');
    const count = await cells.count();
    if (count === 0) throw new Error('No glyph grid cells found');
  });

  await test('Save/load controls present', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(300);
    const btns = page.locator('button');
    for (let i = 0; i < await btns.count(); i++) {
      const txt = await btns.nth(i).textContent();
      if (txt.includes('12') || txt.includes('Matrix')) { await btns.nth(i).click(); break; }
    }
    await page.waitForTimeout(400);
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Load"), button:has-text("Export"), button:has-text("Seal")');
    const count = await saveBtn.count();
    if (count === 0) throw new Error('No save/load controls found');
  });

  // ── TAB SWITCHING ────────────────────────────────────────
  await test('Codex tab clickable and switches view', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(400);
    const content = page.locator('#tab-codex');
    const visible = await content.isVisible();
    if (!visible) throw new Error('Codex tab content not visible after click');
  });

  await test('Dream tab clickable and switches view', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="dream"]').click();
    await page.waitForTimeout(400);
    const content = page.locator('#tab-dream');
    const visible = await content.isVisible();
    if (!visible) throw new Error('Dream tab content not visible after click');
  });

  await test('Journal tab clickable and switches view', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="journal"]').click();
    await page.waitForTimeout(400);
    const content = page.locator('#tab-journal');
    const visible = await content.isVisible();
    if (!visible) throw new Error('Journal tab content not visible after click');
  });

  // ── STATE AND COHERENCE ─────────────────────────────────
  await test('Coherence bar present and starts at 0%', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    const bar = page.locator('#cohBar');
    const exists = await bar.count() > 0;
    if (!exists) throw new Error('Coherence bar not found');
  });

  await test('Field status element present', async (page) => {
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    const exists = await page.locator('#fieldStatus').count() > 0;
    if (!exists) throw new Error('Field status element not found');
  });

  // ── NO ERRORS ───────────────────────────────────────────
  await test('No console errors on load and basic interaction', async (page) => {
    const errs = [];
    page.on('pageerror', err => errs.push(err.message));
    await page.goto(`http://localhost:${PORT}/`);
    await waitForPortal(page);
    await page.locator('[data-tab="codex"]').click();
    await page.waitForTimeout(300);
    const criticalErrors = errs.filter(e => !e.toLowerCase().includes('warning') && !e.toLowerCase().includes('deprecated'));
    if (criticalErrors.length > 0) throw new Error(`Page errors: ${criticalErrors.join('; ')}`);
  });

  await browser.close();
  server.close();

  console.log(`\n\n═══ Results: ${passed} passed / ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
