const fs = require('fs');
let c = fs.readFileSync('breath-controller.js', 'utf8');
// playPhaseTone: 0.03-0.08 → 0.08-0.25
c = c.replace(
  'const vol = 0.03 + (coherenceLevel / 100) * 0.05; // 0.03\u20130.08',
  'const vol = 0.08 + (coherenceLevel / 100) * 0.17; // 0.08\u201325'
);
// playTone default: 0.06 → 0.15
c = c.replace(
  'playTone(freq, vol = 0.06, dur = 1.8)',
  'playTone(freq, vol = 0.15, dur = 1.8)'
);
// glyph tone: 0.07 → 0.15
c = c.replace(
  'this.playTone(freqs[sigilIndex % freqs.length], 0.07, 1.2);',
  'this.playTone(freqs[sigilIndex % freqs.length], 0.15, 1.2);'
);
// tab tone: 0.08 → 0.18
c = c.replace(
  'this.playTone(tones[tabIndex % tones.length], 0.08, 1.4);',
  'this.playTone(tones[tabIndex % tones.length], 0.18, 1.4);'
);
fs.writeFileSync('breath-controller.js', c);
const lines = c.split('\n');
['coherenceLevel / 100) * 0.17', 'vol = 0.15', '0.15, 1.2)', '0.18, 1.4)'].forEach(chk => {
  const idx = lines.findIndex(l => l.includes(chk));
  console.log(idx >= 0 ? 'OK ' + chk : 'MISS ' + chk);
});
