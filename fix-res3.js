const fs = require('fs');
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');

// Fix resizeCanvases: move canvasSize assignment AFTER canvas.width
// This ensures canvasSize always reflects the CURRENT s value, not the stale buffer value
const oldBlock = Buffer.from(
  '  const rect = wrap ? wrap.getBoundingClientRect() : null; const s = rect ? Math.min(rect.width, rect.height) : 320;\r\n' +
  '  canvasSize = canvas.width / dpr;\r\n' +
  '  canvas.width = s * dpr;\r\n' +
  '  canvas.height = s * dpr;\r\n' +
  '  canvas.style.width = s + \'px\';\r\n' +
  '  canvas.style.height = s + \'px\';'
);
const newBlock = Buffer.from(
  '  const rect = wrap ? wrap.getBoundingClientRect() : null; const s = rect ? Math.min(rect.width, rect.height) : 320;\r\n' +
  '  canvas.width = s * dpr;\r\n' +
  '  canvas.height = s * dpr;\r\n' +
  '  canvas.style.width = s + \'px\';\r\n' +
  '  canvas.style.height = s + \'px\';\r\n' +
  '  canvasSize = s; // set AFTER dimensions so canvasSize always equals display px'
);

const pos = buf.indexOf(oldBlock);
if (pos === -1) { console.error('resizeCanvases block not found'); process.exit(1); }
console.log('Found at byte', pos);

const before = buf.slice(0, pos);
const after = buf.slice(pos + oldBlock.length);
const fixed = Buffer.concat([before, newBlock, after]);

// Also fix dims() — canvasSize is now set in display px, so use canvasSize directly
// dims() currently uses canvas.width/dpr — that's still correct, but let's make it use canvasSize for clarity
const dimsOld = Buffer.from(
  '  // canvas.width is buffer px; divide by dpr to get display px for correct drawing coords\r\n' +
  '  const s = canvas.width / dpr;'
);
const dimsNew = Buffer.from(
  '  // canvasSize = display px (set after canvas.width assignment in resizeCanvases)\r\n' +
  '  const s = canvasSize;'
);
const dimsPos = fixed.indexOf(dimsOld);
if (dimsPos === -1) { console.error('dims() canvas.width/dpr line not found'); process.exit(1); }
console.log('dims() fix at byte', dimsPos);

const dBefore = fixed.slice(0, dimsPos);
const dAfter = fixed.slice(dimsPos + dimsOld.length);
const fixed2 = Buffer.concat([dBefore, dimsNew, dAfter]);

fs.writeFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js', fixed2);
console.log('resonator.js fixed');

// Verify
const verify = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js', 'utf8');
const rcIdx = verify.indexOf('function resizeCanvases');
console.log('\nresizeCanvases:');
console.log(verify.slice(rcIdx, rcIdx + 400));
const dimsIdx2 = verify.indexOf('function dims');
console.log('dims():');
console.log(verify.slice(dimsIdx2, dimsIdx2 + 100));
