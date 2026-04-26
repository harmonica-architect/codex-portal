// Sync coherenceLevel to window for cross-module access
setInterval(() => { if (typeof coherenceLevel !== 'undefined') window.coherenceLevel = coherenceLevel; }, 250);
﻿// ══════════════════════════════════════════════
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

// ── GLYPH INTELLIGENCE STATE ──
// Tracks user-specific glyph usage across contexts.
// Each glyph accumulates: selection count, contexts, avg coherence, personal meaning.
let glyphIntelligence = {};

function saveGlyphIntelligence() {
  try { localStorage.setItem('codex_glyph_intel', JSON.stringify(glyphIntelligence)); } catch(e) {}
}

function loadGlyphIntelligence() {
  try {
    var stored = localStorage.getItem('codex_glyph_intel');
    if (stored) glyphIntelligence = JSON.parse(stored);
  } catch(e) {}
}

function trackGlyphSelection(glyph, context, coherence) {
  if (!glyph || glyph.length === 0) return;
  var coh = (typeof coherenceLevel !== 'undefined') ? coherenceLevel :
            (typeof COHERENCE_BUS !== 'undefined' && COHERENCE_BUS.coherenceLevel) ? COHERENCE_BUS.coherenceLevel : 0;
  if (!glyphIntelligence[glyph]) {
    glyphIntelligence[glyph] = { contexts: {}, avgCoherence: 0, selections: 0, lastSeen: 0, personalMeaning: null };
  }
  var g = glyphIntelligence[glyph];
  g.selections++;
  g.lastSeen = Date.now();
  g.avgCoherence = (g.avgCoherence * (g.selections - 1) + coh) / g.selections;
  if (!g.contexts[context]) g.contexts[context] = 0;
  g.contexts[context]++;
  saveGlyphIntelligence();
}

function inferPersonalMeaning(glyph) {
  var g = glyphIntelligence[glyph];
  if (!g || g.selections < 5) return null;
  var topContext = Object.keys(g.contexts).reduce(function(a, b) {
    return g.contexts[a] > g.contexts[b] ? a : b;
  });
  var meanings = {
    'login': 'Identity anchor — you reach for this when defining yourself',
    'journal': 'Insight keeper — this glyph holds your reflections',
    'mirror': 'Field mirror — this is your reflection language',
    'sigil-nav': 'Navigation key — this is how you move through the portal',
    'breath-phase': 'Breath companion — this appears at key moments in your cycle'
  };
  return meanings[topContext] || null;
}

function timeAgo(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function renderGlyphIntelligence() {
  var body = document.getElementById('glyphIntelBody');
  if (!body) return;
  var allGlyphs = ['△','◁△▷','◇','⬟','△̅','⊕','⊗','◈'];
  var hasData = allGlyphs.some(function(g) {
    return glyphIntelligence[g] && glyphIntelligence[g].selections > 0;
  });
  if (!hasData) return; // Keep placeholder
  body.innerHTML = allGlyphs.map(function(g) {
    var gi = glyphIntelligence[g];
    if (!gi || gi.selections === 0) return '';
    var pct = Math.min(100, Math.round(gi.avgCoherence));
    var infer = inferPersonalMeaning(g);
    var ctxCount = Object.keys(gi.contexts).length;
    var lastSeenStr = gi.lastSeen ? timeAgo(gi.lastSeen) : 'never';
    return '<div class="gi-glyph-row">' +
      '<span class="gi-glyph">' + g + '</span>' +
      '<div class="gi-info">' +
        (infer ? '<div class="gi-meaning">' + infer + '</div>' : '') +
        '<div class="gi-meta">' + gi.selections + '\u00d7 selected \u00b7 ' + ctxCount + ' context' + (ctxCount !== 1 ? 's' : '') + ' \u00b7 avg ' + pct + '% coh \u00b7 ' + lastSeenStr + '</div>' +
      '</div>' +
      '<div class="gi-bar-wrap"><div class="gi-bar" style="width:' + pct + '%"></div></div>' +
    '</div>';
  }).join('');
}

// ── SIGIL EVOLUTION STATE ──
let sigilEvolution = {
  glyphs: {},     // glyph char → { weight, interactions, lastSeen, unlocked }
  milestones: [], // { ts, type, glyph, weight }
  totalInteractions: 0
};

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

// ══════════════════════════════════════════
// HARMONIC SOUNDSCAPE ENGINE
// Layered ambient sound environments
// ══════════════════════════════════════════

let soundscape = {
  ctx: null,           // AudioContext
  active: false,       // whether soundscape is running
  masterGain: null,     // master volume
  droneOscs: [],       // fundamental drone oscillators
  layerOscs: [],        // breath-phase layer oscillators
  currentPhaseIdx: 0,   // breath phase for layer switching
  currentArchetype: 'Star',
  nodes: {},            // active oscillator nodes by frequency
};

// Map archetype to its harmonic series
const ARCHETYPE_HARMONICS = {
  Seed:       [432, 864, 1296],
  Bridge:     [528, 1056],
  Axis:       [639, 1278],
  Convergence:[741, 1482],
  Star:       [852, 1704],
  Return:     [963, 1926]
};

function initSoundscape() {
  if (soundscape.ctx) return; // already initialized
  try {
    soundscape.ctx = new (window.AudioContext || window.webkitAudioContext)();
    soundscape.masterGain = soundscape.ctx.createGain();
    soundscape.masterGain.gain.setValueAtTime(0, soundscape.ctx.currentTime);
    soundscape.masterGain.connect(soundscape.ctx.destination);
  } catch(e) {
    console.warn('Soundscape: Web Audio not available', e);
  }
}

function startSoundscape() {
  if (!soundscape.ctx || soundscape.active) return;
  if (soundscape.ctx.state === 'suspended') soundscape.ctx.resume();
  soundscape.active = true;
  soundscape.masterGain.gain.cancelScheduledValues(soundscape.ctx.currentTime);
  soundscape.masterGain.gain.setValueAtTime(0, soundscape.ctx.currentTime);
  soundscape.masterGain.gain.linearRampToValueAtTime(SOUNDSCAPE_CONFIG.baseVolume, soundscape.ctx.currentTime + SOUNDSCAPE_CONFIG.droneFadeTime);
  startDrone();
  startPhaseLayer();
}

function stopSoundscape() {
  if (!soundscape.active) return;
  soundscape.active = false;
  if (soundscape.masterGain) {
    soundscape.masterGain.gain.cancelScheduledValues(soundscape.ctx.currentTime);
    soundscape.masterGain.gain.setValueAtTime(soundscape.masterGain.gain.value, soundscape.ctx.currentTime);
    soundscape.masterGain.gain.linearRampToValueAtTime(0, soundscape.ctx.currentTime + SOUNDSCAPE_CONFIG.droneFadeTime);
  }
  soundscape.droneOscs.forEach(function(o) { try { o.stop(soundscape.ctx.currentTime + SOUNDSCAPE_CONFIG.droneFadeTime); } catch(e) {} });
  soundscape.droneOscs = [];
  soundscape.layerOscs.forEach(function(o) { try { o.stop(soundscape.ctx.currentTime + SOUNDSCAPE_CONFIG.layerFadeTime); } catch(e) {} });
  soundscape.layerOscs = [];
}

function toggleSoundscape() {
  if (!soundscape.ctx) initSoundscape();
  if (soundscape.active) { stopSoundscape(); return false; }
  else { startSoundscape(); return true; }
}

function startDrone() {
  if (!soundscape.ctx) return;
  var baseFreq = 432;
  SOUNDSCAPE_CONFIG.octaves.forEach(function(oct) {
    var freq = baseFreq * Math.pow(2, oct);
    var osc = soundscape.ctx.createOscillator();
    var gain = soundscape.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = oct === 0 ? 1.0 : 0.3 / Math.pow(2, oct);
    osc.connect(gain);
    gain.connect(soundscape.masterGain);
    osc.start();
    soundscape.droneOscs.push(osc);
  });
}

function startPhaseLayer() {
  if (!soundscape.ctx || !soundscape.active) return;
  soundscape.layerOscs.forEach(function(o) { try { o.stop(soundscape.ctx.currentTime + 0.1); } catch(e) {} });
  soundscape.layerOscs = [];
  var phaseIdx = (typeof breathCtrl !== 'undefined' && breathCtrl.currentPhase !== undefined) ? breathCtrl.currentPhase : 0;
  var arch = soundscape.currentArchetype || 'Star';
  var harmFreqs = ARCHETYPE_HARMONICS[arch] || ARCHETYPE_HARMONICS.Star;
  harmFreqs.forEach(function(hfreq, i) {
    var osc = soundscape.ctx.createOscillator();
    var gain = soundscape.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hfreq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(soundscape.masterGain);
    osc.start();
    gain.gain.linearRampToValueAtTime(SOUNDSCAPE_CONFIG.layerVolume / (i + 1), soundscape.ctx.currentTime + SOUNDSCAPE_CONFIG.layerFadeTime);
    soundscape.layerOscs.push(osc);
  });
}

function onBreathPhaseChangeSoundscape(phaseIdx) {
  if (!soundscape.active) return;
  soundscape.currentPhaseIdx = phaseIdx;
  startPhaseLayer();
}

var lastCohSoundscape = -1;
function onCoherenceChangeSoundscape(coh) {
  if (!soundscape.active || !soundscape.masterGain) return;
  if (lastCohSoundscape >= 0 && Math.abs(coh - lastCohSoundscape) < 5) return;
  lastCohSoundscape = coh;
  var baseVol = SOUNDSCAPE_CONFIG.baseVolume;
  var cohBoost = coh > 75 ? (coh - 75) * 0.0004 : 0;
  soundscape.masterGain.gain.cancelScheduledValues(soundscape.ctx.currentTime);
  soundscape.masterGain.gain.setValueAtTime(soundscape.masterGain.gain.value, soundscape.ctx.currentTime);
  soundscape.masterGain.gain.linearRampToValueAtTime(baseVol + cohBoost, soundscape.ctx.currentTime + 1.5);
}

window.soundscape = soundscape;
window.toggleSoundscape = toggleSoundscape;
window.initSoundscape = initSoundscape;
window.startSoundscape = startSoundscape;
window.stopSoundscape = stopSoundscape;

if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
  breathCtrl.onPhaseChange(function(phase, phaseIdx) {
    onBreathPhaseChangeSoundscape(phaseIdx);
  });
}

