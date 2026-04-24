// debug-hub-mobile2.js
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
    const cs = wrap ? getComputedStyle(wrap) : null;
    const ring = document.querySelector('.sigil-nav-ring');
    const ringCS = ring ? getComputedStyle(ring) : null;
    const hub = document.querySelector('.sn-hub');
    const portalCS = document.getElementById('portal') ? getComputedStyle(document.getElementById('portal')) : null;
    return {
      wrapCS: cs ? {
        position: cs.position, display: cs.display, width: cs.width,
        justifyContent: cs.justifyContent, left: cs.left, right: cs.right,
        paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight,
        marginLeft: cs.marginLeft, marginRight: cs.marginRight
      } : null,
      ringCS: ringCS ? {
        position: ringCS.position, width: ringCS.width, left: ringCS.left
      } : null,
      portalCS: portalCS ? {
        display: portalCS.display, width: portalCS.width,
        paddingLeft: portalCS.paddingLeft, paddingRight: portalCS.paddingRight,
        maxWidth: portalCS.maxWidth, margin: portalCS.margin
      } : null
    };
  });
  console.log('Computed styles:', JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));