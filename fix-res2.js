const fs = require('fs');
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');

// 1. Fix dims() — use canvas.width/dpr for drawing coords
const dimsStart = 2388;
const dimsEnd = 2507; // byte of closing }
const oldDims = buf.slice(dimsStart, dimsEnd + 1);
const newDims = Buffer.from(
  'function dims() {\r\n' +
  '  // canvas.width is buffer px; divide by dpr to get display px for correct drawing coords\r\n' +
  '  const s = canvas.width / dpr;\r\n' +
  '  return { cx: s / 2, cy: s / 2, r: s * 0.42, ir: s * 0.285, hr: s * 0.038 }\r\n'
);
if (buf.slice(dimsStart, dimsStart + 'function dims()'.length).toString() !== 'function dims()') {
  console.error('dims() signature mismatch, aborting');
  process.exit(1);
}
console.log('dims() signature confirmed, replacing...');

const part1 = buf.slice(0, dimsStart);
const part2 = buf.slice(dimsEnd + 1);
let tmp = Buffer.concat([part1, newDims, part2]);
console.log('dims() fixed');

// 2. Fix resizeCanvases — canvasSize should track display pixels, not CSS pixels
// Find the FIRST canvasSize = s; (inside resizeCanvases)
const csOld = Buffer.from('canvasSize = s;');
const csPos = tmp.indexOf(csOld);
if (csPos === -1) {
  console.error('canvasSize = s; not found');
  process.exit(1);
}
console.log('canvasSize=s at byte', csPos);

// Replace with: canvasSize = canvas.width / dpr;
const csNew = Buffer.from('canvasSize = canvas.width / dpr;');
const tmpBefore = tmp.slice(0, csPos);
const tmpAfter = tmp.slice(csPos + csOld.length);
tmp = Buffer.concat([tmpBefore, csNew, tmpAfter]);
console.log('canvasSize fixed in resizeCanvases');

fs.writeFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js', tmp);
console.log('resonator.js written');

// Verify the changes
const verify = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js', 'utf8');
const dimsIdx = verify.indexOf('function dims()');
console.log('\nVerification — dims():');
console.log(verify.slice(dimsIdx, dimsIdx + 200));
console.log('\nVerification — resizeCanvases section:');
const rcIdx = verify.indexOf('function resizeCanvases');
console.log(verify.slice(rcIdx, rcIdx + 300));
