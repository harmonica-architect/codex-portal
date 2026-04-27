/* ▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐
   FIELD RESONATOR v6 — Solfeggio Frequency Device
   ▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐ */

const SEGMENTS = 24;
const PRIME_POS = [0, 4, 6, 10, 12, 16, 18, 22];
const ARC_CIRCUMFERENCE = 314;

// ── SOLFEGGIO FREQUENCIES ──────────────────────────────────────────────────
// The 8 core Solfeggio tones. Each maps to a breath phase as the "resonant frequency".
// Additional tones can be layered via the sidebar.
const SOLFEGGIO = {
  396: { name: '396 Hz', sig: '△', meaning: 'Liberation · Guilt removal', color: '#5a7a6a', phase: null },
  417: { name: '417 Hz', sig: '◁', meaning: 'Letting go · Facilitation', color: '#7a6a5a', phase: null },
  432: { name: '432 Hz', sig: '⊙', meaning: 'Natural tuning · Grounding', color: '#d4b896', phase: 'base' },
  528: { name: '528 Hz', sig: '◎', meaning: 'DNA repair · Miracles', color: '#7a6a9a', phase: 'inhale' },
  639: { name: '639 Hz', sig: '◇', meaning: 'Connection · Relationships', color: '#8a7aaa', phase: 'hold' },
  741: { name: '741 Hz', sig: '◉', meaning: 'Expression · Solutions', color: '#5a8a7a', phase: 'exhale' },
  852: { name: '852 Hz', sig: '◈', meaning: 'Intuition · Truth', color: '#6a7a9a', phase: 'still' },
  963: { name: '963 Hz', sig: '⟁', meaning: 'Divine awakening', color: '#9a7aaa', phase: 'peak' }
};

// Which frequency is "active" at each breath phase
const PHASE_FREQS = { idle: 432, inhale: 528, hold: 639, exhale: 741, still: 852 };

// ── STATE ────────────────────────────────────────────────────────────────────
let step = 1;
let rotation = 0;
let coherence = 0;
let targetCoherence = 0;
let breathActive = false;
let breathPhase = 'idle';
let cycleCount = 0;
let entrainmentLevel = 0;
let inhaleS = 5, holdS = 5, exhaleS = 5;
let breathStartTime = 0;
let audioCtx = null;
let oscillators = {};       // freq → { o, g }
let layerState = {};       // freq → { on: bool, vol: 0-1 }
let isAudioOn = true;
let masterVol = 0.5;
let selectedSnapshotGlyph = '△';
let wavePoints = [];
let wavePhase = 0;
let breathGuidanceOn = true;
let difficultyLevel = 1;
let coherenceHistory = [];
let lastSuggestionTime = 0;
let suggestedCycle = null;
let rafId = null;           // requestAnimationFrame id for cleanup
let activeFreq = 432;       // currently highlighted/primary frequency
let baseFreq = 432;        // the base drone frequency

// ── CANVAS SETUP ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('resonatorCanvas');
const ctx = canvas.getContext('2d');
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let canvasSize = 320;

function resizeCanvases() {
  const wrap = document.getElementById('wheelWrap');
  const rect = wrap ? wrap.getBoundingClientRect() : null;
  const s = rect ? Math.min(rect.width, rect.height) : 320;
  canvas.width = s * dpr;
  canvas.height = s * dpr;
  canvas.style.width = s + 'px';
  canvas.style.height = s + 'px';
  canvasSize = s;
  waveCanvas.width = waveCanvas.offsetWidth * dpr;
  waveCanvas.height = 18 * dpr;
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

function dims() {
  const s = canvasSize;
  return { cx: s / 2, cy: s / 2, r: s * 0.42, ir: s * 0.285, hr: s * 0.038 };
}

// Broadcast coherence + phase to shared localStorage for cross-tool sync
const coherenceInterval = setInterval(() => {
  if (breathActive) {
    localStorage.setItem('codex_coherence_update', coherence.toString());
    localStorage.setItem('codex_phase_update', String(breathPhase === 'inhale' ? 0 : breathPhase === 'hold' ? 2 : 4));
  }
}, 300);

// ── AUDIO ─────────────────────────────────────────────────────────────────────
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function createOsc(freq, vol, dur = 2) {
  try {
    initAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function playTransitionCue(stepN) {
  const freqs = [261.6, 329.6, 392, 523.2];
  createOsc(freqs[stepN - 1] || 432, masterVol * 0.5, 0.8);
}

function playPhaseCue(freq) {
  createOsc(freq, masterVol * 0.5, 1.2);
}

// Start a continuous oscillator layer
function startLayer(freq, vol) {
  if (!audioCtx) initAudio();
  if (oscillators[freq]) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  oscillators[freq] = { o, g };
  layerState[freq] = { on: true, vol };
}

// Stop a continuous oscillator layer
function stopLayer(freq) {
  if (oscillators[freq]) {
    try { oscillators[freq].o.stop(); } catch (e) {}
    delete oscillators[freq];
    layerState[freq] = { on: false, vol: 0 };
  }
}

// Update volumes of all running oscillators based on coherence + phase
function updateSoundscapeVolumes() {
  if (!isAudioOn) return;
  const coh = Math.min(1, coherence / 100);
  const cohBoost = 0.3 + coh * 0.7;  // 0.3 at 0% coherence, 1.0 at 100%

  Object.keys(oscillators).forEach(f => {
    const freq = parseFloat(f);
    const state = layerState[freq];
    if (!state) return;
    const baseVol = state.vol * masterVol * 0.35;
    // Boost the active phase frequency
    const isActivePhase = PHASE_FREQS[breathPhase] === freq;
    const adjVol = baseVol * cohBoost * (isActivePhase ? 1.5 : 1.0);
    try {
      oscillators[f].g.gain.setValueAtTime(Math.min(adjVol, masterVol * 0.5), audioCtx.currentTime);
    } catch (e) {}
  });
}

// Auto-start: 432Hz base drone + 528Hz (default active layer)
function autoStartSound() {
  try {
    initAudio();
    startLayer(432, 0.4);   // base drone — always on
    startLayer(528, 0.25);  // miracles tone — active by default
    activeFreq = 528;
    const toggle528 = document.getElementById('sndToggle528');
    const toggle432 = document.getElementById('sndToggle432');
    if (toggle528) toggle528.classList.add('on');
    if (toggle432) toggle432.classList.add('on');
    const pill = document.getElementById('audioMiniPill');
    if (pill) pill.classList.add('on');
  } catch (e) {}
}

// ── AUDIO TOGGLE ──────────────────────────────────────────────────────────────
document.getElementById('audioMiniPill')?.addEventListener('click', () => {
  isAudioOn = !isAudioOn;
  const pill = document.getElementById('audioMiniPill');
  pill?.classList.toggle('on', isAudioOn);
  if (isAudioOn) {
    initAudio();
    // Restart all layers that were on
    Object.keys(layerState).forEach(f => {
      if (layerState[f].on) startLayer(parseFloat(f), layerState[f].vol);
    });
  } else {
    Object.keys(oscillators).forEach(f => stopLayer(parseFloat(f)));
  }
});

document.getElementById('volSliderMini')?.addEventListener('input', e => {
  masterVol = Math.max(0.05, e.target.value / 100);
  const volVal = document.getElementById('volValMini');
  if (volVal) volVal.textContent = e.target.value + '%';
});

// ── SOLFEGGIO LAYER TOGGLES ──────────────────────────────────────────────────
Object.keys(SOLFEGGIO).forEach(f => {
  const freq = parseInt(f);
  const toggle = document.getElementById('sndToggle' + freq);
  const volSlider = document.getElementById('sndVol' + freq);
  if (!toggle) return;

  // Init layer state
  layerState[freq] = { on: false, vol: 0.3 };

  toggle.addEventListener('click', () => {
    const on = toggle.classList.contains('on');
    if (on) {
      toggle.classList.remove('on');
      if (oscillators[freq]) stopLayer(freq);
      layerState[freq].on = false;
    } else {
      toggle.classList.add('on');
      layerState[freq].on = true;
      if (isAudioOn) {
        const vol = (volSlider ? parseInt(volSlider.value) : 30) / 100;
        startLayer(freq, vol);
      }
    }
  });

  if (volSlider) {
    volSlider.addEventListener('input', e => {
      const vol = parseInt(e.target.value) / 100;
      layerState[freq].vol = vol;
      if (oscillators[freq] && isAudioOn) {
        const adjVol = vol * masterVol * 0.35;
        try { oscillators[freq].g.gain.setValueAtTime(adjVol, audioCtx.currentTime); } catch (e) {}
      }
    });
  }
});

// ── STEP SYSTEM ───────────────────────────────────────────────────────────────
const STEP_LABELS = {
  1: { title: 'Solfeggio Field · Attune', glyph: '⊙', hint: 'click to begin', sub: '432 Hz · natural tuning' },
  2: { title: 'Breathe · Attune', glyph: '▲', hint: 'follow the cycle', sub: 'frequencies shift with breath' },
  3: { title: 'Resonate · Field Active', glyph: '◉', hint: 'sound amplifies', sub: 'coherence builds' }
};

function setStep(n) {
  step = n;
  updateStepUI();
  if (isAudioOn) playTransitionCue(n);
  if (n === 3) openSidebarNoToggle();
}

function updateStepUI() {
  document.querySelectorAll('.step-pip').forEach(p => {
    const s = parseInt(p.dataset.step);
    p.classList.toggle('active', s === step);
    p.classList.toggle('done', s < step);
  });

  const progress = (step - 1) / 2;
  document.getElementById('stepArcFill').style.strokeDashoffset = ARC_CIRCUMFERENCE - ARC_CIRCUMFERENCE * progress;

  const info = STEP_LABELS[step];
  document.getElementById('centerGlyph').textContent = info.glyph;
  document.getElementById('centerHint').textContent = info.hint;
  document.getElementById('stageSubtitle').textContent = info.sub;
  canvas.className = 'wheel-canvas ' + (step === 1 ? 'attract' : 'active');
  document.getElementById('centerGlyph').classList.toggle('entrained', step > 1);

  document.getElementById('tipsRow').style.opacity = step === 1 ? '1' : '0';
  checkAdaptiveSuggestion();
}

// ── BREATH GUIDANCE ───────────────────────────────────────────────────────────
function playGuidanceTone(freq, dur = 0.6) {
  if (!breathGuidanceOn || !isAudioOn) return;
  createOsc(freq, masterVol * 0.4, dur);
}

function playGuidanceChime() {
  if (!breathGuidanceOn || !isAudioOn) return;
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => createOsc(f, masterVol * 0.4, 0.5), i * 120);
  });
}

function startBreathGuidance() {
  if (!breathGuidanceOn) return;
  guidanceActive = true;
  runGuidanceSequence();
}

function stopBreathGuidance() {
  guidanceActive = false;
  if (guidanceTimer) { clearTimeout(guidanceTimer); guidanceTimer = null; }
  guidancePhase = 'none';
}

let guidancePhase = 'none';
let guidanceTimer = null;
let guidanceActive = false;

function runGuidanceSequence() {
  if (!guidanceActive || !breathActive) return;

  const ratio = getRatio();
  const totalDur = getCycleDuration() * 1000;
  const elapsed = Date.now() - breathStartTime;
  const progress = (elapsed % totalDur) / totalDur;

  let currentPhase = 'idle';
  if (progress < ratio.inhale) currentPhase = 'inhale';
  else if (progress < ratio.inhale + ratio.hold) currentPhase = 'hold';
  else currentPhase = 'exhale';

  if (currentPhase !== guidancePhase) {
    guidancePhase = currentPhase;
    if (currentPhase === 'inhale') {
      playGuidanceTone(261.6, 0.5);
      document.getElementById('breathLabel').textContent = '↑ Inhale';
      document.getElementById('breathLabel').style.color = '#7a6a9a';
    } else if (currentPhase === 'hold') {
      playGuidanceTone(329.6, 0.5);
      document.getElementById('breathLabel').textContent = '◼ Hold';
      document.getElementById('breathLabel').style.color = '#8a7aaa';
    } else if (currentPhase === 'exhale') {
      playGuidanceTone(196, 0.5);
      document.getElementById('breathLabel').textContent = '↓ Exhale';
      document.getElementById('breathLabel').style.color = '#5a7a6a';
    }
  }

  guidanceTimer = setTimeout(runGuidanceSequence, 200);
}

// ── ADAPTIVE SUGGESTIONS ──────────────────────────────────────────────────────
function checkAdaptiveSuggestion() {
  if (difficultyLevel >= 4) return;
  if (!breathActive) return;
  if (Date.now() - lastSuggestionTime < 60000) return;

  const avgCoherence = coherenceHistory.length > 0
    ? coherenceHistory.reduce((a, b) => a + b, 0) / coherenceHistory.length
    : 0;

  if (avgCoherence > 70 && difficultyLevel === 1) {
    suggestCycle({ in: 6, h: 0, out: 6 }, 'Strong coherence — try box breathing (6·0·6)');
  } else if (avgCoherence > 75 && difficultyLevel === 2) {
    suggestCycle({ in: 4, h: 4, out: 8 }, 'Excellent — extend exhale with 4·4·8');
  } else if (avgCoherence > 80 && difficultyLevel === 3) {
    suggestCycle({ in: 4, h: 7, out: 8 }, 'Mastery — try 4·7·8 for deeper retention');
  }
}

let suggestedCycle = null;

function suggestCycle(cycle, reason) {
  suggestedCycle = cycle;
  const box = document.getElementById('suggestionBox');
  if (!box) return;
  box.style.display = 'block';
  document.getElementById('suggestionText').textContent =
    cycle.in + '·' + cycle.h + '·' + cycle.out;
  document.getElementById('suggestionReason').textContent = reason;
  lastSuggestionTime = Date.now();
  if (isAudioOn) playGuidanceChime();
}

document.getElementById('btnAcceptSuggestion')?.addEventListener('click', () => {
  if (!suggestedCycle) return;
  inhaleS = suggestedCycle.in;
  holdS = suggestedCycle.h;
  exhaleS = suggestedCycle.out;
  syncCycleUI();
  if (breathActive) breathStartTime = Date.now();
  document.getElementById('suggestionBox').style.display = 'none';
  suggestedCycle = null;
  difficultyLevel = Math.min(4, difficultyLevel + 1);
  syncDifficultyUI();
});

function syncDifficultyUI() {
  document.querySelectorAll('.diff-dot').forEach(d => {
    d.classList.toggle('active', parseInt(d.dataset.l) <= difficultyLevel);
  });
}

document.querySelectorAll('.diff-dot').forEach(d => {
  d.addEventListener('click', () => {
    difficultyLevel = parseInt(d.dataset.l);
    syncDifficultyUI();
    document.getElementById('suggestionBox').style.display = 'none';
  });
});

document.getElementById('guidancePill')?.addEventListener('click', () => {
  breathGuidanceOn = !breathGuidanceOn;
  document.getElementById('guidancePill')?.classList.toggle('on', breathGuidanceOn);
  if (!breathGuidanceOn) stopBreathGuidance();
  else if (breathActive) startBreathGuidance();
});

// ── BREATH CYCLE ─────────────────────────────────────────────────────────────
function getCycleDuration() { return inhaleS + holdS + exhaleS; }
function getRatio() {
  const t = getCycleDuration();
  return { inhale: inhaleS / t, hold: holdS / t, exhale: exhaleS / t };
}

