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

  const homeInfo = await page.evaluate(() => {
    const snWrap = document.getElementById('sigilNavWrap');
    const brWrap = document.getElementById('breathRingWrap');
    const activeTab = document.querySelector('.tab-content.active')?.id;
    return {
      activeTab,
      sigilNavHidden: snWrap ? snWrap.style.display === 'none' : 'not_found',
      breathRingVisible: !!brWrap,
      breathRingDotCount: document.querySelectorAll('.br-dot').length
    };
  });
  console.log('HOME tab:', JSON.stringify(homeInfo));

  // Navigate to Wheel tab
  await page.evaluate(() => { document.querySelector('.sn-dot-1')?.click(); });
  await new Promise(r => setTimeout(r, 1000));
  const wheelInfo = await page.evaluate(() => {
    const snWrap = document.getElementById('sigilNavWrap');
    const brWrap = document.getElementById('breathRingWrap');
    const activeTab = document.querySelector('.tab-content.active')?.id;
    return {
      activeTab,
      sigilNavHidden: snWrap ? snWrap.style.display === 'none' : 'not_found',
      breathRingVisible: !!brWrap
    };
  });
  console.log('WHEEL tab:', JSON.stringify(wheelInfo));

  // Navigate back to home
  await page.evaluate(() => { document.querySelector('.sn-dot-0')?.click(); });
  await new Promise(r => setTimeout(r, 1000));
  const backHome = await page.evaluate(() => {
    const snWrap = document.getElementById('sigilNavWrap');
    return { sigilNavHidden: snWrap ? snWrap.style.display === 'none' : 'not_found' };
  });
  console.log('BACK HOME:', JSON.stringify(backHome));

  await browser.close();
}
main().catch(e => console.error(e));
