/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FIELD RESONATOR v5
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SEGMENTS = 24;
const PRIME_POS = [0, 4, 6, 10, 12, 16, 18, 22];
const ARC_CIRCUMFERENCE = 314;

/* â”€â”€ STATE â”€â”€ */
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
let oscillators = {};
let isAudioOn = true; // auto-on
let masterVol = 0.3;
let selectedSnapshotGlyph = 'â–³';
let wavePoints = [];
let wavePhase = 0;
let breathGuidanceOn = true;
let difficultyLevel = 1;
let coherenceHistory = [];
let lastSuggestionTime = 0;
let suggestedCycle = null;

/* Guided breath state */
let guidancePhase = 'none'; // 'inhale' | 'hold' | 'exhale'
let guidanceTimer = null;
let guidanceActive = false;

/* â”€â”€ CANVAS SETUP â”€â”€ */
const canvas = document.getElementById('resonatorCanvas');
const ctx = canvas.getContext('2d');
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let canvasSize = 320;

function resizeCanvases() {
  const wrap = document.getElementById('wheelWrap');
  const s = wrap ? wrap.offsetWidth : 320;
  canvasSize = s;
  canvas.width = s * dpr;
  canvas.height = s * dpr;
  canvas.style.width = s + 'px';
  canvas.style.height = s + 'px';
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
setInterval(() => {
  if (breathActive) {
    localStorage.setItem('codex_coherence_update', coherence.toString());
    localStorage.setItem('codex_phase_update', String(breathPhase === 'inhale' ? 0 : breathPhase === 'hold' ? 2 : 4));
  }
}, 300);

/* â”€â”€ BREATH GUIDANCE SYSTEM â”€â”€ */
function playGuidanceTone(freq, dur = 0.6) {
  if (!breathGuidanceOn || !isAudioOn) return;
  createOsc(freq, masterVol * 0.08, dur);
}

function playGuidanceChime() {
  if (!breathGuidanceOn || !isAudioOn) return;
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => createOsc(f, masterVol * 0.06, 0.5), i * 120);
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

function runGuidanceSequence() {
  if (!guidanceActive || !breathActive) return;

  const ratio = getRatio();
  const totalDur = getCycleDuration() * 1000;
  const elapsed = Date.now() - breathStartTime;
  const progress = (elapsed % totalDur) / totalDur;

  // Determine current phase from breath state
  let currentPhase = 'idle';
  if (progress < ratio.inhale) currentPhase = 'inhale';
  else if (progress < ratio.inhale + ratio.hold) currentPhase = 'hold';
  else currentPhase = 'exhale';

  if (currentPhase !== guidancePhase) {
    guidancePhase = currentPhase;
    if (currentPhase === 'inhale') {
      playGuidanceTone(261.6, 0.5);  // C4
      document.getElementById('breathLabel').textContent = 'â†‘ Inhale';
      document.getElementById('breathLabel').style.color = '#7a6a9a';
    } else if (currentPhase === 'hold') {
      playGuidanceTone(329.6, 0.5);  // E4
      document.getElementById('breathLabel').textContent = 'â—† Hold';
      document.getElementById('breathLabel').style.color = '#8a7aaa';
    } else if (currentPhase === 'exhale') {
      playGuidanceTone(196, 0.5);   // G3
      document.getElementById('breathLabel').textContent = 'â†“ Exhale';
      document.getElementById('breathLabel').style.color = '#5a7a6a';
    }
  }

  guidanceTimer = setTimeout(runGuidanceSequence, 200);
}

function checkAdaptiveSuggestion() {
  if (difficultyLevel >= 4) return;
  if (!breathActive) return;
  if (Date.now() - lastSuggestionTime < 60000) return; // Only suggest every 60s

  const avgCoherence = coherenceHistory.length > 0
    ? coherenceHistory.reduce((a, b) => a + b, 0) / coherenceHistory.length
    : 0;

  if (avgCoherence > 70 && difficultyLevel === 1) {
    suggestCycle({ in: 6, h: 0, out: 6 }, 'Coherence strong â€” try box breathing (6Â·0Â·6)');
  } else if (avgCoherence > 75 && difficultyLevel === 2) {
    suggestCycle({ in: 4, h: 4, out: 8 }, 'Excellent coherence â€” extend exhale with 4Â·4Â·8');
  } else if (avgCoherence > 80 && difficultyLevel === 3) {
    suggestCycle({ in: 4, h: 7, out: 8 }, 'Mastery detected â€” try 4Â·7Â·8 for deeper retention');
  }
}

function suggestCycle(cycle, reason) {
  suggestedCycle = cycle;
  const box = document.getElementById('suggestionBox');
  if (!box) return;
  box.style.display = 'block';
  document.getElementById('suggestionText').textContent =
    cycle.in + 'Â·' + cycle.h + 'Â·' + cycle.out;
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

/* â”€â”€ STEP SYSTEM â”€â”€ */
const STEP_LABELS = {
  1: { title: 'Monadic Spiral Â· 432Hz', glyph: 'âŠ™', hint: 'click to begin', sub: 'attune to the field' },
  2: { title: 'Breath Â· Inhale', glyph: 'â–³', hint: 'follow the cycle', sub: 'the field remembers' },
  3: { title: 'Resonance Active', glyph: 'â—‰', hint: 'sound amplifies', sub: 'coherence builds' }
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

  // Hide tips after step 1
  document.getElementById('tipsRow').style.opacity = step === 1 ? '1' : '0';

  // Check for adaptive suggestion
  checkAdaptiveSuggestion();
}

/* â”€â”€ AUDIO â€” auto-activated â”€â”€ */
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
  createOsc(freqs[stepN - 1] || 432, masterVol * 0.1, 0.8);
}

function playPhaseCue(freq) {
  createOsc(freq, masterVol * 0.15, 1.2);
}

function startSoundscapeLayer(freq, vol) {
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
}

function stopSoundscapeLayer(freq) {
  if (oscillators[freq]) {
    try { oscillators[freq].o.stop(); } catch (e) {}
    delete oscillators[freq];
  }
}

function updateSoundscapeVolumes() {
  if (!isAudioOn) return;
  [432, 528, 639, 741, 852].forEach(f => {
    if (oscillators[f]) {
      const volSlider = document.getElementById('sndVol' + f);
      const vol = (volSlider ? parseInt(volSlider.value) : 30) / 100 * masterVol * 0.12;
      const adjVol = vol * (0.4 + coherence / 200);
      try { oscillators[f].g.gain.setValueAtTime(adjVol, audioCtx.currentTime); } catch (e) {}
    }
  });
}

// Auto-start 432Hz base drone
function autoStartSound() {
  try {
    initAudio();
    startSoundscapeLayer(432, masterVol * 0.12);
    document.getElementById('audioMiniPill')?.classList.add('on');
  } catch (e) {}
}

/* â”€â”€ AUDIO TOGGLE â”€â”€ */
document.getElementById('audioMiniPill')?.addEventListener('click', () => {
  isAudioOn = !isAudioOn;
  const pill = document.getElementById('audioMiniPill');
  pill?.classList.toggle('on', isAudioOn);
  if (isAudioOn) {
    initAudio();
    startSoundscapeLayer(432, masterVol * 0.12);
  } else {
    Object.keys(oscillators).forEach(f => stopSoundscapeLayer(parseFloat(f)));
  }
});

document.getElementById('volSliderMini')?.addEventListener('input', e => {
  masterVol = e.target.value / 100;
  const volVal = document.getElementById('volValMini');
  if (volVal) volVal.textContent = e.target.value + '%';
});

/* â”€â”€ SOUNDSCAPE LAYER TOGGLES â”€â”€ */
[432, 528, 639, 741, 852].forEach(f => {
  const toggle = document.getElementById('sndToggle' + f);
  const volSlider = document.getElementById('sndVol' + f);
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const on = toggle.classList.contains('on');
    if (on) {
      toggle.classList.remove('on');
      if (oscillators[f]) stopSoundscapeLayer(f);
    } else {
      toggle.classList.add('on');
      if (isAudioOn) {
        const vol = (volSlider ? parseInt(volSlider.value) : 30) / 100 * masterVol * 0.12;
        startSoundscapeLayer(f, vol);
      }
    }
  });
});

/* â”€â”€ BREATH CYCLE â”€â”€ */
function getCycleDuration() { return inhaleS + holdS + exhaleS; }
function getRatio() {
  const t = getCycleDuration();
  return { inhale: inhaleS / t, hold: holdS / t, exhale: exhaleS / t };
}

const PHASE_LABELS = { idle: '', inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };
const PHASE_COLORS = { inhale: '#7a6a9a', hold: '#8a7aaa', exhale: '#5a7a6a' };
const PHASE_GLYPHS = { inhale: 'â–³', hold: 'â—‡', exhale: 'â—â–·', idle: 'âŠ™' };
const PHASE_FREQS = { inhale: 432, hold: 528, exhale: 639 };

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
    targetCoherence = 40 + (progress / ratio.inhale) * 35;
    entrainmentLevel = Math.min(6, Math.floor((progress / ratio.inhale) * 6));
  } else if (progress < ratio.inhale + ratio.hold) {
    breathPhase = 'hold';
    targetCoherence = 75 + Math.sin((progress - ratio.inhale) / ratio.hold * Math.PI) * 20;
    entrainmentLevel = 6;
  } else {
    const exProg = (progress - ratio.inhale - ratio.hold) / ratio.exhale;
    breathPhase = 'exhale';
    targetCoherence = Math.max(0, 60 - exProg * 30);
    entrainmentLevel = Math.max(0, Math.floor((1 - exProg) * 6));
  }

  // Track coherence for adaptive suggestions
  if (cycleCount > 0) {
    coherenceHistory.push(coherence);
    if (coherenceHistory.length > 30) coherenceHistory.shift();
  }
}

function updateBreathUI() {
  const bl = document.getElementById('breathLabel');
  bl.textContent = breathActive ? PHASE_LABELS[breathPhase] : '';
  bl.style.color = PHASE_COLORS[breathPhase] || 'transparent';

  const glyph = PHASE_GLYPHS[breathPhase] || PHASE_GLYPHS.idle;
  document.getElementById('centerGlyph').textContent = glyph;

  if (breathActive) {
    document.getElementById('centerFreq').textContent = (PHASE_FREQS[breathPhase] || 432) + ' Hz';
  }

  // Entrainment cells
  document.querySelectorAll('.entrainment-cell').forEach((c, i) => {
    c.classList.toggle('lit', i < entrainmentLevel);
  });

  // Coherence shimmer at high coherence
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

/* â”€â”€ WAVEFORM â”€â”€ */
function drawWaveformStrip() {
  const w = waveCanvas.offsetWidth;
  const h = 18;
  waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

  if (wavePoints.length < 80) {
    for (let i = 0; i < 80; i++) wavePoints.push({ v: 0.5 });
  }
  wavePoints.push({ v: breathActive ? entrainmentLevel / 6 : Math.random() * 0.15 });
  if (wavePoints.length > 80) wavePoints.shift();

  waveCtx.beginPath();
  wavePoints.forEach((p, i) => {
    const x = (i / 80) * w * dpr;
    const y = p.v * h * dpr;
    if (i === 0) waveCtx.moveTo(x, y);
    else waveCtx.lineTo(x, y);
  });
  waveCtx.strokeStyle = `rgba(212,184,150,${0.15 + coherence / 100 * 0.4})`;
  waveCtx.lineWidth = dpr;
  waveCtx.stroke();
}

/* â”€â”€ WHEEL RENDERER â”€â”€ */
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
    let colors = { inhale: 'rgba(122,106,154,', hold: 'rgba(138,122,170,', exhale: 'rgba(90,122,106,' };

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

  // Center dot
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
}

/* â”€â”€ ANIMATION LOOP â”€â”€ */
function animate() {
  updateBreathState();
  updateBreathUI();
  updateCoherence();
  updateSoundscapeVolumes();
  drawWheel();
  drawWaveformStrip();
  rotation += 0.004;
  requestAnimationFrame(animate);
}

