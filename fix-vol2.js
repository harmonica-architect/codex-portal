const fs = require('fs');

// app.js
let c = fs.readFileSync('app.js', 'utf8');
c = c.replace('vol = vol !== undefined ? vol : 0.12;', 'vol = vol !== undefined ? vol : 0.25;');
c = c.replace('function tone(f, dur = 2.5, vol = 0.12)', 'function tone(f, dur = 2.5, vol = 0.25)');
fs.writeFileSync('app.js', c);
const lines = c.split('\n');
const f1 = lines.findIndex(l => l.includes('vol !== undefined ? vol : 0.25'));
const f2 = lines.findIndex(l => l.includes('vol = 0.25'));
console.log('app.js: vol=0.25 -> line ' + (f1+1) + ', tone vol=0.25 -> line ' + (f2+1));

// matrix.js
c = fs.readFileSync('matrix.js', 'utf8');
c = c.replace('function playTone(freq, vol, dur, type) {\n  vol = vol === undefined ? 0.25 : vol;',
  'function playTone(freq, vol, dur, type) {\n  vol = vol === undefined ? 0.35 : vol;');
c = c.replace('if (vol < 0.05) vol = 0.18;', 'if (vol < 0.08) vol = 0.25;');
c = c.replace('vol = vol === undefined ? 0.2 : vol;', 'vol = vol === undefined ? 0.35 : vol;');
c = c.replace('if (gf) playTone(gf.f, 0.18, 1.5);', 'if (gf) playTone(gf.f, 0.25, 1.5);');
fs.writeFileSync('matrix.js', c);
const mlines = c.split('\n');
const m1 = mlines.findIndex(l => l.includes('vol === undefined ? 0.35'));
const m2 = mlines.findIndex(l => l.includes('vol < 0.08'));
console.log('matrix.js: vol=0.35 -> line ' + (m1+1) + ', vol<0.08 -> line ' + (m2+1));
