const fs = require('fs');

// Show the canvas HTML attributes and CSS
const html = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.html', 'utf8');
const canvasIdx = html.indexOf('resonatorCanvas');
console.log('Canvas HTML:', html.slice(canvasIdx - 10, canvasIdx + 80));

// Show the full resizeCanvases and dims
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');
const rcIdx = buf.indexOf(Buffer.from('function resizeCanvases'));
console.log('\nresizeCanvases:', buf.slice(rcIdx, rcIdx + 500).toString('utf8'));

const dimsIdx = buf.indexOf(Buffer.from('function dims'));
console.log('\ndims():', buf.slice(dimsIdx, dimsIdx + 150).toString('utf8'));

// Check: is canvasSize set BEFORE or AFTER canvas.width in resizeCanvases?
const rcContent = buf.slice(rcIdx, rcIdx + 500).toString('utf8');
const canvasWidthLine = rcContent.split('\n').find(l => l.includes('canvas.width'));
const canvasSizeLine = rcContent.split('\n').find(l => l.includes('canvasSize'));
console.log('\nLine order in resizeCanvases:');
rcContent.split('\n').forEach((l, i) => {
  if (l.includes('canvas.') || l.includes('canvasSize')) {
    console.log(' ', i, l.trim());
  }
});
