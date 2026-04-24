// debug-wrap6.js
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
    const sheets = Array.from(document.styleSheets);
    const rules = [];
    for (const sheet of sheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes('sigil-nav-wrap') && !rule.selectorText.includes(':')) {
            rules.push({ sel: rule.selectorText, props: rule.style.cssText });
          }
        }
      } catch(e) {}
    }
    return { rules, vw: window.innerWidth, bodyW: document.body.clientWidth };
  });
  console.log('VW:', info.vw, 'bodyW:', info.bodyW);
  console.log('Rules:');
  info.rules.forEach(r => console.log(' ', r.sel, '{', r.props, '}'));
  await browser.close();
}
main().catch(e => console.error(e));