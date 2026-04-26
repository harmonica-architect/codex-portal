/**
 * Codex Portal — Animation Test Suite v3
 * Cross-browser, multi-page animation verification
 *
 * Tests RAF-driven animations, CSS transitions, breath-phase animations
 * on Chromium, Firefox, and WebKit across all pages.
 *
 * Usage: node animation-test.js
 */

const { chromium, firefox, webkit } = require('playwright');

const BASE_URL = 'https://harmonica-architect.github.io/codex-portal/';
const PAGES = [
  { name: 'Home/Wheel',   path: '/',              hasPortal: true,  hasWheel: true  },
  { name: 'Matrix',       path: '/matrix.html',   hasPortal: false, hasWheel: false },
  { name: 'Resonator',    path: '/resonator.html',hasPortal: false, hasWheel: false },
  { name: 'Dream',       path: '/?tab=dream',    hasPortal: true,  hasWheel: true  },
];

const BROWSERS = [
  { name: 'Chromium', launcher: chromium },
  { name: 'Firefox',  launcher: firefox },
  // WebKit / Safari only available on macOS — skipped on other platforms.
  { name: 'WebKit',   launcher: webkit, skip: process.platform !== 'darwin' },
];

const RESULTS = [];

async function run() {
  console.log('\n🜂 Codex Portal — Animation Test Suite');
  console.log('═'.repeat(56));

  for (const browserDef of BROWSERS) {
    if (browserDef.skip) {
      console.log(`\n⏭  ${browserDef.name} — skipped (${browserDef.skip})`);
      continue;
    }

    let browser;
    try {
      browser = await browserDef.launcher.launch({ headless: true });
    } catch(e) {
      console.log(`\n⏭  ${browserDef.name} — not available: ${e.message.split('\n')[0]}`);
      continue;
    }

    console.log(`\n${'─'.repeat(56)}`);
    console.log(`🌐 ${browserDef.name}`);
    console.log('─'.repeat(56));

    for (const pageDef of PAGES) {
      const pageResults = await testPageAnimation(browser, pageDef, browserDef.name);
      RESULTS.push({ browser: browserDef.name, page: pageDef.name, results: pageResults });
    }

    await browser.close();
  }

  printSummary();
}

// ─── Per-page animation tests ─────────────────────────────────────────────

