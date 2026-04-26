const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');
let style = fs.readFileSync('style.css', 'utf8');
let breath = fs.readFileSync('breath-controller.js', 'utf8');
let bus = fs.readFileSync('coherence-bus.js', 'utf8');

// ── 1. breath-controller.js: call COHERENCE_BUS._syncFromBreath after cascade ──
breath = breath.replace(
  'this.cascadeListeners.forEach(fn => { try { fn(this.breathCount, this); } catch(e) { } });',
  'this.cascadeListeners.forEach(fn => { try { fn(this.breathCount, this); } catch(e) { } });\n  if (typeof COHERENCE_BUS !== "undefined") COHERENCE_BUS._syncFromBreath(this);'
);
fs.writeFileSync('breath-controller.js', breath);
console.log('1 breath-controller.js: _syncFromBreath call added');

// ── 2. coherence-bus.js: add _syncFromBreath method before subscriber registry ──
bus = bus.replace(
  '// ── Subscriber registry ──',
  `_syncFromBreath(ctrl) {\n  this.breathCount = ctrl.breathCount || this.breathCount;\n  this.totalInteractions = ctrl.totalInteractions || this.totalInteractions;\n}\n\n// ── Subscriber registry ──`
);
fs.writeFileSync('coherence-bus.js', bus);
console.log('2 coherence-bus.js: _syncFromBreath method added');

// ── 3. app.js: sync breathCount from BreathController in getJourney call ──
app = app.replace(
  'const j = COHERENCE_BUS.getJourney();\n  // Ensure breathCount',
  'const j = COHERENCE_BUS.getJourney();\n  // Ensure breathCount'
);
app = app.replace(
  'const j = COHERENCE_BUS.getJourney();',
  `const j = COHERENCE_BUS.getJourney();
  if (typeof breathCtrl !== 'undefined' && breathCtrl.breathCount) {
    j.breathCount = breathCtrl.breathCount;
    j.interactions = breathCtrl.totalInteractions || j.interactions;
  }`
);
console.log('3 app.js: breathCount sync added');

// ── 4. app.js: archetype bands in sparkline ──
const oldSparkline = `function drawCohSparkline(samples) {
  const canvas = document.getElementById('cohSparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!samples || samples.length < 2) return;

  const first = samples[0];
  const last = samples[samples.length - 1];
  const rising = last >= first;
  const strokeColor = rising ? 'rgba(232,200,106,0.75)' : 'rgba(120,110,80,0.55)';
  const fillColor = rising ? 'rgba(232,200,106,0.10)' : 'rgba(100,90,70,0.07)';

  const len = samples.length;
  const stepX = W / (len - 1);

  // Smooth line via quadratic bezier midpoints
  ctx.beginPath();
  let px = 0, py = H - (samples[0] / 100) * H;
  ctx.moveTo(px, py);
  for (let i = 1; i < len; i++) {
    const nx = i * stepX;
    const ny = H - (samples[i] / 100) * H;
    ctx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
    px = nx; py = ny;
  }
  ctx.lineTo(px, py);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fill under curve
  ctx.lineTo(px, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  }`;

const newSparkline = `function drawCohSparkline(samples) {
  const canvas = document.getElementById('cohSparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!samples || samples.length < 2) return;

  const first = samples[0];
  const last = samples[samples.length - 1];
  const rising = last >= first;
  const strokeColor = rising ? 'rgba(232,200,106,0.75)' : 'rgba(120,110,80,0.55)';
  const fillColor = rising ? 'rgba(232,200,106,0.10)' : 'rgba(100,90,70,0.07)';

  const len = samples.length;
  const stepX = W / (len - 1);

  // Smooth line via quadratic bezier midpoints
  ctx.beginPath();
  let px = 0, py = H - (samples[0] / 100) * H;
  ctx.moveTo(px, py);
  for (let i = 1; i < len; i++) {
    const nx = i * stepX;
    const ny = H - (samples[i] / 100) * H;
    ctx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
    px = nx; py = ny;
  }
  ctx.lineTo(px, py);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fill under curve
  ctx.lineTo(px, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // ── Archetype color bands from phaseLog ──
  if (typeof COHERENCE_BUS !== 'undefined' && COHERENCE_BUS.phaseLog) {
    const recent = COHERENCE_BUS.phaseLog.slice(0, 30).reverse();
    const aW = W / 30;
    const colorMap = {
      Seed: '#e8c86a', Bridge: '#b8a0d0', Axis: '#c8d0e0',
      Star: '#d0c040', Convergence: '#a0c0c0', Return: '#c0a0b0'
    };
    recent.forEach((entry, i) => {
      const arch = entry.archetype || 'Seed';
      ctx.fillStyle = colorMap[arch] || '#e8c86a';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(i * aW, H - 4, aW - 1, 4);
      ctx.globalAlpha = 1;
    });
  }
  }`;

