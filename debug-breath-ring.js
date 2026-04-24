const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, isMobile: false });
  const page = await ctx.newPage();
  await page.goto(BASE, { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  for (const g of ['△','◇','◈']) await page.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await page.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const info = await page.evaluate(() => {
    const snWrap = document.getElementById('sigilNavWrap');
    const snDots = document.querySelectorAll('.sn-dot');
    const brWrap = document.getElementById('breathRingWrap');
    const brDots = document.querySelectorAll('.br-dot');
    const snBB = snWrap?.getBoundingClientRect();
    const brBB = brWrap?.getBoundingClientRect();
    return {
      sigilNavWrap: { x: snBB?.x, y: snBB?.y, width: snBB?.width, height: snBB?.height, visible: snBB !== null },
      sigilNavDotCount: snDots.length,
      breathRingVisible: brBB !== null,
      breathRingDotCount: brDots.length,
      brBB: brBB ? { x: brBB.x, y: brBB.y, width: brBB.width, height: brBB.height } : null,
      bothVisible: snBB !== null && brBB !== null
    };
  });
  console.log('Home tab (desktop 1280×900):');
  console.log(JSON.stringify(info, null, 2));

  // Also check Wheel tab
  await page.locator('.sn-dot-1').click().catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const wheelInfo = await page.evaluate(() => {
    const snWrap = document.getElementById('sigilNavWrap');
    const snBB = snWrap?.getBoundingClientRect();
    const brWrap = document.getElementById('breathRingWrap');
    const brBB = brWrap?.getBoundingClientRect();
    return {
      sigilNavWrap: snBB ? { x: snBB.x, y: snBB.y } : null,
      breathRingVisible: brBB !== null
    };
  });
  console.log('Wheel tab:');
  console.log(JSON.stringify(wheelInfo, null, 2));

  await browser.close();
}
main().catch(e => console.error(e));
