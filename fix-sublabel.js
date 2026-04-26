const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
const lines = c.split('\n');

// Find the subLabel block start and end
const startIdx = lines.findIndex(l => l.includes('if (subLabel) {'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '}');

if (startIdx < 0 || endIdx < 0) {
  console.log('Could not find subLabel block boundaries');
  process.exit(1);
}

console.log('subLabel block: lines', startIdx + 1, 'to', endIdx + 1);

// Replace lines 92-99 with the new implementation
const newLines = [
  '  if (subLabel) {',
  '    const bh = breathHold();',
  '    const bp = Math.round(bh * 100);',
  '    const sel = selectedWheelPos;',
  '    // Breath phase + prime marker from BreathController',
  '    let breathType = \'—\';',
  '    if (typeof breathCtrl !== \'undefined\' && breathCtrl.phases && breathCtrl.phases[breathCtrl.currentPhase]) {',
  '      const phaseName = breathCtrl.phases[breathCtrl.currentPhase].name;',
  '      const wheelPos = breathCtrl.phases[breathCtrl.currentPhase].wheelPos;',
  '      const isPrime = WHEEL_CONFIG.primePositions.includes(wheelPos);',
  '      const primeMarker = isPrime ? \'\u2726\' : \'—\';',
  '      breathType = primeMarker + \' \' + phaseName;',
  '    }',
  '    const primeStatus = sel !== null',
  '      ? (WHEEL_CONFIG.primePositions.includes(sel) ? \'prime\' : isQuasiPrime(sel) ? \'quasi\' : \'comp\')',
  '      : \'—\';',
  '    subLabel.textContent = `br ${bp}% ${breathType}`;',
  '  }'
];

// Replace in-place
const result = [...lines.slice(0, startIdx), ...newLines, ...lines.slice(endIdx + 1)];
fs.writeFileSync('app.js', result.join('\n'));
console.log('Written. Verifying...');

const c2 = fs.readFileSync('app.js', 'utf8');
const l2 = c2.split('\n');
const checkLines = [92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
checkLines.forEach(i => {
  if (l2[i]) console.log(i + 1, l2[i].trim().substring(0, 80));
});