app = app.replace(oldSparkline, newSparkline);
console.log('4 app.js: archetype bands in sparkline added');

// ── 5. app.js: coherence bar text scales with breath ──
app = app.replace(
  'if (cohVal) cohVal.style.opacity = 0.7 + breathHold() * 0.3;',
  "if (cohVal) { cohVal.style.opacity = 0.7 + breathHold() * 0.3; cohVal.style.transform = breathHold() > 0.5 ? `scale(${1 + breathHold() * 0.08})` : 'scale(1)'; cohVal.style.transition = 'opacity 0.15s, transform 0.15s'; }"
);
console.log('5 app.js: cohVal breath scale added');

// ── 6. app.js: standing wave interference at high coherence ──
// Find the interference line in drawWheel and enhance it
const interfIdx = app.indexOf('const interferenceAlpha = 0.06');
if (interfIdx > 0) {
  // Check if already enhanced
  if (!app.includes('waveR = or * 0.85')) {
    app = app.replace(
      'const interferenceAlpha = 0.06 + Math.abs(Math.sin(breathPhase * Math.PI * 2 * freq / 15));',
      `const interferenceAlpha = 0.06 + Math.abs(Math.sin(breathPhase * Math.PI * 2 * freq / 15));
  const coherenceBoost = (coherenceLevel || 0) / 100;
  if (coherenceBoost > 0.6) {
    const waveR = or * 0.85 + Math.sin(breathPhase * Math.PI * 4) * 12 * coherenceBoost;
    ctx.beginPath();
    ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
    ctx.strokeStyle = \`rgba(232,200,106,\${0.08 * coherenceBoost})\`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }`
    );
    console.log('6 app.js: standing wave interference added');
  } else {
    console.log('6 app.js: already done');
  }
}

// ── 7. style.css: axis-band enhanced glow ──
const axisBandIdx = style.indexOf('.axis-band {');
const axisBandEnd = style.indexOf('}', axisBandIdx);
const oldAxis = style.substring(axisBandIdx, axisBandEnd + 1);
const newAxis = oldAxis.replace(
  'filter: blur(calc(1.5px + (1 - var(--breath-hold, 0)) * 1px));',
  'filter: blur(calc(1.5px + (1 - var(--breath-hold, 0)) * 1px));\n  box-shadow: calc(var(--coh-glow-spread, 4) * 0.3)px 0 calc(var(--coh-glow-spread, 4) * 0.5) rgba(232,200,106,calc(var(--coh-glow-opacity, 0.15) * 0.4));'
);
style = style.replace(oldAxis, newAxis);
console.log('7 style.css: axis-band glow enhanced');

// ── 8. style.css: .coherence-ring class ──
const cohBarIdx = style.indexOf('.coh-bar {');
const newCoherenceRing = `

/* Coherence-driven ring glow — CSS var driven */
.coherence-ring {
  box-shadow: 0 0 calc(var(--coh-glow-spread, 4) * 1px) rgba(232,200,106,var(--coh-glow-opacity, 0.15));
  transition: box-shadow 0.5s ease;
}
`;
style = style.slice(0, cohBarIdx) + newCoherenceRing + style.slice(cohBarIdx);
console.log('8 style.css: .coherence-ring class added');

