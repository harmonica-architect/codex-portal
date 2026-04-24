const { chromium } = require('playwright');
const BASE = 'http://localhost:3737';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Desktop
  const desk = await browser.newPage({ width: 1280, height: 900 });
  await desk.goto(BASE, { timeout: 10000 }).catch(() => {});
  await desk.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) await desk.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await desk.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const deskInfo = await desk.evaluate(() => {
    const wrap = document.getElementById('sigilNavWrap');
    const ring = document.querySelector('.sigil-nav-ring');
    const portal = document.getElementById('portal');
    const cp = document.querySelector('.coherence-panel');
    const vp = document.documentElement;
    const vpW = vp.clientWidth;
    return {
      vpW,
      wrapBB: wrap?.getBoundingClientRect().toJSON(),
      wrapCS: {
        position: getComputedStyle(wrap).position,
        width: getComputedStyle(wrap).width,
        maxWidth: getComputedStyle(wrap).maxWidth,
        right: getComputedStyle(wrap).right,
        top: getComputedStyle(wrap).top,
        left: getComputedStyle(wrap).left,
        zIndex: getComputedStyle(wrap).zIndex,
        justifyContent: getComputedStyle(wrap).justifyContent,
        display: getComputedStyle(wrap).display
      },
      ringBB: ring?.getBoundingClientRect().toJSON(),
      portalBB: portal?.getBoundingClientRect().toJSON(),
      cpBB: cp?.getBoundingClientRect().toJSON()
    };
  });
  console.log('DESKTOP (1280×900):');
  console.log('viewportWidth:', deskInfo.vpW);
  console.log('portal:', JSON.stringify(deskInfo.portalBB));
  console.log('coherence-panel:', JSON.stringify(deskInfo.cpBB));
  console.log('wrap BB:', JSON.stringify(deskInfo.wrapBB));
  console.log('wrap CS:', JSON.stringify(deskInfo.wrapCS));
  console.log('ring BB:', JSON.stringify(deskInfo.ringBB));

  // Mobile
  const mob = await browser.newPage({ width: 375, height: 812 });
  await mob.goto(BASE, { timeout: 10000 }).catch(() => {});
  await mob.waitForSelector('.login-g', { timeout: 3000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  for (const g of ['△','◇','◈']) await mob.locator('.login-g[data-g="'+g+'"]').first().click().catch(() => {});
  await mob.locator('#loginBtn').click().catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const mobInfo = await mob.evaluate(() => {
    const wrap = document.getElementById('sigilNavWrap');
    const ring = document.querySelector('.sigil-nav-ring');
    const portal = document.getElementById('portal');
    const cp = document.querySelector('.coherence-panel');
    const vp = document.documentElement;
    const vpW = vp.clientWidth;
    return {
      vpW,
      wrapBB: wrap?.getBoundingClientRect().toJSON(),
      wrapCS: {
        position: getComputedStyle(wrap).position,
        width: getComputedStyle(wrap).width,
        maxWidth: getComputedStyle(wrap).maxWidth,
        right: getComputedStyle(wrap).right,
        top: getComputedStyle(wrap).top,
        left: getComputedStyle(wrap).left,
        zIndex: getComputedStyle(wrap).zIndex,
        justifyContent: getComputedStyle(wrap).justifyContent,
        display: getComputedStyle(wrap).display
      },
      ringBB: ring?.getBoundingClientRect().toJSON(),
      portalBB: portal?.getBoundingClientRect().toJSON(),
      cpBB: cp?.getBoundingClientRect().toJSON()
    };
  });
  console.log('\nMOBILE (375×812):');
  console.log('viewportWidth:', mobInfo.vpW);
  console.log('portal:', JSON.stringify(mobInfo.portalBB));
  console.log('coherence-panel:', JSON.stringify(mobInfo.cpBB));
  console.log('wrap BB:', JSON.stringify(mobInfo.wrapBB));
  console.log('wrap CS:', JSON.stringify(mobInfo.wrapCS));
  console.log('ring BB:', JSON.stringify(mobInfo.ringBB));

  await browser.close();
}
main().catch(e => console.error(e));
