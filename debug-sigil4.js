const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Mobile
  const mob = await browser.newPage({ width: 375, height: 812 });
  await mob.goto(BASE, { timeout: 10000 }).catch(() => {});
  await mob.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  for (const g of ['△','◇','◈']) await mob.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await mob.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const info = await mob.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const bcs = getComputedStyle(document.body);
    return {
      htmlWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.clientWidth,
      htmlCS: {
        minWidth: cs.minWidth,
        maxWidth: cs.maxWidth,
        width: cs.width,
        transform: cs.transform,
        position: cs.position,
        overflowX: cs.overflowX
      },
      bodyCS: {
        minWidth: bcs.minWidth,
        maxWidth: bcs.maxWidth,
        width: bcs.width,
        overflowX: bcs.overflowX
      }
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Check all CSS rules from stylesheets - look for min-width on * or html
  const allRules = await mob.evaluate(() => {
    const sheets = document.styleSheets;
    const results = [];
    for (const sheet of sheets) {
      try {
        for (const rule of sheet.cssRules) {
          const sel = rule.selectorText || '';
          if ((sel === '*' || sel === 'html' || sel === 'body') && rule.cssText.includes('min-width')) {
            results.push({ sel, css: rule.cssText.slice(0, 200) });
          }
        }
      } catch(e) {}
    }
    return results;
  });
  console.log('Rules with min-width on html/body/*:', JSON.stringify(allRules, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));