const PHASE_LABELS = { idle: '', inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale', still: 'Still' };
const PHASE_COLORS = { inhale: '#7a6a9a', hold: '#8a7aaa', exhale: '#5a7a6a', still: '#d4b896', idle: 'transparent' };

function updateBreathState() {
  if (!breathActive) {
    targetCoherence = Math.max(0, targetCoherence - 2);
    entrainmentLevel = Math.max(0, entrainmentLevel - 0.5);
    stopBreathGuidance();
    return;
  }

  const elapsed = Date.now() - breathStartTime;
  const totalDur = getCycleDuration() * 1000;
  const progress = (elapsed % totalDur) / totalDur;
  const ratio = getRatio();

  if (progress < ratio.inhale) {
    breathPhase = 'inhale';
    activeFreq = 528;
    targetCoherence = 40 + (progress / ratio.inhale) * 35;
    entrainmentLevel = Math.min(6, Math.floor((progress / ratio.inhale) * 6));
  } else if (progress < ratio.inhale + ratio.hold) {
    breathPhase = 'hold';
    activeFreq = 639;
    targetCoherence = 75 + Math.sin((progress - ratio.inhale) / ratio.hold * Math.PI) * 20;
    entrainmentLevel = 6;
  } else {
    const exProg = (progress - ratio.inhale - ratio.hold) / ratio.exhale;
    breathPhase = 'exhale';
    activeFreq = 741;
    targetCoherence = Math.max(0, 60 - exProg * 30);
    entrainmentLevel = Math.max(0, Math.floor((1 - exProg) * 6));
  }

  if (cycleCount > 0) {
    coherenceHistory.push(coherence);
    if (coherenceHistory.length > 30) coherenceHistory.shift();
  }
}

function updateBreathUI() {
  updatePhaseStrip();
  const bl = document.getElementById('breathLabel');
  bl.textContent = breathActive ? PHASE_LABELS[breathPhase] : '';
  bl.style.color = PHASE_COLORS[breathPhase] || 'transparent';

  // Center glyph + freq reflects active frequency
  const solf = SOLFEGGIO[activeFreq] || SOLFEGGIO[432];
  document.getElementById('centerGlyph').textContent = solf.sig;
  document.getElementById('centerFreq').textContent = activeFreq + ' Hz';
  document.getElementById('centerHint').textContent = breathActive ? solf.meaning.split('·')[0].trim() : 'click to begin';

  // Entrainment cells
  document.querySelectorAll('.entrainment-cell').forEach((c, i) => {
    c.classList.toggle('lit', i < entrainmentLevel);
  });

  const cohFill = document.getElementById('cohArcFill');
  cohFill?.classList.toggle('high', coherence > 70);
}

function updateCoherence() {
  coherence += (targetCoherence - coherence) * 0.04;
  const pct = Math.round(coherence);
  const cohFill = document.getElementById('cohArcFill');
  if (cohFill) cohFill.style.width = pct + '%';
  const cohPct = document.getElementById('cohPct');
  if (cohPct) cohPct.textContent = pct + '%';
}

// ── PHASE STRIP ──────────────────────────────────────────────────────────────
function updatePhaseStrip() {
  const phases = ['inhale', 'hold', 'exhale', 'still'];
  phases.forEach(p => {
    const chip = document.getElementById('phase' + p.charAt(0).toUpperCase() + p.slice(1));
    if (!chip) return;
    chip.className = 'phase-chip';
    if (breathPhase === p && breathActive) {
      chip.classList.add('active-' + p);
    }
  });
}

// ── WAVEFORM ─────────────────────────────────────────────────────────────────
function drawWaveformStrip() {
  const w = waveCanvas.offsetWidth;
  const h = 18;
  waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

  if (wavePoints.length < 80) {
    for (let i = 0; i < 80; i++) wavePoints.push({ v: 0.5 });
  }
  // Wave amplitude driven by entrainment level
  const amp = breathActive ? (entrainmentLevel / 6) : Math.random() * 0.1;
  wavePoints.push({ v: 0.5 + (Math.sin(wavePhase) * amp * 0.8) });
  wavePoints.push({ v: 0.5 + (Math.sin(wavePhase * 1.5 + 0.3) * amp * 0.5) });
  if (wavePoints.length > 80) wavePoints.shift();

  // Draw two layered waveforms — one for base freq, one for active freq
  wavePhase += 0.08;

  const drawLine = (offset, color, ampMult) => {
    waveCtx.beginPath();
    wavePoints.forEach((p, i) => {
      const x = (i / 80) * w * dpr;
      const baseY = h * dpr * 0.5;
      const y = baseY + (p.v - 0.5) * h * dpr * ampMult;
      if (i === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    });
    waveCtx.strokeStyle = color;
    waveCtx.lineWidth = dpr;
    waveCtx.stroke();
  };

  // Base layer (gold)
  drawLine(0, `rgba(212,184,150,${0.1 + coherence / 100 * 0.3})`, 0.8);
  // Active frequency layer (phase color)
  const phaseColor = PHASE_COLORS[breathPhase] || PHASE_COLORS.idle;
  drawLine(0, phaseColor.replace(')', ', 0.3)').replace('rgb', 'rgba'), 0.5);
}

// ── WHEEL RENDERER ───────────────────────────────────────────────────────────
function getIcositetragonPoints(d, rot) {
  const pts = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = (i / SEGMENTS) * Math.PI * 2 + rot - Math.PI / 2;
    pts.push({ x: d.cx + Math.cos(angle) * d.r, y: d.cy + Math.sin(angle) * d.r, prime: PRIME_POS.includes(i) });
  }
  return pts;
}

function drawWheel() {
  const s = canvasSize;
  ctx.clearRect(0, 0, s, s);
  const d = dims();

  // Background glow
  const grad = ctx.createRadialGradient(d.cx, d.cy, 0, d.cx, d.cy, d.r);
  grad.addColorStop(0, `rgba(212,184,150,${0.03 + coherence / 100 * 0.06})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  // Grid rings
  ctx.strokeStyle = 'rgba(22,22,42,0.8)';
  ctx.lineWidth = 0.5;
  [0.3, 0.5, 0.7, 0.9].forEach(r => {
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r * r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Triangular grid
  const pts = getIcositetragonPoints(d, rotation);
  ctx.strokeStyle = 'rgba(212,184,150,0.1)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < SEGMENTS; i += 8) {
    const p1 = pts[i], p2 = pts[(i + 8) % SEGMENTS], p3 = pts[(i + 16) % SEGMENTS];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Main icositetragon
  ctx.strokeStyle = `rgba(212,184,150,${0.4 + coherence / 100 * 0.5})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.closePath();
  ctx.stroke();

  // Pentagonal inner
  ctx.strokeStyle = 'rgba(90,122,106,0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const p = pts[(i * 5) % SEGMENTS];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw Solfeggio frequency nodes around the wheel (positions 0, 3, 6, 9, 12, 15, 18, 21)
  const freqOrder = [432, 528, 639, 741, 852, 963, 417, 396];
  freqOrder.forEach((freq, i) => {
    const pt = pts[i * 3 % SEGMENTS];  // spread 8 freqs around 24 positions
    const isActive = freq === activeFreq;
    const solf = SOLFEGGIO[freq];
    const alpha = isActive ? (0.6 + coherence / 100 * 0.4) : 0.25;
    ctx.fillStyle = solf.color ? hexToRgba(solf.color, alpha) : `rgba(212,184,150,${alpha})`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isActive ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (isActive) {
      ctx.strokeStyle = solf.color ? hexToRgba(solf.color, 0.6) : 'rgba(212,184,150,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Prime nodes
  pts.forEach(p => {
    if (p.prime) {
      ctx.fillStyle = `rgba(212,184,150,${0.4 + coherence / 100 * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Breath pulse ring
  if (breathActive) {
    const elapsed = Date.now() - breathStartTime;
    const totalDur = getCycleDuration() * 1000;
    const progress = (elapsed % totalDur) / totalDur;
    const ratio = getRatio();
    let pulseR = d.r;
    let alpha = 0.4;
    const colors = { inhale: 'rgba(122,106,154,', hold: 'rgba(138,122,170,', exhale: 'rgba(90,122,106,', still: 'rgba(212,184,150,', idle: 'rgba(212,184,150,' };

    if (progress < ratio.inhale) {
      pulseR = d.r * (0.82 + (progress / ratio.inhale) * 0.18);
      alpha = 0.3 + coherence / 100 * 0.4;
    } else if (progress < ratio.inhale + ratio.hold) {
      pulseR = d.r;
      alpha = 0.6;
    } else {
      const exProg = (progress - ratio.inhale - ratio.hold) / ratio.exhale;
      pulseR = d.r * (1 - exProg * 0.18);
      alpha = 0.5 - exProg * 0.2;
    }

    const c = (colors[breathPhase] || colors.inhale) + alpha + ')';
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, pulseR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center
  const hg = ctx.createRadialGradient(d.cx, d.cy, 0, d.cx, d.cy, d.hr * 2.5);
  hg.addColorStop(0, `rgba(212,184,150,${0.08 + coherence / 100 * 0.2})`);
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, d.hr * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1e32';
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, d.hr, 0, Math.PI * 2);
  ctx.fill();

  // Active frequency glyph at center
  const solf = SOLFEGGIO[activeFreq] || SOLFEGGIO[432];
  ctx.fillStyle = solf.color ? hexToRgba(solf.color, 0.7 + coherence / 100 * 0.3) : `rgba(212,184,150,${0.7 + coherence / 100 * 0.3})`;
  ctx.font = `bold ${d.hr * 1.2}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(solf.sig, d.cx, d.cy);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── ANIMATION LOOP ────────────────────────────────────────────────────────────
function animate() {
  updateBreathState();
  updateBreathUI();
  updateCoherence();
  updateSoundscapeVolumes();
  drawWheel();
  drawWaveformStrip();
  rotation += 0.004;
  rafId = requestAnimationFrame(animate);
}

// ── WHEEL INTERACTION ─────────────────────────────────────────────────────────
function handleWheelClick() {
  if (step === 1) {
    setStep(2);
    startBreath();
    if (isAudioOn) createOsc(261.6, masterVol * 0.5, 1.5);
  } else if (step === 2) {
    setStep(3);
    if (isAudioOn) createOsc(392, masterVol * 0.5, 1.5);
  } else {
    if (breathActive) {
      breathActive = false;
      breathPhase = 'idle';
      activeFreq = 432;
      targetCoherence = Math.max(0, coherence * 0.6);
      stopBreathGuidance();
    } else {
      startBreath();
    }
  }
}

function startBreath() {
  breathActive = true;
  breathStartTime = Date.now();
  cycleCount++;
  if (isAudioOn) {
    playPhaseCue(PHASE_FREQS[breathPhase]);
  }
  startBreathGuidance();
}

document.getElementById('wheelWrap')?.addEventListener('click', handleWheelClick);
canvas.addEventListener('click', handleWheelClick);

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function openSidebarNoToggle() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('mainStage')?.classList.add('sidebar-open');
  document.getElementById('sidebarToggleBtn')?.classList.add('hidden');
}

function closeSidebarNoToggle() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('mainStage')?.classList.remove('sidebar-open');
  document.getElementById('sidebarToggleBtn')?.classList.remove('hidden');
}

document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => {
  openSidebarNoToggle();
  if (step === 1) setStep(2);
});
document.getElementById('sidebarClose')?.addEventListener('click', closeSidebarNoToggle);

// ── CYCLE CONFIG ─────────────────────────────────────────────────────────────
function syncCycleUI() {
  document.getElementById('inhaleMini').value = inhaleS;
  document.getElementById('holdMini').value = holdS;
  document.getElementById('exhaleMini').value = exhaleS;
  document.querySelectorAll('.cycle-preset-mini').forEach(b => {
    const match = parseInt(b.dataset.in) === inhaleS && parseInt(b.dataset.h) === holdS && parseInt(b.dataset.out) === exhaleS;
    b.classList.toggle('sel', match);
  });
}

document.querySelectorAll('.cycle-preset-mini').forEach(btn => {
  btn.addEventListener('click', () => {
    inhaleS = parseInt(btn.dataset.in);
    holdS = parseInt(btn.dataset.h);
    exhaleS = parseInt(btn.dataset.out);
    syncCycleUI();
    if (breathActive) breathStartTime = Date.now();
  });
});

['inhaleMini', 'holdMini', 'exhaleMini'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', e => {
    const v = parseInt(e.target.value) || 1;
    if (id === 'inhaleMini') inhaleS = Math.max(1, v);
    if (id === 'holdMini') holdS = Math.max(0, v);
    if (id === 'exhaleMini') exhaleS = Math.max(1, v);
    syncCycleUI();
    if (breathActive) breathStartTime = Date.now();
  });
});

// ── SNAPSHOT ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.snap-gly').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.snap-gly').forEach(x => x.classList.remove('sel'));
    btn.classList.add('sel');
    selectedSnapshotGlyph = btn.dataset.g;
  });
});

document.getElementById('btnSealSigil')?.addEventListener('click', () => {
  localStorage.setItem('resonator_sigil_' + selectedSnapshotGlyph, JSON.stringify({
    glyph: selectedSnapshotGlyph,
    coherence: Math.round(coherence),
    phase: breathPhase,
    freq: activeFreq,
    cycle: inhaleS + '-' + holdS + '-' + exhaleS,
    ts: Date.now()
  }));
  alert('Sigil sealed: ' + selectedSnapshotGlyph + ' · ' + activeFreq + 'Hz · ' + Math.round(coherence) + '%');
});

document.getElementById('btnDownloadSigil')?.addEventListener('click', () => {
  const s = 400;
  const oc = document.createElement('canvas');
  oc.width = s; oc.height = s;
  const ox = oc.getContext('2d');
  ox.fillStyle = '#06060e';
  ox.fillRect(0, 0, s, s);
  ox.strokeStyle = '#d4b896';
  ox.lineWidth = 2;
  ox.strokeRect(4, 4, s - 8, s - 8);

  ox.fillStyle = '#d4b896';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const r = s * 0.38;
    ox.beginPath();
    ox.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, PRIME_POS.includes(i) ? 4 : 2, 0, Math.PI * 2);
    ox.fill();
  }

  const solf = SOLFEGGIO[activeFreq] || SOLFEGGIO[432];
  ox.font = 'bold 96px serif';
  ox.fillStyle = solf.color || '#d4b896';
  ox.textAlign = 'center';
  ox.textBaseline = 'middle';
  ox.fillText(selectedSnapshotGlyph, s / 2, s / 2);

  ox.font = '13px monospace';
  ox.fillStyle = '#444460';
  ox.fillText(`${activeFreq}Hz · ${solf.name.split(' ')[0]} · ${breathPhase} · ${inhaleS}-${holdS}-${exhaleS}s · ${Math.round(coherence)}%`, s / 2, s * 0.87);

  const b = document.createElement('a');
  b.href = oc.toDataURL('image/png');
  b.download = `codex-sigil-${selectedSnapshotGlyph}-${activeFreq}hz.png`;
  b.click();
});