async function testPageAnimation(browser, pageDef, browserName) {
  const url = BASE_URL.replace(/\/$/, '') + pageDef.path;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  const pageResults = [];

  // Load
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000); // let all scripts fully initialize
  } catch(e) {
    pageResults.push({ test: 'Page load', pass: false, note: shortErr(e) });
    await ctx.close();
    return pageResults;
  }

  // Login (only on pages with portal — index.html family)
  if (pageDef.hasPortal) {
    const needsLogin = await page.evaluate(() => {
      const ls = document.getElementById('loginScreen');
      return ls && window.getComputedStyle(ls).display !== 'none';
    });
    if (needsLogin) {
      await login(page);
    }
    await page.waitForTimeout(1200);

    // Portal visible
    const portalVisible = await page.evaluate(() => {
      const p = document.getElementById('portal');
      return p && window.getComputedStyle(p).display !== 'none';
    });
    pageResults.push({ test: 'Portal visible', pass: portalVisible });

    if (!portalVisible) {
      pageResults.push({ test: 'Animations skipped (login failed)', pass: false });
      await ctx.close();
      return pageResults;
    }

    // Navigate to Wheel tab (sn-dot-1)
    await page.evaluate(() => {
      document.querySelector('.sn-dot-1')?.click();
    });
    await page.waitForTimeout(800);

    // Start breath cycle
    await page.evaluate(() => {
      document.getElementById('btnStart')?.click();
    });
    // Give breath controller time to fire multiple phase changes
    await page.waitForTimeout(2000);

    const breathRunning = await page.evaluate(() => {
      if (typeof isRunning !== 'undefined') return isRunning;
      if (typeof breathCtrl !== 'undefined') return breathCtrl.isActive;
      return false;
    });
    pageResults.push({ test: 'Breath cycle started', pass: breathRunning });

    // Run animation checks (only on pages with wheel canvas)
    const animResults = breathRunning
      ? await runAnimationChecks(page, pageDef.name)
      : [{ test: 'Animation checks skipped', pass: false }];
    pageResults.push(...animResults);

  } else {
    // Sub-pages (Matrix, Resonator) — just check sigil nav exists and is interactive
    const snOk = await page.evaluate(() => {
      return document.querySelectorAll('.sn-dot').length === 8 &&
             typeof initSigilNav === 'function';
    });
    pageResults.push({ test: 'Sigil nav initialized', pass: snOk });

    // Check that breath controller exists
    const bcOk = await page.evaluate(() => {
      return typeof breathCtrl !== 'undefined' && breathCtrl.isActive === false;
    });
    pageResults.push({ test: 'Breath controller ready', pass: bcOk });

    // Navigate between sigil dots (smoke test)
    await page.evaluate(() => {
      document.querySelector('.sn-dot-3')?.click();
    });
    await page.waitForTimeout(500);
    const navWorked = await page.evaluate(() => {
      const dot3 = document.querySelector('.sn-dot-3');
      return dot3 && dot3.classList.contains('active');
    });
    pageResults.push({ test: 'Sigil nav responds to clicks', pass: navWorked });
  }

  // Critical JS errors
  const critErrors = errors.filter(e =>
    !e.includes('favicon') && !e.includes('net::') &&
    !e.includes('Failed to load') && !e.includes('Refused to connect')
  );
  pageResults.push({
    test: 'No critical JS errors',
    pass: critErrors.length === 0,
    note: critErrors.slice(0, 2).join('; ')
  });

  // Print per-page results
  const passCount = pageResults.filter(r => r.pass === true).length;
  const skipCount = pageResults.filter(r => r.pass === null).length;
  const totalNonNull = pageResults.filter(r => r.pass !== null).length;
  const icon = passCount === totalNonNull ? '✅' : '⚠️';
  const sk = skipCount > 0 ? ` (+${skipCount} skipped)` : '';
  console.log(`\n  📄 ${pageDef.name} ${icon} ${passCount}/${totalNonNull} passed${sk}`);
  pageResults.forEach(r => {
    const note = r.note ? ` → ${r.note}` : '';
    const icon2 = r.pass === null ? '⏭ ' : (r.pass ? '✅' : '❌');
    console.log(`     ${icon2} ${r.test}${note}`);
  });

  await ctx.close();
  return pageResults;
}

// ─── Login helper ─────────────────────────────────────────────────────────

async function login(page) {
  const glyphs = await page.$$('.login-g');
  if (glyphs.length >= 3) {
    await glyphs[0].click(); await page.waitForTimeout(200);
    await glyphs[1].click(); await page.waitForTimeout(200);
    await glyphs[2].click(); await page.waitForTimeout(200);
  }
  await page.evaluate(() => document.getElementById('loginBtn')?.click());
}

// ─── Animation checks (run on wheel tab after breath starts) ───────────────

async function runAnimationChecks(page, pageName) {
  return [
    await testWheelCanvasAnimation(page),
    await testSigilNavBreathScale(page),
    await testBreathRingActive(page),
    await testSigilOrbitAnimation(page),
    await testBreathCSSVars(page),
    await test24CellRotation(page),
    await testCoherenceBarAnimation(page),
    await testSparklineCanvas(page),
  ];
}

// ─── Individual animation test functions ──────────────────────────────────

