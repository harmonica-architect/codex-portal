// debug-sigil-desktop.js
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

  const info = await desk.evaluate(() => {
    const wrap = document.getElementById('sigilNavWrap');
    const ring = document.querySelector('.sigil-nav-ring');
    const hub = document.getElementById('snHub');
    const portal = document.getElementById('portal');
    const cp = document.querySelector('.coherence-panel');
    return {
      wrapBB: wrap ? wrap.getBoundingClientRect().toJSON() : null,
      wrapCS: wrap ? getComputedStyle(wrap).cssText : null,
      ringBB: ring ? ring.getBoundingClientRect().toJSON() : null,
      hubBB: hub ? hub.getBoundingClientRect().toJSON() : null,
      portalBB: portal ? portal.getBoundingClientRect().toJSON() : null,
      cpBB: cp ? cp.getBoundingClientRect().toJSON() : null,
      wrapCS: wrap ? {
        position: getComputedStyle(wrap).position,
        width: getComputedStyle(wrap).width,
        right: getComputedStyle(wrap).right,
        top: getComputedStyle(wrap).top,
        left: getComputedStyle(wrap).left,
        zIndex: getComputedStyle(wrap).zIndex
      } : null
    };
  });
  console.log('DESKTOP (1280×900):');
  console.log('portal:', JSON.stringify(info.portalBB));
  console.log('coherence-panel:', JSON.stringify(info.cpBB));
  console.log('wrap:', JSON.stringify(info.wrapBB));
  console.log('wrap CS:', JSON.stringify(info.wrapCS));
  console.log('ring:', JSON.stringify(info.ringBB));
  console.log('hub:', JSON.stringify(info.hubBB));

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
    const hub = document.getElementById('snHub');
    const portal = document.getElementById('portal');
    const cp = document.querySelector('.coherence-panel');
    return {
      wrapBB: wrap ? wrap.getBoundingClientRect().toJSON() : null,
      ringBB: ring ? ring.getBoundingClientRect().toJSON() : null,
      hubBB: hub ? hub.getBoundingClientRect().toJSON() : null,
      portalBB: portal ? portal.getBoundingClientRect().toJSON() : null,
      cpBB: cp ? cp.getBoundingClientRect().toJSON() : null,
      wrapCS: wrap ? {
        position: getComputedStyle(wrap).position,
        width: getComputedStyle(wrap).width,
        left: getComputedStyle(wrap).left,
        justifyContent: getComputedStyle(wrap).justifyContent
      } : null
    };
  });
  console.log('\nMOBILE (375×812):');
  console.log('portal:', JSON.stringify(mobInfo.portalBB));
  console.log('coherence-panel:', JSON.stringify(mobInfo.cpBB));
  console.log('wrap:', JSON.stringify(mobInfo.wrapBB));
  console.log('wrap CS:', JSON.stringify(mobInfo.wrapCS));
  console.log('ring:', JSON.stringify(mobInfo.ringBB));
  console.log('hub:', JSON.stringify(mobInfo.hubBB));

  await browser.close();
}
main().catch(e => console.error(e));