// ── PROFILES ─────────────────────────────────────────────────────────────────
function loadProfiles() {
  const list = document.getElementById('profileList');
  if (!list) return;
  list.innerHTML = '';
  Object.keys(localStorage).filter(k => k.startsWith('resonator_profile_')).forEach(k => {
    const name = k.replace('resonator_profile_', '');
    const item = document.createElement('div');
    item.className = 'profile-list-item';
    item.innerHTML = `<span>${name}</span><button data-name="${name}">→</button>`;
    item.querySelector('button').addEventListener('click', () => loadProfile(name));
    list.appendChild(item);
  });
}

function saveProfile(name) {
  if (!name) return;
  const layers = Object.keys(layerState).filter(f => layerState[f].on);
  localStorage.setItem('resonator_profile_' + name, JSON.stringify({
    inhaleS, holdS, exhaleS, masterVol, activeFreq, layers
  }));
  loadProfiles();
}

function loadProfile(name) {
  const raw = localStorage.getItem('resonator_profile_' + name);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    inhaleS = d.inhaleS || 5;
    holdS = d.holdS || 5;
    exhaleS = d.exhaleS || 5;
    masterVol = d.masterVol || 0.5;
    activeFreq = d.activeFreq || 432;

    syncCycleUI();
    const vs = document.getElementById('volSliderMini');
    if (vs) vs.value = masterVol * 100;
    const vv = document.getElementById('volValMini');
    if (vv) vv.textContent = Math.round(masterVol * 100) + '%';

    // Restore active layers
    if (d.layers) {
      d.layers.forEach(f => {
        const toggle = document.getElementById('sndToggle' + f);
        if (toggle) toggle.classList.add('on');
        layerState[f] = { on: true, vol: 0.3 };
        if (isAudioOn) startLayer(f, 0.3);
      });
    }
  } catch (e) {}
}