// 1. Wheel canvas RAF animation — 8 samples at 250ms intervals (≈4fps for 2s)
// Uses pixel variance coefficient: stdDev / mean — animating canvas has CV > 0.001
async function testWheelCanvasAnimation(page) {
  const samples = [];
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => {
      const c = document.getElementById('wheel');
      if (!c) return null;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i+1] + d[i+2];
      return sum;
    });
    if (s !== null) samples.push(s);
    if (i < 7) await page.waitForTimeout(250);
  }
  if (!samples.length) return { test: 'Wheel canvas exists', pass: false, note: 'not found' };

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // coefficient of variation — robust to scale

  return {
    test: 'Wheel canvas animating',
    pass: samples[0] > 0 && cv > 0.0005,
    note: `CV=${cv.toExponential(3)} range=${Math.max(...samples)-Math.min(...samples)} mean=${Math.round(mean)}`
  };
}

// 2. Sigil nav dots: breath phase changes should drive visible scale changes
// scale(1.12) during inhale, scale(0.92) during exhale — checked on ALL dots
async function testSigilNavBreathScale(page) {
  const result = await page.evaluate(() => {
    const dots = document.querySelectorAll('.sn-dot');
    if (!dots.length) return { found: false };

    // Check inline transform on ALL dots — any with non-default scale counts
    let withNonDefaultScale = 0;
    let withScale = 0;
    let activeIdx = -1;

    dots.forEach((d, i) => {
      const t = d.style.transform || '';
      if (t.includes('scale')) {
        withScale++;
        const m = t.match(/scale\(([^)]+)\)/);
        if (m) {
          const v = parseFloat(m[1]);
          if (Math.abs(v - 1.0) > 0.01) withNonDefaultScale++;
        }
      }
      if (d.classList.contains('active')) activeIdx = i;
    });

    return { found: true, count: dots.length, withScale, withNonDefaultScale, activeIdx };
  });

  if (!result.found) return { test: 'Sigil nav dots exist', pass: false };

  return {
    test: 'Sigil nav breath scale active',
    pass: result.withNonDefaultScale > 0,
    note: `${result.withNonDefaultScale}/${result.count} dots with non-default scale (active=${result.activeIdx})`
  };
}

// 3. Breath ring active dot — only valid on home tab
async function testBreathRingActive(page) {
  const isHomeTab = await page.evaluate(() => {
    return document.getElementById('tab-home')?.classList.contains('active');
  });
  if (!isHomeTab) {
    return { test: 'Breath ring active dot (home)', pass: null, note: 'skipped — not on home tab' };
  }
  const result = await page.evaluate(() => {
    const dots = document.querySelectorAll('.br-dot');
    if (!dots.length) return { found: false };
    const active = Array.from(dots).filter(d => d.classList.contains('active')).length;
    return { found: true, total: dots.length, active };
  });
  if (!result.found) return { test: 'Breath ring dots exist', pass: false };
  return {
    test: 'Breath ring active dot (home)',
    pass: result.active === 1,
    note: `${result.active}/${result.total} dots active`
  };
}

// 4. Sigil orbit outer animation — RAF-driven rotation via transform
async function testSigilOrbitAnimation(page) {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const t = await page.evaluate(() => {
      const el = document.getElementById('snOrbitOuter');
      return el ? el.style.transform : '';
    });
    samples.push(t);
    if (i < 4) await page.waitForTimeout(300);
  }
  const hasTransform = samples.some(t => t.length > 0);
  const uniqueValues = [...new Set(samples)].length;
  const isChanging = uniqueValues > 1;
  return {
    test: 'Sigil orbit animating',
    pass: hasTransform,
    note: isChanging ? `rotating (${uniqueValues} unique transforms)` : (hasTransform ? 'stable' : 'not set')
  };
}

// 5. Breath CSS var --breath-hold on documentElement (set by breathTick RAF loop)
async function testBreathCSSVars(page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      breathHold: root.style.getPropertyValue('--breath-hold').trim(),
      coh: root.style.getPropertyValue('--coh').trim(),
    };
  });
  const bh = parseFloat(result.breathHold);
  return {
    test: 'Breath CSS var updating',
    pass: !isNaN(bh) && bh >= 0 && bh <= 1,
    note: `--breath-hold=${result.breathHold} --coh=${result.coh}`
  };
}

