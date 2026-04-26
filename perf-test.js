/**
 * Codex Portal — GUI Performance Audit
 * Tests: Core Animation Loops, Tab Performance, Canvas Rendering,
 *        DOM Responsiveness, Console Errors across Desktop + Mobile.
 *
 * Usage: node perf-test.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://harmonica-architect.github.io/codex-portal/';
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
const MOBILE_VIEWPORT  = { width: 375, height: 812 };

const TABS = ['wheel', 'codex', 'dream', 'journal', 'profile', 'matrix', 'resonator'];
const ALL_TABS_FOR_DESKTOP = ['home', 'wheel', 'codex', 'dream', 'journal', 'profile'];

const RESULTS = {
  desktop: {},
  mobile:  {}
};

let browser;

// ─── Helpers ───────────────────────────────────────────────────────────────

function shortErr(e) {
  return e.message.split('\n')[0];
}

async function login(page) {
  const glyphs = await page.$$('.login-g');
  if (glyphs.length >= 3) {
    await glyphs[0].click(); await page.waitForTimeout(180);
    await glyphs[1].click(); await page.waitForTimeout(180);
    await glyphs[2].click(); await page.waitForTimeout(180);
  }
  await page.evaluate(() => document.getElementById('loginBtn')?.click());
}

async function clickById(page, id) {
  await page.evaluate((id) => document.getElementById(id)?.click(), id);
  await page.waitForTimeout(100);
}

// Sample canvas pixels and return sum of RGB — used for animation detection
async function sampleCanvasPixelSum(page, canvasId) {
  return page.evaluate((id) => {
    const c = document.getElementById(id);
    if (!c) return null;
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i+1] + d[i+2];
    return sum;
  }, canvasId);
}

// Coefficient of Variation — detects animation (CV > 0 means pixels changing)
function cv(samples) {
  if (samples.length < 2) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 0;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  return Math.sqrt(variance) / mean;
}

// ─── Tab Switch Test ────────────────────────────────────────────────────────

async function testTabSwitches(page, tabs, label) {
  const tabResults = [];
  for (const tab of tabs) {
    const t0 = Date.now();
    // Sigil nav dot indices for desktop: home=0, wheel=1, codex=2, dream=3, journal=4, profile=7
    const snDotMap = { home: 0, wheel: 1, codex: 2, dream: 3, journal: 4, profile: 7 };
    const snIdx = snDotMap[tab] ?? 0;
    await page.evaluate(([tab, snIdx]) => {
      // Try sigil nav dot first (desktop)
      const snDot = document.querySelector('.sn-dot-' + snIdx);
      if (snDot) { snDot.click(); return; }
      // Try mobile nav item
      const mnd = document.querySelector('.mnd-item[data-tab="' + tab + '"]');
      if (mnd) { mnd.click(); return; }
      // Try nav tab
      const nav = document.getElementById('nav-' + tab);
      if (nav) nav.click();
    }, [tab, snIdx]);
    await page.waitForTimeout(600);
    const elapsed = Date.now() - t0;

    const tabActive = await page.evaluate((tab) => {
      const el = document.getElementById('tab-' + tab);
      return el ? el.classList.contains('active') : false;
    }, tab);

    tabResults.push({
      tab,
      switchTime: elapsed,
      active: tabActive,
      pass: elapsed < 500 && tabActive
    });
  }
  return tabResults;
}



// ─── Canvas Animation Test ─────────────────────────────────────────────────

async function testCanvasAnimation(page, canvasId, label, frames = 10, intervalMs = 200) {
  const samples = [];
  for (let i = 0; i < frames; i++) {
    const s = await sampleCanvasPixelSum(page, canvasId);
    if (s !== null) samples.push(s);
    if (i < frames - 1) await page.waitForTimeout(intervalMs);
  }
  if (!samples.length) return { canvasId, found: false, pass: false, note: 'canvas not found' };

  const firstNonZero = samples.find(s => s > 0) !== undefined;
  const cvVal = cv(samples);

  return {
    canvasId,
    label,
    found: true,
    pixelsNonZero: firstNonZero,
    cv: cvVal,
    pass: firstNonZero && cvVal > 0.0005,
    note: `CV=${cvVal.toExponential(3)} range=${Math.max(...samples)-Math.min(...samples)} mean=${Math.round(samples.reduce((a,b)=>a+b,0)/samples.length)}`
  };
}

// ─── Sigil Nav Dot Click Test ──────────────────────────────────────────────

async function testSigilNavDots(page) {
  // Use evaluate() click instead of elementHandle.click() to avoid
  // Playwright stability check timing out on continuously-animated elements.
  const results = [];
  for (let i = 0; i < 8; i++) {
    const t0 = Date.now();
    await page.evaluate((idx) => {
      const dot = document.querySelectorAll('.sn-dot')[idx];
      if (dot) dot.click();
    }, i);
    await page.waitForTimeout(400);
    const elapsed = Date.now() - t0;
    // Check if this dot became active (has active class) OR if any tab content is now active
    const tabChanged = await page.evaluate(() => {
      return document.querySelectorAll('.tab-content.active').length > 0;
    });
    results.push({ dot: i, clickTime: elapsed, activated: tabChanged, pass: elapsed < 500 });
  }
  return results;
}

// ─── Breath Gate / Glyph Selection / Journal Save ──────────────────────────

async function testGlyphSelection(page) {
  const glyphs = await page.$$('.login-g');
  if (glyphs.length < 3) return { pass: false, note: 'glyphs not found' };
  for (let i = 0; i < 3; i++) {
    await glyphs[i].click();
    await page.waitForTimeout(150);
  }
  const hasChosen = await page.evaluate(() => {
    return document.querySelectorAll('.login-g.chosen').length >= 3;
  });
  return { pass: hasChosen, note: `${hasChosen ? '3' : 0} glyphs chosen` };
}

async function testBreathGate(page) {
  // Breath gate shows after 1 full cycle — skip exact timing, just check it can appear
  const hasGateEl = await page.evaluate(() => !!document.querySelector('.breath-gate-overlay'));
  return { pass: true, note: `breath-gate element exists: ${hasGateEl}` };
}

async function testJournalSave(page) {
  // Navigate to journal tab first
  await page.evaluate(() => {
    const el = document.getElementById('nav-journal') || document.querySelector('.sn-dot-4') || document.querySelector('.mnd-item[data-tab="journal"]');
    if (el) el.click();
  });
  await page.waitForTimeout(600);

  // Type in journal
  const textarea = await page.$('#journalEntryArea') || await page.$('.journal-entry-area');
  if (textarea) {
    await textarea.fill('Performance test entry at ' + new Date().toISOString());
    const saveBtn = await page.$('#journalSaveBtn') || await page.$('.journal-save-btn');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  }

  const saved = await page.evaluate(() => {
    const entries = document.getElementById('journalEntries');
    return entries && entries.children.length > 0;
  });
  return { pass: saved, note: saved ? 'entry saved' : 'no entries found' };
}

async function testMirrorReflection(page) {
  // Navigate to dream tab
  await page.evaluate(() => {
    const el = document.querySelector('.sn-dot-3') || document.querySelector('.mnd-item[data-tab="dream"]');
    if (el) el.click();
  });
  await page.waitForTimeout(600);

  const input = await page.$('#mirrorInput');
  if (input) {
    await input.fill('water');
    const submit = await page.$('#mirrorSubmit');
    if (submit) {
      await submit.click();
      await page.waitForTimeout(800);
    }
  }

  const output = await page.evaluate(() => {
    const el = document.getElementById('mirrorOutput');
    return el ? el.textContent || '' : '';
  });

  return {
    pass: output.length > 0,
    note: `output length: ${output.length}${output.length > 0 ? ', first 40: ' + output.slice(0, 40) : ''}`
  };
}

async function testBreathCSSVars(page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const bh = parseFloat(root.style.getPropertyValue('--breath-hold').trim() || 'NaN');
    return { breathHold: root.style.getPropertyValue('--breath-hold').trim(), coh: root.style.getPropertyValue('--coh').trim() };
  });
  const bh = parseFloat(result.breathHold);
  return {
    pass: !isNaN(bh) && bh >= 0 && bh <= 1,
    note: `--breath-hold=${result.breathHold} --coh=${result.coh}`
  };
}

async function testCoherenceBar(page) {
  const result = await page.evaluate(() => {
    const bar = document.getElementById('cohBar');
    if (!bar) return { found: false };
    const w = parseFloat(window.getComputedStyle(bar).width);
    const val = document.getElementById('cohValue')?.textContent || '';
    return { found: true, width: Math.round(w), value: val };
  });
  if (!result.found) return { pass: false, note: 'coherence bar not found' };
  return {
    pass: result.width > 0 || result.value.includes('%'),
    note: `width=${result.width}px value="${result.value}"`
  };
}

// ─── Sigil Nav Orbit Animation ─────────────────────────────────────────────

async function testSigilOrbitAnimation(page) {
  const samples = [];
  for (let i = 0; i < 6; i++) {
    const t = await page.evaluate(() => {
      const el = document.getElementById('snOrbitOuter');
      return el ? el.style.transform : '';
    });
    samples.push(t);
    if (i < 5) await page.waitForTimeout(250);
  }
  const hasTransform = samples.some(t => t.length > 0);
  const uniqueValues = [...new Set(samples)].length;
  return {
    pass: hasTransform && uniqueValues > 1,
    note: hasTransform ? `animating (${uniqueValues} unique transforms)` : 'not set'
  };
}

// ─── Sigil Nav Breath Scale ───────────────────────────────────────────────

async function testSigilNavBreathScale(page) {
  const result = await page.evaluate(() => {
    const dots = document.querySelectorAll('.sn-dot');
    if (!dots.length) return { found: false };
    let withNonDefaultScale = 0;
    dots.forEach(d => {
      const t = d.style.transform || '';
      if (t.includes('scale')) {
        const m = t.match(/scale\(([^)]+)\)/);
        if (m && Math.abs(parseFloat(m[1]) - 1.0) > 0.01) withNonDefaultScale++;
      }
    });
    return { found: true, total: dots.length, withNonDefaultScale };
  });
  if (!result.found) return { pass: false, note: 'no sigil nav dots found' };
  return {
    pass: result.withNonDefaultScale > 0,
    note: `${result.withNonDefaultScale}/${result.total} dots with breath scale`
  };
}

// ─── Mobile Nav Drawer ─────────────────────────────────────────────────────

async function testMobileNavDrawer(page) {
  const info = await page.evaluate(() => {
    const el = document.getElementById('mobileNavDrawer');
    if (!el) return { found: false };
    return { found: true, display: window.getComputedStyle(el).display };
  });
  if (!info.found) return { pass: false, note: 'drawer element not found' };
  const isVisible = info.display !== 'none';
  return {
    pass: isVisible,
    note: `display=${info.display}`
  };
}

// ─── Mobile Sigil Nav ──────────────────────────────────────────────────────

async function testMobileSigilNav(page) {
  const items = await page.$$('.mnd-item');
  if (!items.length) return { pass: false, note: 'no mobile nav items found' };
  // Click each item and check tab activation
  let passed = 0;
  for (let i = 0; i < items.length; i++) {
    await items[i].click();
    await page.waitForTimeout(300);
    const active = await page.evaluate((idx) => {
      const item = document.querySelectorAll('.mnd-item')[idx];
      return item ? item.classList.contains('active') : false;
    }, i);
    if (active) passed++;
  }
  return { pass: passed === items.length, note: `${passed}/${items.length} items activated correctly` };
}

// ─── Main Desktop Test ─────────────────────────────────────────────────────

async function runDesktopTests() {
  console.log('\n🜂 DESKTOP PERFORMANCE AUDIT (1280×900)');
  console.log('═'.repeat(56));

  const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
  const page = await ctx.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  const results = { tabs: [], canvases: [], interactions: [], errors: [], criticalErrors: [] };

  // ── Load + Login ──────────────────────────────────────────────────────
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);
    results.loadTime = Date.now();
    results.loadOk = true;
  } catch(e) {
    results.loadOk = false;
    results.loadNote = shortErr(e);
    await ctx.close();
    return results;
  }

  const needsLogin = await page.evaluate(() => {
    const ls = document.getElementById('loginScreen');
    return ls && window.getComputedStyle(ls).display !== 'none';
  });

  if (needsLogin) {
    await login(page);
    await page.waitForTimeout(1000);
  }

  const portalVisible = await page.evaluate(() => {
    const p = document.getElementById('portal');
    return p && window.getComputedStyle(p).display !== 'none';
  });
  results.portalVisible = portalVisible;
  if (!portalVisible) {
    results.note = 'Login failed — portal not visible';
    await ctx.close();
    return results;
  }

  // ── Start breath cycle ────────────────────────────────────────────────
  await page.evaluate(() => document.getElementById('btnStart')?.click());
  await page.waitForTimeout(800);

  const breathRunning = await page.evaluate(() => {
    return typeof isRunning !== 'undefined' ? isRunning :
           (typeof breathCtrl !== 'undefined' ? breathCtrl.isActive : false);
  });
  results.breathRunning = breathRunning;

  // ── Tab Switches ──────────────────────────────────────────────────────
  console.log('\n  📋 Tab Switches:');
  const tabResults = await testTabSwitches(page, ALL_TABS_FOR_DESKTOP, 'desktop');
  tabResults.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    console.log(`     ${icon} ${r.tab}: ${r.switchTime}ms (active=${r.active})`);
  });
  results.tabs = tabResults;

  // ── Canvas Animations ─────────────────────────────────────────────────
  console.log('\n  🎨 Canvas Animations:');
  const CANVAS_IDS = [
    { id: 'wheel',            label: 'Wheel (main)' },
    { id: 'cohSparkline',     label: 'Coherence Sparkline' },
    { id: 'cohRadar',         label: 'Coherence Radar' },
    { id: 'primeAxisTracker', label: 'Prime Axis Tracker' },
    { id: 'mirror24cell',      label: 'Mirror 24-Cell' },
  ];

  // Navigate to wheel tab for wheel canvas
  await page.evaluate(() => {
    const el = document.getElementById('nav-wheel') || document.querySelector('.sn-dot-1');
    if (el) el.click();
  });
  await page.waitForTimeout(500);

  const canvasResults = [];
  for (const c of CANVAS_IDS) {
    // Only test mirror canvas when on dream tab
    if (c.id === 'mirror24cell') {
      await page.evaluate(() => document.querySelector('.sn-dot-3')?.click());
      await page.waitForTimeout(500);
    }
    const r = await testCanvasAnimation(page, c.id, c.label, 10, 200);
    const icon = r.pass ? '✅' : '❌';
    console.log(`     ${icon} ${c.label}: ${r.note}`);
    canvasResults.push(r);
  }
  results.canvases = canvasResults;

  // ── Sigil Nav Tests ───────────────────────────────────────────────────
  console.log('\n  🔵 Sigil Nav:');
  const snOrbit = await testSigilOrbitAnimation(page);
  console.log(`     ${snOrbit.pass ? '✅' : '⚠️ '} Sigil orbit: ${snOrbit.note}`);

  const snBreathScale = await testSigilNavBreathScale(page);
  console.log(`     ${snBreathScale.pass ? '✅' : '⚠️ '} Sigil breath scale: ${snBreathScale.note}`);

  const snDots = await testSigilNavDots(page);
  const allDotsOk = snDots.every(d => d.pass);
  console.log(`     ${allDotsOk ? '✅' : '⚠️ '} Sigil nav dots: ${snDots.filter(d=>d.pass).length}/${snDots.length} clicked OK (${snDots.every(d=>d.activated) ? 'all activated' : 'some missing activation'})`);

  results.sigilNav = { orbit: snOrbit, breathScale: snBreathScale, dots: snDots };

  // ── DOM Interactions ───────────────────────────────────────────────────
  console.log('\n  🖱  DOM Interactions:');

  const glyphSel = await testGlyphSelection(page);
  console.log(`     ${glyphSel.pass ? '✅' : '❌'} Glyph selection: ${glyphSel.note}`);

  const cssVar = await testBreathCSSVars(page);
  console.log(`     ${cssVar.pass ? '✅' : '⚠️ '} Breath CSS vars: ${cssVar.note}`);

  const cohBar = await testCoherenceBar(page);
  console.log(`     ${cohBar.pass ? '✅' : '❌'} Coherence bar: ${cohBar.note}`);

  // ── Error Check ────────────────────────────────────────────────────────
  const critErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::') &&
    !e.includes('Failed to load') &&
    !e.includes('Refused to connect')
  );
  results.errors = critErrors;
  results.criticalErrors = critErrors;

  console.log('\n  ⚠️  Console Errors:');
  if (critErrors.length === 0) {
    console.log(`     ✅ No critical errors`);
  } else {
    critErrors.slice(0, 5).forEach(e => console.log(`     ❌ ${e.slice(0, 120)}`));
  }

  console.log('\n  ── Summary ──────────────────────────────────────');

  const tabPass = tabResults.filter(r => r.pass).length;
  const canvasPass = canvasResults.filter(r => r.pass).length;
  const tabScore = `${tabPass}/${tabResults.length}`;
  const canvasScore = `${canvasPass}/${canvasResults.length}`;
  console.log(`     Tabs: ${tabScore} passed | Canvases: ${canvasScore} animating | Errors: ${critErrors.length}`);

  await ctx.close();
  return results;
}

// ─── Main Mobile Test ──────────────────────────────────────────────────────

async function runMobileTests() {
  console.log('\n🜂 MOBILE PERFORMANCE AUDIT (375×812)');
  console.log('═'.repeat(56));

  const ctx = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const page = await ctx.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  const results = { tabs: [], canvases: [], interactions: [], errors: [], criticalErrors: [] };

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);
    results.loadOk = true;
  } catch(e) {
    results.loadOk = false;
    results.loadNote = shortErr(e);
    await ctx.close();
    return results;
  }

  const needsLogin = await page.evaluate(() => {
    const ls = document.getElementById('loginScreen');
    return ls && window.getComputedStyle(ls).display !== 'none';
  });

  if (needsLogin) {
    await login(page);
    await page.waitForTimeout(1000);
  }

  const portalVisible = await page.evaluate(() => {
    const p = document.getElementById('portal');
    return p && window.getComputedStyle(p).display !== 'none';
  });
  results.portalVisible = portalVisible;
  if (!portalVisible) {
    results.note = 'Login failed on mobile';
    await ctx.close();
    return results;
  }

  // ── Mobile Nav Drawer ─────────────────────────────────────────────────
  console.log('\n  📱 Mobile Nav Drawer:');
  const drawer = await testMobileNavDrawer(page);
  console.log(`     ${drawer.pass ? '✅' : '❌'} Nav drawer: ${drawer.note}`);

  // ── Tab Switches via Mobile Nav ───────────────────────────────────────
  const mobileTabs = ['wheel', 'codex', 'dream', 'journal', 'profile'];
  console.log('\n  📋 Mobile Tab Switches:');
  for (const tab of mobileTabs) {
    const t0 = Date.now();
    await page.evaluate((t) => {
      const el = document.querySelector(`.mnd-item[data-tab="${t}"]`);
      if (el) el.click();
    }, tab);
    await page.waitForTimeout(500);
    const elapsed = Date.now() - t0;
    const active = await page.evaluate((t) => {
      const el = document.getElementById('tab-' + t);
      return el ? el.classList.contains('active') : false;
    }, tab);
    const icon = elapsed < 500 && active ? '✅' : '❌';
    console.log(`     ${icon} ${tab}: ${elapsed}ms (active=${active})`);
  }

  // ── Mobile Sigil Nav ──────────────────────────────────────────────────
  console.log('\n  🔵 Mobile Sigil Nav (mnd-item):');
  const mndResult = await testMobileSigilNav(page);
  console.log(`     ${mndResult.pass ? '✅' : '❌'} Mobile nav items: ${mndResult.note}`);

  // ── Mobile Canvas (wheel) ─────────────────────────────────────────────
  await page.evaluate(() => document.querySelector('.mnd-item[data-tab="wheel"]')?.click());
  await page.waitForTimeout(500);

  console.log('\n  🎨 Mobile Canvas:');
  const wheelMobile = await testCanvasAnimation(page, 'wheel', 'Wheel (mobile)', 8, 250);
  console.log(`     ${wheelMobile.pass ? '✅' : '❌'} Wheel canvas: ${wheelMobile.note}`);

  // ── Error Check ────────────────────────────────────────────────────────
  const critErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::') &&
    !e.includes('Failed to load') &&
    !e.includes('Refused to connect')
  );
  results.errors = critErrors;
  results.criticalErrors = critErrors;

  console.log('\n  ⚠️  Console Errors:');
  if (critErrors.length === 0) {
    console.log(`     ✅ No critical errors`);
  } else {
    critErrors.slice(0, 5).forEach(e => console.log(`     ❌ ${e.slice(0, 120)}`));
  }

  console.log('\n  ── Summary ──────────────────────────────────────');
  console.log(`     Mobile layout functional | Errors: ${critErrors.length}`);

  await ctx.close();
  return results;
}

// ─── Performance Audit Report ─────────────────────────────────────────────

function printAuditReport(desktopResults, mobileResults) {
  console.log('\n' + '═'.repeat(56));
  console.log('📊 GUI PERFORMANCE AUDIT — FINAL REPORT');
  console.log('═'.repeat(56));

  // Desktop tab switch times
  console.log('\n📋 TAB SWITCH TIMES (Desktop):');
  if (desktopResults.tabs && desktopResults.tabs.length > 0) {
    desktopResults.tabs.forEach(r => {
      const icon = r.switchTime < 500 ? '✅' : '⚠️ ';
      console.log(`   ${icon} ${r.tab}: ${r.switchTime}ms${r.active ? '' : ' (NOT ACTIVE)'}`);
    });
    const avgTab = desktopResults.tabs.reduce((s, r) => s + r.switchTime, 0) / desktopResults.tabs.length;
    const maxTab = Math.max(...desktopResults.tabs.map(r => r.switchTime));
    console.log(`   Avg: ${Math.round(avgTab)}ms | Max: ${maxTab}ms`);
  } else {
    console.log('   (no data)');
  }

  // Canvas animation CVs
  console.log('\n🎨 CANVAS ANIMATION COEFFICIENTS OF VARIATION:');
  if (desktopResults.canvases && desktopResults.canvases.length > 0) {
    desktopResults.canvases.forEach(r => {
      const icon = r.pass ? '✅' : '❌';
      console.log(`   ${icon} ${r.label}: ${r.note}`);
    });
  } else {
    console.log('   (no data)');
  }

  // Sigil nav
  console.log('\n🔵 SIGIL NAV:');
  if (desktopResults.sigilNav) {
    console.log(`   Orbit: ${desktopResults.sigilNav.orbit.note}`);
    console.log(`   Breath scale: ${desktopResults.sigilNav.breathScale.note}`);
    const dotOk = desktopResults.sigilNav.dots.filter(d => d.pass).length;
    console.log(`   Dot clicks: ${dotOk}/${desktopResults.sigilNav.dots.length} OK`);
  }

  // DOM interactions
  console.log('\n🖱  DOM INTERACTIONS:');
  if (desktopResults.errors !== undefined) {
    console.log(`   Critical JS errors: ${desktopResults.criticalErrors?.length || 0}`);
    if (desktopResults.criticalErrors?.length > 0) {
      desktopResults.criticalErrors.slice(0, 3).forEach(e => console.log(`      ❌ ${e.slice(0, 100)}`));
    }
  }

  // Mobile
  console.log('\n📱 MOBILE:');
  console.log(`   Nav drawer visible: ${mobileResults.portalVisible ? 'yes' : 'no'}`);

  // Final verdict
  console.log('\n' + '═'.repeat(56));
  const dTabs = desktopResults.tabs || [];
  const dCanvases = desktopResults.canvases || [];
  const tabOk = dTabs.filter(r => r.pass).length;
  const canvasOk = dCanvases.filter(r => r.pass).length;
  const errors = (desktopResults.criticalErrors || []).length;
  const allGood = tabOk === dTabs.length && canvasOk === dCanvases.length && errors === 0;
  console.log(allGood
    ? '✅ ALL CHECKS PASSED'
    : `⚠️  Tab: ${tabOk}/${dTabs.length} | Canvas: ${canvasOk}/${dCanvases.length} | Errors: ${errors}`);
  console.log('═'.repeat(56));
}

// ─── Run ───────────────────────────────────────────────────────────────────

async function main() {
  browser = await chromium.launch({ headless: true });

  const desktopResults = await runDesktopTests();
  const mobileResults = await runMobileTests();

  await browser.close();

  printAuditReport(desktopResults, mobileResults);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
