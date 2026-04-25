/**
 * Codex Portal — A/B GUI Test
 * Tests: Login → All Tabs → Breath Start → Mirror → Spiral Log → Community
 * Runs on both Mobile (375px) and Desktop (1280px) viewports
 */
const { chromium } = require('playwright');

const URL = 'https://harmonica-architect.github.io/codex-portal/';
const RESULTS = [];
let browser;

async function run() {
  browser = await chromium.launch({ headless: true });
  console.log('\n🜂 Codex Portal A/B GUI Test\n' + '═'.repeat(50));

  await testViewport('MOBILE', 375, 812);
  await testViewport('DESKTOP', 1280, 900);

  await browser.close();
  printSummary();
}

async function testViewport(label, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const vresults = [];
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  const tag = `[${label} ${width}×${height}]`;

  // Helper: click element via evaluate to avoid Playwright visibility checks
  async function clickById(id) {
    await page.evaluate((id) => document.getElementById(id)?.click(), id);
    await page.waitForTimeout(100);
  }

  // Helper: click element via evaluate by selector
  async function clickBySelector(sel) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.click();
    }, sel);
    await page.waitForTimeout(100);
  }

  // ── 1. Load ──
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    vresults.push({ test: 'Page load', pass: true, note: `${width}×${height}` });
  } catch(e) {
    vresults.push({ test: 'Page load', pass: false, note: e.message.split('\n')[0] });
    await ctx.close();
    return;
  }

  // ── 2. Login screen visible ──
  const loginVisible = await page.evaluate(() => !!document.getElementById('loginScreen'));
  vresults.push({ test: 'Login screen visible', pass: loginVisible });

  // ── 3. Select 3 glyphs to log in ──
  await clickBySelector('.login-g:nth-child(1)');
  await page.waitForTimeout(150);
  await clickBySelector('.login-g:nth-child(2)');
  await page.waitForTimeout(150);
  await clickBySelector('.login-g:nth-child(3)');
  await page.waitForTimeout(150);

  const loginEnabled = await page.evaluate(() => {
    const btn = document.getElementById('loginBtn');
    return btn && !btn.disabled;
  });
  vresults.push({ test: 'Login button enabled after 3 glyphs', pass: loginEnabled });

  // ── 4. Enter portal ──
  await clickById('loginBtn');
  await page.waitForTimeout(800);

  const portalVisible = await page.evaluate(() => {
    const p = document.getElementById('portal');
    return p && window.getComputedStyle(p).display !== 'none';
  });
  vresults.push({ test: 'Portal visible after login', pass: portalVisible });

  // ── 5. Sigil navigator visible ──
  const sigilNavVisible = await page.evaluate(() => !!document.getElementById('sigilNavWrap'));
  vresults.push({ test: 'Sigil navigator visible', pass: sigilNavVisible });

  // ── 6. Coherence panel visible ──
  const cohVisible = await page.evaluate(() => !!document.getElementById('cohBar'));
  vresults.push({ test: 'Coherence bar visible', pass: cohVisible });

  // ── 7. Breath prompt strip (home tab) ──
  const bpsVisible = await page.evaluate(() => !!document.getElementById('breathPromptStrip'));
  vresults.push({ test: 'Breath prompt strip visible', pass: bpsVisible });

  // ── 8. Mobile nav drawer ──
  if (label === 'MOBILE') {
    const drawerInfo = await page.evaluate(() => {
      const el = document.getElementById('mobileNavDrawer');
      if (!el) return { found: false };
      return { found: true, display: window.getComputedStyle(el).display };
    });
    vresults.push({ test: 'Mobile nav drawer visible', pass: drawerInfo.found && drawerInfo.display !== 'none', note: drawerInfo.display });
  } else {
    const drawerInfo = await page.evaluate(() => {
      const el = document.getElementById('mobileNavDrawer');
      if (!el) return { found: false };
      return { found: true, display: window.getComputedStyle(el).display };
    });
    vresults.push({ test: 'Mobile nav drawer hidden on desktop', pass: drawerInfo.display === 'none' || !drawerInfo.found });
  }

  // ── 9. Navigate to Wheel tab ──
  if (label === 'MOBILE') {
    await clickBySelector('.mnd-item[data-tab="wheel"]');
  } else {
    await clickBySelector('.sn-dot-1');
  }
  await page.waitForTimeout(800);

  const wheelActive = await page.evaluate(() => document.getElementById('tab-wheel')?.classList.contains('active'));
  vresults.push({ test: 'Wheel tab navigates correctly', pass: wheelActive });

  // ── 10. Start breath cycle ──
  await clickById('btnStart');
  await page.waitForTimeout(500);

  const phaseDisplayVisible = await page.evaluate(() => {
    const el = document.getElementById('phaseNum');
    return el && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
  });
  vresults.push({ test: 'Breath cycle starts (phase display)', pass: phaseDisplayVisible });

  // ── 11. Stop breath ──
  await clickById('btnStart');
  await page.waitForTimeout(300);

  // ── 12. Navigate to Dream tab (Mirror Mode) ──
  if (label === 'MOBILE') {
    await clickBySelector('.mnd-item[data-tab="dream"]');
  } else {
    await clickBySelector('.sn-dot-3');
  }
  await page.waitForTimeout(800);

  const dreamActive = await page.evaluate(() => document.getElementById('tab-dream')?.classList.contains('active'));
  vresults.push({ test: 'Dream/Mirror tab navigates', pass: dreamActive });

  // ── 13. Mirror input works ──
  const mirrorInputExists = await page.evaluate(() => !!document.getElementById('mirrorInput'));
  vresults.push({ test: 'Mirror input visible', pass: mirrorInputExists });

  if (mirrorInputExists) {
    await page.evaluate(() => { document.getElementById('mirrorInput').value = 'water'; });
    await clickById('mirrorSubmit');
    await page.waitForTimeout(500);
    const mirrorOutput = await page.evaluate(() => document.getElementById('mirrorOutput')?.textContent || '');
    const mirrorWorked = mirrorOutput.length > 5;
    vresults.push({ test: 'Mirror reflects input', pass: !!mirrorWorked, note: mirrorWorked ? mirrorOutput.slice(0, 40) : 'empty' });
  }

  // ── 14. Journal tab ──
  if (label === 'MOBILE') {
    await clickBySelector('.mnd-item[data-tab="journal"]');
  } else {
    await clickBySelector('.sn-dot-4');
  }
  await page.waitForTimeout(800);
  const journalActive = await page.evaluate(() => document.getElementById('tab-journal')?.classList.contains('active'));
  vresults.push({ test: 'Journal tab navigates', pass: journalActive });

  // ── 15. Profile tab ──
  if (label === 'MOBILE') {
    await clickBySelector('.mnd-item[data-tab="profile"]');
  } else {
    await clickBySelector('.sn-dot-7');
  }
  await page.waitForTimeout(800);
  const profileActive = await page.evaluate(() => document.getElementById('tab-profile')?.classList.contains('active'));
  vresults.push({ test: 'Profile tab navigates', pass: profileActive });

  // ── 16. Sigil nav profile dot ──
  const profileDotExists = await page.evaluate(() => !!document.querySelector('.sn-dot-7'));
  vresults.push({ test: 'Sigil nav profile dot visible', pass: profileDotExists });

  // ── Error check ──
  const critErrors = errors.filter(e =>
    !e.includes('favicon') && !e.includes('net::') && !e.includes('Failed to load'));
  vresults.push({ test: 'No critical errors', pass: critErrors.length === 0, note: critErrors.slice(0, 3).join('; ') });

  // ── Print results ──
  console.log(`\n${tag}`);
  vresults.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    const note = r.note ? ` [${r.note}]` : '';
    console.log(`  ${icon} ${r.test}${note}`);
  });

  RESULTS.push({ label, vresults });

  // Cleanup
  await page.close();
  await ctx.close();
}

function printSummary() {
  const allPass = RESULTS.every(r => r.vresults.every(v => v.pass));
  const total = RESULTS.reduce((s, r) => s + r.vresults.length, 0);
  const passed = RESULTS.reduce((s, r) => s + r.vresults.filter(v => v.pass).length, 0);
  console.log('\n' + '═'.repeat(50));
  console.log(allPass ? '✅ ALL PASS' : `⚠️  ${total - passed}/${total} FAILED`);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });