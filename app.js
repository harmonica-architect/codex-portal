// ══════════════════════════════════════════════
// CODEX PORTAL — APP.JS
// ══════════════════════════════════════════════

// ── GLOBAL HELPERS (called from inline onclick) ──
function toggleCollapse(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── STATE ──
let userSigil = [];
let profile = null;
let currentPhase = 0;
let isRunning = false;
let cycleCount = 0;
let nightMode = false;
let glowP = 0, glowD = 1;
let animId = null;
let wheel24Rot = 0; // 24-cell rotation angle
let isShowing120Cell = localStorage.getItem('wheelGeometry') === '120'; // 120-cell toggle
let coherenceLevel = 0;
let virtualUsers = 0;
let selectedJournalGlyph = '';
let selectedCodexGlyph = '';
let cohInterval = null;

// ── WebSocket state
let ws = null;
let wsConnected = false;
let serverPhase = -1;
let globalCoherence = 0;
let inSyncCount = 0;
let totalUsers = 0;
let lastCoherenceUpdate = 0;
let coherenceUpdateTimer = null;
let glyphOverlay = { glyph: '△', show: true };
let personalTone = 432;
let toneFreq = 432;

// ── BREATH LOOP STATE ──
let breathPhase = 0;
let breathDir = 1;
let lastBreathTs = 0;
let breathRafId = null;
let rippleOrigin = null;
let ripplePhase = 0;
let rippleRafId = null;
let selectedWheelPos = null;

function breathHold() { return Math.sin(breathPhase * Math.PI); }

function breathTick(ts) {
  if (!lastBreathTs) lastBreathTs = ts;
  const dt = ts - lastBreathTs;
  breathPhase += (dt / 6000) * breathDir;
  if (breathPhase >= 1) { breathPhase = 1; breathDir = -1; }
  if (breathPhase <= 0) { breathPhase = 0; breathDir = 1; }
  lastBreathTs = ts;
  document.documentElement.style.setProperty('--breath-hold', breathHold());
  // Night mode accent breath shift
  const bh3 = breathHold();
  if (bh3 > 0.6) {
    const shift = (bh3 - 0.6) / 0.4;
    const r = Math.round(232 - shift * 112);
    const g = Math.round(200 - shift * 88);
    const b = Math.round(106 + shift * 149);
    document.documentElement.style.setProperty('--gold', `rgb(${r},${g},${b})`);
  } else {
    document.documentElement.style.setProperty('--gold', nightMode ? '#a090d0' : '#e8c86a');
  }
  updateCoherenceDisplay();
  breathRafId = requestAnimationFrame(breathTick);
}

function updateCoherenceDisplay() {
  const cohBar = document.getElementById('cohBar');
  const cohVal = document.getElementById('cohValue');
  const subLabel = document.getElementById('cohSubLabel');
  if (!cohBar || !cohVal) return;
  const pct = Math.round(coherenceLevel || 0);
  cohBar.style.width = pct + '%';
  cohVal.textContent = pct + '%';
  if (subLabel) {
    const bh = breathHold();
    const bp = Math.round(bh * 100);
    const sel = selectedWheelPos;
    const primeStatus = sel !== null
      ? (WHEEL_CONFIG.primePositions.includes(sel) ? 'prime' : isQuasiPrime(sel) ? 'quasi' : 'comp')
      : '—';
    subLabel.textContent = `br ${bp}% ${primeStatus}`;
  }
  // Coherence bar breath glow
  if (cohBar) cohBar.style.boxShadow = breathHold() > 0.5 ? `0 0 ${breathHold()*12}px rgba(232,200,106,${breathHold()*0.5})` : '';
  if (cohVal) { cohVal.style.opacity = 0.7 + breathHold() * 0.3; cohVal.style.transform = breathHold() > 0.5 ? `scale(${1 + breathHold() * 0.08})` : 'scale(1)'; cohVal.style.transition = 'opacity 0.15s, transform 0.15s'; }
  drawCoherenceRadar();
}

// ── PRIME / QUASI-PRIME HELPERS ──
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}
function isQuasiPrime(n) {
  if (WHEEL_CONFIG.primePositions.includes(n)) return false;
  if (n % 2 === 0 || n % 3 === 0) return false;
  return isPrime(n + 2) || isPrime(n - 2) || isPrime(n + 4);
}

// ── RIPPLE SELECTION ──
function startRipple(wp) {
  selectedWheelPos = wp;
  rippleOrigin = wp;
  ripplePhase = 0;
  if (rippleRafId) cancelAnimationFrame(rippleRafId);
  rippleRafId = requestAnimationFrame(rippleTick);
}
function rippleTick() {
  ripplePhase += 0.03;
  if (ripplePhase >= 1) { ripplePhase = 0; rippleOrigin = null; rippleRafId = null; return; }
  drawWheel();
  rippleRafId = requestAnimationFrame(rippleTick);
}
function onWheelClick(e) {
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - cx;
  const dy = e.clientY - rect.top - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < ir - 30 || dist > or + 30) return;
  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  const seg = Math.round((angle / (Math.PI * 2)) * WHEEL_CONFIG.segments) % WHEEL_CONFIG.segments;
  startRipple(seg);
}

// ── PRIME AXIS TRACKER RAF ──
let primeTrackerAnimId = null;

function primeTrackerRAF() {
  const canvas = document.getElementById('primeAxisTracker');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 40;
  const cy = 44;
  const size = 36;
  const pos = typeof breathCtrl !== 'undefined'
    ? breathCtrl.breathCount % 24
    : 0;
  const coh = typeof COHERENCE_BUS !== 'undefined'
    ? COHERENCE_BUS.coherenceLevel
    : 0;
  drawPrimeAxisTracker(ctx, cx, cy, size, pos, coh);
  primeTrackerAnimId = requestAnimationFrame(primeTrackerRAF);
}

function startPrimeTracker() {
  if (primeTrackerAnimId) return;
  primeTrackerRAF();
}

function stopPrimeTracker() {
  if (primeTrackerAnimId) {
    cancelAnimationFrame(primeTrackerAnimId);
    primeTrackerAnimId = null;
  }
}

