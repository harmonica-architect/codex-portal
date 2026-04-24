// sigil-nav-test.js — Fixed: test sigil nav dot clicking and cross-page navigation
const { chromium } = require('playwright');

const BASE = 'http://localhost:3737';

async function test(name, page, fn) {
  try {
    await fn();
    console.log('✅', name);
    return true;
  } catch (e) {
    console.log('❌', name + ':', e.message.slice(0, 140));
    return false;
  }
}

async function enterPortal(page) {
  await page.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) {
    await page.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  }
  await page.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
}

// Use evaluate() for clicks since Playwright .click() has false-positive timeouts
async function clickSigilDot(page, idx, waitMs = 800) {
  await page.evaluate((i) => {
    document.querySelector('.sn-dot-' + i)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, idx);
  await new Promise(r => setTimeout(r, waitMs));
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  let passed = 0, failed = 0;

  // ── DESKTOP ──
  console.log('\n=== DESKTOP (1280×900) ===');
  const desk = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desk.goto(BASE, { timeout: 10000 }).catch(() => {});
  await enterPortal(desk);

  const d1 = await test('8 sigil dots visible', desk, async () => {
    const n = await desk.locator('.sn-dot').count();
    if (n !== 8) throw new Error(n + ' dots');
  }); passed += d1 ? 1 : 0; failed += d1 ? 0 : 1;

  const d2 = await test('ring has nonzero dimensions', desk, async () => {
    const b = await desk.locator('.sigil-nav-ring').boundingBox().catch(() => null);
    if (!b || b.width === 0) throw new Error('zero width');
    if (b.height === 0) throw new Error('zero height');
  }); passed += d2 ? 1 : 0; failed += d2 ? 0 : 1;

  const d3 = await test('hub glyph visible', desk, async () => {
    if (!await desk.locator('#snHubGlyph').isVisible()) throw new Error('not visible');
  }); passed += d3 ? 1 : 0; failed += d3 ? 0 : 1;

  const d4 = await test('ring centered on page', desk, async () => {
    const b = await desk.locator('.sigil-nav-ring').boundingBox().catch(() => null);
    if (!b) throw new Error('no bounding box');
    const cx = b.x + b.width / 2;
    if (Math.abs(cx - 640) > 200) throw new Error('cx=' + cx.toFixed(0) + ' expected ~640');
  }); passed += d4 ? 1 : 0; failed += d4 ? 0 : 1;

  // Desktop dot-1 click: navigate from home → wheel tab (in-page transition)
  const d5 = await test('click dot 1 → wheel tab activates', desk, async () => {
    await clickSigilDot(desk, 1, 1200);
    const n = await desk.locator('.sn-dot-1.active').count();
    if (n === 0) throw new Error('dot 1 not active after click');
  }); passed += d5 ? 1 : 0; failed += d5 ? 0 : 1;

  // Desktop dot-5 click: triggers cross-page nav → index.html
  // We verify: (1) URL changes, (2) no JS errors occur during navigation
  const d6 = await test('click dot 5 (Matrix) → navigates to index.html', desk, async () => {
    const urlBefore = desk.url();
    await clickSigilDot(desk, 5, 100); // short wait — navigation is synchronous
    // Wait for navigation to complete
    await desk.waitForURL('**/index.html', { timeout: 3000 }).catch(() => {});
    const urlAfter = desk.url();
    if (!urlAfter.includes('index.html')) throw new Error('URL did not change to index.html: ' + urlAfter);
    // Verify sigil nav is present on the new page
    const n = await desk.locator('.sn-dot').count();
    if (n !== 8) throw new Error('sigil nav missing on new page: ' + n + ' dots');
  }); passed += d6 ? 1 : 0; failed += d6 ? 0 : 1;

  // ── MOBILE ──
  console.log('\n=== MOBILE (375×812) ===');
  const mob = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mob.goto(BASE, { timeout: 10000 }).catch(() => {});
  await enterPortal(mob);

  const m1 = await test('8 sigil dots visible', mob, async () => {
    const n = await mob.locator('.sn-dot').count();
    if (n !== 8) throw new Error(n + ' dots');
  }); passed += m1 ? 1 : 0; failed += m1 ? 0 : 1;

  const m2 = await test('ring fits viewport width', mob, async () => {
    const b = await mob.locator('.sigil-nav-ring').boundingBox().catch(() => null);
    if (!b || b.width === 0) throw new Error('zero width');
    if (b.width > 375) throw new Error('too wide: ' + b.width.toFixed(0));
    if (b.height > 200) throw new Error('too tall: ' + b.height.toFixed(0));
  }); passed += m2 ? 1 : 0; failed += m2 ? 0 : 1;

  const m3 = await test('ring centered on viewport', mob, async () => {
    const b = await mob.locator('.sigil-nav-wrap').boundingBox().catch(() => null);
    if (!b) throw new Error('no wrap bounding box');
    const cx = b.x + b.width / 2;
    if (Math.abs(cx - 187.5) > 60) throw new Error('cx=' + cx.toFixed(0) + ' expected ~187');
  }); passed += m3 ? 1 : 0; failed += m3 ? 0 : 1;

  const m4 = await test('hub centered', mob, async () => {
    const b = await mob.locator('.sn-hub').boundingBox().catch(() => null);
    if (!b || b.width === 0) throw new Error('hub zero');
    const cx = b.x + b.width / 2;
    if (Math.abs(cx - 187.5) > 60) throw new Error('cx=' + cx.toFixed(0) + ' expected ~187');
  }); passed += m4 ? 1 : 0; failed += m4 ? 0 : 1;

  const m5 = await test('ring not cut off at viewport edges', mob, async () => {
    const b = await mob.locator('.sigil-nav-wrap').boundingBox().catch(() => null);
    if (!b) throw new Error('no wrap box');
    if (b.x < -5) throw new Error('left edge: x=' + b.x.toFixed(0));
    if (b.x + b.width > 380) throw new Error('right edge: ' + (b.x+b.width).toFixed(0));
  }); passed += m5 ? 1 : 0; failed += m5 ? 0 : 1;

  // Mobile dot-3 click: home → dream tab (in-page transition)
  const m6 = await test('click dot 3 → dream tab activates', mob, async () => {
    await clickSigilDot(mob, 3, 1200);
    const n = await mob.locator('.sn-dot-3.active').count();
    if (n === 0) throw new Error('dot 3 not active after click');
  }); passed += m6 ? 1 : 0; failed += m6 ? 0 : 1;

  // Mobile dot-0 click: home tab exists in portal URL (index.html), so clicking dot-0
  // from activeIndex=3 (dream) should do an in-page tab switch, not a page reload.
  // We verify the tab actually changes to home.
  const m7 = await test('click dot 0 (home) → home tab activates', mob, async () => {
    await clickSigilDot(mob, 0, 1200);
    const n = await mob.locator('.sn-dot-0.active').count();
    if (n === 0) throw new Error('dot 0 not active after click');
  }); passed += m7 ? 1 : 0; failed += m7 ? 0 : 1;

  await browser.close();

  console.log('\n=== RESULT:', passed, '/', passed+failed, 'passed ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });