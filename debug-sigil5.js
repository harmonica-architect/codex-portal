const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  const contexts = await browser.contexts();
  // Mobile with proper device emulation
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mob = await ctx.newPage();
  await mob.goto(BASE, { timeout: 10000 }).catch(() => {});
  await mob.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  for (const g of ['△','◇','◈']) await mob.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await mob.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const info = await mob.evaluate(() => {
    return {
      vpClientWidth: document.documentElement.clientWidth,
      vpInnerWidth: window.innerWidth,
      htmlWidth: getComputedStyle(document.documentElement).width,
      bodyWidth: getComputedStyle(document.body).width,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content
    };
  });
  console.log('Mobile emulated viewport:', info);

  // Check if mobile-context sigil nav is still absolute
  const wrapCS = await mob.evaluate(() => {
    const wrap = document.getElementById('sigilNavWrap');
    if (!wrap) return 'NOT FOUND';
    return {
      position: getComputedStyle(wrap).position,
      width: getComputedStyle(wrap).width,
      right: getComputedStyle(wrap).right,
      top: getComputedStyle(wrap).top,
      display: getComputedStyle(wrap).display
    };
  });
  console.log('sigil-nav-wrap computed style:', wrapCS);

  await browser.close();
}
main().catch(e => console.error(e));
