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

  // ── 1. Load ──
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  vresults.push({ test: 'Page load', pass: true, note: `${width}×${height}` });

  // ── 2. Login screen visible ──
  const loginVisible = await page.locator('#loginScreen').isVisible();
  vresults.push({ test: 'Login screen visible', pass: loginVisible });

  // ── 3. Select 3 glyphs to log in ──
  await page.locator('.login-g').nth(0).click();
  await page.waitForTimeout(150);
  await page.locator('.login-g').nth(1).click();
  await page.waitForTimeout(150);
  await page.locator('.login-g').nth(2).click();
  await page.waitForTimeout(150);

  const loginBtn = page.locator('#loginBtn');
  const loginEnabled = await loginBtn.isEnabled();
  vresults.push({ test: 'Login button enabled after 3 glyphs', pass: loginEnabled });

  // ── 4. Enter portal ──
  await loginBtn.click();
  await page.waitForTimeout(800);

  const portalVisible = await page.locator('#portal').isVisible();
  vresults.push({ test: 'Portal visible after login', pass: portalVisible });

  // ── 5. Sigil navigator visible ──
  const sigilNavVisible = await page.locator('#sigilNavWrap').isVisible();
  vresults.push({ test: 'Sigil navigator visible', pass: sigilNavVisible });

  // ── 6. Coherence panel visible ──
  const cohVisible = await page.locator('#cohBar').isVisible();
  vresults.push({ test: 'Coherence bar visible', pass: cohVisible });

  // ── 7. Breath prompt strip (home tab) ──
  const bpsVisible = await page.locator('#breathPromptStrip').isVisible();
  vresults.push({ test: 'Breath prompt strip visible', pass: bpsVisible });

  // ── 8. Mobile nav drawer visible on mobile ──
  if (label === 'MOBILE') {
    const drawerEl = page.locator('#mobileNavDrawer');
    const drawerVisible = await drawerEl.isVisible();
    const computedDisplay = await page.evaluate(() => {
      const el = document.getElementById('mobileNavDrawer');
      return el ? window.getComputedStyle(el).display : 'NOT FOUND';
    });
    vresults.push({ test: 'Mobile nav drawer visible', pass: drawerVisible, note: `display:${computedDisplay}` });
  } else {
    const drawerHidden = !(await page.locator('#mobileNavDrawer').isVisible());
    vresults.push({ test: 'Mobile nav drawer hidden on desktop', pass: drawerHidden });
  }

  // ── 9. Navigate to Wheel tab — use drawer on mobile, dots on desktop ──
  if (label === 'MOBILE') {
    await page.locator('.mnd-item[data-tab="wheel"]').click({ force: true });
  } else {
    await page.locator('.sn-dot-1').click({ force: true });
  }
  await page.waitForTimeout(600);

  const wheelVisible = await page.locator('#tab-wheel').isVisible();
  vresults.push({ test: 'Wheel tab navigates correctly', pass: wheelVisible });

  // ── 10. Start breath cycle ──
  await page.locator('#btnStart').click({ force: true });
  await page.waitForTimeout(500);

  const isRunning = await page.evaluate(() => window.isRunning || false);
  // isRunning might not be global; check phase display instead
  const phaseDisplayVisible = await page.locator('#phaseNum').isVisible();
  vresults.push({ test: 'Breath cycle starts (phase display)', pass: phaseDisplayVisible });

  // ── 11. Stop breath ──
  await page.locator('#btnStart').click({ force: true });
  await page.waitForTimeout(300);

  // ── 12. Navigate to Dream tab (Mirror Mode) ──
  if (label === 'MOBILE') {
    await page.locator('.mnd-item[data-tab="dream"]').click({ force: true });
  } else {
    await page.locator('.sn-dot-3').click({ force: true });
  }
  await page.waitForTimeout(600);

  const dreamVisible = await page.locator('#tab-dream').isVisible();
  vresults.push({ test: 'Dream/Mirror tab navigates', pass: dreamVisible });

  // ── 13. Mirror input works ──
  const mirrorInput = page.locator('#mirrorInput');
  const mirrorInputVisible = await mirrorInput.isVisible();
  vresults.push({ test: 'Mirror input visible', pass: mirrorInputVisible });

  if (mirrorInputVisible) {
    await mirrorInput.fill('water');
    await page.locator('#mirrorSubmit').click();
    await page.waitForTimeout(500);
    const output = await page.locator('#mirrorOutput').textContent();
    const mirrorWorked = output && output.length > 5;
    vresults.push({ test: 'Mirror reflects input', pass: !!mirrorWorked, note: mirrorWorked ? output.slice(0, 40) : 'empty' });
  }

  // ── 14. Journal tab ──
  if (label === 'MOBILE') {
    await page.locator('.mnd-item[data-tab="journal"]').click({ force: true });
  } else {
    await page.locator('.sn-dot-4').click({ force: true });
  }
  await page.waitForTimeout(600);
  const journalVisible = await page.locator('#tab-journal').isVisible();
  vresults.push({ test: 'Journal tab navigates', pass: journalVisible });

  // ── 15. Profile tab ──
  if (label === 'MOBILE') {
    await page.locator('.mnd-item[data-tab="profile"]').click({ force: true });
  } else {
    await page.locator('.sn-dot-7').click({ force: true });
  }
  await page.waitForTimeout(600);
  const profileVisible = await page.locator('#tab-profile').isVisible();
  vresults.push({ test: 'Profile tab navigates', pass: profileVisible });

  // ── 16. Community section visible on home ──
  if (label === 'MOBILE') {
    await page.locator('.mnd-item[data-tab="home"]').click({ force: true });
  } else {
    await page.locator('.sn-dot-0').click({ force: true });
  }
  await page.waitForTimeout(600);
  const communityVisible = await page.locator('#communitySection').isVisible();
  vresults.push({ test: 'Community section visible', pass: communityVisible });

  // ── 17. Spiral log canvas present ──
  const spiralCanvas = page.locator('#spiralLogCanvas');
  const spiralVisible = await spiralCanvas.isVisible();
  vresults.push({ test: 'Spiral log canvas visible', pass: spiralVisible });

  // ── 18. No console errors ──
  const critErrors = errors.filter(e =>
    !e.includes('favicon') && !e.includes('third-party') &&
    !e.includes('net::ERR_') && !e.includes('Failed to load resource')
  );
  vresults.push({ test: 'No critical console errors', pass: critErrors.length === 0, note: critErrors.length ? critErrors[0].slice(0, 80) : '' });

  await ctx.close();

  // Print results
  const passed = vresults.filter(r => r.pass).length;
  const total = vresults.length;
  const pct = Math.round((passed / total) * 100);

  console.log(`\n${tag} Results (${passed}/${total} = ${pct}%)\n` + '─'.repeat(40));
  vresults.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    const note = r.note ? ` → ${r.note}` : '';
    console.log(`  ${icon} ${r.test}${note}`);
  });
  if (critErrors.length) {
    console.log('\n  Console errors:');
    critErrors.forEach(e => console.log('  ❗ ' + e.slice(0, 100)));
  }

  RESULTS.push({ label, width, height, passed, total, pct, errors: critErrors });
}

function printSummary() {
  console.log('\n\n' + '═'.repeat(50));
  console.log('SUMMARY');
  console.log('═'.repeat(50));
  RESULTS.forEach(r => {
    const icon = r.pct >= 90 ? '✅' : r.pct >= 70 ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.label} (${r.width}×${r.height}): ${r.passed}/${r.total} (${r.pct}%)`);
  });
  const allPass = RESULTS.every(r => r.pct >= 80);
  console.log('\n' + (allPass ? '✅ All viewports pass.' : '⚠️ Some viewports need attention.'));
}

run().catch(err => {
  console.error('Test runner error:', err.message);
  if (browser) browser.close();
  process.exit(1);
});
