const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Mobile - check actual viewport in page context
  const mob = await browser.newPage({ width: 375, height: 812 });
  await mob.goto(BASE, { timeout: 10000 }).catch(() => {});
  await mob.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  for (const g of ['△','◇','◈']) await mob.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await mob.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const mobInfo = await mob.evaluate(() => {
    const vp = document.documentElement;
    const body = document.body;
    return {
      vpClientWidth: vp.clientWidth,
      vpClientHeight: vp.clientHeight,
      vpScrollWidth: vp.scrollWidth,
      bodyClientWidth: body.clientWidth,
      vpInnerWidth: window.innerWidth,
      vpInnerHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      // Check which CSS rule is winning
      wrapPosition: getComputedStyle(document.getElementById('sigilNavWrap')).position,
      wrapRight: getComputedStyle(document.getElementById('sigilNavWrap')).right,
      wrapWidth: getComputedStyle(document.getElementById('sigilNavWrap')).width,
    };
  });
  console.log('MOBILE (375×812) actual page metrics:');
  console.log(JSON.stringify(mobInfo, null, 2));

  // Also check what Playwright sees
  const pwMetrics = mob.viewport();
  console.log('Playwright viewport:', pwMetrics);

  await browser.close();
}
main().catch(e => console.error(e));
