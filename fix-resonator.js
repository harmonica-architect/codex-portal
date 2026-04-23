const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'resonator.js');
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Fix resizeCanvases — use getBoundingClientRect for accurate CSS pixel size
const resizeOld = 'function resizeCanvases() {\r\n  const wrap = document.getElementById(\'wheelWrap\');\r\n  const s = wrap ? wrap.offsetWidth : 320;\r\n  canvasSize = s;\r\n  canvas.width = s * dpr;\r\n  canvas.height = s * dpr;\r\n  canvas.style.width = s + \'px\';\r\n  canvas.style.height = s + \'px\';\r\n  waveCanvas.width = waveCanvas.offsetWidth * dpr;\r\n  waveCanvas.height = 18 * dpr;\r\n}';

const resizeNew = 'function resizeCanvases() {\r\n  const wrap = document.getElementById(\'wheelWrap\');\r\n  // Use getBoundingClientRect for the ACTUAL rendered size — critical when CSS min()
  // constrains the display size differently from offsetWidth on small viewports
  const rect = wrap ? wrap.getBoundingClientRect() : null;\r\n  const s = rect ? Math.min(rect.width, rect.height) : 320;\r\n  canvasSize = s;\r\n  canvas.width = s * dpr;\r\n  canvas.height = s * dpr;\r\n  canvas.style.width = s + \'px\';\r\n  canvas.style.height = s + \'px\';\r\n  waveCanvas.width = waveCanvas.offsetWidth * dpr;\r\n  waveCanvas.height = 18 * dpr;\r\n}';

if (!content.includes(resizeOld)) {
  console.error('resizeCanvases() not found — check CRLF');
  // Show what's actually there
  const idx = content.indexOf('function resizeCanvases');
  console.log('Found at:', idx);
  if (idx >= 0) console.log(JSON.stringify(content.slice(idx, idx+300)));
} else {
  content = content.replace(resizeOld, resizeNew);
  console.log('resizeCanvases() fixed — uses getBoundingClientRect');
}

// Fix 2: Add call to resizeCanvases on DOMContentLoaded before drawWheel
const domOld = "document.addEventListener('DOMContentLoaded', () => {";
const domNew = "document.addEventListener('DOMContentLoaded', () => {\r\n  resizeCanvases(); // sync buffer to actual display size before first draw";

if (!content.includes(domOld)) {
  console.error('DOMContentLoaded not found');
} else {
  content = content.replace(domOld, domNew);
  console.log('DOMContentLoaded init fixed');
}

fs.writeFileSync(file, content, 'utf8');
console.log('resonator.js written');

// Fix 3: Fix CSS padding-top for .main-stage
const cssFile = path.join(__dirname, 'resonator.css');
let css = fs.readFileSync(cssFile, 'utf8');

// Add top padding to clear the fixed inline-guide banner (~36px)
const stageOld = '.main-stage {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 2rem 1rem;\r\n  transition: margin-right: 0.5s cubic-bezier(0.4,0,0.2,1);\r\n  position: relative;\r\n  z-index: 60;\r\n}';
const stageNew = '.main-stage {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 3.6rem 1rem 2rem;\r\n  transition: margin-right: 0.5s cubic-bezier(0.4,0,0.2,1);\r\n  position: relative;\r\n  z-index: 60;\r\n}';

if (!css.includes(stageOld)) {
  console.error('.main-stage CSS not found');
  // Try to find it
  const idx = css.indexOf('.main-stage {');
  if (idx >= 0) console.log(JSON.stringify(css.slice(idx, idx+300)));
} else {
  css = css.replace(stageOld, stageNew);
  console.log('.main-stage top padding fixed (3.6rem to clear inline-guide)');
}

// Tighten header and step-guide
css = css.replace('.stage-header { text-align: center; margin-bottom: 1.2rem; }',
  '.stage-header { text-align: center; margin-bottom: 0.4rem; }');
css = css.replace('.step-guide { display: flex; gap: 0.6rem; margin-bottom: 1rem; align-items: center; }',
  '.step-guide { display: flex; gap: 0.6rem; margin-bottom: 0.4rem; align-items: center; }');
console.log('Header and step-guide tightened');

fs.writeFileSync(cssFile, css, 'utf8');
console.log('resonator.css written');
console.log('\nDone — push with git add -A && git commit');
