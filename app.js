// ══════════════════════════════════════════════
// CODEX PORTAL — APP.JS
// ══════════════════════════════════════════════

// ── GLOBAL HELPERS (called from inline onclick) ──
function toggleCollapse(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
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

// ── DASHBOARD ──
let miniAnimId = null;

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
  vol = vol !== undefined ? vol : 0.12;
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

function drawWheel() {
  ctx.clearRect(0, 0, WHEEL_CONFIG.canvasSize, WHEEL_CONFIG.canvasSize);
  const night = nightMode;

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
    ctx.lineWidth = act ? 3 : (pp ? 1.8 : 1.2);
    ctx.stroke();
  }

  // Nodes + glyph overlay at prime positions
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const a = pAngle(i);
    const pp = WHEEL_CONFIG.primePositions.includes(i);
    const act = (i === PHASES[currentPhase]?.wheelPos && isRunning);
    const r = pp ? 9 : 5.5;
    const nx = cx + Math.cos(a) * (ir - 22);
    const ny = cy + Math.sin(a) * (ir - 22);

    if (act) {
      const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 3);
      grd.addColorStop(0, `rgba(245,210,130,${0.85 + glowP * 0.15})`);
      grd.addColorStop(0.4, `rgba(200,160,70,${0.4 * glowP})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8f0e0';
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (pp) {
      // Draw glyph at this prime node
      if (glyphOverlay.show && glyphOverlay.glyph) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = night ? '#a090d0' : '#e8c86a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyphOverlay.glyph, nx, ny);
      } else {
        ctx.fillStyle = night ? '#9688b0' : '#e8c86a';
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = night ? '#1e1e38' : '#252538';
      ctx.beginPath();
      ctx.arc(nx, ny, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
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
    ctx.strokeStyle = `rgba(232,200,106,${0.65 + glowP * 0.35})`;
    ctx.lineWidth = 4;
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
}

function animateWheel() {
  glowP += WHEEL_CONFIG.glowSpeed * glowD;
  if (glowP >= 1) { glowP = 1; glowD = -1; }
  if (glowP <= 0) { glowP = 0; glowD = 1; }
  drawWheel();
  animId = requestAnimationFrame(animateWheel);
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
      serverPhase = msg.phase;
      globalCoherence = msg.globalCoherence || 0;
      totalUsers = msg.userCount || 0;
      inSyncCount = msg.inSyncCount || 0;
      updateFieldStatus(
        totalUsers > 0
          ? `${totalUsers} breather${totalUsers !== 1 ? 's' : ''} in field | ${inSyncCount} in phase | field coherence ${Math.round(globalCoherence)}%`
          : 'Waiting for field connection...'
      );
      // Apply server phase sync bonus to local display
      if (serverPhase === currentPhase && isRunning) {
        coherenceLevel = Math.min(95, coherenceLevel + COHERENCE.syncBonus / 10);
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

function tone(f, dur = 2.5, vol = 0.12) {
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
    coherenceLevel = Math.min(
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
    document.getElementById('btnNight').classList.add('active-btn');
  } else {
    ind.textContent = 'Day mode — gold field';
    document.documentElement.style.setProperty('--bg', NIGHT_MODE.dayBg);
    document.documentElement.style.setProperty('--surface', '#0e0e1a');
    document.documentElement.style.setProperty('--gold', NIGHT_MODE.dayGold);
    document.documentElement.style.setProperty('--axis', NIGHT_MODE.dayAxis);
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
  const activeTab = document.querySelector('.nav-tab.active')?.dataset.tab || 'home';
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

  // ── Sigil Navigator (desktop orbit nav) ──
  initSigilNav();

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
    fieldIntentionEl.innerHTML = `<span style="font-size:0.52rem;color:var(--muted);">Field intention:</span> "${fi.text}" <span style="font-size:0.48rem;color:var(--muted);opacity:0.6;">— ${fi.author} · ${age}m ago</span>`;
  }
}

// ── JOURNEY / PHASE-LOG DISPLAY ──
function refreshJourneyDisplay() {
  if (typeof COHERENCE_BUS === 'undefined') return;
  const j = COHERENCE_BUS.getJourney();
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
    jabb.innerHTML = `<div class="abb-bar">${barHtml}</div><div class="abb-legend">${Object.entries(j.archetypes).map(([a,c]) => `<span style="color:${archColors[a]||'var(--gold)'};font-size:0.52rem;">${a} ${c}</span>`).join(' · ')}</div>`;
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
    el.innerHTML = `<strong>${lastGlyph} — ${interp.interpretation}</strong><br><br>${interpretDreamText(text)}`;
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
    profile.journal.push({ glyph: selectedJournalGlyph || '△', text, ts: Date.now() });
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
      lines.push(`[${d}] ${e.glyph} ${e.text}`);
    });
    downloadText(lines.join('\n'), 'codex-journal.txt');
  };

  refreshJournal();
}

function refreshJournal() {
  const el = document.getElementById('journalEntries');
  el.innerHTML = '';
  (profile?.journal || []).slice(-10).reverse().forEach(e => {
    const d = new Date(e.ts).toLocaleString().slice(0, -3);
    const div = document.createElement('div');
    div.style.cssText = 'padding:0.4rem;border-bottom:1px solid var(--border);font-size:0.72rem;color:var(--muted);';
    div.innerHTML = `<span style="color:var(--gold);margin-right:0.4rem;">${e.glyph}</span>${d}<br>${e.text}`;
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
