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

// ── RIPPLE STATE (H3) ──
let rippleOrigin = null;
let ripplePhase = 0;
let rippleRafId = null;
let selectedWheelPos = null;

function startRipple(wp) {
  selectedWheelPos = wp;
  rippleOrigin = wp;
  ripplePhase = 0;
  if (rippleRafId) cancelAnimationFrame(rippleRafId);
  rippleRafId = requestAnimationFrame(rippleTick);
}

function rippleTick() {
  ripplePhase += 0.03;
  if (ripplePhase >= 1) {
    ripplePhase = 0;
    rippleOrigin = null;
    rippleRafId = null;
    return;
  }
  drawWheel();
  rippleRafId = requestAnimationFrame(rippleTick);
}

function onWheelClick(e) {
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - cx;
  const dy = e.clientY - rect.top - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < ir - 30 || dist > or + 30) return; // outside wheel
  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  const seg = Math.round((angle / (Math.PI * 2)) * WHEEL_CONFIG.segments) % WHEEL_CONFIG.segments;
  startRipple(seg);
}

// ── BREATH STATE (H1+H4) ──
let breathPhase = 0;
let breathDir = 1;
let lastBreathTs = 0;
let breathRafId = null;

function breathHold() { return Math.sin(breathPhase * Math.PI); }

function breathTick(ts) {
  if (!lastBreathTs) lastBreathTs = ts;
  const dt = ts - lastBreathTs;
  breathPhase += (dt / 6000) * breathDir;
  if (breathPhase >= 1) { breathPhase = 1; breathDir = -1; }
  if (breathPhase <= 0) { breathPhase = 0; breathDir = 1; }
  lastBreathTs = ts;
  document.documentElement.style.setProperty('--breath-hold', breathHold());
  // Modulate coherence bar glow (H4)
  const cohBar = document.getElementById('cohBar');
  const cohVal = document.getElementById('cohValue');
  if (cohBar) cohBar.style.boxShadow = breathHold() > 0.5 ? `0 0 ${breathHold()*12}px rgba(232,200,106,${breathHold()*0.5})` : '';
  if (cohVal) cohVal.style.opacity = 0.7 + breathHold() * 0.3;
  // Night mode accent breath shift (H6)
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
  drawWheel();
  updateCoherenceDisplay();
  breathRafId = requestAnimationFrame(breathTick);
}
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

