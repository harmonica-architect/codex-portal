// debug-hub-mobile.js
const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto(BASE, { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) await page.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await page.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const wrap = document.querySelector('.sigil-nav-wrap');
    const ring = document.querySelector('.sigil-nav-ring');
    const hub = document.querySelector('.sn-hub');
    const hubGlyph = document.getElementById('snHubGlyph');
    const hubLabel = document.getElementById('snHubLabel');
    return {
      wrapBB: wrap ? wrap.getBoundingClientRect().toJSON() : null,
      wrapStyle: wrap ? getComputedStyle(wrap).cssText : null,
      ringBB: ring ? ring.getBoundingClientRect().toJSON() : null,
      hubBB: hub ? hub.getBoundingClientRect().toJSON() : null,
      hubGlyphBB: hubGlyph ? hubGlyph.getBoundingClientRect().toJSON() : null,
      hubLabelBB: hubLabel ? hubLabel.getBoundingClientRect().toJSON() : null,
      portalBB: document.getElementById('portal') ? document.getElementById('portal').getBoundingClientRect().toJSON() : null,
      tabHomeBB: document.getElementById('tab-home') ? document.getElementById('tab-home').getBoundingClientRect().toJSON() : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));