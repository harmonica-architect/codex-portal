const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

// Remove the false window.coherenceLevel = 0; line
c = c.replace("window.coherenceLevel = 0; // expose to breath-controller\n", '');

// When coherenceLevel is updated (sync bonus path), also update window.coherenceLevel
c = c.replace(
  'coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10);',
  'coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10); window.coherenceLevel = coherenceLevel;'
);

// When coherenceLevel is updated (simulation path)
c = c.replace(
  'COHERENCE.ceiling,\n      COHERENCE.virtualUserBase + virtualUsers * COHERENCE.virtualUserBoost +',
  'COHERENCE.ceiling,\n      window.coherenceLevel = COHERENCE.virtualUserBase + virtualUsers * COHERENCE.virtualUserBoost +'
);

fs.writeFileSync('app.js', c);

// Verify
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('window.coherenceLevel')) console.log('Line ' + (i + 1) + ': ' + JSON.stringify(l.trim()));
}
console.log('Done');