/* â”€â”€ WHEEL INTERACTION â”€â”€ */
function handleWheelClick() {
  if (step === 1) {
    setStep(2);
    startBreath();
    if (isAudioOn) createOsc(261.6, masterVol * 0.12, 1.5);
  } else if (step === 2) {
    setStep(3);
    if (isAudioOn) createOsc(392, masterVol * 0.12, 1.5);
  } else {
    if (breathActive) {
      breathActive = false;
      breathPhase = 'idle';
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
  if (isAudioOn) playPhaseCue(432);
  startBreathGuidance();
}

document.getElementById('wheelWrap')?.addEventListener('click', handleWheelClick);
canvas.addEventListener('click', handleWheelClick);

/* â”€â”€ SIDEBAR â”€â”€ */
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

/* â”€â”€ CYCLE CONFIG â”€â”€ */
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

/* â”€â”€ SNAPSHOT â”€â”€ */
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
    cycle: inhaleS + '-' + holdS + '-' + exhaleS,
    ts: Date.now()
  }));
  alert('Sigil sealed: ' + selectedSnapshotGlyph + ' Â· ' + Math.round(coherence) + '%');
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

  ox.font = 'bold 96px serif';
  ox.fillStyle = '#d4b896';
  ox.textAlign = 'center';
  ox.textBaseline = 'middle';
  ox.fillText(selectedSnapshotGlyph, s / 2, s / 2);

  ox.font = '13px monospace';
  ox.fillStyle = '#444460';
  ox.fillText(`COHERENCE ${Math.round(coherence)}% | ${breathPhase} | ${inhaleS}-${holdS}-${exhaleS}s`, s / 2, s * 0.87);

  const b = document.createElement('a');
  b.href = oc.toDataURL('image/png');
  b.download = `codex-sigil-${selectedSnapshotGlyph}-${Math.round(coherence)}pct.png`;
  b.click();
});

/* â”€â”€ PROFILES â”€â”€ */
function loadProfiles() {
  const list = document.getElementById('profileList');
  if (!list) return;
  list.innerHTML = '';
  Object.keys(localStorage).filter(k => k.startsWith('resonator_profile_')).forEach(k => {
    const name = k.replace('resonator_profile_', '');
    const item = document.createElement('div');
    item.className = 'profile-list-item';
    item.innerHTML = `<span>${name}</span><button data-name="${name}">â†’</button>`;
    item.querySelector('button').addEventListener('click', () => loadProfile(name));
    list.appendChild(item);
  });
}

function saveProfile(name) {
  if (!name) return;
  localStorage.setItem('resonator_profile_' + name, JSON.stringify({ inhaleS, holdS, exhaleS, masterVol }));
  loadProfiles();
}

function loadProfile(name) {
  const raw = localStorage.getItem('resonator_profile_' + name);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    inhaleS = d.inhaleS || 5;
    holdS = d.holdS || 5;
    exhaleS = d.exhaleS || 10;
    masterVol = d.masterVol || 0.3;
    syncCycleUI();
    const vs = document.getElementById('volSliderMini');
    if (vs) vs.value = masterVol * 100;
    const vv = document.getElementById('volValMini');
    if (vv) vv.textContent = Math.round(masterVol * 100) + '%';
  } catch (e) {}
}

function resetToDefaults() {
  inhaleS = 5; holdS = 5; exhaleS = 5; masterVol = 0.3;
  syncCycleUI();
  const vs = document.getElementById('volSliderMini');
  if (vs) vs.value = 30;
  const vv = document.getElementById('volValMini');
  if (vv) vv.textContent = '30%';
  // Reset soundscape toggles
  [432, 528, 639, 741, 852].forEach(f => {
    const t = document.getElementById('sndToggle' + f);
    if (f === 432) t?.classList.add('on');
    else t?.classList.remove('on');
  });
  // Reset difficulty
  difficultyLevel = 1;
  syncDifficultyUI();
  document.getElementById('suggestionBox').style.display = 'none';
}

document.getElementById('btnSaveProfile')?.addEventListener('click', () => {
  saveProfile(document.getElementById('profileNameInput')?.value.trim());
});
document.getElementById('btnLoadProfile')?.addEventListener('click', () => {
  loadProfile(document.getElementById('profileNameInput')?.value.trim());
});
document.getElementById('btnResetDefault')?.addEventListener('click', resetToDefaults);

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  syncCycleUI();
  syncDifficultyUI();
  loadProfiles();
  updateStepUI();
  autoStartSound();
  animate();
  console.log('◇ Field Resonator v5 — Guided breath · Adaptive difficulty · Auto-sound');
});
