// debug-hub-mobile3.js
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
    const cs = document.getElementById('sigilNavWrap') ? getComputedStyle(document.getElementById('sigilNavWrap')) : null;
    const rCS = document.querySelector('.sigil-nav-ring') ? getComputedStyle(document.querySelector('.sigil-nav-ring')) : null;
    return {
      wrap: {
        position: cs.position, display: cs.display, width: cs.width,
        flexDirection: cs.flexDirection, justifyContent: cs.justifyContent,
        alignItems: cs.alignItems, margin: cs.margin, padding: cs.padding
      },
      ring: {
        position: rCS.position, display: rCS.display, width: rCS.width,
        marginLeft: rCS.marginLeft, marginRight: rCS.marginLeft
      }
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));