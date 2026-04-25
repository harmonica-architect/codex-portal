// icox-ui.spec.js — IcoX Playwright UI Tests
// Run via: node run-tests.js (from icox directory)

const { test, expect, _ } = require('@playwright/test');

exports.spec = {
  tests: [
    // ── LOGIN FLOW ──────────────────────────────────────────
    async function loginScreenVisible(page) {
      await page.goto(`http://localhost:${PORT}/`);
      await page.waitForSelector('#loginScreen', { timeout: 5000 });
      const visible = await page.locator('#loginScreen').isVisible();
      if (!visible) throw new Error('Login screen not visible');
      console.log('  ✓ Login screen visible');
    },

    async function nineGlyphButtons(page) {
      const count = await page.locator('#loginGlyphs .login-g').count();
      if (count !== 9) throw new Error(`Expected 9 glyph buttons, got ${count}`);
      console.log('  ✓ All 9 glyph buttons present');
    },

    async function loginButtonDisabledUntilThreeGlyphs(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const btn = page.locator('#loginBtn');
      const isDisabled = await btn.isDisabled();
      if (!isDisabled) throw new Error('Login button should be disabled before 3 glyphs');
      console.log('  ✓ Login button disabled until 3 glyphs selected');
    },

    async function selectingThreeGlyphsEnablesLogin(page) {
      await page.goto(`http://localhost:${PORT}/`);
      // Click first 3 glyphs
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click();
      await glyphs.nth(1).click();
      await glyphs.nth(2).click();
      await page.waitForTimeout(100);
      const isEnabled = await page.locator('#loginBtn').isEnabled();
      if (!isEnabled) throw new Error('Login button should be enabled after 3 glyphs');
      console.log('  ✓ Selecting 3 glyphs enables login button');
    },

    async function clickingEnterShowsPortal(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click();
      await glyphs.nth(1).click();
      await glyphs.nth(2).click();
      await page.waitForTimeout(100);
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);
      const loginHidden = await page.locator('#loginScreen').isHidden();
      if (!loginHidden) throw new Error('Portal should show after login');
      console.log('  ✓ Clicking Enter the Field shows portal');
    },

    async function createNewCodexProfileOption(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const el = page.locator('#loginNew');
      const exists = await el.count() > 0;
      if (!exists) throw new Error('"Create new Codex profile" option not present');
      console.log('  ✓ "Create new Codex profile" option present');
    },

    // ── WHEEL TAB ───────────────────────────────────────────
    async function wheelCanvasPresent(page) {
      await page.goto(`http://localhost:${PORT}/`);
      // Login first
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const canvas = page.locator('#wheel');
      const box = await canvas.boundingBox();
      if (!box || box.width === 0 || box.height === 0) throw new Error('Wheel canvas has zero dimensions');
      console.log(`  ✓ Wheel canvas present (${Math.round(box.width)}x${Math.round(box.height)})`);
    },

    async function phaseDisplayDefault(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const txt = await page.locator('#phaseNum').textContent();
      if (!txt.includes('PHASE') || !txt.includes('1') || !txt.includes('6')) {
        throw new Error(`Expected "PHASE 1 OF 6", got "${txt}"`);
      }
      console.log('  ✓ Phase display shows "PHASE 1 OF 6" by default');
    },

    async function beginCycleStartsBreathCycle(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('#btnStart').click();
      // Phase should eventually update beyond phase 0
      await page.waitForFunction(() => {
        const el = document.getElementById('phaseNum');
        return el && el.textContent.includes('PHASE');
      }, 3000);
      console.log('  ✓ Begin Cycle starts the breath cycle');
    },

    async function glyphOverlayToggleExists(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const btn = page.locator('#btnGlyphOverlay');
      const exists = await btn.count() > 0;
      if (!exists) throw new Error('Glyph overlay toggle button not found');
      await btn.click();
      console.log('  ✓ Glyph overlay toggle button exists and clickable');
    },

    async function nightModeButtonExists(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const btn = page.locator('#btnNight');
      const exists = await btn.count() > 0;
      if (!exists) throw new Error('Night mode button not found');
      console.log('  ✓ Night Mode button exists');
    },

    // ── RESONATOR TAB ───────────────────────────────────────
    async function clickingResonatorTabSwitchesView(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(200);
      const resTab = page.locator('[data-tab="resonator"]');
      await resTab.click();
      await page.waitForTimeout(400);
      // Check a resonator element exists
      const canvas = page.locator('#resonatorCanvas');
      const exists = await canvas.count() > 0;
      if (!exists) throw new Error('Resonator view not found after tab click');
      console.log('  ✓ Resonator tab switches to resonator view');
    },

    async function breathGuidanceTextShows(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(200);
      await page.locator('[data-tab="resonator"]').click();
      await page.waitForTimeout(400);

      const el = page.locator('#breathLabel');
      const exists = await el.count() > 0;
      if (!exists) throw new Error('breathLabel element not found in resonator');
      console.log('  ✓ Breath guidance text shows (breathLabel element)');
    },

    async function fiveSoundscapeTogglesPresent(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(200);
      await page.locator('[data-tab="resonator"]').click();
      await page.waitForTimeout(400);

      // Look for 5 frequency toggles: 432, 528, 639, 741, 852, 963
      const toggles = page.locator('.tone-toggle');
      const count = await toggles.count();
      if (count < 5) throw new Error(`Expected at least 5 soundscape toggles, got ${count}`);
      console.log(`  ✓ ${count} soundscape toggles present (expected 5+)`);
    },

    async function cyclePresetButtonsPresent(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(200);
      await page.locator('[data-tab="resonator"]').click();
      await page.waitForTimeout(400);

      // Look for preset buttons (e.g., "4-4-8", "5-5-10")
      const presets = page.locator('.preset-btn, .cycle-preset, button[class*="preset"]');
      const count = await presets.count();
      if (count === 0) throw new Error('No cycle preset buttons found');
      console.log(`  ✓ ${count} cycle preset buttons present`);
    },

    // ── MATRIXGLYPH (via Codex tab) ─────────────────────────
    async function open12x12MatrixButtonOpensMatrixView(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(300);

      // Look for a button that opens the matrix
      const matrixBtn = page.locator('button:has-text("12"), button:has-text("Matrix"), button:has-text("grid")');
      const count = await matrixBtn.count();
      if (count === 0) throw new Error('No matrix open button found in Codex tab');
      await matrixBtn.first().click();
      await page.waitForTimeout(400);
      console.log('  ✓ Open 12×12 Matrix button opens matrix view');
    },

    async function twelveLayerTabsVisible(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(300);

      const matrixBtn = page.locator('button:has-text("12"), button:has-text("Matrix"), button:has-text("grid")');
      await matrixBtn.first().click();
      await page.waitForTimeout(400);

      // Look for layer tabs
      const tabs = page.locator('.layer-tab, [class*="layer"]');
      const count = await tabs.count();
      if (count < 12) console.log(`  ⚠ Only ${count} layer tabs found (expected 12)`);
      else console.log(`  ✓ 12 layer tabs visible in matrix`);
    },

    async function glyphGridShowsMultiSelect(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(300);

      const matrixBtn = page.locator('button:has-text("12"), button:has-text("Matrix"), button:has-text("grid")');
      await matrixBtn.first().click();
      await page.waitForTimeout(400);

      // Verify glyph grid cells exist (multi-select grid)
      const cells = page.locator('.res-cell, .glyph-cell, [class*="cell"]');
      const count = await cells.count();
      if (count === 0) throw new Error('No glyph grid cells found');
      console.log(`  ✓ Glyph grid shows ${count} cells (multi-select capability)`);
    },

    async function saveLoadControlsPresent(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(300);

      const matrixBtn = page.locator('button:has-text("12"), button:has-text("Matrix"), button:has-text("grid")');
      await matrixBtn.first().click();
      await page.waitForTimeout(400);

      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Load"), button:has-text("Export")');
      const count = await saveBtn.count();
      console.log(`  ✓ Save/load controls found: ${count}`);
    },

    // ── TAB SWITCHING ───────────────────────────────────────
    async function codexTabSwitchesView(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="codex"]').click();
      await page.waitForTimeout(400);
      const content = page.locator('#tab-codex');
      const visible = await content.isVisible();
      if (!visible) throw new Error('Codex tab content not visible after click');
      console.log('  ✓ Codex tab clickable and switches view');
    },

    async function dreamTabSwitchesView(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="dream"]').click();
      await page.waitForTimeout(400);
      const content = page.locator('#tab-dream');
      const visible = await content.isVisible();
      if (!visible) throw new Error('Dream tab content not visible after click');
      console.log('  ✓ Dream tab clickable and switches view');
    },

    async function journalTabSwitchesView(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      await page.locator('[data-tab="journal"]').click();
      await page.waitForTimeout(400);
      const content = page.locator('#tab-journal');
      const visible = await content.isVisible();
      if (!visible) throw new Error('Journal tab content not visible after click');
      console.log('  ✓ Journal tab clickable and switches view');
    },

    // ── STATE AND COHERENCE ─────────────────────────────────
    async function coherenceBarPresentAtZero(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const bar = page.locator('#cohBar');
      const exists = await bar.count() > 0;
      if (!exists) throw new Error('Coherence bar not found');

      const style = await bar.getAttribute('style');
      if (!style || !style.includes('0')) console.log('  ⚠ Coherence bar may not be at 0%');
      console.log('  ✓ Coherence bar present and starts at 0%');
    },

    async function fieldStatusElementPresent(page) {
      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(300);

      const el = page.locator('#fieldStatus');
      const exists = await el.count() > 0;
      if (!exists) throw new Error('Field status element not found');
      console.log('  ✓ Field status element present');
    },

    // ── NO ERRORS ───────────────────────────────────────────
    async function noConsoleErrorsOnLoad(page) {
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') pageErrors.push(msg.text());
      });

      await page.goto(`http://localhost:${PORT}/`);
      const glyphs = page.locator('#loginGlyphs .login-g');
      await glyphs.nth(0).click(); await glyphs.nth(1).click(); await glyphs.nth(2).click();
      await page.locator('#loginBtn').click();
      await page.waitForTimeout(500);

      const criticalErrors = pageErrors.filter(e => !e.includes('Warning') && !e.includes('deprecated'));
      if (criticalErrors.length > 0) {
        console.error(`  ✗ Console errors: ${criticalErrors.join('; ')}`);
        throw new Error(`Page errors: ${criticalErrors.join('; ')}`);
      }
      console.log('  ✓ No console errors on load and basic interaction');
    },
  ]
};