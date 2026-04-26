const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
const lines = c.split('\n');

// 1. Expose breathCtrl globally — find the first const breathCtrl = new BreathController()
const btIdx = lines.findIndex(l => l.includes('const breathCtrl = new BreathController()'));
if (btIdx >= 0) {
  // Add window.breathCtrl right after this line
  const line = lines[btIdx];
  lines[btIdx] = line + '\nwindow.breathCtrl = breathCtrl;';
  console.log('OK window.breathCtrl exposed at line', btIdx + 1);
} else {
  console.log('MISS: const breathCtrl = new BreathController() not found');
}

// 2. Add window.coherenceLevel sync interval at the start of script
// Find first meaningful line of app.js (after comments/state)
const appStartIdx = lines.findIndex(l => !l.startsWith('//') && l.trim() !== '' && !l.startsWith('/*'));
if (appStartIdx >= 0) {
  // Insert sync interval near top of script
  lines.splice(appStartIdx, 0, '// Sync coherenceLevel to window for cross-module access\nsetInterval(() => { if (typeof coherenceLevel !== \'undefined\') window.coherenceLevel = coherenceLevel; }, 250);');
  console.log('OK sync interval added near line', appStartIdx + 1);
}

// 3. Ensure window.coherenceLevel sync on every assignment
// Add it after coherenceLevel = lines
const assignments = ['coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10);', 'coherenceLevel = Math.min(95, Math.max(0, coherenceLevel - COHERENCE.naturalDecay / 10));'];
assignments.forEach(old => {
  const idx = lines.findIndex(l => l.includes(old));
  if (idx >= 0) {
    lines[idx] = old + '\nwindow.coherenceLevel = coherenceLevel;';
    console.log('OK window.coherenceLevel sync added after', old.substring(0, 50));
  } else {
    console.log('MISS:', old.substring(0, 50));
  }
});

fs.writeFileSync('app.js', lines.join('\n'));

// Verify
const c2 = fs.readFileSync('app.js', 'utf8');
const lines2 = c2.split('\n');
const checks = ['window.breathCtrl = breathCtrl', 'window.coherenceLevel = coherenceLevel;'];
checks.forEach(chk => {
  console.log(lines2.some(l => l.includes(chk)) ? 'OK ' + chk : 'MISS ' + chk);
});