// ── WEBSOCKET — MULTI-USER COHERENCE ──
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(WS_CONFIG.serverUrl);

    ws.onopen = () => {
      wsConnected = true;
      updateFieldStatus('Field connected — ' + totalUsers + ' breather' + (totalUsers !== 1 ? 's' : '') + ' in field');
      // Send registration
      sendWS({ type: 'join', sigil: userSigil.join(''), coherence: 0, phase: currentPhase });
      // Register with CodexState for cross-tool sync
      registerWSSender(sendWS);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleWSMessage(msg);
      } catch (e) { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      wsConnected = false;
      registerWSSender(null); // Unregister on close so CodexState doesn't try to send
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

// R4.1 — Quasi-Prime detection helpers
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

  // R1.1 — Harmonic Fifth Lines (draw AFTER spokes, BEFORE nodes)
  {
    const fifthsCycle = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    const bh = breathHold();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = `rgba(232,200,106,${0.15 + bh * 0.2})`;
    ctx.lineWidth = 0.8;
    const r1 = ir + (or - ir) * 0.5;
    for (let fi = 0; fi < fifthsCycle.length; fi++) {
      const a1 = pAngle(fifthsCycle[fi]);
      const a2 = pAngle(fifthsCycle[(fi + 1) % fifthsCycle.length]);
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1));
      ctx.lineTo(cx + r1 * Math.cos(a2), cy + r1 * Math.sin(a2));
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // R4.2 — 4-Quadrant Charge Colors (draw BEFORE nodes)
  {
    const quadColors = [
      'rgba(200,80,80,0.04)',
      'rgba(200,180,60,0.04)',
      'rgba(60,180,120,0.04)',
      'rgba(80,100,220,0.04)'
    ];
    for (let q = 0; q < 4; q++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, or, q * Math.PI / 2, (q + 1) * Math.PI / 2);
      ctx.fillStyle = quadColors[q];
      ctx.fill();
    }
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
      const bh = breathHold();
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
      // Draw glyph at this prime node
      if (glyphOverlay.show && glyphOverlay.glyph) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = night ? '#a090d0' : '#e8c86a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyphOverlay.glyph, nx, ny);
      } else {
        const bh = breathHold();
        const breatheR = 9 * (1 + bh * 0.12);
        const breatheAlpha = 0.7 + bh * 0.3;
        ctx.fillStyle = night ? `rgba(150,136,176,${breatheAlpha})` : `rgba(232,200,106,${breatheAlpha})`;
        ctx.beginPath();
        ctx.arc(nx, ny, breatheR, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const bh = breathHold();
      const isQP = isQuasiPrime(i);
      if (isQP) {
        const qpAlpha = 0.1 + bh * 0.35;
        ctx.fillStyle = night ? `rgba(120,100,180,${qpAlpha})` : `rgba(100,80,160,${qpAlpha})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 4 * (1 + bh * 0.15), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = night
          ? `rgba(30,30,56,${0.2 + bh * 0.25})`
          : `rgba(40,40,64,${0.15 + bh * 0.2})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Frequency ratio labels (R2.1)
  if (breathHold() > 0.65) {
    const fifthsMap = { 0: '1/1', 7: '3/2', 2: '9/8', 9: '5/4', 4: '4/3', 11: '8/3', 6: '5/3', 1: '16/15', 8: '9/4', 3: '6/5', 10: '15/8', 5: '7/4' };
    for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
      const pp = WHEEL_CONFIG.primePositions.includes(i);
      if (pp) {
        const ratio = fifthsMap[i];
        if (ratio) {
          ctx.fillStyle = 'rgba(232,200,106,0.75)';
          ctx.font = '6.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ratio, cx + Math.cos(pAngle(i)) * (ir - 55), cy + Math.sin(pAngle(i)) * (ir - 55));
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

  // R2.1 — Frequency Ratio Labels at prime nodes (when breathHold > 0.65)
  if (breathHold() > 0.65) {
    const noteRatios = [
      { pos: 0, ratio: '1/1' },   // C
      { pos: 4, ratio: '5/4' },   // E
      { pos: 7, ratio: '3/2' },   // G
      { pos: 9, ratio: '15/8' },  // B
      { pos: 11, ratio: '5/3' }   // F#
    ];
    ctx.font = '7px sans-serif';
    ctx.fillStyle = 'rgba(232,200,106,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const { pos, ratio } of noteRatios) {
      if (WHEEL_CONFIG.primePositions.includes(pos)) {
        const a = pAngle(pos);
        ctx.fillText(ratio, cx + Math.cos(a) * (ir - 60), cy + Math.sin(a) * (ir - 60));
      }
    }
  }

  // Active arc
  if (isRunning && PHASES[currentPhase]) {
    const a = pAngle(PHASES[currentPhase].wheelPos);
    const arcBh = breathHold();
    ctx.beginPath();
    ctx.arc(cx, cy, ir + 12, a - 0.18, a + 0.18);
    ctx.strokeStyle = `rgba(232,200,106,${0.65 + arcBh * 0.35})`;
    ctx.lineWidth = 4 + arcBh * 1.5;
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

  // Selection ripple wave (H3)
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


  // Quasi-prime nodes (R4.1)
  for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
    const pp = WHEEL_CONFIG.primePositions.includes(i);
    const act = (i === PHASES[currentPhase]?.wheelPos && isRunning);
    if (!pp && !act) {
      const isQP = isQuasiPrime(i);
      if (isQP) {
        const nx = cx + Math.cos(pAngle(i)) * (ir - 22);
        const ny = cy + Math.sin(pAngle(i)) * (ir - 22);
        const qpAlpha = 0.08 + breathHold() * 0.32;
        ctx.fillStyle = night ? `rgba(130,100,190,${qpAlpha})` : `rgba(110,85,170,${qpAlpha})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.8 * (1 + breathHold() * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // φ-spiral overlay (R5.3)
  {
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
  }

  // Selected wheel position highlight
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

  // R5.3 — φ-Spiral Overlay (draw last, on top)
  {
    const PHI = 1.6180339887;
    const bh = breathHold();
    ctx.save();
    ctx.strokeStyle = `rgba(232,200,106,${0.1 + bh * 0.15})`;
    ctx.lineWidth = 0.5 + bh * 0.8;
    ctx.beginPath();
    for (let i = 0; i < WHEEL_CONFIG.segments; i++) {
      const t = i / WHEEL_CONFIG.segments;
      const r = ir + (or - ir) * t;
      const angle = pAngle(i) + t * 0.5 * Math.PI;
      const sx = cx + r * Math.cos(angle);
      const sy = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }
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

function updateFieldStatus(text) {
  const el = document.getElementById('fieldStatus');
  if (el) el.textContent = text;
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

// ── ENHANCED COHERENCE DISPLAY (R6.2) ──
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
      document.getElementById('loginBtn').disabled = userSigil.length !== 3;
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

function enterPortal() {
  document.getElementById('loginScreen').classList.add('hide');
  document.getElementById('portal').style.display = 'flex';
  localStorage.setItem(STORAGE_KEYS.lastSigil, userSigil.join(''));
  // Sync sigil to shared state
  updateState({ sigil: [...userSigil] });
  // Start breath RAF loop (H1+H4) + keep glow animation (glowP drives spoke/arc glow)
  if (breathRafId) cancelAnimationFrame(breathRafId);
  if (animId) cancelAnimationFrame(animId);
  breathRafId = requestAnimationFrame(breathTick);
  animId = requestAnimationFrame(animateWheel);
  if (cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 600);
  checkNight();
  initNavTabs();
  initCodex();
  initJournal();
  initProfile();
  initGlyphOverlay();
  initTonePanel();
  // Restore active tab from shared state
  const savedTab = getState().activeTab;
  if (savedTab) {
    const tab = document.querySelector('.nav-tab[data-tab="' + savedTab + '"]');
    if (tab) tab.click();
  }
  document.getElementById('helpFab').onclick = () => showAxisMessage();
  document.getElementById('btnOpenMatrix')?.addEventListener('click', () => {
    window.open('matrix.html', '_blank', 'width=700,height=800,scrollbars=yes');
  });
}

function saveProfile() {
  if (!profile) return;
  localStorage.setItem(STORAGE_KEYS.profile + ':' + profile.sigil.join(''), JSON.stringify(profile));
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
      // Persist active tab to shared state
      updateState({ activeTab: tab.dataset.tab });
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