function resetToDefaults() {
  inhaleS = 5; holdS = 5; exhaleS = 5; masterVol = 0.5; activeFreq = 432;
  syncCycleUI();
  const vs = document.getElementById('volSliderMini');
  if (vs) vs.value = 50;
  const vv = document.getElementById('volValMini');
  if (vv) vv.textContent = '50%';
  difficultyLevel = 1;
  syncDifficultyUI();
  document.getElementById('suggestionBox').style.display = 'none';
  // Stop all layers
  Object.keys(oscillators).forEach(f => stopLayer(parseFloat(f)));
  Object.keys(layerState).forEach(f => layerState[f] = { on: false, vol: 0.3 });
  // Re-auto-start
  autoStartSound();
}

document.getElementById('btnSaveProfile')?.addEventListener('click', () => {
  saveProfile(document.getElementById('profileNameInput')?.value.trim());
});
document.getElementById('btnLoadProfile')?.addEventListener('click', () => {
  loadProfile(document.getElementById('profileNameInput')?.value.trim());
});
document.getElementById('btnResetDefault')?.addEventListener('click', resetToDefaults);

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Init layer state for all Solfeggio frequencies
  Object.keys(SOLFEGGIO).forEach(f => {
    layerState[parseInt(f)] = { on: false, vol: 0.3 };
  });
  syncCycleUI();
  syncDifficultyUI();
  loadProfiles();
  updateStepUI();
  autoStartSound();
  rafId = requestAnimationFrame(animate);
  console.log('◇ Field Resonator v6 — Solfeggio Frequency Device · 8 tones · Breath-synchronized');
});

// Clean up animation frame and intervals when leaving the page
window.addEventListener('beforeunload', () => {
  if (rafId) cancelAnimationFrame(rafId);
  clearInterval(coherenceInterval);
});