// ── 9. app.js: archetype glyphs in journey legend ──
app = app.replace(
  "jabb.innerHTML = `<div class=\"abb-bar\">${barHtml}</div><div class=\"abb-legend\">${Object.entries(j.archetypes).map(([a,c]) => `<span style=\"color:${archColors[a]||'var(--gold)'};font-size:0.52rem;\">${a} ${c}</span>`).join(' · ')}</div>`;",
  "const glyphMap = { Seed: '△', Bridge: '◁△▷', Axis: '◇', Star: '◎', Convergence: '⊕', Return: '◇' };\njabb.innerHTML = `<div class=\"abb-bar\">${barHtml}</div><div class=\"abb-legend\">${Object.entries(j.archetypes).map(([a,c]) => `<span style=\"color:${archColors[a]||'var(--gold)'};font-size:0.52rem;\">${glyphMap[a]||'·'} ${a} ${c}</span>`).join(' · ')}</div>`;"
);
console.log('9 app.js: archetype glyphs in legend added');

// ── 10. app.js: low-coherence noise ghosts ──
// Find the ghost harmonic block and enhance it
const ghostIdx = app.indexOf('// Ghost harmonic — subtle breathing presence');
if (ghostIdx > 0) {
  if (!app.includes('cohBoost < 0.3')) {
    app = app.replace(
      `// Ghost harmonic — subtle breathing presence
        ctx.fillStyle = night
          ? \`rgba(30,30,56,\${0.2 + bh * 0.25})\`
          : \`rgba(40,40,64,\${0.15 + bh * 0.2})\`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);
        ctx.fill();`,
      `// Ghost harmonic — subtle breathing presence
        const cohBoost = (coherenceLevel || 0) / 100;
        ctx.fillStyle = night
          ? \`rgba(30,30,56,\${0.2 + bh * 0.25})\`
          : \`rgba(40,40,64,\${0.15 + bh * 0.2})\`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);
        ctx.fill();
        // Low-coherence field noise: faint ghost flickers
        if (cohBoost < 0.3) {
          const noiseAlpha = (0.3 - cohBoost) * 0.12;
          ctx.fillStyle = night ? \`rgba(80,60,120,\${noiseAlpha})\` : \`rgba(200,160,80,\${noiseAlpha})\`;
          ctx.beginPath();
          ctx.arc(nx + (Math.random() - 0.5) * 8, ny + (Math.random() - 0.5) * 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }`
    );
    console.log('10 app.js: low-coherence noise ghosts added');
  } else {
    console.log('10 app.js: already done');
  }
}

// Write app.js
fs.writeFileSync('app.js', app);
fs.writeFileSync('style.css', style);

// Verify all changes
console.log('\n── Verification ──');
const lines = fs.readFileSync('app.js', 'utf8').split('\n');
const styleLines = fs.readFileSync('style.css', 'utf8').split('\n');
const breathLines = fs.readFileSync('breath-controller.js', 'utf8').split('\n');
const busLines = fs.readFileSync('coherence-bus.js', 'utf8').split('\n');

const checks = [
  ['app: glyphMap', lines.some(l => l.includes('glyphMap['))],
  ['app: cohVal scale', lines.some(l => l.includes("cohVal.style.transform"))],
  ['app: waveR = or * 0.85', lines.some(l => l.includes('waveR = or * 0.85'))],
  ['app: archetype bands', lines.some(l => l.includes('colorMap[arch]'))],
  ['app: noiseAlpha', lines.some(l => l.includes('noiseAlpha'))],
  ['style: .coherence-ring', styleLines.some(l => l.includes('.coherence-ring'))],
  ['style: coh-glow-spread axis', styleLines.some(l => l.includes('--coh-glow-spread'))],
  ['breath: _syncFromBreath', breathLines.some(l => l.includes('_syncFromBreath'))],
  ['bus: _syncFromBreath', busLines.some(l => l.includes('_syncFromBreath'))],
];
checks.forEach(([name, ok]) => console.log(ok ? '✅ ' + name : '❌ MISS: ' + name));