// ── ANIMATION CLEANUP ──
function stopWheelAnimation() {
  if (typeof animId !== 'undefined' && animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function stopMiniWheelAnimation() {
  if (typeof miniAnimId !== 'undefined' && miniAnimId !== null) {
    cancelAnimationFrame(miniAnimId);
    miniAnimId = null;
  }
}

window.addEventListener('beforeunload', () => {
  stopWheelAnimation();
  stopMiniWheelAnimation();
});

// ── DASHBOARD ──
let miniAnimId = null;

// ── COHERENCE SPARKLINE ──
function drawCohSparkline(samples) {
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
  ctx.lineWidth = 0.75;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Subtle fill under the curve
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Tiny trend arrow
  if (rising) {
    ctx.fillStyle = 'rgba(232,200,106,0.45)';
    ctx.font = '9px sans-serif';
    ctx.fillText('\u2191', W - 10, 8);
  }

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
}

function drawCoherenceRadar() {
  const canvas = document.getElementById('cohRadar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx2 = W / 2, cy2 = H / 2, r = W / 2 - 4;

  // 4 axes: Breath, Prime, Wave, CrossDomain
  const axes = [
    { label: 'br', value: breathHold() },  // breath alignment
    { label: 'pr', value: selectedWheelPos !== null
      ? WHEEL_CONFIG.primePositions.includes(selectedWheelPos) ? 1.0
      : isQuasiPrime(selectedWheelPos) ? 0.6 : 0.2 : 0 },  // prime proximity
    { label: 'wv', value: 0.5 },  // wave coherence (placeholder)
    { label: 'cd', value: 0.4 }   // cross-domain (placeholder)
  ];
  const n = axes.length;

  // Draw axes
  ctx.strokeStyle = 'rgba(100,90,160,0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx2, cy2);
    ctx.lineTo(cx2 + r * Math.cos(angle), cy2 + r * Math.sin(angle));
    ctx.stroke();
  }

  // Draw filled polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const v = Math.max(0, Math.min(1, axes[i].value));
    const px = cx2 + r * v * Math.cos(angle);
    const py = cy2 + r * v * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,200,106,0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,200,106,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw axis labels
  ctx.fillStyle = 'rgba(180,160,220,0.7)';
  ctx.font = '5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const lx = cx2 + (r + 6) * Math.cos(angle);
    const ly = cy2 + (r + 6) * Math.sin(angle);
    ctx.fillText(axes[i].label, lx, ly);
  }
}

function initDashboard() {
  // Mini wheel animation — outer ring rotates continuously
  const mwOuter = document.getElementById('mwOuter');
  const mwMid = document.getElementById('mwMid');
  const mwInner = document.getElementById('mwInner');
  let mwAngle = 0;

  function animateMiniWheel() {
    mwAngle += 0.004;
    if (mwOuter) mwOuter.style.transform = `rotate(${mwAngle}rad)`;
    if (mwMid) mwMid.style.transform = `rotate(${-mwAngle * 1.5}rad)`;
    if (mwInner) mwInner.style.transform = `rotate(${mwAngle * 2}rad)`;
    miniAnimId = requestAnimationFrame(animateMiniWheel);
  }
  animateMiniWheel();

  // Live sync from main coherence state
  syncDashboard();
  setInterval(syncDashboard, 500);
}

function syncDashboard() {
  const cohEl = document.getElementById('dashCohValue');
  const cohBar = document.getElementById('dashCohBar');
  const fieldEl = document.getElementById('dashFieldStatus');
  const glyphEl = document.getElementById('dashGlyph');
  const breathEl = document.getElementById('dashBreath');
  const phaseNameEl = document.getElementById('dashPhaseName');
  const phaseGlyphEl = document.getElementById('dashPhaseGlyph');
  const cyclesEl = document.getElementById('dashCycles');

  if (!cohEl) return;

  const c = Math.round(coherenceLevel);
  cohEl.textContent = c;
  cohBar.style.width = c + '%';

  // Color shift: green (<40) → gold (40-70) → bright gold (>70)
  if (c < 40) {
    cohBar.style.background = 'linear-gradient(90deg,#5a7a5a,#7aaa7a)';
  } else if (c < 70) {
    cohBar.style.background = 'linear-gradient(90deg,#8a7a3a,#e8c86a)';
  } else {
    cohBar.style.background = 'linear-gradient(90deg,#c8a050,#f0d880)';
  }

  // Phase sync
  if (isRunning && PHASES[currentPhase]) {
    const p = PHASES[currentPhase];
    glyphEl.textContent = p.glyph;
    glyphEl.style.opacity = '1';
    breathEl.textContent = p.breath;
    phaseNameEl.textContent = p.name;
    phaseGlyphEl.textContent = p.glyph;
  } else {
    glyphEl.textContent = '◇';
    glyphEl.style.opacity = '0.4';
    breathEl.textContent = '—';
    phaseNameEl.textContent = 'Still';
    phaseGlyphEl.textContent = '◇';
  }

  // Cycle count
  cyclesEl.textContent = cycleCount;

  // Field status
  if (wsConnected && totalUsers > 0) {
    fieldEl.textContent = `${totalUsers} breather${totalUsers !== 1 ? 's' : ''} in field`;
    fieldEl.style.color = 'var(--axis)';
  } else {
    fieldEl.textContent = 'Local coherence';
    fieldEl.style.color = 'var(--muted)';
  }
}

function navTo(tab) {
  const t = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
  if (t) t.click();
}

function navToMatrix() {
  window.location.href = 'matrix.html';
}

function navToResonator() {
  window.location.href = 'resonator.html';
}

// ── GLYPH TONE RING ──
// Frequency map for the 12 wheel positions
const GLYPH_RING_FREQS = [
  { glyph: '△',   freq: 432.0 },
  { glyph: '◁△▷', freq: 456.9 },
  { glyph: '◇',   freq: 483.3 },
  { glyph: '⬟',   freq: 510.6 },
  { glyph: '△̅',  freq: 539.8 },
  { glyph: '⊕',   freq: 570.6 },
  { glyph: '⊗',   freq: 603.4 },
  { glyph: '◈',   freq: 637.9 },
  { glyph: '⬡',   freq: 674.0 },
  { glyph: '◧',   freq: 712.0 },
  { glyph: '◨',   freq: 752.4 },
  { glyph: '⟡',   freq: 795.0 },
];

function playGlyphTone(freq, vol) {
  vol = vol !== undefined ? vol : 0.25;
  try {
    var ctx = ac();
    if (ctx.state === 'suspended') ctx.resume();
    // Sine wave with soft ADSR: attack 50ms, decay to 0.001 over 1.5s
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.6);
  } catch (e) { }
}

function initGlyphRing() {
  var container = document.getElementById('grButtons');
  if (!container) return;
  container.innerHTML = '';
  GLYPH_RING_FREQS.forEach(function(item, idx) {
    var btn = document.createElement('button');
    btn.className = 'gr-btn';
    btn.dataset.freq = item.freq;
    btn.innerHTML = '<span>' + item.glyph + '</span><span class="gr-hz">' + item.freq.toFixed(1) + '</span>';
    btn.title = 'Play ' + item.freq.toFixed(1) + ' Hz';
    btn.addEventListener('click', function() {
      var f = parseFloat(btn.dataset.freq);
      playGlyphTone(f);
      // Visual feedback
      btn.classList.add('active');
      setTimeout(function() { btn.classList.remove('active'); }, 400);
    });
    container.appendChild(btn);
  });
}

// ── WHEEL CANVAS ──
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const cx = WHEEL_CONFIG.centerX;
const cy = WHEEL_CONFIG.centerY;
const or = WHEEL_CONFIG.outerRadius;
const ir = WHEEL_CONFIG.innerRadius;
const hr = WHEEL_CONFIG.hubRadius;

// 432Hz rotation: (432 cycles/s) / (108000ms per rotation) ≈ 0.004 rad/frame
const ROTATION_PER_FRAME = WHEEL_CONFIG.rotationSpeed;

function pAngle(i) {
  return (i / WHEEL_CONFIG.segments) * Math.PI * 2 - Math.PI / 2;
}

// Map wheelPos (0-23) → 24-cell vertex index (0-23)
// The 24-cell's 24 vertices map directly to the 24 wheel positions.
// Active vertex highlights when the breath phase's wheelPos is at that segment.
function _wheelPosTo24Vert(wheelPos) {
  return (wheelPos >= 0 && wheelPos < 24) ? wheelPos : -1;
}

