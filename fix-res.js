const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'resonator.js');
const content = fs.readFileSync(file); // raw buffer — no encoding issues

// ── Fix 1: resizeCanvases — use getBoundingClientRect ──────────────────────
// OLD:  const s = wrap ? wrap.offsetWidth : 320;
// NEW:  const rect = wrap ? wrap.getBoundingClientRect() : null;
//       const s = rect ? Math.min(rect.width, rect.height) : 320;
// The key change is using rect dimensions instead of offsetWidth, since CSS min()
// may constrain the actual display size differently.
const buf1Old = Buffer.from(
  "function resizeCanvases() {\r\n" +
  "  const wrap = document.getElementById('wheelWrap');\r\n" +
  "  const s = wrap ? wrap.offsetWidth : 320;\r\n",
  'utf8'
);
const buf1New = Buffer.from(
  "function resizeCanvases() {\r\n" +
  "  const wrap = document.getElementById('wheelWrap');\r\n" +
  "  const rect = wrap ? wrap.getBoundingClientRect() : null;\r\n" +
  "  const s = rect ? Math.min(rect.width, rect.height) : 320;\r\n",
  'utf8'
);

if (!buf1Old.includes(buf1Old)) {
  // actually check using indexOf
  const idx1 = content.indexOf(buf1Old);
  if (idx1 === -1) {
    console.error('resizeCanvases pattern not found (offsetWidth line)');
  } else {
    console.log('Found resizeCanvases at', idx1);
  }
} else {
  const idx = content.indexOf(buf1Old);
  content.copy; // no-op
}