// ── Phase 3: Breath Phase History Indicator ──
// Tracks phase completions this session to show 8-dot pattern on coherence bar
let sessionPhaseCounts = Array(8).fill(0);

function updatePhaseDots() {
  const wrap = document.getElementById('cohPhaseDots');
  if (!wrap) return;
  const total = Math.max(1, sessionPhaseCounts.reduce(function(a, b) { return a + b; }, 0));
  wrap.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('div');
    const ratio = sessionPhaseCounts[i] / total;
    dot.className = 'cpd-dot';
    if (sessionPhaseCounts[i] > 0) dot.className += ' filled';
    if (ratio > 0.25) dot.className += ' heavy';
    wrap.appendChild(dot);
  }
}

if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
  breathCtrl.onPhaseChange(function(phase, phaseIdx) {
    if (sessionPhaseCounts[phaseIdx] !== undefined) {
      sessionPhaseCounts[phaseIdx]++;
      updatePhaseDots();
    }
  });
}

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

// ── BREATH GATE STATE ──
let breathCycleUnlocked = false;  // becomes true after 1 full cycle
let breathCyclesCompleted = 0;     // increments each time a cycle completes

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
    // Breath phase + prime marker from BreathController
    let breathType = '—';
    if (typeof breathCtrl !== 'undefined' && breathCtrl.phases && breathCtrl.phases[breathCtrl.currentPhase]) {
      const phaseName = breathCtrl.phases[breathCtrl.currentPhase].name;
      const wheelPos = breathCtrl.phases[breathCtrl.currentPhase].wheelPos;
      const isPrime = WHEEL_CONFIG.primePositions.includes(wheelPos);
      const primeMarker = isPrime ? '✦' : '—';
      breathType = primeMarker + ' ' + phaseName;
    }
    const primeStatus = sel !== null
      ? (WHEEL_CONFIG.primePositions.includes(sel) ? 'prime' : isQuasiPrime(sel) ? 'quasi' : 'comp')
      : '—';
    subLabel.textContent = `br ${bp}% ${breathType}`;
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
  // Phase 1+2: Save session history and summary before closing
  if (typeof COHERENCE_BUS !== 'undefined') {
    COHERENCE_BUS.saveSessionHistory();
    // Build session summary
    const journey = COHERENCE_BUS.getJourney();
    const lastSession = {
      ts: Date.now(),
      breaths: COHERENCE_BUS.breathCount,
      avgCoh: journey.avgCoherence,
      archetype: COHERENCE_BUS.activeArchetype,
      interactions: COHERENCE_BUS.totalInteractions,
      duration: Math.round((Date.now() - COHERENCE_BUS.sessionStart) / 1000)
    };
    COHERENCE_BUS.saveSessionSummary(lastSession);
  }
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

// ── SIGIL EVOLUTION ──
function initSigilEvolution() {
  var stored = null;
  try { stored = localStorage.getItem('codex_sigil_evolution'); } catch(e) {}
  if (stored) {
    try { sigilEvolution = JSON.parse(stored); } catch(e) {}
  } else {
    sigilEvolution = { glyphs: {}, milestones: [], totalInteractions: 0 };
    userSigil.forEach(function(g) {
      sigilEvolution.glyphs[g] = { weight: 0.5, interactions: 1, lastSeen: Date.now(), unlocked: true };
    });
  }
  // Prune stale glyphs (no interaction in 30 days → decay)
  var now = Date.now();
  var thirtyDays = 30 * 24 * 60 * 60 * 1000;
  Object.keys(sigilEvolution.glyphs).forEach(function(g) {
    var gdata = sigilEvolution.glyphs[g];
    var daysSince = (now - gdata.lastSeen) / (24 * 60 * 60 * 1000);
    if (daysSince > 30) {
      gdata.weight = Math.max(0.1, gdata.weight - (daysSince - 30) * 0.02);
    }
  });
  saveSigilEvolution();
}

function saveSigilEvolution() {
  try { localStorage.setItem('codex_sigil_evolution', JSON.stringify(sigilEvolution)); } catch(e) {}
}

function evolveSigil(interactionType, glyph, coherence) {
  if (!glyph) return;
  if (!sigilEvolution.glyphs[glyph]) {
    sigilEvolution.glyphs[glyph] = { weight: 0.3, interactions: 0, lastSeen: Date.now(), unlocked: false };
  }
  var gdata = sigilEvolution.glyphs[glyph];
  var now = Date.now();
  var significance = interactionType === 'cycle-complete' ? 2 :
                     interactionType === 'journal-save' ? 1.5 :
                     interactionType === 'mirror-reflection' ? 1.2 : 0.5;
  var coherenceBonus = (coherence / 100) * 0.1 * significance;
  gdata.weight = Math.min(1.0, gdata.weight + coherenceBonus);
  gdata.interactions++;
  gdata.lastSeen = now;
  sigilEvolution.totalInteractions++;
  // Milestone: weight threshold crossings
  var thresholds = [0.6, 0.7, 0.8, 0.9, 1.0];
  thresholds.forEach(function(th) {
    if (gdata.weight >= th && !gdata['crossed_' + th]) {
      gdata['crossed_' + th] = true;
      sigilEvolution.milestones.push({ ts: now, type: 'weight_' + th, glyph: glyph, weight: gdata.weight });
    }
  });
  // Progressive unlock: every 10 interactions unlock a new glyph
  if (sigilEvolution.totalInteractions % 10 === 0) {
    var allGlyphs = ['△','◁△▷','◇','⬟','△̅','⊕','⊗','◈','⊙'];
    var unlockedCount = Object.values(sigilEvolution.glyphs).filter(function(gd) { return gd.unlocked; }).length;
    if (unlockedCount < 5) {
      var unsel = allGlyphs.filter(function(g) {
        return !sigilEvolution.glyphs[g] && !userSigil.includes(g);
      });
      if (unsel.length > 0) {
        var newG = unsel[Math.floor(Math.random() * unsel.length)];
        sigilEvolution.glyphs[newG] = { weight: 0.3, interactions: 0, lastSeen: now, unlocked: true };
        sigilEvolution.milestones.push({ ts: now, type: 'glyph_unlock', glyph: newG, weight: 0.3 });
      }
    }
  }
  saveSigilEvolution();
  refreshProfile();
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
coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10);
window.coherenceLevel = coherenceLevel;
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
  // Start BreathController for phase-change animations (sigil nav, cascade)
  const el = document.getElementById('snHub');
  if (typeof breathCtrl !== 'undefined') breathCtrl.start(el);
  // Restart the RAF animation loop if it was cancelled or never started
  if (animId) cancelAnimationFrame(animId);
  if (breathRafId) cancelAnimationFrame(breathRafId);
  // animateWheel self-schedules via RAF — start it to drive drawWheel() and wheel24Rot
  animId = requestAnimationFrame(animateWheel);
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
  const el = document.getElementById('snHub');
  if (typeof breathCtrl !== 'undefined') breathCtrl.start(el);
  // Restart the RAF animation loop
  if (animId) cancelAnimationFrame(animId);
  if (breathRafId) cancelAnimationFrame(breathRafId);
  animId = requestAnimationFrame(animateWheel);
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