function drawWheel() {
  ctx.clearRect(0, 0, WHEEL_CONFIG.canvasSize, WHEEL_CONFIG.canvasSize);
  const night = nightMode;

  // 4-Quadrant charge color sectors (QUATERNION SYMMETRY)
  const quadColors = [
    'rgba(200,70,70,0.05)',
    'rgba(210,185,50,0.04)',
    'rgba(50,185,115,0.04)',
    'rgba(75,95,225,0.05)'
  ];
  for (let q = 0; q < 4; q++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, or * 1.02, q * Math.PI / 2, (q + 1) * Math.PI / 2);
    ctx.fillStyle = quadColors[q];
    ctx.fill();
  }

  // ── 120-CELL GEOMETRY PROJECTION (rendered on top of 24-cell) ──
  if (isShowing120Cell && typeof cell120Instance !== 'undefined') {
    const scale120 = or * 0.95;
    const breathPhase = isRunning ? (Date.now() / 1000) : 0;
    cell120Instance.draw(ctx, cx, cy, scale120, breathPhase);
  }

  // ── 24-CELL GEOMETRY WIREFRAME (rendered first, as background) ──
  const activeWheelPos = (isRunning && PHASES[currentPhase]) ? PHASES[currentPhase].wheelPos : -1;
  const night24 = night ? 0.6 : 0.4; // night mode slightly brighter
  if (typeof cell24Instance !== 'undefined') {
    const scale24 = or * 0.92;
    const breathPhase = isRunning ? (Date.now() / 1000) : 0;
    const activeVert = _wheelPosTo24Vert(activeWheelPos);
    cell24Instance.draw(ctx, cx, cy, scale24, wheel24Rot * 0.4, wheel24Rot * 0.7, wheel24Rot * 0.25, breathPhase, activeVert);
  }

  // Outer glow
  const g = ctx.createRadialGradient(cx, cy, or - 25, cx, cy, or + 35);
  g.addColorStop(0, night ? 'rgba(30,30,60,0.2)' : 'rgba(80,65,45,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, or + 35, 0, Math.PI * 2);
  ctx.fill();

  // Spokes
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const a = pAngle(i);
    const pp = WHEEL_CONFIG.primePositions.includes(i);
    const act = (i === PHASES[currentPhase]?.wheelPos && isRunning);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ir, cy + Math.sin(a) * ir);
    ctx.lineTo(cx + Math.cos(a) * or, cy + Math.sin(a) * or);
    ctx.strokeStyle = act ? `rgba(232,200,106,${0.5 + glowP * 0.4})`
      : pp ? (night ? 'rgba(150,130,180,0.5)' : 'rgba(232,200,106,0.5)')
      : (night ? 'rgba(40,40,70,0.5)' : 'rgba(50,50,75,0.4)');
    ctx.lineWidth = act ? 1.5 : (pp ? 1.0 : 0.7);
    ctx.stroke();
  }

  // Harmonic fifths connections (0→7→2→9→4→11→6→1→8→3→10→5→0)
  const fifthsCycle = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = `rgba(232,200,106,${0.15 + breathHold() * 0.2})`;
  ctx.lineWidth = 0.4;
  for (let i = 0; i < fifthsCycle.length; i++) {
    const a1 = pAngle(fifthsCycle[i]);
    const a2 = pAngle(fifthsCycle[(i + 1) % fifthsCycle.length]);
    const r1 = ir + (or - ir) * 0.5;
    const r2 = ir + (or - ir) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1));
    ctx.lineTo(cx + r2 * Math.cos(a2), cy + r2 * Math.sin(a2));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Nodes + glyph overlay at prime positions
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const a = pAngle(i);
    const pp = WHEEL_CONFIG.primePositions.includes(i);
    const act = (i === PHASES[currentPhase]?.wheelPos && isRunning);
    const bh = breathHold();
    const nx = cx + Math.cos(a) * (ir - 22);
    const ny = cy + Math.sin(a) * (ir - 22);

    if (act) {
      // Active node — breathing glow
      const breatheR = 9 * (1 + bh * 0.12);
      const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, breatheR * 3);
      grd.addColorStop(0, `rgba(245,210,130,${0.85 + bh * 0.15})`);
      grd.addColorStop(0.4, `rgba(200,160,70,${0.4 * (0.5 + bh * 0.5)})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(nx, ny, breatheR * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8f0e0';
      ctx.beginPath();
      ctx.arc(nx, ny, breatheR, 0, Math.PI * 2);
      ctx.fill();
    } else if (pp) {
      // Prime node — breathing dot + glyph overlay
      const breatheR = 9 * (1 + bh * 0.12);
      const breatheAlpha = 0.7 + bh * 0.3;
      if (glyphOverlay.show && glyphOverlay.glyph) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = `rgba(${night ? '160,144,208' : '232,200,106'},${breatheAlpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyphOverlay.glyph, nx, ny);
      } else {
        ctx.fillStyle = `rgba(${night ? '150,136,176' : '232,200,106'},${breatheAlpha})`;
        ctx.beginPath();
        ctx.arc(nx, ny, breatheR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Frequency ratio label at peak breath
      if (breathHold() > 0.65) {
        const fifthsMap = {0:'1/1',7:'3/2',2:'9/8',9:'5/4',4:'4/3',11:'8/3',6:'5/3',1:'16/15',8:'9/4',3:'6/5',10:'15/8',5:'7/4'};
        const ratio = fifthsMap[i];
        if (ratio) {
          ctx.fillStyle = 'rgba(232,200,106,0.75)';
          ctx.font = '6.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ratio, cx + Math.cos(pAngle(i)) * (ir - 55), cy + Math.sin(pAngle(i)) * (ir - 55));
        }
      }
    } else {
      // Non-prime — check quasi-prime or ghost
      const isQP = isQuasiPrime(i);
      if (isQP) {
        // Quasi-prime — subtle breathing presence
        const qpAlpha = 0.08 + bh * 0.32;
        ctx.fillStyle = night ? `rgba(130,100,190,${qpAlpha})` : `rgba(110,85,170,${qpAlpha})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.8 * (1 + bh * 0.18), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ghost harmonic — subtle breathing presence
        const cohBoost = (coherenceLevel || 0) / 100;
        ctx.fillStyle = night
          ? `rgba(30,30,56,${0.2 + bh * 0.25})`
          : `rgba(40,40,64,${0.15 + bh * 0.2})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);
        ctx.fill();
        // Low-coherence field noise
        if (cohBoost < 0.3) {
          const noiseAlpha = (0.3 - cohBoost) * 0.12;
          ctx.fillStyle = night ? `rgba(80,60,120,${noiseAlpha})` : `rgba(200,160,80,${noiseAlpha})`;
          ctx.beginPath();
          ctx.arc(nx + (Math.random() - 0.5) * 8, ny + (Math.random() - 0.5) * 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Prime labels
  ctx.font = '8.5px sans-serif';
  ctx.fillStyle = night ? '#7060a0' : '#a08860';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    if (WHEEL_CONFIG.primePositions.includes(i)) {
      const a = pAngle(i);
      const labelIdx = WHEEL_CONFIG.primePositions.indexOf(i);
      ctx.fillText(WHEEL_CONFIG.primeLabels[labelIdx], cx + Math.cos(a) * (ir - 42), cy + Math.sin(a) * (ir - 42));
    }
  }

  // Active arc
  if (isRunning && PHASES[currentPhase]) {
    const a = pAngle(PHASES[currentPhase].wheelPos);
    ctx.beginPath();
    ctx.arc(cx, cy, ir + 12, a - 0.18, a + 0.18);
    ctx.strokeStyle = `rgba(232,200,106,${0.65 + breathHold() * 0.35})`;
    ctx.lineWidth = 4 + breathHold() * 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Center
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr * 2.5);
  hg.addColorStop(0, night ? 'rgba(80,70,120,0.3)' : 'rgba(160,140,100,0.25)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, hr * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night ? '#3a3060' : '#4a3a2a';
  ctx.beginPath();
  ctx.arc(cx, cy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night ? '#a090d0' : '#c8b888';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⊙', cx, cy);

  // Golden ratio spiral overlay
  const PHI = 1.6180339887;
  ctx.save();
  ctx.strokeStyle = `rgba(232,200,106,${0.08 + breathHold() * 0.18})`;
  ctx.lineWidth = 0.4 + breathHold() * 0.9;
  ctx.beginPath();
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const t = i / WHEEL_CONFIG.segments;
    const r = ir + (or - ir) * t;
    const spiralAngle = pAngle(i) + t * 0.618 * Math.PI;
    const sx = cx + r * Math.cos(spiralAngle);
    const sy = cy + r * Math.sin(spiralAngle);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();

  // Selection ripple wave
  if (rippleOrigin != null && ripplePhase > 0 && ripplePhase < 1) {
    const angle = pAngle(rippleOrigin);
    const rippleR = ripplePhase * (or - ir - 20);
    const alpha = (1 - ripplePhase) * 0.6;
    const rx = cx + (ir + 20 + rippleR / 2) * Math.cos(angle);
    const ry = cy + (ir + 20 + rippleR / 2) * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(rx, ry, 10 + ripplePhase * 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232,200,106,${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Selected wheel position breathing highlight
  if (selectedWheelPos != null) {
    const angle = pAngle(selectedWheelPos);
    const sx = cx + (ir - 22) * Math.cos(angle);
    const sy = cy + (ir - 22) * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + breathHold() * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // T13: Zero-variance station markers — concentric ring at station positions
  if (typeof ZV_STATIONS !== 'undefined' && ZV_STATIONS.length > 0) {
    for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
      const station = ZV_STATIONS.find(s => s.matAddr === i);
      if (station) {
        const angle = pAngle(i);
        const sx = cx + (ir - 22) * Math.cos(angle);
        const sy = cy + (ir - 22) * Math.sin(angle);
        const bh = breathHold();
        ctx.beginPath();
        ctx.arc(sx, sy, 12 + bh * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,160,255,${0.3 + bh * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, 16 + bh * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,160,255,${0.15 + bh * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // T14: Interference lines — positions in same zeta residue class connect
  if (typeof ZV_STATIONS !== 'undefined' && ZV_STATIONS.length > 1) {
    for (let i = 0; i < ZV_STATIONS.length; i++) {
      for (let j = i + 1; j < ZV_STATIONS.length; j++) {
        const a1 = ZV_STATIONS[i].matAddr % 30;
        const a2 = ZV_STATIONS[j].matAddr % 30;
        if (a1 === a2) {
          const wp1 = ZV_STATIONS[i].matAddr % 24;
          const wp2 = ZV_STATIONS[j].matAddr % 24;
          const ang1 = pAngle(wp1);
          const ang2 = pAngle(wp2);
          const r1 = ir + (or - ir) * 0.5;
          const r2 = ir + (or - ir) * 0.5;
          const x1 = cx + r1 * Math.cos(ang1);
          const y1 = cy + r1 * Math.sin(ang1);
          const x2 = cx + r2 * Math.cos(ang2);
          const y2 = cy + r2 * Math.sin(ang2);
          const freq = (a1 + a2) / 2;
          const interferenceAlpha = 0.06 + Math.abs(Math.sin(breathPhase * Math.PI * 2 * freq / 15)) * 0.12;
  const coherenceBoost = (coherenceLevel || 0) / 100;
  if (coherenceBoost > 0.6) {
    const waveR = or * 0.85 + Math.sin(breathPhase * Math.PI * 4) * 12 * coherenceBoost;
    ctx.beginPath();
    ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232,200,106,${0.08 * coherenceBoost})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(180,140,255,${interferenceAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }

  // T16: Digital root tint per wheel segment — subtle color wash
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const a = pAngle(i);
    const nx = cx + Math.cos(a) * (ir - 22);
    const ny = cy + Math.sin(a) * (ir - 22);
    const dr = 1 + ((i - 1) % 9);
    const drGlow = [
      '',
      'rgba(200,60,60,0.03)',
      'rgba(200,120,60,0.03)',
      'rgba(220,160,60,0.025)',
      'rgba(200,200,80,0.02)',
      'rgba(100,200,100,0.02)',
      'rgba(60,180,180,0.025)',
      'rgba(80,120,220,0.025)',
      'rgba(120,80,200,0.03)'
    ];
    ctx.fillStyle = drGlow[dr];
    ctx.beginPath();
    ctx.arc(nx, ny, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // T20: Prime density tick marks — count primes within ±5 positions
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const pp = WHEEL_CONFIG.primePositions.includes(i);
    const act = (i === PHASES[currentPhase]?.wheelPos && isRunning);
    if (act) continue; // skip active node
    const primeNeighbors = WHEEL_CONFIG.primePositions.filter(p => {
      const diff = Math.abs(p - i);
      return Math.min(diff, 24 - diff) <= 5;
    }).length;
    if (primeNeighbors > 0) {
      const tickR = pp ? 12 : 8;
      for (let t = 0; t < Math.min(primeNeighbors, 6); t++) {
        const ta = pAngle(i) + (t - primeNeighbors / 2) * 0.15;
        ctx.beginPath();
        ctx.moveTo(cx + (ir - 22 - 2) * Math.cos(pAngle(i)), cy + (ir - 22 - 2) * Math.sin(pAngle(i)));
        ctx.lineTo(cx + (ir - 22 - tickR) * Math.cos(ta), cy + (ir - 22 - tickR) * Math.sin(ta));
        ctx.strokeStyle = pp ? `rgba(232,200,106,${0.4 + breathHold() * 0.3})` : `rgba(150,130,200,${0.2 + breathHold() * 0.2})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }
}

function animateWheel() {
  breathTick(performance.now()); // advance breath phase
  glowP += WHEEL_CONFIG.glowSpeed * glowD;
  if (glowP >= 1) { glowP = 1; glowD = -1; }
  if (glowP <= 0) { glowP = 0; glowD = 1; }
  // Advance 24-cell rotation continuously
  // 24-cell rotation driven by coherence — Codex harmonic principle:
  // Low coherence = turbulent fast rotation (n=2.0)
  // High coherence = stable slow precession (n=0.2)
  // Rotation speed = ROTATION_PER_FRAME × (2.0 − 1.8 × coh/100)
  const cohNorm = Math.max(0, Math.min(100, coherenceLevel || 0)) / 100;
  const rotationSpeedMult = 2.0 - cohNorm * 1.8;
  wheel24Rot += ROTATION_PER_FRAME * 0.6 * rotationSpeedMult;
  drawWheel();
  animId = requestAnimationFrame(animateWheel);
  if (breathRafId) cancelAnimationFrame(breathRafId);
  breathRafId = requestAnimationFrame(breathTick);
}

// ── WEBSOCKET — MULTI-USER COHERENCE ──
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(WS_CONFIG.serverUrl);

    ws.onopen = () => {
      wsConnected = true;
      updateFieldStatus('Field connected — ' + totalUsers + ' breather' + (totalUsers !== 1 ? 's' : '') + ' in field');
      updateConnBox();
      // Send registration
      sendWS({ type: 'join', sigil: userSigil.join(''), coherence: 0, phase: currentPhase });
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleWSMessage(msg);
      } catch (e) { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      wsConnected = false;
      updateFieldStatus('Field disconnected — reconnecting...');
      setTimeout(connectWebSocket, WS_CONFIG.reconnectInterval);
    };

    ws.onerror = () => {
      wsConnected = false;
    };
  } catch (e) {
    setTimeout(connectWebSocket, WS_CONFIG.reconnectInterval);
  }
}

function handleWSMessage(msg) {
  switch (msg.type) {
    case 'field_state':
      serverPhase = Math.max(0, Math.min(5, msg.phase ?? 0));
      globalCoherence = Math.max(0, Math.min(100, msg.globalCoherence ?? 0));
      totalUsers = Math.max(0, Math.min(10000, msg.userCount ?? 0));
      inSyncCount = Math.max(0, Math.min(totalUsers, msg.inSyncCount ?? 0));
      updateFieldStatus(
        totalUsers > 0
          ? `${totalUsers} breather${totalUsers !== 1 ? 's' : ''} in field | ${inSyncCount} in phase | field coherence ${Math.round(globalCoherence)}%`
          : 'Waiting for field connection...'
      );
      // Apply server phase sync bonus to local display
      if (serverPhase === currentPhase && isRunning) {
        coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10); window.coherenceLevel = coherenceLevel;
      }
      break;

    case 'users_count':
      totalUsers = msg.count || 0;
      break;
  }
}

function sendWS(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function updateConnBox() {
  const dot = document.getElementById('connDot');
  const count = document.getElementById('connCount');
  const sync = document.getElementById('connSync');
  if (!dot || !count) return;

  if (wsConnected && totalUsers > 0) {
    dot.className = 'conn-dot connected';
    count.textContent = totalUsers;
    sync.textContent = inSyncCount > 0 ? `· ${inSyncCount} sync` : '';
  } else if (wsConnected) {
    dot.className = 'conn-dot connected';
    count.textContent = '1';
    sync.textContent = '';
  } else {
    dot.className = 'conn-dot disconnected';
    count.textContent = '—';
    sync.textContent = '';
  }
}

function updateFieldStatus(text) {
  const el = document.getElementById('fieldStatus');
  if (el) el.textContent = text;
  updateConnBox();
}

function startCoherenceUpdates() {
  if (coherenceUpdateTimer) clearInterval(coherenceUpdateTimer);
  coherenceUpdateTimer = setInterval(() => {
    if (wsConnected && isRunning) {
      sendWS({
        type: 'coherence_update',
        sigil: userSigil.join(''),
        coherence: Math.round(coherenceLevel),
        phase: currentPhase
      });
    }
  }, WS_CONFIG.coherenceUpdateInterval);
}

function stopCoherenceUpdates() {
  if (coherenceUpdateTimer) {
    clearInterval(coherenceUpdateTimer);
    coherenceUpdateTimer = null;
  }
}

// ── AUDIO ──
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(f, dur = 2.5, vol = 0.25) {
  try {
    const ctx = ac();
    // Fundamental + octave
    [[f, vol * 0.7], [f * 2, vol * 0.3]].forEach(([ff, vv]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = ff;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vv, ctx.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    });
  } catch (e) { }
}

// Personalized tone — use user's selected frequency
function playPersonalizedTone(f, dur = 2.5, vol = 0.12) {
  try {
    const ctx = ac();
    const freq = f || toneFreq;
    // User's chosen tone + harmonic
    [[freq, vol * 0.8], [freq * 2, vol * 0.2]].forEach(([ff, vv]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = ff;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vv, ctx.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    });
  } catch (e) { }
}

function playPhase(n) {
  // Use personalized tone if set, otherwise phase frequency
  const freq = (toneFreq !== 432) ? toneFreq : PHASES[n].frequency;
  playPersonalizedTone(freq, 2.5, 0.13);
}

function playComplete() {
  const freqs = [528, 639, 741];
  freqs.forEach((f, i) => setTimeout(() => tone(f, 3.5 - i * 0.3, 0.10), i * 500));
}

// ── COHERENCE SIMULATION ──
function updateCoherence() {
  if (!profile) return;

  if (isRunning) {
    virtualUsers = Math.min(5, virtualUsers + (virtualUsers < 1 ? 1 : Math.random() > 0.7 ? 1 : 0));
    coherenceLevel = window.coherenceLevel = Math.min(
      COHERENCE.ceiling,
      COHERENCE.virtualUserBase + virtualUsers * COHERENCE.virtualUserBoost +
      Math.sin(Date.now() / 2000) * COHERENCE.waveAmplitude
    );
  } else {
    virtualUsers = Math.max(0, virtualUsers - (Math.random() > 0.5 ? 1 : 0));
    coherenceLevel = Math.max(COHERENCE.floor, coherenceLevel - COHERENCE.decayRate);
  }

  document.getElementById('cohBar').style.width = coherenceLevel + '%';
  document.getElementById('cohValue').textContent = Math.round(coherenceLevel) + '%';

  // Sparkline from COHERENCE_BUS rolling history
  if (typeof COHERENCE_BUS !== 'undefined' && COHERENCE_BUS.coherenceHistory && COHERENCE_BUS.coherenceHistory.length > 1) {
    drawCohSparkline(COHERENCE_BUS.coherenceHistory.slice(-30));
  }

  // User dots
  const dots = document.getElementById('userDots');
  const colors = ['#e8c86a', '#a090d0', '#90b0c0', '#b0a080', '#80b090'];
  dots.innerHTML = '';
  for (let v = 0; v < virtualUsers; v++) {
    const d = document.createElement('div');
    d.className = 'user-dot';
    d.style.background = colors[v % colors.length];
    d.title = 'Anonymous breather ' + ANON_NAMES[v % ANON_NAMES.length];
    dots.appendChild(d);
  }

  // Anon users display
  const anonEl = document.getElementById('anonUsers');
  anonEl.innerHTML = '';
  for (let v = 0; v < virtualUsers; v++) {
    const s = document.createElement('span');
    s.className = 'anon-user';
    s.textContent = ANON_NAMES[v % ANON_NAMES.length];
    anonEl.appendChild(s);
  }
}

// ── 5D AXIS MESSAGE ──
let axisMsgIndex = 0;
function showAxisMessage() {
  const el = document.getElementById('axisMessage');
  el.textContent = AXIS_MESSAGES[axisMsgIndex % AXIS_MESSAGES.length];
  el.classList.add('visible');
  axisMsgIndex++;
  setTimeout(() => el.classList.remove('visible'), 4000);
}

// ── PHASE MANAGEMENT ──
let phaseTimer = null;

function advancePhase() {
  playPhase(currentPhase);
  if (currentPhase < PHASES.length - 1) {
    currentPhase++;
    updatePhaseUI();
    schedulePhase();
  } else {
    endCycle();
  }
}

function updatePhaseUI() {
  const p = PHASES[currentPhase];
  document.getElementById('phaseNum').textContent = `PHASE ${currentPhase + 1} OF 6`;
  document.getElementById('phaseName').textContent = `${p.breath} — ${p.name}`;
  const gb = document.getElementById('glyphBig');
  gb.textContent = p.glyph;
  gb.classList.remove('pulse');
  void gb.offsetWidth;
  gb.classList.add('pulse');
  document.getElementById('instruction').innerHTML = p.instruction;
}

function schedulePhase() {
  clearTimeout(phaseTimer);
  const delays = [4000, 4000, 4000, 4000, 4000, 4000];
  phaseTimer = setTimeout(advancePhase, delays[currentPhase]);
}

// ── CYCLE MANAGEMENT ──
function startCycle() {
  if (!profile) return;
  isRunning = true;
  currentPhase = 0;
  document.getElementById('btnStart').style.display = 'none';
  document.getElementById('btnRepeat').style.display = 'inline-block';
  document.getElementById('btnNight').style.display = 'none';
  document.getElementById('nightIndicator').textContent = '';
  updatePhaseUI();
  playPhase(0);
  schedulePhase();
  if (cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 300);
  startCoherenceUpdates();
  connectWebSocket();
}

function endCycle() {
  isRunning = false;
  clearTimeout(phaseTimer);
  document.getElementById('btnStart').style.display = 'inline-block';
  document.getElementById('btnRepeat').style.display = 'none';
  document.getElementById('btnNight').style.display = 'inline-block';
  cycleCount++;
  if (profile) {
    profile.cycles = (profile.cycles || 0) + 1;
    saveProfile();
  }
  playComplete();
  setTimeout(showAxisMessage, 800);
  stopCoherenceUpdates();
}

function repeatCycle() {
  currentPhase = 0;
  updatePhaseUI();
  isRunning = true;
  playPhase(0);
  schedulePhase();
  startCoherenceUpdates();
}

// ── NIGHT MODE ──
function checkNight() {
  const h = new Date().getHours();
  return h >= NIGHT_MODE.startHour || h < NIGHT_MODE.endHour;
}

function applyNight() {
  nightMode = checkNight();
  const ind = document.getElementById('nightIndicator');
  if (nightMode) {
    ind.textContent = 'Night mode — violet field';
    document.documentElement.style.setProperty('--bg', NIGHT_MODE.nightBg);
    document.documentElement.style.setProperty('--surface', '#0e0e1a');
    document.documentElement.style.setProperty('--gold', NIGHT_MODE.nightGold);
    document.documentElement.style.setProperty('--axis', NIGHT_MODE.nightAxis);
    document.documentElement.style.setProperty('--breath-ring-color', 'rgba(160,120,60,0.5)');
    document.getElementById('btnNight').classList.add('active-btn');
  } else {
    ind.textContent = 'Day mode — gold field';
    document.documentElement.style.setProperty('--bg', NIGHT_MODE.dayBg);
    document.documentElement.style.setProperty('--surface', '#0e0e1a');
    document.documentElement.style.setProperty('--gold', NIGHT_MODE.dayGold);
    document.documentElement.style.setProperty('--axis', NIGHT_MODE.dayAxis);
    document.documentElement.style.setProperty('--breath-ring-color', 'rgba(232,200,106,0.8)');
    document.getElementById('btnNight').classList.remove('active-btn');
  }
}

// ── LOGIN ──
function initLogin() {
  const gs = document.querySelectorAll('.login-g');
  gs.forEach(b => {
    b.classList.remove('selected', 'chosen');
    b.addEventListener('click', () => {
      if (b.classList.contains('chosen')) {
        b.classList.remove('chosen');
        userSigil = userSigil.filter(g => g !== b.dataset.g);
      } else if (userSigil.length < 3) {
        b.classList.add('chosen');
        userSigil.push(b.dataset.g);
      }
      gs.forEach(g => g.classList.toggle('selected', userSigil.includes(g.dataset.g)));
    });
  });

  document.getElementById('loginBtn').onclick = () => {
    if (userSigil.length !== 3) {
      document.getElementById('loginError').style.display = 'block';
      return;
    }
    document.getElementById('loginError').style.display = 'none';
    profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile + ':' + userSigil.join('')) || 'null') || {
      sigil: [...userSigil],
      cycles: 0,
      sigils: [],
      journal: []
    };
    saveProfile();
    enterPortal();
  };

  document.getElementById('loginNew').onclick = () => {
    userSigil = [];
    gs.forEach(b => b.classList.remove('selected', 'chosen'));
    document.getElementById('loginHint').innerHTML = 'Create your unique sigil.<br>Choose 3 glyphs that resonate.';
  };
}

// ── MOBILE NAV DRAWER ──
function initMobileNavDrawer() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  drawer.classList.add('visible');

  // Breath-phase-aware animation: exhale opens fast (receptive), inhale closes fast (contracting)
  if (typeof cell24Instance !== 'undefined') {
    breathCtrl.onPhaseChange((phase, phaseIdx) => {
      if (phase.name === 'exhale' || phase.name === 'hold') {
        drawer.style.transition = 'opacity 0.15s ease-out, transform 0.2s ease-out';
      } else if (phase.name === 'inhale') {
        drawer.style.transition = 'opacity 0.3s ease-in, transform 0.4s ease-in';
      }
    });
  }

  drawer.querySelectorAll('.mnd-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      const navTab = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
      if (navTab) {
        navTab.click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (window.matchMedia('(min-width: 600px)').matches) {
        drawer.classList.remove('visible');
      }
    });
  });
  drawer.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
}

function updateMobileNavState() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  // Sync active drawer item to the actual active tab content (not the hidden nav-tab bar)
  const activeTab = document.querySelector('.tab-content.active')?.id?.replace('tab-', '') || 'home';
  drawer.querySelectorAll('.mnd-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === activeTab);
  });
}

function enterPortal() {
  document.getElementById('loginScreen').classList.add('hide');
  document.getElementById('portal').style.display = 'flex';
  localStorage.setItem(STORAGE_KEYS.lastSigil, userSigil.join(''));
  // Sync sigil to shared state
  updateState({ sigil: [...userSigil] });
  animateWheel();
  if (cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 600);
  // Auto-coherence journal logging
  let lastCohLog = null;
  const cohLogInterval = setInterval(() => {
    if (typeof COHERENCE_BUS === 'undefined' || !profile) return;
    const coh = COHERENCE_BUS.coherenceLevel || 0;
    // Log high-coherence moment (>80, not already logged)
    if (coh > 80 && lastCohLog !== 'high') {
      if (!profile.journal) profile.journal = [];
      profile.journal.push({ glyph: '✦', text: '↑ Field coherence peak: ' + coh + '%', ts: Date.now(), matAddr: journalGlyphToMatAddr('✦') });
      saveProfile();
      lastCohLog = 'high';
      // P9 — flash Journal drawer item on peak
      const journalBtn = document.querySelector('.mnd-item[data-tab="journal"]');
      if (journalBtn) {
        journalBtn.classList.add('peak-glow');
        setTimeout(() => journalBtn.classList.remove('peak-glow'), 2000);
      }
    } else if (coh < 30 && lastCohLog !== 'low') {
      if (!profile.journal) profile.journal = [];
      profile.journal.push({ glyph: '·', text: '↓ Field friction: ' + coh + '%', ts: Date.now(), matAddr: journalGlyphToMatAddr('·') });
      saveProfile();
      lastCohLog = 'low';
    } else if (coh >= 30 && coh <= 80) {
      lastCohLog = null; // Reset when back in neutral zone
    }
  }, 8000); // Check every 8 seconds
  checkNight();
  initNavTabs();
  initCodex();
  initJournal();
  initProfile();
  initGlyphOverlay();
  initTonePanel();
  // Restore active tab from sigil nav navigation (profile, codex, dream, journal)
  const pendingTab = localStorage.getItem('pendingTab');
  if (pendingTab) {
    localStorage.removeItem('pendingTab');
    const tab = document.querySelector('.nav-tab[data-tab="' + pendingTab + '"]');
    if (tab) {
      setTimeout(() => tab.click(), 80);
    }
  }
  // ── Glyph Linker ──
  initGlyphLinker();

  // ── Mirror Mode ──
  initMirrorMode();

  // ── Mobile Nav Drawer ──
  initMobileNavDrawer();
  updateMobileNavState();

  // ── Audio autoplay policy: resume audio context on first user interaction ──
  document.addEventListener('click', () => {
    if (typeof breathCtrl !== 'undefined' && breathCtrl.audioCtx && breathCtrl.audioCtx.state === 'suspended') {
      breathCtrl.audioCtx.resume();
    }
  }, { once: true });

  // Sync mute button state from localStorage on load
  if (typeof cell24Instance !== 'undefined') {
    const btn = document.getElementById('audioMuteBtn');
    if (btn) {
      btn.classList.toggle('muted', breathCtrl.audioMuted);
      btn.textContent = breathCtrl.audioMuted ? '⊘' : '♩';
      btn.title = breathCtrl.audioMuted ? 'Unmute breath tones' : 'Mute breath tones';
    }
  }

  // ── Sigil Navigator (desktop orbit nav) ──
  initSigilNav();

  // Breath ring dots on home tab — click to navigate
  document.querySelectorAll('.br-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.idx);
      navigateToSigil(idx);
    });
  });

  // Sync sigil nav + coherence bus with dashboard state
  setInterval(() => {
    setSigilNavCoherence(coherenceLevel, globalCoherence);
    COHERENCE_BUS.updateCoherence(coherenceLevel);
    // Drive hub pulse class
    const hub = document.getElementById('snHub');
    if (hub) {
      const coh = (coherenceLevel + globalCoherence) / 2;
      hub.classList.toggle('coh-pulse', coh > 70);
      hub.classList.toggle('breath-active', isRunning);
    }
    // Update journey display
    refreshJourneyDisplay();
  }, 500);

  // ── BREATH PHASE SUBSCRIPTIONS — bus drives all UI ──
  onBreathPhase(({ phase, phaseIdx, archetype, prompt, bt, ctrl }) => {
    // Breath prompt strip
    const bpsGlyph = document.getElementById('bpsGlyph');
    const bpsText = document.getElementById('bpsText');
    const bpsArchetype = document.getElementById('bpsArchetype');
    if (bpsGlyph) bpsGlyph.textContent = phase.glyph;
    if (bpsText) bpsText.textContent = prompt;
    if (bpsArchetype) bpsArchetype.textContent = archetype;

    // Breath prompt strip animation — fades between phases
    const bps = document.getElementById('breathPromptStrip');
    if (bps) {
      bps.classList.remove('prompt-inhale', 'prompt-hold', 'prompt-exhale', 'prompt-still');
      void bps.offsetWidth; // reflow
      bps.classList.add('prompt-' + bt);
    }

    // Archetype ring — highlight active phase node
    const arNodes = document.querySelectorAll('.ar-node');
    arNodes.forEach((n, i) => {
      n.classList.toggle('ar-active', i === phaseIdx);
    });

    // Breath ring (home tab) — highlight active dot by phase index
    const brDots = document.querySelectorAll('.br-dot');
    brDots.forEach((d, i) => {
      d.classList.toggle('active', i === phaseIdx);
    });
    // Update breath ring hub with phase glyph
    const brHub = document.getElementById('brHub');
    if (brHub) brHub.textContent = phase.glyph;

    // Sigil nav dots — update breath-glow class
    const dots = document.querySelectorAll('.sn-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('glow-breathe', ctrl.isInhale() && i === sigilNav.activeIndex);
    });

    // Dash phase badge — update with breath glyph
    const dpg = document.getElementById('dashPhaseGlyph');
    const dpb = document.getElementById('dashBreath');
    const dpn = document.getElementById('dashPhaseName');
    if (dpg) dpg.textContent = phase.glyph;
    if (dpb) dpb.textContent = phase.name;
    if (dpn) dpn.textContent = archetype;

    // Breath phase on sigil nav hub (override tab label with phase glyph)
    const snhg = document.getElementById('snHubGlyph');
    if (snhg && !sigilNav.isTransitioning) snhg.textContent = phase.glyph;
  });

  // Archetype ring click → jump to that breath context
  document.querySelectorAll('.ar-node').forEach(node => {
    node.addEventListener('click', () => {
      const arch = node.dataset.archetype;
      const glyph = node.dataset.glyph;
      COHERENCE_BUS.logInteraction('archetypeClick', { archetype: arch, glyph });
      // Navigate to wheel tab
      navigateToSigil(1);
      // Play archetype tone
      if (typeof breathCtrl !== 'undefined') breathCtrl.playTone(432 + sigilNav.activeIndex * 27, 0.08, 1.5);
    });
  });

  initGlyphRing();
  initDashboard();

  // ── COMMUNITY FIELD TOKEN INIT + AUTO-WRITE SETUP ──
  // Load stored GitHub token if present
  const storedToken = (() => {
    try { return localStorage.getItem('codex_gh_token'); } catch { return null; }
  })();
  if (storedToken && typeof COMMUNITY_FIELD !== 'undefined') {
    COMMUNITY_FIELD.TOKEN = storedToken;
  }

  // Setup token input UI
  const tokenInput = document.getElementById('csTokenInput');
  const tokenBtn = document.getElementById('csTokenBtn');
  if (tokenInput && tokenBtn && typeof COMMUNITY_FIELD !== 'undefined') {
    // Pre-fill if token already stored
    if (storedToken) tokenInput.value = '••••••••';

    tokenBtn.addEventListener('click', () => {
      const raw = tokenInput.value.trim();
      if (!raw || raw === '••••••••') return;
      COMMUNITY_FIELD.TOKEN = raw;
      // ⚠️ SECURITY NOTE: Token stored in plain localStorage — accessible to any script on this origin.
      // For production, use a backend proxy to hold the token server-side.
      try { localStorage.setItem('codex_gh_token', raw); } catch {}
      tokenInput.value = '••••••••';
      tokenInput.title = 'Token saved in localStorage (your own token — not shared)'
      // Trigger a fresh field read with the token
      COMMUNITY_FIELD._readField();
    });

    tokenInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') tokenBtn.click();
    });
  }

  // Periodically sync community status
  setInterval(updateCommunityStatus, 5000);
  // ── BREATH GLYPH LINKER ──
  function initGlyphLinker() {
    const glyphBtns = document.querySelectorAll('.gls-btn');
    glyphBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const g = btn.dataset.g;
        glyphBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        glyphLinker.activate(g);
        document.getElementById('btnStopGlyphLinker').style.display = 'inline-block';
      });
    });

    document.getElementById('btnStopGlyphLinker').addEventListener('click', () => {
      glyphLinker.deactivate();
      glyphBtns.forEach(b => b.classList.remove('active'));
      document.getElementById('btnStopGlyphLinker').style.display = 'none';
      document.getElementById('glssGlyph').textContent = '◇';
      document.getElementById('glssStep').textContent = 'Sequence stopped';
      document.getElementById('glssPos').textContent = '';
      document.getElementById('glyphLinkerInterpretation').textContent = '';
      document.getElementById('glyphLinkerInterpretation').classList.remove('visible');
    });

    // Listen to glyph linker steps
    glyphLinker.onStep((payload) => {
      if (!payload.isActive) return;
      // Update status display
      document.getElementById('glssGlyph').textContent = payload.glyph;
      document.getElementById('glssStep').textContent = payload.breath + ' · pos ' + payload.pos + '/23';
      document.getElementById('glssPos').textContent = '↑ ' + payload.resonanceGlyph + ' near prime ' + payload.nearestPrime;
      const interpEl = document.getElementById('glyphLinkerInterpretation');
      interpEl.textContent = payload.text;
      interpEl.classList.add('visible');
      // Update breath sequence panel
      const bsp = document.getElementById('breathSequencePanel');
      if (bsp) bsp.style.display = 'block';
      document.getElementById('bspGlyph').textContent = payload.glyph;
      document.getElementById('bspProgressFill').style.width = ((payload.stepIndex / 23) * 100) + '%';
      document.getElementById('bspStepText').textContent = payload.text;
      // Play step tone
      glyphLinker.playStepTone(payload.freq);
      // Also update the wheel glyph big display when on wheel tab
      const glyphBig = document.getElementById('glyphBig');
      if (glyphBig) glyphBig.textContent = payload.glyph;
      // Update phase display if visible
      const phaseNum = document.getElementById('phaseNum');
      if (phaseNum) phaseNum.textContent = 'STEP ' + (payload.stepIndex + 1) + ' OF 24';
      const phaseName = document.getElementById('phaseName');
      if (phaseName) phaseName.textContent = payload.breath.charAt(0).toUpperCase() + payload.breath.slice(1) + ' — ' + payload.glyph;
      const instruction = document.getElementById('instruction');
      if (instruction) instruction.textContent = payload.text;
    });
  }

  // ── MIRROR MODE ──
  function initMirrorMode() {
    const inputEl = document.getElementById('mirrorInput');
    const outputEl = document.getElementById('mirrorOutput');
    const glyphEl = document.getElementById('mirrorGlyphDisplay');
    const strengthEl = document.getElementById('mirrorStrength');
    const historyEl = document.getElementById('mirrorHistoryList');
    const matAddrEl = document.getElementById('mataddrPos');
    const matAddrFreqEl = document.getElementById('mataddrFreq');
    const matAddrVFEl = document.getElementById('mataddrVF');
    const matAddrResEl = document.getElementById('mataddrResInfo');

    mirrorMode.mount(inputEl, outputEl, glyphEl, strengthEl, historyEl,
      matAddrEl, matAddrFreqEl, matAddrVFEl, matAddrResEl);

    // Start the 24-cell projection RAF loop + tab watcher
    initMirror24CellTabWatcher();

    // Submit on button click
    document.getElementById('mirrorSubmit').addEventListener('click', () => {
      const val = inputEl.value.trim();
      if (!val) return;
      // Detect input type
      const freq = parseFloat(val);
      let inputType = 'text';
      if (!isNaN(freq) && freq > 20 && freq < 2000) inputType = 'frequency';
      else if (['inhale', 'hold', 'exhale', 'still'].includes(val.toLowerCase())) inputType = 'breath';
      else if (GLYPHS.some(g => g.glyph === val)) inputType = 'glyph';
      const result = mirrorMode.reflectInput(val, inputType);
      if (typeof COHERENCE_BUS !== 'undefined' && result) {
        COHERENCE_BUS.logMirror(result);
      }
      // Update 24-cell highlight vertex to match mirror wheelPos
      updateMirror24CellHighlight(result?.wheelPos ?? -1);
      inputEl.value = '';
    });

    // Submit on Enter
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('mirrorSubmit').click();
      }
    });
  }

  document.getElementById('btnOpenMatrix')?.addEventListener('click', () => {
    window.open('matrix.html', '_blank', 'width=700,height=800,scrollbars=yes');
  });
}

function saveProfile() {
  if (!profile) return;
  localStorage.setItem(STORAGE_KEYS.profile + ':' + profile.sigil.join(''), JSON.stringify(profile));
}

// ── JOURNEY / PHASE-LOG DISPLAY ──
function updateCommunityStatus() {
  if (typeof COMMUNITY_FIELD === 'undefined') return;
  const state = COMMUNITY_FIELD.getState();
  const dot = document.getElementById('csDot');
  const statusText = document.getElementById('csStatusText');
  const nodesList = document.getElementById('csNodesList');
  const fieldIntentionEl = document.getElementById('csFieldIntention');

  if (dot) {
    dot.className = state.isOnline ? 'cs-dot online' : 'cs-dot offline';
  }
  if (statusText) {
    statusText.textContent = state.isOnline
      ? `${state.nodes.length} node${state.nodes.length !== 1 ? 's' : ''} online`
      : 'Offline';
  }
  if (nodesList) {
    const online = state.nodes.filter(n => n.online);
    if (online.length) {
      nodesList.innerHTML = online.slice(0, 6).map(n => {
        const color = COMMUNITY_FIELD._archetypeColor(n.archetype);
        return `<span class="cs-node-badge" style="border-color:${color}40;color:${color};">${n.sigil} <span style="opacity:0.5">${n.coh}%</span></span>`;
      }).join('');
    } else {
      nodesList.innerHTML = '<span style="font-size:0.52rem;color:var(--muted);opacity:0.5;">No nodes online. Breathe to join.</span>';
    }
  }
  if (fieldIntentionEl && state.fieldIntention) {
    const fi = state.fieldIntention;
    const age = Math.round((Date.now() - fi.ts) / 60000);
    const esc = typeof escapeHtml === 'function' ? escapeHtml : (s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
    fieldIntentionEl.innerHTML = `<span style="font-size:0.52rem;color:var(--muted);">Field intention:</span> "${esc(fi.text)}" <span style="font-size:0.48rem;color:var(--muted);opacity:0.6;">— ${esc(fi.author)} · ${age}m ago</span>`;
  }
}

// ── JOURNEY / PHASE-LOG DISPLAY ──
function refreshJourneyDisplay() {
  if (typeof COHERENCE_BUS === 'undefined') return;
  const j = COHERENCE_BUS.getJourney();
  if (typeof breathCtrl !== 'undefined' && breathCtrl.breathCount) {
    j.breathCount = breathCtrl.breathCount;
    j.interactions = breathCtrl.totalInteractions || j.interactions;
  }
  const je = document.getElementById('jsBreaths');
  const jie = document.getElementById('jsInteractions');
  const jace = document.getElementById('jsAvgCoh');
  const jabb = document.getElementById('journeyArchetypeBar');
  if (je) je.textContent = j.breathCount;
  if (jie) jie.textContent = j.interactions;
  if (jace) jace.textContent = j.avgCoherence + '%';
  if (jabb) {
    const total = Object.values(j.archetypes).reduce((a, b) => a + b, 0) || 1;
    const archColors = {
      Seed: '#e8c86a', Bridge: '#b8a0d0', Axis: '#c8d0e0',
      Star: '#e8c86a', Convergence: '#a0c0c0', Return: '#c0a0b0'
    };
    let barHtml = '';
    for (const [arch, count] of Object.entries(j.archetypes)) {
      const pct = Math.round((count / total) * 100);
      const color = archColors[arch] || 'var(--gold)';
      barHtml += `<div class="abb-segment" style="width:${pct}%;background:${color};" title="${arch}: ${count}"></div>`;
    }
    const glyphMap = { Seed: '△', Bridge: '◁△▷', Axis: '◇', Star: '◎', Convergence: '⊕', Return: '◇' };
jabb.innerHTML = `<div class="abb-bar">${barHtml}</div><div class="abb-legend">${Object.entries(j.archetypes).map(([a,c]) => `<span style="color:${archColors[a]||'var(--gold)'};font-size:0.52rem;">${glyphMap[a]||'·'} ${a} ${c}</span>`).join(' · ')}</div>`;
  }
}

// ── GLYPH OVERLAY + TONE PANEL ──
function initGlyphOverlay() {
  const row = document.getElementById('glyphOverlayRow');
  if (!row) return;
  row.innerHTML = '';
  GLYPHS.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'gly';
    btn.textContent = g.glyph;
    btn.title = g.name;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#glyphOverlayRow .gly').forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      glyphOverlay.glyph = g.glyph;
    });
    row.appendChild(btn);
  });

  // Glyph overlay icon button
  const glyphBtn = document.getElementById('btnGlyphOverlay');
  if (glyphBtn) {
    glyphBtn.addEventListener('click', () => {
      glyphOverlay.show = !glyphOverlay.show;
      glyphBtn.classList.toggle('active', glyphOverlay.show);
      document.getElementById('glyphPanel').style.display = glyphOverlay.show ? 'block' : 'none';
      glyphBtn.title = glyphOverlay.show ? 'Glyph overlay ON' : 'Toggle glyph overlay';
    });
  }
}

// ── PERSONAL TONE PANEL ──
function initTonePanel() {
  const toneBtn = document.getElementById('btnTone');
  const tonePanel = document.getElementById('tonePanel');
  const slider = document.getElementById('toneFreqSlider');
  const display = document.getElementById('toneFreqDisplay');
  const setBtn = document.getElementById('btnSetTone');


  if (!toneBtn || !tonePanel) return;

  toneBtn.addEventListener('click', () => {
    const isOpen = tonePanel.style.display === 'block';
    tonePanel.style.display = isOpen ? 'none' : 'block';
    toneBtn.classList.toggle('active', !isOpen);
  });


  if (slider) {
    slider.addEventListener('input', () => {
      toneFreq = parseInt(slider.value);
      display.textContent = toneFreq + ' Hz';
    });
  }

  if (setBtn) {
    setBtn.addEventListener('click', () => {
      toneFreq = parseInt(slider.value);
      playPersonalizedTone(toneFreq, 1.5, 0.15);
      tonePanel.style.display = 'none';
      document.getElementById('btnTone').classList.remove('active');
    });
  }
}

// ── NAV TABS ──
function initNavTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      updateMobileNavState();
    });
  });
}

// ── CODEX PANEL ──
function initCodex() {
  const lib = document.getElementById('glyphLibrary');
  GLYPHS.forEach(g => {
    const b = document.createElement('button');
    b.className = 'gly';
    b.textContent = g.glyph;
    b.dataset.g = g.glyph;
    b.addEventListener('click', () => {
      document.querySelectorAll('.gly').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedCodexGlyph = g.glyph;
      showArchetype(g.archetype);
    });
    lib.appendChild(b);
  });

  const seals = document.getElementById('sealLibrary');
  RECURSION_SEALS.forEach(g => {
    const b = document.createElement('button');
    b.className = 'gly sealed';
    b.textContent = g.glyph;
    b.dataset.g = g.glyph;
    b.addEventListener('click', () => {
      document.querySelectorAll('.gly.sealed').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedCodexGlyph = g.glyph;
      showArchetype(g.archetype);
    });
    seals.appendChild(b);
  });

  document.getElementById('btnSaveSigil').onclick = () => {
    const name = document.getElementById('sigilNameInput').value.trim();
    if (!name || !selectedCodexGlyph) return;
    if (!profile.sigils) profile.sigils = [];
    const exists = profile.sigils.find(s => s.glyph === selectedCodexGlyph);
    if (exists) { exists.name = name; } else { profile.sigils.push({ glyph: selectedCodexGlyph, name }); }
    saveProfile();
    refreshMySigils();
    const el = document.getElementById('sigilSaved');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 2000);
  };

  refreshMySigils();
}

function showArchetype(text) {
  document.getElementById('archetypeResult').textContent = text;
}

function refreshMySigils() {
  const el = document.getElementById('mySigils');
  el.innerHTML = '';
  (profile?.sigils || []).forEach(s => {
    const b = document.createElement('button');
    b.className = 'gly';
    b.textContent = s.glyph;
    b.title = s.name;
    el.appendChild(b);
  });
}

// ── DREAM MODULE ──
function initDream() {
  document.getElementById('btnInterpret').onclick = () => {
    const text = document.getElementById('dreamText').value.trim();
    if (!text) return;
    const lastGlyph = profile?.journal?.length ? profile.journal[profile.journal.length - 1].glyph : '△';
    const interp = DREAM_INTERPRETATIONS.find(d => d.glyph === lastGlyph) || DREAM_INTERPRETATIONS[0];
    const el = document.getElementById('dreamInterpretation');
    el.innerHTML = `<strong>${escapeHtml(lastGlyph)} — ${escapeHtml(interp.interpretation)}</strong><br><br>${escapeHtml(interpretDreamText(text))}`;
    el.style.display = 'block';
  };
  updateCircadian();
}

function interpretDreamText(text) {
  const words = text.toLowerCase().split(/\s+/);
  const hasWater = words.some(w => ['water', 'river', 'ocean', 'rain', 'tears', 'flow', 'wave'].includes(w));
  const hasLight = words.some(w => ['light', 'star', 'sun', 'gold', 'glow', 'shining', 'bright'].includes(w));
  const hasField = words.some(w => ['field', 'wheel', 'circle', 'breath', 'spiral', 'wind'].includes(w));
  const hasDepth = words.some(w => ['depth', 'deep', 'below', 'under', 'fall', 'sink', 'dark'].includes(w));
  let result = '';
  if (hasWater && hasLight) result += 'Water and light together suggest emotional clarity emerging through the field. ';
  else if (hasField && hasDepth) result += 'The field drawing you deep — you are integrating at the axis level. ';
  else if (hasWater) result += 'Emotional flow detected — the field is processing feeling. ';
  else if (hasLight) result += 'Illumination patterns — the primes are lighting your path. ';
  else if (hasField) result += 'Field awareness is active — breath is the medium of change. ';
  else result += 'The dream text is being processed. Record more next cycle. ';
  return result || 'The field holds your dream without commentary. All is noted.';
}

function updateCircadian() {
  const h = new Date().getHours();
  const phase = h < 6 ? 'Pre-dawn' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
  document.getElementById('circadianTime').textContent = phase + ' — ' + (checkNight() ? 'Night mode' : 'Day mode');
}

// ── JOURNAL ──
function initJournal() {
  document.querySelectorAll('#tab-journal .glyph-grid .gly').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#tab-journal .glyph-grid .gly').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      selectedJournalGlyph = b.dataset.g;
    });
  });

  document.getElementById('btnJournalSave').onclick = () => {
    const text = document.getElementById('journalText').value.trim();
    if (!text) return;
    if (!profile.journal) profile.journal = [];
    profile.journal.push({ glyph: selectedJournalGlyph || '△', text, ts: Date.now(), matAddr: journalGlyphToMatAddr(selectedJournalGlyph || '△') });
    saveProfile();
    document.getElementById('journalText').value = '';
    const el = document.getElementById('journalMsg');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 2000);
    refreshJournal();
  };

  document.getElementById('btnJournalDL').onclick = () => {
    if (!profile?.journal?.length) return;
    const lines = ['Codex Journal — ' + profile.sigil.join(''), ''];
    profile.journal.forEach(e => {
      const d = new Date(e.ts).toLocaleString();
      const mat = (e.matAddr != null) ? ` [M${e.matAddr}]` : '';
      lines.push(`[${d}] ${e.glyph}${mat} ${e.text}`);
    });
    downloadText(lines.join('\n'), 'codex-journal.txt');
  };

  refreshJournal();
}

// ── JOURNAL GEOMETRIC ANCHOR ──
// Maps a glyph to its matAddr (V,F coordinate on the Codex 12×12 matrix).
// This anchors each journal entry to a point in harmonic space —
// enabling the field coherence history to be visualized in Codex geometry.
//
// Glyph → char code sum mod 12 → V_row; Codex primes on 24-gon → F_col
function journalGlyphToMatAddr(glyph) {
  if (!glyph) return null;
  const code = glyph.charCodeAt(0) || 0;
  const V = Math.abs(code) % 12;
  // Glyphs near prime positions on the 24-gon get higher F values
  const glyphPos = code % 24;
  const primePositions = [0, 4, 6, 10, 12, 16, 18, 22];
  const nearPrime = primePositions.some(p => Math.abs(glyphPos - p) <= 1 || Math.abs(glyphPos - p) >= 23);
  const F = nearPrime ? Math.abs((code * 7) % 12) : Math.abs((code * 3) % 12);
  return V * 12 + F;
}

function refreshJournal() {
  const el = document.getElementById('journalEntries');
  el.innerHTML = '';
  (profile?.journal || []).slice(-10).reverse().forEach(e => {
    const d = new Date(e.ts).toLocaleString().slice(0, -3);
    const matTag = (e.matAddr != null)
      ? `<span style="background:rgba(232,200,106,0.1);color:var(--gold);padding:0 0.3rem;border-radius:3px;font-size:0.62rem;margin-left:0.3rem;">M${e.matAddr}</span>`
      : '';
    const div = document.createElement('div');
    div.style.cssText = 'padding:0.4rem;border-bottom:1px solid var(--border);font-size:0.72rem;color:var(--muted);display:flex;align-items:center;';
    div.innerHTML = `<span style="color:var(--gold);margin-right:0.4rem;">${escapeHtml(e.glyph)}</span>${d}${matTag}<br>${escapeHtml(e.text)}`;
    el.appendChild(div);
  });
}

function downloadText(content, filename) {
  const b = document.createElement('a');
  b.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  b.download = filename;
  b.click();
}

// ── PROFILE ──
function initProfile() {
  document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem(STORAGE_KEYS.lastSigil);
    location.reload();
  };
  refreshProfile();
}

function refreshProfile() {
  const el = document.getElementById('profileContent');
  if (!profile) return;
  el.innerHTML = `
    <div class="profile-row"><span>Sigil</span><span>${profile.sigil.join('')}</span></div>
    <div class="profile-row"><span>Cycles completed</span><span>${profile.cycles || 0}</span></div>
    <div class="profile-row"><span>Journal entries</span><span>${profile.journal?.length || 0}</span></div>
    <div class="profile-row"><span>Sigils sealed</span><span>${profile.sigils?.length || 0}</span></div>
    <div class="profile-row"><span>Personal tone</span><span>${toneFreq} Hz</span></div>
  `;
}

// ── INIT CONTROLS ──
document.getElementById('btnStart').onclick = startCycle;
document.getElementById('btnRepeat').onclick = repeatCycle;
document.getElementById('btnNight').onclick = applyNight;
document.getElementById('axisMessage').onclick = () => document.getElementById('axisMessage').classList.remove('visible');

// ── 24/120-CELL TOGGLE ──
function applyToggle120(show120) {
  isShowing120Cell = show120;
  localStorage.setItem('wheelGeometry', show120 ? '120' : '24');
  const wrap = document.getElementById('toggle120');
  if (show120) {
    wrap.classList.add('show-120');
    wrap.querySelectorAll('.t120-opt').forEach(el => {
      el.classList.toggle('active', el.dataset.val === '120');
    });
  } else {
    wrap.classList.remove('show-120');
    wrap.querySelectorAll('.t120-opt').forEach(el => {
      el.classList.toggle('active', el.dataset.val === '24');
    });
  }
}

function setWheelGeometry(mode) {
  localStorage.setItem('wheelGeometry', mode);
  isShowing120Cell = (mode === '120');
  document.getElementById('btnGeo24').style.fontWeight = mode === '24' ? 'bold' : 'normal';
  document.getElementById('btnGeo120').style.fontWeight = mode === '120' ? 'bold' : 'normal';
  drawWheel();
}
// Apply saved preference on load
if (isShowing120Cell) applyToggle120(true);
document.getElementById('toggle120').onclick = () => applyToggle120(!isShowing120Cell);
// T19: Restore geometry toggle button state
const savedGeo = localStorage.getItem('wheelGeometry') || '24';
document.getElementById('btnGeo24').style.fontWeight = savedGeo === '24' ? 'bold' : 'normal';
document.getElementById('btnGeo120').style.fontWeight = savedGeo === '120' ? 'bold' : 'normal';

// ── AUTO-LOGIN ──
const autoLogin = localStorage.getItem(STORAGE_KEYS.lastSigil);
if (autoLogin) {
  const stored = localStorage.getItem(STORAGE_KEYS.profile + ':' + autoLogin);
  if (stored) {
    profile = JSON.parse(stored);
    userSigil = [...profile.sigil];
    enterPortal();
  } else {
    initLogin();
  }
} else {
  initLogin();
}
