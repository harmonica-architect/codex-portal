// debug-wrap5.js
const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ width: 375, height: 812 });
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  await page.goto(BASE, { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) await page.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await page.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const wrap = document.getElementById('sigilNavWrap');
    const ring = document.querySelector('.sigil-nav-ring');
    const cs = getComputedStyle(wrap);
    const ringCS = getComputedStyle(ring);
    // Count sigil-nav-wrap rules
    let ruleCount = 0;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === '.sigil-nav-wrap') ruleCount++;
        }
      } catch(e) {}
    }
    return {
      position: cs.position,
      display: cs.display,
      width: cs.width,
      right: cs.right,
      top: cs.top,
      ringPosition: ringCS.position,
      ringWidth: ringCS.width,
      ruleCount,
      bodyWidth: document.body.clientWidth
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));