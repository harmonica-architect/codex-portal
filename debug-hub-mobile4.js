// debug-hub-mobile4.js
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
    // Check ALL CSS rules being applied to sigilNavWrap
    const el = document.getElementById('sigilNavWrap');
    const cs = getComputedStyle(el);
    const sheets = Array.from(document.styleSheets);
    const rules = [];
    for (const sheet of sheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes('sigil-nav-wrap')) {
            rules.push(rule.selectorText + ' { ' + rule.style.cssText + ' }');
          }
        }
      } catch(e) {}
    }
    return {
      position: cs.position,
      width: cs.width,
      justifyContent: cs.justifyContent,
      top: cs.top,
      right: cs.right,
      left: cs.left,
      cssRules: rules
    };
  });
  console.log('CS:', JSON.stringify({position: info.position, width: info.width, justifyContent: info.justifyContent, top: info.top, right: info.right, left: info.left}, null, 2));
  console.log('RULES:', info.cssRules.join('\n'));

  await browser.close();
}
main().catch(e => console.error(e));