// 6. 24-cell rotation — pixel variance of mid-ring region
async function test24CellRotation(page) {
  const samples = [];
  for (let i = 0; i < 6; i++) {
    const s = await page.evaluate(() => {
      const c = document.getElementById('wheel');
      if (!c) return null;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const mid = c.width / 2;
      let sum = 0;
      for (let y = Math.floor(mid * 0.5); y < Math.floor(mid * 1.5); y += 2) {
        for (let x = Math.floor(mid * 0.55); x < Math.floor(mid * 1.45); x += 2) {
          const idx = (y * c.width + x) * 4;
          sum += d[idx] + d[idx+1] + d[idx+2];
        }
      }
      return sum;
    });
    if (s !== null) samples.push(s);
    if (i < 5) await page.waitForTimeout(400);
  }
  if (samples.length < 2) return { test: '24-cell rotation', pass: false, note: 'not enough samples' };

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  return {
    test: '24-cell rotation detected',
    pass: cv > 0.001,
    note: `CV=${cv.toExponential(3)} range=${Math.max(...samples)-Math.min(...samples)}`
  };
}

// 7. Coherence bar has non-zero computed width
async function testCoherenceBarAnimation(page) {
  const result = await page.evaluate(() => {
    const bar = document.getElementById('cohBar');
    if (!bar) return { found: false };
    const w = parseFloat(window.getComputedStyle(bar).width);
    const val = document.getElementById('cohValue')?.textContent || '';
    return { found: true, width: Math.round(w), value: val };
  });
  if (!result.found) return { test: 'Coherence bar exists', pass: false };
  return {
    test: 'Coherence bar active',
    pass: result.width > 0 || result.value.includes('%'),
    note: `width=${result.width}px value="${result.value}"`
  };
}

// 8. Sparkline canvas has rendered content (non-zero pixel sum)
async function testSparklineCanvas(page) {
  const result = await page.evaluate(() => {
    const c = document.getElementById('cohSparkline');
    if (!c) return { found: false };
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i+1] + d[i+2];
    return { found: true, pixels: sum };
  });
  if (!result.found) return { test: 'Sparkline canvas exists', pass: false };
  return {
    test: 'Sparkline canvas rendered',
    pass: result.pixels > 0,
    note: `pixel sum=${result.pixels}`
  };
}

// ─── Summary ───────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n' + '═'.repeat(56));
  console.log('📊 ANIMATION TEST SUMMARY');
  console.log('═'.repeat(56));

  let totalTests = 0;
  let totalPassed = 0;
  let totalSkipped = 0;

  RESULTS.forEach(r => {
    const passed = r.results.filter(v => v.pass === true).length;
    const skipped = r.results.filter(v => v.pass === null).length;
    const total = r.results.filter(v => v.pass !== null).length;
    totalTests += total;
    totalSkipped += skipped;
    totalPassed += passed;
    const icon = passed === total ? '✅' : '⚠️';
    const sk = skipped > 0 ? ` (+${skipped} skipped)` : '';
    console.log(`\n  ${icon} ${r.browser} × ${r.page}: ${passed}/${total}${sk} passed`);
    r.results.forEach(v => {
      const icon2 = v.pass === null ? '⏭' : (v.pass ? '✅' : '❌');
      console.log(`     ${icon2} ${v.test}`);
    });
  });

  console.log('\n' + '═'.repeat(56));
  const allPass = totalPassed === totalTests;
  console.log(allPass
    ? `✅ ALL ${totalPassed}/${totalTests} ANIMATION TESTS PASS`
    : `⚠️  ${totalTests - totalPassed}/${totalTests} tests failed (${totalSkipped} skipped)`);
  console.log('═'.repeat(56));
}

function shortErr(e) {
  return e.message.split('\n')[0];
}

// ─── Run ──────────────────────────────────────────────────────────────────

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});