// ── BREATH GATE — lock deeper features behind breath-cycle completion ──
function checkBreathGate(tab) {
  const lockedTabs = ['matrix', 'resonator'];
  if (!lockedTabs.includes(tab)) return true; // not locked
  if (breathCycleUnlocked) return true;
  showBreathGate(tab);
  return false;
}

function showBreathGate(targetTab) {
  const overlay = document.getElementById('breathGateOverlay');
  const icon = document.getElementById('bgoIcon');
  const text = document.getElementById('bgoText');
  if (!overlay) return;
  icon.textContent = '◎';
  text.textContent = 'Sync with the breath to unlock ' + targetTab + '…';
  overlay.style.display = 'flex';
  if (typeof breathCtrl !== 'undefined' && !breathCtrl.isActive) {
    const btn = document.getElementById('btnStart');
    if (btn) btn.click();
  }
  updateBreathGateDots(0);
}

function updateBreathGateDots(phaseIdx) {
  for (let i = 0; i < 8; i++) {
    const dot = document.getElementById('bgd' + i);
    if (!dot) continue;
    dot.classList.toggle('active', i <= phaseIdx);
  }
}

function hideBreathGate() {
  const overlay = document.getElementById('breathGateOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ── GLYPH RESONANCE FEEDBACK (login) ──
// Hash a glyph string to a wheel position 0–23
function hashGlyphToWheelPos(glyph) {
  let h = 0;
  for (let i = 0; i < glyph.length; i++) {
    h = ((h << 5) - h) + glyph.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return Math.abs(h) % 24;
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
        // Play deselect tone
        const wp = hashGlyphToWheelPos(b.dataset.g);
        if (typeof breathCtrl !== 'undefined') breathCtrl.playTone(PYTHAGOREAN_FREQS[wp], 0.08, 0.5);
      } else if (userSigil.length < 3) {
        b.classList.add('chosen');
        userSigil.push(b.dataset.g);
        // ── Glyph resonance feedback ──
        const glyph = b.dataset.g;
        const wp = hashGlyphToWheelPos(glyph);
        const freq = PYTHAGOREAN_FREQS[wp];
        // 1. Play Pythagorean tone
        if (typeof breathCtrl !== 'undefined') breathCtrl.playTone(freq, 0.15, 1.2);
        // 2. Golden flash animation on the button
        b.classList.remove('glyph-resonance-flash');
        void b.offsetWidth; // force reflow to restart animation
        b.classList.add('glyph-resonance-flash');
        setTimeout(() => b.classList.remove('glyph-resonance-flash'), 400);
        // 3. Ring pulse on login screen
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
          loginScreen.classList.remove('login-ring-pulse');
          void loginScreen.offsetWidth;
          loginScreen.classList.add('login-ring-pulse');
          setTimeout(() => loginScreen.classList.remove('login-ring-pulse'), 750);
        }
        // 4. Triad chord when 3rd glyph is selected
        if (userSigil.length === 3) {
          const freqs = userSigil.map(g => PYTHAGOREAN_FREQS[hashGlyphToWheelPos(g) % 24]);
          if (typeof breathCtrl !== 'undefined') {
            freqs.forEach((f, i) => breathCtrl.playTone(f, 0.12, 2.0));
          }
        }
        // Track glyph selection for glyph intelligence
        trackGlyphSelection(glyph, 'login', coherenceLevel);
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
  // Navigate to Wheel tab as the primary entry point
  navigateToSigil(1);
  // Auto-start the breath cycle to guide user toward unlocking
  setTimeout(() => {
    const btn = document.getElementById('btnStart');
    if (btn && typeof breathCtrl !== 'undefined' && !breathCtrl.isActive) {
      btn.click();
    }
  }, 800);
  animateWheel();
  if (cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 600);

  // Phase 2: Show previous session summary toast
  if (typeof COHERENCE_BUS !== 'undefined') {
    var lastSess = COHERENCE_BUS.getLastSession();
    if (lastSess) {
      var durMin = Math.round(lastSess.duration / 60);
      var durStr = durMin < 1 ? lastSess.duration + 's' : durMin + 'm';
      var toastEl = document.createElement('div');
      toastEl.id = 'sessionToast';
      toastEl.style.cssText = 'position:fixed;bottom:1.5rem;left:1.5rem;z-index:9999;background:rgba(20,18,30,0.95);border:1px solid rgba(200,180,140,0.3);border-radius:8px;padding:0.75rem 1rem;max-width:260px;font-size:0.72rem;color:rgba(220,210,190,0.9);line-height:1.4;';
      toastEl.innerHTML = '<div style="margin-bottom:0.3rem;font-size:0.6rem;opacity:0.5;letter-spacing:0.08em;">PREVIOUS SESSION</div>' +
        '<div style="margin-bottom:0.25rem;">' + lastSess.breaths + ' breaths · ' + lastSess.avgCoh + '% avg · ' + durStr + '</div>' +
        '<div style="opacity:0.6;">Archetype: ' + (lastSess.archetype || 'Seed') + '</div>';
      document.body.appendChild(toastEl);
      setTimeout(function() {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      }, 4500);
    }
  }
  // Auto-coherence journal logging (opt-in via setting)
  let lastCohLog = null;
  window.cohLogInterval = setInterval(() => {
    // Respect opt-in: only auto-log if the user has enabled it
    var autoLogEnabled = false;
    try { autoLogEnabled = localStorage.getItem('codex_auto_log') === 'true'; } catch(e) {}
    if (!autoLogEnabled) return;
    if (typeof COHERENCE_BUS === 'undefined' || !profile) return;
    var coh = COHERENCE_BUS.coherenceLevel || 0;
    // Log high-coherence moment (>80, not already logged)
    if (coh > 80 && lastCohLog !== 'high') {
      if (!profile.journal) profile.journal = [];
      profile.journal.push({ glyph: '✦', text: '↑ Field coherence peak: ' + coh + '%', ts: Date.now(), matAddr: journalGlyphToMatAddr('✦') });
      try { saveProfile(); } catch(e) { /* localStorage quota may be exceeded */ }
      lastCohLog = 'high';
      // P9 — flash Journal drawer item on peak
      var journalBtn = document.querySelector('.mnd-item[data-tab="journal"]');
      if (journalBtn) {
        journalBtn.classList.add('peak-glow');
        setTimeout(function() { journalBtn.classList.remove('peak-glow'); }, 2000);
      }
    } else if (coh < 30 && lastCohLog !== 'low') {
      if (!profile.journal) profile.journal = [];
      profile.journal.push({ glyph: '·', text: '↓ Field friction: ' + coh + '%', ts: Date.now(), matAddr: journalGlyphToMatAddr('·') });
      try { saveProfile(); } catch(e) { /* localStorage quota may be exceeded */ }
      lastCohLog = 'low';
    } else if (coh >= 30 && coh <= 80) {
      lastCohLog = null; // Reset when back in neutral zone
    }
  }, 8000); // Check every 8 seconds
  window.addEventListener('beforeunload', function() {
    if (window.cohLogInterval) { clearInterval(window.cohLogInterval); window.cohLogInterval = null; }
  });
  checkNight();
  initNavTabs();
  initCodex();
  initIcoxNode();
  initJournal();
  initProfile();
  initGlyphOverlay();
  initTonePanel();

  // Initialize sigil evolution after profile is loaded
  initSigilEvolution();

  // ── Breath Gate — register cycle-complete listener after breathCtrl is available ──
  if (typeof breathCtrl !== 'undefined' && breathCtrl.onCycleComplete) {
    breathCtrl.onCycleComplete(function(count) {
      breathCyclesCompleted = count;
      if (!breathCycleUnlocked && breathCyclesCompleted >= 1) {
        breathCycleUnlocked = true;
        hideBreathGate();
        // Flash the hub to celebrate
        const hub = document.getElementById('snHub');
        if (hub) {
          hub.style.transition = 'box-shadow 0.5s ease';
          hub.style.boxShadow = '0 0 30px 10px rgba(232,200,106,0.8)';
          setTimeout(() => { hub.style.boxShadow = ''; }, 2000);
        }
        // Notify coherence bus
        if (typeof COHERENCE_BUS !== 'undefined') {
          COHERENCE_BUS.phaseLog.push({ ts: Date.now(), phase: 'Cycle Unlocked', glyph: '◎', action: 'Breath gate passed', coh: 100 });
        }
      }
    });

    // Also update breath gate dots when phase changes while overlay is visible
    breathCtrl.onPhaseChange(function(phase, phaseIdx) {
      var overlay = document.getElementById('breathGateOverlay');
      if (overlay && overlay.style.display !== 'none') {
        updateBreathGateDots(phaseIdx);
      }
    });
  }

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

    // Track glyph intelligence — breath phase glyph changes
    trackGlyphSelection(phase.glyph, 'breath-phase', coherenceLevel);
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

  // Token is held in memory by COMMUNITY_FIELD.TOKEN (set on click above).
  const tokenInput = document.getElementById('csTokenInput');
  const tokenBtn = document.getElementById('csTokenBtn');
  if (tokenInput && tokenBtn && typeof COMMUNITY_FIELD !== 'undefined') {
    // Clear any token that was previously saved to localStorage (security hygiene)
    try { localStorage.removeItem('codex_gh_token'); } catch {}

    tokenBtn.addEventListener('click', () => {
      const raw = tokenInput.value.trim();
      if (!raw || raw === '••••••••') return;
      COMMUNITY_FIELD.TOKEN = raw;
      // Token is held in memory only — not persisted to localStorage.
      // The community-field proxy (Render) will be the write path going forward.
      tokenInput.value = '••••••••';
      tokenInput.title = 'Token held in memory for this session';
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

  // ── Render the calibration arc gauge for mirror coherence ──
function renderCalibrationArc(strength) {
  const canvas = document.getElementById('mirrorCalibCanvas');
  const label = document.getElementById('mirrorCalibLabel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H;
  const r = H - 4;

  // Background arc (dim)
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = 'rgba(232,200,106,0.12)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Filled arc — strength 0..1 maps to 0°..180°
  const endAngle = Math.PI + strength * Math.PI;
  if (strength > 0.01) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle);
    // Color shifts gold at high strength, muted at low
    const alpha = 0.5 + strength * 0.5;
    ctx.strokeStyle = `rgba(232,200,106,${alpha})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow at high strength
    if (strength > 0.5) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, endAngle);
      ctx.strokeStyle = `rgba(232,200,106,${(strength - 0.5) * 0.4})`;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // Label
  if (label) {
    const pct = Math.round(strength * 100);
    label.textContent = `Field: ${pct}%`;
  }
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

    // Task 5: Register breath phase change → refresh mirror overlay on phase change
    if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
      breathCtrl.onPhaseChange(function(phase, phaseIdx) {
        // Force the next RAF frame to pick up the new breath scale
        _mirror24cellAngle += 0.001;
      });
    }

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
      updateMirror24CellHighlight(result?.wheelPos ?? -1);
      if (result && result.glyph) evolveSigil('mirror-reflection', result.glyph, (result.strength || 0.5) * 100);
      // Track glyph selection for glyph intelligence
      if (result && result.glyph) trackGlyphSelection(result.glyph, 'mirror', (result.strength || 0.5) * 100);
      // Task 5: flash the mirror overlay and update calibration arc
      flashMirrorOverlay();
      renderCalibrationArc(result?.strength ?? 0);
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
      // Re-render fractal timeline when navigating to profile tab
      if (tab.dataset.tab === 'profile') {
        setTimeout(renderFractalTimeline, 50);
      }
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

// ── JOURNAL GLYPHIC ECHO ──
// Draws a small 80×80 canvas showing an icositetragon (24-gon) with
// the entry's wheel position marked, a center glyph, and a breath-phase arc.
function generateGlyphicEcho(canvasId, entryGlyph, wheelPos, phase) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  var ctx = canvas.getContext('2d');
  var cx = 40, cy = 40, r = 32;

  // Clear
  ctx.clearRect(0, 0, 80, 80);

  // Draw icositetragon (24-gon) ring
  ctx.beginPath();
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(232,200,106,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Mark the wheel position of the entry
  var posAngle = (wheelPos / 24) * Math.PI * 2 - Math.PI / 2;
  var px = cx + r * Math.cos(posAngle);
  var py = cy + r * Math.sin(posAngle);

  // Glow dot at position
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(232,200,106,0.9)';
  ctx.fill();

  // Center glyph
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(entryGlyph || '△', cx, cy);

  // Phase arc (small arc showing which breath phase)
  var phaseArc = { inhale: 0.5, 'hold-in': 1.0, exhale: 2.0, still: 2.5, 'inhale-2': 3.0, 'hold-peak': 3.5, 'exhale-release': 4.0, rest: 4.5 };
  var phaseNorm = phaseArc[phase] || 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, -Math.PI / 2, -Math.PI / 2 + phaseNorm * (Math.PI / 4));
  ctx.strokeStyle = 'rgba(180,140,220,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL();
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
    if (!breathCycleUnlocked) {
      var el = document.getElementById('journalMsg');
      el.textContent = '◎ Sync with breath first — complete one full cycle';
      el.style.color = 'var(--muted)';
      el.style.display = 'block';
      setTimeout(function() {
        el.textContent = 'Entry sealed — the Codex remembers.';
        el.style.color = '';
        el.style.display = 'none';
      }, 2000);
      return;
    }
    var text = document.getElementById('journalText').value.trim();
    if (!text) return;
    // Cap at 5000 chars to prevent localStorage quota exhaustion
    if (text.length > 5000) text = text.substring(0, 5000);

    // ── Capture breath context at moment of writing ──
    var breathCtx = { phase: 'unknown', phaseIdx: -1, wheelPos: 0, coherence: 0 };
    if (typeof breathCtrl !== 'undefined' && breathCtrl.phases) {
      var ph = breathCtrl.phases[breathCtrl.currentPhase];
      breathCtx.phase = ph ? ph.name : 'unknown';
      breathCtx.phaseIdx = breathCtrl.currentPhase;
      breathCtx.wheelPos = ph ? ph.wheelPos : 0;
    }
    if (typeof window.coherenceLevel !== 'undefined') {
      breathCtx.coherence = window.coherenceLevel;
    } else if (typeof COHERENCE_BUS !== 'undefined') {
      breathCtx.coherence = COHERENCE_BUS.coherenceLevel || 0;
    }

    var entryGlyph = selectedJournalGlyph || '△';
    var echoCanvasId = 'jecEchoTmp';

    // Generate glyphic echo and store as dataURL
    var echoDataUrl = generateGlyphicEcho(echoCanvasId, entryGlyph, breathCtx.wheelPos, breathCtx.phase);

    if (!profile.journal) profile.journal = [];
    profile.journal.push({
      glyph: entryGlyph,
      text: text,
      ts: Date.now(),
      matAddr: journalGlyphToMatAddr(entryGlyph),
      breathCtx: breathCtx,
      echo: echoDataUrl
    });
    saveProfile();
    // Evolve sigil on journal save
    evolveSigil('journal-save', selectedJournalGlyph || userSigil[0], breathCtx.coherence || 0);
    // Track glyph selection for glyph intelligence
    trackGlyphSelection(selectedJournalGlyph || '△', 'journal', breathCtx.coherence || 0);
    document.getElementById('journalText').value = '';
    var el2 = document.getElementById('journalMsg');
    el2.style.display = 'block';
    setTimeout(function() { el2.style.display = 'none'; }, 2000);
    refreshJournal();
    // Re-render fractal timeline if on profile tab
    renderFractalTimeline();
  };

  document.getElementById('btnJournalDL').onclick = () => {
    if (!profile?.journal?.length) return;
    var lines = ['Codex Journal — ' + profile.sigil.join(''), ''];
    profile.journal.forEach(function(e) {
      var d = new Date(e.ts).toLocaleString();
      var mat = (e.matAddr != null) ? ' [M' + e.matAddr + ']' : '';
      lines.push('[' + d + '] ' + e.glyph + mat + ' ' + e.text);
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
  var el = document.getElementById('journalEntries');
  if (!el) return;
  el.innerHTML = '';
  var entries = (profile?.journal || []).slice(-10).reverse();
  if (entries.length === 0) {
    el.innerHTML = '<div style="font-size:0.65rem;color:var(--muted);padding:0.5rem 0;text-align:center;">No entries yet. Complete a breath cycle to begin.</div>';
    return;
  }
  entries.forEach(function(e, idx) {
    var d = new Date(e.ts);
    var timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var phaseLabel = (e.breathCtx && e.breathCtx.phase) ? e.breathCtx.phase : '';
    var cohPct = (e.breathCtx && e.breathCtx.coherence != null) ? Math.round(e.breathCtx.coherence) : null;
    var metaParts = [];
    if (e.glyph) metaParts.push(e.glyph);
    if (phaseLabel) metaParts.push(phaseLabel);
    if (cohPct != null) metaParts.push(cohPct + '%');
    if (timeStr) metaParts.push(timeStr);
    var metaLabel = metaParts.join(' · ');

    var matTag = (e.matAddr != null)
      ? '<span style="background:rgba(232,200,106,0.1);color:var(--gold);padding:0 0.3rem;border-radius:3px;font-size:0.62rem;margin-left:0.3rem;">M' + e.matAddr + '</span>'
      : '';

    var echoImg = '';
    if (e.echo) {
      echoImg = '<canvas class="jec-echo" width="80" height="80" style="flex-shrink:0;border-radius:50%;border:1px solid rgba(232,200,106,0.3);"></canvas>';
    } else {
      echoImg = '<canvas class="jec-echo" width="80" height="80" style="flex-shrink:0;border-radius:50%;border:1px solid rgba(232,200,106,0.3);"></canvas>';
    }

    var div = document.createElement('div');
    div.className = 'journal-entry-card';
    div.innerHTML = echoImg +
      '<div class="jec-text">' + escapeHtml(e.text) + '<br>' + matTag + '</div>' +
      '<div class="jec-meta">' + metaLabel + '</div>';
    el.appendChild(div);

    // Restore echo image after appending to DOM
    if (e.echo) {
      var cvs = div.querySelectorAll('canvas.jec-echo');
      if (cvs.length > 0 && cvs[0]) {
        var ictx = cvs[0].getContext('2d');
        var img = new Image();
        img.onload = function() { ictx.drawImage(img, 0, 0, 80, 80); };
        img.src = e.echo;
      }
    }
  });
}

function downloadText(content, filename) {
  const b = document.createElement('a');
  b.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  b.download = filename;
  b.click();
}

// ── FRACTAL TIMELINE ──
// Renders journal entries + coherence events as a horizontal fractal timeline
// on #fractalTimelineCanvas, colored by archetype and sized by coherence.
function renderFractalTimeline() {
  var canvas = document.getElementById('fractalTimelineCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  var entries = profile?.journal || [];
  var legendEl = document.getElementById('fractalTimelineLegend');

  var archColors = {
    Seed: '#e8c86a', Bridge: '#b8a0d0', Axis: '#c8d0e0',
    Star: '#e8c86a', Convergence: '#a0c0c0', Return: '#c0a0b0'
  };
  var allArchetypes = ['Seed', 'Bridge', 'Axis', 'Star', 'Convergence', 'Return'];

  // Helper: derive archetype from glyph
  function glyphToArch(glyph) {
    if (!glyph) return 'Seed';
    var map = { '△': 'Seed', '◎': 'Star', '◁△▷': 'Bridge', '◇': 'Axis', '◉': 'Star', '○': 'Convergence', '·': 'Return', '⊕': 'Convergence', '⊗': 'Axis' };
    return map[glyph] || 'Seed';
  }

  // Placeholder if no entries
  if (entries.length === 0) {
    ctx.fillStyle = 'rgba(232,200,106,0.15)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Complete journal entries to build your fractal timeline.', W / 2, H / 2);
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  // Compute time range
  var firstTs = entries[0]?.ts || Date.now();
  var lastTs = entries[entries.length - 1]?.ts || Date.now();
  var range = Math.max(lastTs - firstTs, 1);

  // Archetype zone bands (horizontal strips)
  var bandH = Math.floor(H / 6);
  var archBand = {};
  allArchetypes.forEach(function(a, i) {
    archBand[a] = { y: i * bandH, h: bandH, color: archColors[a] || '#e8c86a' };
  });

  // Draw archetype zone bands
  allArchetypes.forEach(function(a) {
    var band = archBand[a];
    ctx.fillStyle = band.color.replace(')', ', 0.06)').replace('rgb', 'rgba').replace('#', 'rgba(');
    // Convert hex to rgba fill
    var hex = band.color;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.06)';
    ctx.fillRect(0, band.y, W, band.h);
    // Zone label
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.4)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(a, 4, band.y + 2);
  });

  // Draw connecting arcs between sequential entries
  for (var i = 0; i < entries.length - 1; i++) {
    var e1 = entries[i], e2 = entries[i + 1];
    var x1 = ((e1.ts - firstTs) / range) * (W - 20) + 10;
    var x2 = ((e2.ts - firstTs) / range) * (W - 20) + 10;
    var arch1 = glyphToArch(e1.glyph);
    var arch2 = glyphToArch(e2.glyph);
    var y1 = (archBand[arch1]?.y ?? 0) + archBand[arch1]?.h / 2 ?? H / 2;
    var y2 = (archBand[arch2]?.y ?? 0) + archBand[arch2]?.h / 2 ?? H / 2;
    // Draw bezier arc
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + (x2 - x1) / 2, y1, x1 + (x2 - x1) / 2, y2, x2, y2);
    var hex1 = archBand[arch1]?.color || '#e8c86a';
    var rc = parseInt(hex1.slice(1, 3), 16);
    var gc = parseInt(hex1.slice(3, 5), 16);
    var bc = parseInt(hex1.slice(5, 7), 16);
    ctx.strokeStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw entry nodes
  entries.forEach(function(e) {
    var x = ((e.ts - firstTs) / range) * (W - 20) + 10;
    var arch = glyphToArch(e.glyph);
    var band = archBand[arch] || { y: 0, h: bandH };
    var cy2 = band.y + band.h / 2;
    var coh = (e.breathCtx?.coherence != null) ? e.breathCtx.coherence : 50;
    var nodeR = 3 + (coh / 100) * 6; // 3–9px based on coherence

    // Glow
    var hex = archColors[arch] || '#e8c86a';
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var grad = ctx.createRadialGradient(x, cy2, 0, x, cy2, nodeR * 2.5);
    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.5)');
    grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, cy2, nodeR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Node circle
    ctx.beginPath();
    ctx.arc(x, cy2, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();

    // Glyph label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '8px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.glyph || '△', x, cy2);
  });

  // Legend
  if (legendEl) {
    legendEl.innerHTML = allArchetypes.map(function(a) {
      var hex = archColors[a] || '#e8c86a';
      return '<div class="profile-timeline-legend-item"><div class="legend-dot" style="background:' + hex + ';"></div>' + a + '</div>';
    }).join('');
  }
}

// ── PROFILE ──
function initProfile() {
  document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem(STORAGE_KEYS.lastSigil);
    location.reload();
  };
  // Sync auto-log toggle to current preference
  var autoLogEnabled = false;
  try { autoLogEnabled = localStorage.getItem('codex_auto_log') === 'true'; } catch(e) {}
  var toggle = document.getElementById('autoLogToggle');
  if (toggle) toggle.checked = autoLogEnabled;
  refreshProfile();
  renderFractalTimeline();
  renderGlyphIntelligence();
}

// Expose toggle handler globally for the checkbox onclick
window.TOGGLE_AUTO_LOG = function(checked) {
  try {
    localStorage.setItem('codex_auto_log', checked ? 'true' : 'false');
  } catch(e) {}
};

// Expose soundscape toggle for the Profile tab checkbox
window.TOGGLE_SOUNDSCAPE = function(checked) {
  if (!soundscape.ctx) initSoundscape();
  if (checked) {
    localStorage.setItem('codex_soundscape', 'on');
    toggleSoundscape();
  } else {
    localStorage.removeItem('codex_soundscape');
    toggleSoundscape();
  }
};

function refreshProfile() {
  const el = document.getElementById('profileContent');
  if (!profile) return;
  var totalInteractions = sigilEvolution.totalInteractions || 0;
  var stage = totalInteractions < 10 ? 'Seed' :
              totalInteractions < 25 ? 'Bridge' :
              totalInteractions < 50 ? 'Axis' :
              totalInteractions < 100 ? 'Star' :
              totalInteractions < 200 ? 'Convergence' : 'Return';
  // Phase 5: Evolution timeline
  var STAGES = ['Seed', 'Bridge', 'Axis', 'Star', 'Convergence', 'Return'];
  var stageIdx = STAGES.indexOf(stage);
  var evolutionTimeline = '<div class="pet-wrap">';
  STAGES.forEach(function(s, i) {
    var isActive = i <= stageIdx;
    var isCurrent = s === stage;
    var isPast = i < stageIdx;
    var cls = isCurrent ? 'pet-node pet-current' : isPast ? 'pet-node pet-past' : 'pet-node';
    var arrows = i < STAGES.length - 1 ? '<span class="pet-arrow">\u27a1</span>' : '';
    evolutionTimeline += '<span class="' + cls + '">' + s + '</span>' + arrows;
  });
  evolutionTimeline += '</div>';
  // Next milestone hint
  var nextInter = STAGES[Math.min(stageIdx + 1, STAGES.length - 1)];
  var thresholds = [10, 25, 50, 100, 200];
  var nextThresh = thresholds[Math.min(stageIdx, thresholds.length - 1)];
  var toGo = Math.max(0, nextThresh - totalInteractions);
  var milestoneHint = '';
  if (stage !== 'Return') {
    milestoneHint = '<div class="pet-hint">' + toGo + ' more interaction' + (toGo !== 1 ? 's' : '') + ' to unlock \u25cf ' + nextInter + '</div>';
  }
  var glyphsHtml = Object.keys(sigilEvolution.glyphs).map(function(g) {
    var gd = sigilEvolution.glyphs[g];
    var pct = Math.round(gd.weight * 100);
    var isUser = userSigil.includes(g);
    return '<div class="profile-glyph-row' + (isUser ? ' user-sigil' : '') + '">' +
           '<span class="pgr-glyph">' + g + '</span>' +
           '<div class="pgr-bar-wrap"><div class="pgr-bar" style="width:' + pct + '%"></div></div>' +
           '<span class="pgr-pct">' + pct + '%</span>' +
           '<span class="pgr-count">' + gd.interactions + '\u21ba</span></div>';
  }).join('');

  // Phase 1: Breath History section
  var breathHistoryHtml = '';
  if (typeof COHERENCE_BUS !== 'undefined') {
    var history = COHERENCE_BUS.getSessionHistory();
    if (history.length > 0) {
      var recent7 = history.slice(-7);
      var older7 = history.slice(-14, -7);
      var recentAvg = recent7.length > 0 ? recent7.reduce(function(s, e) { return s + e.avgCoh; }, 0) / recent7.length : 0;
      var olderAvg = older7.length > 0 ? older7.reduce(function(s, e) { return s + e.avgCoh; }, 0) / older7.length : 0;
      var trend = recentAvg > olderAvg + 3 ? '\u2191' : recentAvg < olderAvg - 3 ? '\u2193' : '\u2192';
      var historyRows = history.slice().reverse().map(function(e) {
        var d = new Date(e.date + 'T00:00:00');
        var dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return '<div class="bhr-row">' +
          '<span class="bhr-date">' + dayStr + '</span>' +
          '<span class="bhr-sessions">' + e.sessions + 'x</span>' +
          '<span class="bhr-coh">' + e.avgCoh + '%</span>' +
          '<span class="bhr-breaths">' + e.totalBreaths + '\u2022</span>' +
        '</div>';
      }).join('');
      breathHistoryHtml = '<div class="profile-breath-history">' +
        '<div class="pbh-header">' +
          '<span class="pbh-title">\u25cf Breath History</span>' +
          '<span class="pbh-trend">' + trend + ' ' + Math.round(recentAvg) + '%</span>' +
        '</div>' +
        '<div class="bhr-list">' + historyRows + '</div>' +
      '</div>';
    }
  }

  el.innerHTML = '<div class="profile-sigil-section">' +
    '<div class="pss-label">Your Sigil</div>' +
    '<div class="pss-glyphs">' + userSigil.join('') + '</div>' +
    '<div class="pss-stage">\u25c8 ' + stage + ' Stage</div>' +
    evolutionTimeline +
    milestoneHint +
  '</div>' +
  '<div class="profile-evolution-section">' +
    '<div class="pes-label">Sigil Resonance</div>' +
    glyphsHtml +
  '</div>' +
  breathHistoryHtml +
  '<div class="profile-row"><span>Cycles completed</span><span>' + (profile.cycles || 0) + '</span></div>' +
  '<div class="profile-row"><span>Journal entries</span><span>' + (profile.journal?.length || 0) + '</span></div>' +
  '<div class="profile-row"><span>Total interactions</span><span>' + totalInteractions + '</span></div>' +
  '<div class="profile-row"><span>Milestones</span><span>' + (sigilEvolution.milestones?.length || 0) + '</span></div>' +
  '<div class="profile-row"><span>Personal tone</span><span>' + toneFreq + ' Hz</span></div>' +
  '<div class="profile-community-section">' +
    '<div class="pcs-label">\u25cf Coherence Resonance</div>' +
    '<div class="pcs-text">Your field contributes to the collective harmonic matrix.</div>' +
    '<button class="pcs-btn" id="pcsBtn">View Collective Field</button>' +
  '</div>' +
  '<button class="logout-btn" id="btnLogout">\u2298 Exit Portal</button>';
  var logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) logoutBtn.onclick = function() {
    localStorage.removeItem(STORAGE_KEYS.lastSigil);
    location.reload();
  };
  // Phase 6: Wire community field button
  var pcsBtn = document.getElementById('pcsBtn');
  if (pcsBtn) pcsBtn.onclick = function() {
    var cs = document.getElementById('communitySection');
    if (cs) {
      navTo('home');
      setTimeout(function() { cs.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }
  };
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
// Load glyph intelligence early — before any tracking happens
loadGlyphIntelligence();
// Init adaptive breath profile UI (uses PHASE_GLYPHS defined below)
initBreathProfileUI();

// ── Adaptive Breath Profile UI ──
const PHASE_NAMES = ['Inhale','Hold-In','Exhale','Still','Inhale-2','Hold-Peak','Exhale-Release','Rest'];
const PHASE_GLYPHS = ['◎','◉','○','·','◎','◉','○','◇'];

function initBreathProfileUI() {
  const wrap = document.getElementById('bpPhases');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const row = document.createElement('div');
    row.className = 'bp-phase-row';
    row.innerHTML = `
      <span class="bp-phase-glyph">${PHASE_GLYPHS[i]}</span>
      <span class="bp-phase-name">${PHASE_NAMES[i]}</span>
      <div class="bp-bar-wrap"><div class="bp-bar" id="bpBar${i}" style="width:0%"></div></div>
      <span class="bp-coh-val" id="bpCoh${i}">—</span>
    `;
    wrap.appendChild(row);
  }
  // Reset button
  const resetBtn = document.getElementById('btnResetBreath');
  if (resetBtn) resetBtn.onclick = function() {
    if (typeof breathCtrl !== 'undefined' && breathCtrl.resetBreathProfile) {
      breathCtrl.resetBreathProfile();
      initBreathProfileUI();
    }
  };
  // Subscribe to breath phase changes to update bars in real time
  if (typeof breathCtrl !== 'undefined') {
    breathCtrl.onPhaseChange(function(phase, phaseIdx) {
      // Highlight the current phase row
      document.querySelectorAll('.bp-phase-row').forEach(function(row, ri) {
        row.style.opacity = ri === phaseIdx ? '1' : '0.5';
      });
    });
    breathCtrl.onCycleComplete(function() {
      updateBreathProfileUI();
    });
  }
  updateBreathProfileUI();
}

function updateBreathProfileUI() {
  if (typeof breathCtrl === 'undefined') return;
  var bp = breathCtrl.getBreathProfile();
  var sessionsEl = document.getElementById('bpSessions');
  var statusEl = document.getElementById('bpStatus');
  var barEl = document.getElementById('bpLearningBar');
  var hintEl = document.getElementById('bpHint');
  if (sessionsEl) sessionsEl.textContent = bp.sessions + ' session' + (bp.sessions !== 1 ? 's' : '');
  if (statusEl) {
    if (bp.isLearning) {
      statusEl.textContent = 'Learning… ' + Math.round(bp.learningProgress * 100) + '%';
    } else if (bp.adapted) {
      statusEl.textContent = '● Adapted';
    } else {
      statusEl.textContent = '○ Stable';
    }
  }
  if (barEl) barEl.style.width = (bp.learningProgress * 100) + '%';
  if (hintEl) {
    if (bp.isLearning) {
      hintEl.textContent = 'Keep breathing — the field is learning your rhythm.';
    } else if (bp.adapted) {
      var dom = bp.dominantPhase;
      hintEl.textContent = 'You resonate most with ' + PHASE_NAMES[dom] + '.';
    }
  }
  for (var i = 0; i < 8; i++) {
    var barEl2 = document.getElementById('bpBar' + i);
    var cohEl = document.getElementById('bpCoh' + i);
    var avg = bp.phaseCoherenceAvg[i];
    if (barEl2) {
      var pct = avg !== null ? avg : 0;
      var hue = 40 + (pct / 100) * 30;
      barEl2.style.width = pct + '%';
      barEl2.style.background = avg !== null
        ? 'hsl(' + hue + ', 70%, ' + (40 + pct * 0.3) + '%)'
        : 'rgba(232,200,106,0.2)';
    }
    if (cohEl) cohEl.textContent = avg !== null ? avg + '' : '—';
  }

  // Phase 4: Show ratio + quality score when available
  var bpBody = document.getElementById('breathProfileBody');
  if (bpBody) {
    var extraRow = bpBody.querySelector('.bp-extra-row');
    if (!extraRow) {
      extraRow = document.createElement('div');
      extraRow.className = 'bp-extra-row';
      extraRow.style.cssText = 'display:flex;gap:1rem;margin-top:0.4rem;font-size:0.6rem;color:rgba(200,180,140,0.6);';
      bpBody.appendChild(extraRow);
    }
    var parts = [];
    // Preferred phase ratio (after 5+ sessions)
    if (bp.adapted && bp.preferredRatio) {
      parts.push('<span>\u223f ' + bp.preferredRatio + '</span>');
    }
    // Breath quality score: session avg / global avg
    if (bp.globalAvgCoherence !== null) {
      var sessionAvg = bp.phaseCoherenceAvg.filter(function(v) { return v !== null; })
        .reduce(function(a, b) { return a + b; }, 0) / Math.max(1, bp.phaseCoherenceAvg.filter(function(v) { return v !== null; }).length);
      var qualityRatio = bp.globalAvgCoherence > 0 ? (sessionAvg / bp.globalAvgCoherence).toFixed(2) : null;
      if (qualityRatio !== null) {
        var qColor = sessionAvg >= bp.globalAvgCoherence ? 'rgba(140,200,140,0.8)' : 'rgba(200,160,100,0.8)';
        parts.push('<span style="color:' + qColor + ';">' + qualityRatio + '\u00d7</span>');
      }
    }
    extraRow.innerHTML = parts.join('');
  }
}

// Phase 4: Wire adaptation glow pulse — listen to breathCtrl's _onBreathAdapted
if (typeof breathCtrl !== 'undefined') {
  breathCtrl._onBreathAdapted = function(profile) {
    var cohBar = document.getElementById('cohBar');
    if (cohBar) {
      cohBar.style.transition = 'box-shadow 0.3s ease';
      cohBar.style.boxShadow = '0 0 12px rgba(232,200,106,0.8)';
      setTimeout(function() {
        cohBar.style.boxShadow = '';
      }, 1200);
    }
    // Refresh breath profile UI to show updated values
    updateBreathProfileUI();
  };
}
// Restore soundscape preference (must be after soundscape init at top of file)
if (localStorage.getItem('codex_soundscape') === 'on') {
  initSoundscape();
  // Don't auto-start — wait for user interaction to comply with autoplay policy
  // Show the toggle as checked in the UI
  var scToggle = document.getElementById('soundscapeToggle');
  if (scToggle) scToggle.checked = true;
}
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

// ══════════════════════════════════════════
// ICOSITETRAGON EXPANSION NODE
// Teach the 24-fold harmonic structure
// ══════════════════════════════════════════

let icoxSelectedPos = 12; // Start at prime anchor

// Position data: wheelPos → { glyph, name, archetype, frequency, breath, meaning }
const ICOX_POSITIONS = [
  { glyph: '◈', name: 'Origin',         archetype: 'Star',        frequency: 432, breath: '—',     meaning: 'The origin point. All spokes begin here. The Monad before division. Zero as potential.' },
  { glyph: '△', name: 'Seed Rise',      archetype: 'Seed',        frequency: 432, breath: 'Inhale', meaning: 'The first breath seeds form. Potential crystallizes from silence.' },
  { glyph: '△', name: 'Form Hold',      archetype: 'Seed',        frequency: 432, breath: 'Hold',   meaning: 'The seed holds its form. Breath suspended, meaning condensing.' },
  { glyph: '◇', name: 'Axis Form',      archetype: 'Axis',        frequency: 528, breath: '—',     meaning: 'The axis forms at the perpendicular. Stillness becomes structure.' },
  { glyph: '△', name: 'Prime Anchor',  archetype: 'Seed',        frequency: 528, breath: 'Inhale', meaning: 'A prime resonance anchor. The field holds coherence without fluctuation.' },
  { glyph: '◁△▷', name: 'Bridge',       archetype: 'Bridge',      frequency: 528, breath: 'Hold',   meaning: 'Duality held in balance. Opposites meet through you at this position.' },
  { glyph: '◇', name: 'Deep Axis',      archetype: 'Axis',        frequency: 639, breath: '—',     meaning: 'The deep axis. The fifth dimension is breath, not space — here it becomes clear.' },
  { glyph: '◁△▷', name: 'Bridge Gate',  archetype: 'Bridge',      frequency: 639, breath: 'Exhale', meaning: 'The bridge opens on exhale. Potential collapses to chosen through resonance.' },
  { glyph: '◇', name: 'Still Point',    archetype: 'Axis',        frequency: 639, breath: 'Still',  meaning: 'The diamond at stillness. Rest at the axis — the field aligns itself.' },
  { glyph: '◇', name: 'Quasi-Open',     archetype: 'Axis',        frequency: 741, breath: '—',     meaning: 'A quasi-prime "soft spot" position. The field reflects broadly here — open to many resonances.' },
  { glyph: '△', name: 'Prime Anchor',  archetype: 'Seed',        frequency: 741, breath: 'Inhale', meaning: 'A prime resonance anchor. Crystalline frequency. The field holds.' },
  { glyph: '⊕', name: 'Convergence',   archetype: 'Convergence', frequency: 741, breath: 'Hold',   meaning: 'Two worlds merging. The overlap deepens. Convergence is the marriage of geometry and silence.' },
  { glyph: '◈', name: 'Center',         archetype: 'Star',        frequency: 852, breath: '—',     meaning: 'The center of the 24-gon. The origin radiates here. All paths return to center.' },
  { glyph: '⊕', name: 'Convergence Gate', archetype: 'Convergence', frequency: 741, breath: 'Exhale', meaning: 'Convergence opens on exhale. What was separate becomes one breath.' },
  { glyph: '◇', name: 'Quasi-Open',     archetype: 'Axis',        frequency: 741, breath: '—',     meaning: 'A quasi-prime "soft spot". The reflection is broad here — the field is porous.' },
  { glyph: '△', name: 'Prime Anchor',  archetype: 'Seed',        frequency: 741, breath: 'Inhale', meaning: 'A prime resonance anchor. Stable. The field knows its frequency here.' },
  { glyph: '⬟', name: 'Return',        archetype: 'Return',       frequency: 741, breath: 'Hold',   meaning: 'The pentagonal return. Five directions resolve toward one breath. The cycle breathes back.' },
  { glyph: '⬟', name: 'Quasi-Open',     archetype: 'Return',      frequency: 741, breath: 'Exhale', meaning: 'A quasi-prime soft spot. The field opens to receive before completing.' },
  { glyph: '◇', name: 'Deep Inversion', archetype: 'Axis',        frequency: 741, breath: '—',     meaning: 'Deep inversion. The axis turns inside itself. Consciousness seeing itself.' },
  { glyph: '◇', name: 'Quasi-Open',     archetype: 'Axis',        frequency: 741, breath: '—',     meaning: 'A quasi-prime soft spot. The reflection is porous and open to many frequencies.' },
  { glyph: '⬟', name: 'Return Gate',   archetype: 'Return',       frequency: 741, breath: 'Exhale', meaning: 'Return on exhale. The spiral closes. The cycle completes and breathes again.' },
  { glyph: '△', name: 'Prime Anchor',  archetype: 'Seed',        frequency: 741, breath: 'Inhale', meaning: 'A prime resonance anchor. The field holds its structure. No fluctuation.' },
  { glyph: '◈', name: 'Origin Return',  archetype: 'Star',        frequency: 741, breath: 'Hold',   meaning: 'The origin on return. The Monad remembers itself. The spiral closes to its start.' },
  { glyph: '△', name: 'Quasi-Open',     archetype: 'Seed',        frequency: 741, breath: '—',     meaning: 'The final quasi-prime soft spot. The field is ready for the next breath cycle.' }
];

const ICOX_ARCHETYPE_COLORS = {
  Seed: '#e8c86a',
  Bridge: '#b8a0d0',
  Axis: '#a0c0d0',
  Convergence: '#90c0c0',
  Star: '#e8c86a',
  Return: '#c0a0b0'
};

function initIcoxNode() {
  var canvas = document.getElementById('icoxNodeCanvas');
  if (!canvas) return;

  // Click handler on canvas
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var dx = (e.clientX - rect.left) - cx;
    var dy = (e.clientY - rect.top) - cy;
    var angle = Math.atan2(dy, dx);
    var normalizedAngle = angle + Math.PI / 2;
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    var pos = Math.round((normalizedAngle / (Math.PI * 2)) * 24) % 24;
    selectIcoxPos(pos);
  });

  renderIcoxZoneLegend();
  selectIcoxPos(icoxSelectedPos);
  renderIcoxCanvas();

  // Toggle teach section
  var teachTitle = document.querySelector('.icox-teach-title');
  if (teachTitle) {
    teachTitle.addEventListener('click', function() {
      var section = document.getElementById('icoxTeachSection');
      section.classList.toggle('open');
    });
  }
}

function selectIcoxPos(pos) {
  icoxSelectedPos = pos;
  var data = ICOX_POSITIONS[pos] || ICOX_POSITIONS[0];
  var archColor = ICOX_ARCHETYPE_COLORS[data.archetype] || '#e8c86a';

  document.getElementById('icoxPosLabel').textContent = 'Position ' + pos;
  document.getElementById('icoxPosGlyph').textContent = data.glyph;
  document.getElementById('icoxPosName').textContent = data.name;
  document.getElementById('icoxPosArchetype').textContent = data.archetype;
  document.getElementById('icoxPosArchetype').style.color = archColor;
  document.getElementById('icoxPosFrequency').textContent = data.frequency + ' Hz';
  document.getElementById('icoxPosGate').textContent = data.breath !== '—' ? data.breath + ' phase' : 'All phases';
  document.getElementById('icoxPosMeaning').textContent = data.meaning;

  renderIcoxCanvas();
}

function renderIcoxZoneLegend() {
  var legend = document.getElementById('icoxZoneLegend');
  if (!legend) return;
  var zones = ['Seed','Bridge','Axis','Convergence','Star','Return'];
  legend.innerHTML = zones.map(function(z) {
    return '<div class="icox-zone-item">' +
      '<span class="icox-zone-dot" style="background:' + ICOX_ARCHETYPE_COLORS[z] + '"></span>' +
      '<span class="icox-zone-name">' + z + '</span>' +
    '</div>';
  }).join('');
}

function renderIcoxCanvas() {
  var canvas = document.getElementById('icoxNodeCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var cx = W / 2;
  var cy = H / 2;
  var r = Math.min(cx, cy) * 0.82;

  ctx.clearRect(0, 0, W, H);

  var PRIME_POS = [0, 4, 6, 10, 12, 16, 18, 22];
  var QUASI_POS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
  var archColors = ICOX_ARCHETYPE_COLORS;

  // Draw 3 concentric rings
  for (var ring = 3; ring >= 1; ring--) {
    var ringR = r * (ring / 4);
    ctx.beginPath();
    for (var i = 0; i <= 24; i++) {
      var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
      var x = cx + ringR * Math.cos(angle);
      var y = cy + ringR * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(232,200,106,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Draw 24-gon outer edges
  ctx.beginPath();
  for (var i = 0; i <= 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(232,200,106,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw radial lines
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    var isPrime = PRIME_POS.indexOf(i) !== -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isPrime ? 'rgba(232,200,106,0.12)' : 'rgba(232,200,106,0.04)';
    ctx.lineWidth = isPrime ? 0.8 : 0.4;
    ctx.stroke();
  }

  // Draw vertex dots
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);
    var isPrime = PRIME_POS.indexOf(i) !== -1;
    var isQP = QUASI_POS.indexOf(i) !== -1;
    var isSelected = i === icoxSelectedPos;
    var data = ICOX_POSITIONS[i] || ICOX_POSITIONS[0];
    var archColor = archColors[data.archetype] || '#e8c86a';
    var hex = archColor;
    var rc = parseInt(hex.slice(1, 3), 16);
    var gc = parseInt(hex.slice(3, 5), 16);
    var bc = parseInt(hex.slice(5, 7), 16);
    var dotR = isSelected ? 7 : (isPrime ? 4.5 : 3.5);


    if (isSelected) {
      var grd = ctx.createRadialGradient(x, y, 0, x, y, dotR * 4);
      grd.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',0.7)');
      grd.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, dotR * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = isPrime
      ? 'rgba(232,200,106,0.9)'
      : isQP
      ? 'rgba(' + rc + ',' + gc + ',' + bc + ',0.6)'
      : 'rgba(232,200,106,0.3)';
    ctx.fill();

    if (isSelected) {
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(232,200,106,0.9)';
      ctx.fillText(i, x, y);
    }
  }

  // Center glyph
  ctx.font = 'bold 11px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(232,200,106,0.8)';
  ctx.fillText('✦', cx, cy);
}
