// debug-wrap-at-init.js
const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ width: 375, height: 812 });

  // Intercept all JS that runs before login
  await page.addInitScript(() => {
    const observed = new Set();
    const origSet = HTMLElement.prototype.setAttribute;
    window.__debugSigilStyles = [];
    // Patch style property to catch inline style changes
    const origStyleSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style').set;
    Object.defineProperty(HTMLElement.prototype, 'style', {
      set(val) {
        window.__debugSigilStyles.push({ el: this.className, prop: 'style', val: val.substring ? val.substring(0,100) : String(val).substring(0,100) });
        return origStyleSetter.call(this, val);
      },
      get() { return origStyleSetter.call(this); }
    });
  });

  page.on('console', msg => console.log('BROWSER:', msg.text()));
  await page.goto(BASE, { timeout: 10000 }).catch(() => {});

  // Check wrap style right after page load, before any interaction
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => {
    const el = document.getElementById('sigilNavWrap');
    const cs = getComputedStyle(el);
    return { position: cs.position, width: cs.width, right: cs.right, top: cs.top };
  });
  console.log('Before login:', JSON.stringify(before));

  await page.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) await page.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await page.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const after = await page.evaluate(() => {
    const el = document.getElementById('sigilNavWrap');
    const cs = getComputedStyle(el);
    return { position: cs.position, width: cs.width, right: cs.right, top: cs.top };
  });
  console.log('After login:', JSON.stringify(after));

  await browser.close();
}
main().catch(e => console.error(e));