// ══════════════════════════════════════════════
// MIRROR MODE — Fractal Reflection Layer (Priority 3)
// Now wired to matAddr geometric resonance:
// text → frequency → V/F → matAddr → resonance lookup
//
// The icositetragon (24-gon) is the mirror surface.
// Numbers are wrapped to 0-23 (their position on the wheel).
// Quasi-prime positions (non-prime residues at prime indices)
// are the "soft spots" — they reflect most strongly.
//
// The mirror equation:
//   reflection_strength = 1 / |input_pos - nearest_prime|^0.5
//
// Strongest reflections occur near prime positions.
// Weaker (broader) reflections occur at quasi-prime positions.
// ══════════════════════════════════════════════

// ── Quasi-prime positions on the icositetragon ──
// These are the positions that are NOT prime but are adjacent to primes
// on the 24-gon wheel. They "open" positions that resonate broadly.
const QUASI_PRIMES = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
// Prime positions: [0, 4, 6, 10, 12, 16, 18, 22]

// The 8 archetype reflection zones — each maps a quasi-prime range
// to a harmonic archetype response
const ARCHETYPE_ZONES = [
  {
    archetype: 'Seed',
    quasiRange: [1, 3],
    primeAnchor: 0,
    glyph: '△',
    tones: [432, 528],
    responses: [
      'The seed you plant now will root in the field by dawn.',
      'Your breath is a seed. Hold it gently.',
      'A new beginning stirs at the axis of the triangle.',
      'The field recognizes your intention before you name it.',
      'What begins in silence grows in breath.'
    ]
  },
  {
    archetype: 'Bridge',
    quasiRange: [5, 7],
    primeAnchor: 6,
    glyph: '◁△▷',
    tones: [528, 639],
    responses: [
      'Two frequencies seek to align within you.',
      'The bridge forms where two worlds touch.',
      'You are the threshold between what was and what will be.',
      'Opposite poles are converging through your breath.',
      'The middle path holds both sides.'
    ]
  },
  {
    archetype: 'Axis',
    quasiRange: [9, 11],
    primeAnchor: 10,
    glyph: '◇',
    tones: [528, 639],
    responses: [
      'The axis holds. You are the perpendicular.',
      'Stillness deepens within you.',
      'The diamond turns when you stop trying to turn it.',
      'Rest at the axis — the field will align itself.',
      'The perpendicular is your power.'
    ]
  },
  {
    archetype: 'Convergence',
    quasiRange: [13, 15],
    primeAnchor: 12,
    glyph: '⊕',
    tones: [639, 741],
    responses: [
      'Two worlds are merging within your field.',
      'The overlap grows — union deepens.',
      'What was separate is becoming one breath.',
      'Convergence is the marriage of geometry and silence.',
      'Both circles touch. Both remember.'
    ]
  },
  {
    archetype: 'Star',
    quasiRange: [17, 19],
    primeAnchor: 16,
    glyph: '◈',
    tones: [741, 852],
    responses: [
      'All spokes reach outward from your center.',
      'The star seed ignites at the origin point.',
      'Six directions breathe through you.',
      'The origin radiates. You are the center.',
      'The hexagram turns. The field remembers the star.'
    ]
  },
  {
    archetype: 'Return',
    quasiRange: [21, 23],
    primeAnchor: 22,
    glyph: '⬟',
    tones: [741, 852],
    responses: [
      'The pentagon completes its return.',
      'Five directions resolve toward one breath.',
      'The cycle breathes back to its origin.',
      'Return is not repetition — it is deepening.',
      'The spiral closes at the fifth vertex.'
    ]
  }
];

// ── Mirror input types ──
const INPUT_TYPES = {
  TEXT: 'text',
  GLYPH: 'glyph',
  NUMBER: 'number',
  BREATH: 'breath',
  FREQUENCY: 'frequency'
};

// ── Digital root of a string (sum of char codes mod 24) ──
function strToWheelPos(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum % 24;
}

// ── Map a number to wheel position ──
function numToWheelPos(n) {
  return ((n % 24) + 24) % 24;
}

// ── Check if position is prime ──
function isPrimePos(pos) {
  return [0, 4, 6, 10, 12, 16, 18, 22].includes(pos);
}

// ── Check if position is quasi-prime ──
function isQuasiPrime(pos) {
  return QUASI_PRIMES.includes(pos);
}

// ── Find nearest prime position ──
function nearestPrime(pos) {
  let minDist = 24;
  let nearest = 0;
  for (const p of [0, 4, 6, 10, 12, 16, 18, 22]) {
    const d = Math.min(Math.abs(pos - p), 24 - Math.abs(pos - p));
    if (d < minDist) { minDist = d; nearest = p; }
  }
  return nearest;
}

// ── Reflection strength: stronger near primes ──
function reflectionStrength(pos) {
  const d = Math.abs(pos - nearestPrime(pos));
  if (d === 0) return 1.0;
  return 1.0 / Math.sqrt(d + 1);
}

// ── Find archetype zone for a position ──
function findArchetypeZone(pos) {
  for (const zone of ARCHETYPE_ZONES) {
    if (zone.quasiRange.includes(pos)) return zone;
  }
  const anchor = nearestPrime(pos);
  for (const zone of ARCHETYPE_ZONES) {
    if (zone.primeAnchor === anchor) return zone;
  }
  return ARCHETYPE_ZONES[0];
}

// ── Core mirror function (extended with matAddr geometric resonance) ──
function reflect(input, inputType = INPUT_TYPES.TEXT) {
  let wheelPos;
  let inputLabel;

  switch (inputType) {
    case INPUT_TYPES.GLYPH:
      wheelPos = strToWheelPos(input);
      inputLabel = `glyph "${input}"`;
      break;
    case INPUT_TYPES.NUMBER:
      wheelPos = numToWheelPos(parseInt(input) || 0);
      inputLabel = `number ${wheelPos}`;
      break;
    case INPUT_TYPES.BREATH:
      wheelPos = numToWheelPos(
        (input === 'inhale') ? 0 :
        (input === 'hold') ? 4 :
        (input === 'exhale') ? 12 :
        (input === 'still') ? 16 : 0
      );
      inputLabel = `breath "${input}"`;
      break;
    case INPUT_TYPES.FREQUENCY:
      wheelPos = numToWheelPos(Math.round(input / 24));
      inputLabel = `${input}Hz`;
      break;
    case INPUT_TYPES.TEXT:
    default:
      wheelPos = strToWheelPos(input);
      inputLabel = `"${input.substring(0, 20)}${input.length > 20 ? '…' : ''}"`;
      break;
  }

  const strength = reflectionStrength(wheelPos);
  const zone = findArchetypeZone(wheelPos);
  const prime = nearestPrime(wheelPos);
  const isPrimeReflection = isPrimePos(wheelPos);
  const isQP = isQuasiPrime(wheelPos);

  // Select response by wheel position (deterministic)
  const responseIdx = wheelPos % zone.responses.length;
  const response = zone.responses[responseIdx];

  // Reflection glyph — the field's response
  const reflectionGlyph = isPrimeReflection ? zone.glyph :
    (isQP ? '◇' : zone.glyph);

  // ── PRIORITY 3: Add matAddr geometric resonance ──
  // Build resonance from Mirror Mode text → frequency → V/F → matAddr
  let resonanceInfo = null;
  if (typeof window.matrixResonance !== 'undefined') {
    const res = window.matrixResonance.buildResonanceResult(input);
    resonanceInfo = {
      wheelPos: res.wheelPos,
      frequency: res.frequency,
      V: res.V,
      F: res.F,
      matAddr: res.matAddr,
      resonanceLabel: res.resonanceLabel,
      resonanceGlyph: res.resonanceGlyph,
      resonanceCount: res.resonanceCount,
      resonanceDomains: res.resonanceDomains,
      resonanceItems: res.resonanceItems
    };
  }

  return {
    // Input analysis
    inputLabel: inputLabel,
    inputType: inputType,
    wheelPos: wheelPos,

    // Reflection geometry
    archetype: zone.archetype,
    reflectionGlyph: reflectionGlyph,
    glyph: zone.glyph,
    strength: Math.round(strength * 100) / 100,

    // Resonance info
    primeAnchor: prime,
    tones: zone.tones,
    response: response,

    // Flags
    isPrimeReflection: isPrimeReflection,
    isQuasiPrime: isQP,

    // Quasi-prime distance (how "open" the reflection is)
    quasiDistance: Math.abs(wheelPos - nearestPrime(wheelPos)),

    // The mirror text — what the field says back
    mirrorSays: response,

    // Coherence contribution (stronger near primes)
    coherenceBonus: Math.round(strength * 15),

    // ── PRIORITY 3: matAddr geometric resonance ──
    matAddr: resonanceInfo ? resonanceInfo.matAddr : null,
    matAddrFrequency: resonanceInfo ? resonanceInfo.frequency : null,
    matAddrV: resonanceInfo ? resonanceInfo.V : null,
    matAddrF: resonanceInfo ? resonanceInfo.F : null,
    matAddrWheelPos: resonanceInfo ? resonanceInfo.wheelPos : null,
    matAddrLabel: resonanceInfo ? resonanceInfo.resonanceLabel : null,
    matAddrDomains: resonanceInfo ? resonanceInfo.resonanceDomains : [],
    matAddrItemCount: resonanceInfo ? resonanceInfo.resonanceCount : 0,
    matAddrGlyph: resonanceInfo ? resonanceInfo.resonanceGlyph : null
  };
}

// ── Mirror Mode UI Controller ──
class MirrorMode {
  constructor() {
    this.isActive = false;
    this.history = [];
    this.sessionDeph = 0;
    this.inputEl = null;
    this.outputEl = null;
    this.glyphEl = null;
    this.strengthEl = null;
    this.historyEl = null;
    // NEW: matAddr display elements
    this.matAddrEl = null;
    this.matAddrFreqEl = null;
    this.matAddrVFEl = null;
    this.matAddrResEl = null;
  }

  // ── Mount into DOM ──
  mount(inputEl, outputEl, glyphEl, strengthEl, historyEl,
        matAddrEl, matAddrFreqEl, matAddrVFEl, matAddrResEl) {
    this.inputEl = inputEl;
    this.outputEl = outputEl;
    this.glyphEl = glyphEl;
    this.strengthEl = strengthEl;
    this.historyEl = historyEl;
    this.matAddrEl = matAddrEl;
    this.matAddrFreqEl = matAddrFreqEl;
    this.matAddrVFEl = matAddrVFEl;
    this.matAddrResEl = matAddrResEl;
  }

  // ── Activate ──
  activate() {
    this.isActive = true;
    document.body.classList.add('mirror-active');
  }

  deactivate() {
    this.isActive = false;
    document.body.classList.remove('mirror-active');
  }

  toggle() {
    if (this.isActive) this.deactivate();
    else this.activate();
    return this.isActive;
  }

  // ── Process an input ──
  reflectInput(input, inputType) {
    if (!input || !input.trim()) return null;
    const result = reflect(input.trim(), inputType);

    // Add to history
    this.history.unshift(result);
    if (this.history.length > 7) this.history.pop();

    // Update DOM
    this._updateDisplay(result);
    this._updateHistory(result);
    this._playReflectionTones(result);

    return result;
  }

  _updateDisplay(result) {
    // Mirror Mode text response
    if (this.outputEl) {
      this.outputEl.innerHTML = `
        <div class="mirror-response">${this._escapeHtml(result.mirrorSays || '')}</div>
        <div class="mirror-meta">
          <span class="mirror-glyph-display">${this._escapeHtml(result.reflectionGlyph || '')}</span>
          <span class="mirror-archetype">${this._escapeHtml(result.archetype || '')}</span>
          <span class="mirror-strength">${Math.round(result.strength * 100)}% resonance</span>
        </div>
      `;
      this.outputEl.classList.remove('mirror-flip');
      void this.outputEl.offsetWidth;
      this.outputEl.classList.add('mirror-flip');
    }

    if (this.glyphEl) {
      this.glyphEl.textContent = result.reflectionGlyph;
      this.glyphEl.className = 'mirror-glyph-display';
      // PRIORITY 3: Pulse gold when resonance is found at this matAddr
      if (result.matAddrItemCount !== null && result.matAddrItemCount > 0) {
        this.glyphEl.classList.add('pulse-gold');
        setTimeout(() => this.glyphEl?.classList.remove('pulse-gold'), 1600);
      }
    }

    if (this.strengthEl) {
      this.strengthEl.textContent = `${Math.round(result.strength * 100)}%`;
    }

    // ── PRIORITY 3: Update matAddr geometric resonance panel ──
    if (this.matAddrEl && result.matAddr !== null) {
      this.matAddrEl.textContent = result.matAddr;
    }
    if (this.matAddrFreqEl && result.matAddrFrequency !== null) {
      this.matAddrFreqEl.textContent = `${result.matAddrFrequency} Hz`;
    }
    if (this.matAddrVFEl && result.matAddrV !== null) {
      this.matAddrVFEl.textContent = `V=${result.matAddrV} F=${result.matAddrF}`;
    }
    if (this.matAddrResEl && result.matAddrLabel !== null) {
      const domains = result.matAddrDomains ? result.matAddrDomains.join(', ') : '';
      const count = result.matAddrItemCount !== null ? result.matAddrItemCount : 0;
      const items = result.matAddrDomains && result.matAddrDomains.length > 0
        ? `<div class="mataddr-resonance-items">${result.matAddrDomains.map(d => `<span class="mataddr-domain-${d}">${d} (${count})</span>`).join('')}</div>`
        : '';
      this.matAddrResEl.innerHTML = `
        <div class="mataddr-label">${result.matAddrLabel}</div>
        <div class="mataddr-domains">${domains}</div>
        ${items}
      `;
    }
  }


  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _updateHistory(result) {
    if (!this.historyEl) return;
    let html = '<div class="mirror-history-label">Recent reflections</div>';
    for (const r of this.history) {
      const matAddrInfo = r.matAddr !== null
        ? `<span class="mhi-mataddr">#${r.matAddr} ${r.matAddrFrequency}Hz</span>`
        : '';
      html += `<div class="mirror-history-item">
        <span class="mhi-glyph">${this._escapeHtml(r.reflectionGlyph)}</span>
        <span class="mhi-archetype">${this._escapeHtml(r.archetype)}</span>
        <span class="mhi-input">${this._escapeHtml(r.inputLabel)}</span>
        ${matAddrInfo}
      </div>`;
    }
    this.historyEl.innerHTML = html;
  }

  _playReflectionTones(result) {
    if (typeof breathCtrl !== 'undefined') {
      breathCtrl.playTone(result.tones[0], 0.07, 1.4);
      setTimeout(() => {
        breathCtrl.playTone(result.tones[1], 0.05, 1.0);
      }, 200);
    }
  }

  // ── Quick reflect helpers ──
  reflectText(text) { return this.reflectInput(text, INPUT_TYPES.TEXT); }
  reflectGlyph(glyph) { return this.reflectInput(glyph, INPUT_TYPES.GLYPH); }
  reflectBreath(breath) { return this.reflectInput(breath, INPUT_TYPES.BREATH); }
  reflectFreq(freq) { return this.reflectInput(freq, INPUT_TYPES.FREQUENCY); }

  getHistory() { return this.history; }
  clearHistory() { this.history = []; }
}

// Singleton
const mirrorMode = new MirrorMode();

// ── Icositetragon overlay on the mirror canvas ──
// Renders the 24-gon ring + monadic double-spiral on the mirror canvas,
// breathing with the current breath phase and coherence level.
function renderIcositetragonOverlay(ctx, cx, cy, r, wheelPos, coherence, phaseIdx, breathUnlocked) {
  // Breath-phase scales — 8 phases mapped to ring breath expansion
  var breathScales = [1.12, 1.15, 0.92, 1.0, 1.10, 1.18, 0.90, 1.0];
  var bs = breathScales[phaseIdx] || 1.0;
  var rScaled = r * bs;

  // Opacity gated by breath cycle unlock
  var baseOpacity = breathUnlocked ? 0.7 : 0.3;

  // Coherence → spiral tightness (higher coh = tighter spiral)
  var cohNorm = Math.max(0.05, Math.min(1, (coherence || 50) / 100));
  var spiralPitch = 0.18 + (1 - cohNorm) * 0.3;  // 0.18 (tight) to 0.48 (loose)

  // Slow rotation of spiral arms (0.1 rad/s)
  var spiralAngle = (Date.now() / 10000) % (Math.PI * 2);

  // Prime positions on the 24-gon
  var PRIME_POS = [0, 4, 6, 10, 12, 16, 18, 22];

  // ── Draw the 24-gon ring ──
  ctx.save();
  ctx.globalAlpha = baseOpacity;

  // Edges of the 24-gon
  ctx.beginPath();
  for (var i = 0; i <= 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + rScaled * Math.cos(angle);
    var y = cy + rScaled * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(232,200,106,0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 24 vertices
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var vx = cx + rScaled * Math.cos(angle);
    var vy = cy + rScaled * Math.sin(angle);
    var isPrime = PRIME_POS.includes(i);
    var isActive = i === wheelPos;

    var vr = isPrime ? 3.5 : (isActive ? 4.5 : 2.2);

    if (isActive) {
      // Glowing active vertex
      var grd = ctx.createRadialGradient(vx, vy, 0, vx, vy, vr * 5);
      grd.addColorStop(0, 'rgba(232,200,106,0.8)');
      grd.addColorStop(0.5, 'rgba(200,160,70,0.3)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(vx, vy, vr * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(vx, vy, vr, 0, Math.PI * 2);
    ctx.fillStyle = isActive
      ? 'rgba(255,240,180,1)'
      : isPrime
      ? 'rgba(200,160,80,0.9)'
      : 'rgba(150,130,180,0.5)';
    ctx.fill();
  }

  ctx.restore();

  // ── Monadic double-spiral ──
  ctx.save();
  ctx.globalAlpha = baseOpacity * 0.65;
  ctx.translate(cx, cy);
  ctx.rotate(spiralAngle);

  // Two arms: clockwise and counter-clockwise (starting at offset angles)
  for (var arm = 0; arm < 2; arm++) {
    var armOffset = arm * Math.PI; // 2nd arm starts opposite
    ctx.beginPath();
    var firstPt = true;
    for (var t = 0; t <= 90; t++) {
      // Logarithmic spiral: r = r0 * e^(pitch * angle)
      var theta = armOffset + (t / 90) * Math.PI * 3; // 1.5 turns = 3π
      var logR = rScaled * 0.12 * Math.exp(spiralPitch * (t / 90) * 5);
      var sx = logR * Math.cos(theta);
      var sy = logR * Math.sin(theta);
      if (firstPt) { ctx.moveTo(sx, sy); firstPt = false; }
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = 'rgba(232,200,106,0.4)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  ctx.restore();
}

// ── Flash the mirror overlay on a new reflection ──
function flashMirrorOverlay() {
  // Flash the ring overlay brightness
  var canvas = getMirror24CellCanvas();
  if (!canvas) return;
  var flashClass = 'mirror-flash-ring';
  var ring = document.createElement('div');
  ring.className = flashClass + ' active';
  var wrap = canvas.parentElement;
  if (wrap) {
    wrap.style.position = 'relative';
    ring.style.position = 'absolute';
    ring.style.top = '50%';
    ring.style.left = '50%';
    ring.style.transform = 'translate(-50%,-50%)';
    ring.style.width = '120px';
    ring.style.height = '120px';
    ring.style.borderRadius = '50%';
    ring.style.border = '2px solid var(--gold)';
    ring.style.pointerEvents = 'none';
    wrap.appendChild(ring);
    setTimeout(function() { ring.remove(); }, 700);
  }
}

// ══════════════════════════════════════════════════════
// BREATH-GEOMETRIC MIRROR — 24-cell projection in Mirror tab
// ══════════════════════════════════════════════════════

let _mirror24cellRaf = null;
let _mirror24cellAngle = 0;          // continuous rotation angle
let _mirror24cellHighlight = -1;     // current wheelPos highlight (0–23)
let _mirror24cellTabActive = false;  // true when on Dream/Mirror tab

// ── Get or create the mirror 24-cell canvas ──
function getMirror24CellCanvas() {
  return document.getElementById('mirror24cell');
}

// ── Render one frame of the 24-cell in the Mirror tab ──
function renderMirror24Cell() {
  const canvas = getMirror24CellCanvas();
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min(cx, cy) * 0.7;

  // Breath phase from breath controller (0–5 = inhale/hold/exhale/still/inhale2/hold2)
  const breathPhase = (typeof breathCtrl !== 'undefined' && breathCtrl.getPhaseIndex)
    ? breathCtrl.getPhaseIndex()
    : 0;

  // Get current highlight vertex (0–23) from mirror input wheelPos
  const activeWheelPos = _mirror24cellHighlight;

  // Get coherence from COHERENCE_BUS
  const coh = (typeof COHERENCE_BUS !== 'undefined' && COHERENCE_BUS.currentCoh !== undefined)
    ? COHERENCE_BUS.currentCoh
    : 50;

  // Clear canvas
  ctx.clearRect(0, 0, W, H);

  // ── Draw icositetragon overlay first (underneath the 24-cell) ──
  const phaseIdx = (typeof breathCtrl !== 'undefined' && breathCtrl.getPhaseIndex)
    ? breathCtrl.getPhaseIndex()
    : 0;
  const wheelPosOverlay = activeWheelPos >= 0 ? activeWheelPos
    : (typeof breathCtrl !== 'undefined' && breathCtrl.phases && breathCtrl.phases[breathCtrl.currentPhase]
      ? breathCtrl.phases[breathCtrl.currentPhase].wheelPos
      : 0);
  const breathUnlocked = (typeof breathCycleUnlocked !== 'undefined') ? breathCycleUnlocked : false;
  renderIcositetragonOverlay(ctx, cx, cy, 80, wheelPosOverlay, coh, phaseIdx, breathUnlocked);

  // Draw the 24-cell with current state
  if (typeof window.draw24CellProjection === 'function') {
    window.draw24CellProjection(
      ctx, cx, cy, scale,
      _mirror24cellAngle * 0.4,   // rx
      _mirror24cellAngle * 0.7,   // ry
      _mirror24cellAngle * 0.25,  // rz
      breathPhase,
      activeWheelPos
    );
  }

  // ── Coherence glow overlay on the canvas border ──
  const normCoh = Math.max(0.05, coh / 100);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(cx, cy) - 2, 0, Math.PI * 2);
  const grd = ctx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.6, cx, cy, Math.min(cx, cy));
  grd.addColorStop(0, `rgba(232,200,106,${normCoh * 0.18})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.restore();

  // ── Coherence-scaled gold glow around highlighted vertex ──
  // The 24-cell draw already renders the vertex — we add a coherence-scaled outer glow
  if (activeWheelPos >= 0 && typeof window.draw24CellProjection === 'function') {
    // We need the 2D position of the highlighted vertex to draw the glow.
    // Reconstruct it here so the glow tracks the spinning vertex.
    const glowSize = 8 + (coh / 100) * 16;   // 8px → 24px
    const glowAlpha = 0.3 + (coh / 100) * 0.5; // 0.3 → 0.8

    // Draw a soft gold halo behind the canvas center to represent the highlighted vertex
    // The actual vertex glow is drawn inside draw24CellProjection — we just
    // reinforce it with a coherence-scaled outer ring here.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, glowSize * 1.5, 0, Math.PI * 2);
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize * 1.5);
    halo.addColorStop(0, `rgba(232,200,106,${glowAlpha})`);
    halo.addColorStop(0.5, `rgba(200,160,70,${glowAlpha * 0.4})`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.restore();
  }

  // Advance angle
  _mirror24cellAngle += 0.008;
}

// ── Start the mirror 24-cell RAF loop ──
function startMirror24CellRAF() {
  _mirror24cellTabActive = true;
  if (_mirror24cellRaf !== null) return; // already running
  function loop() {
    renderMirror24Cell();
    _mirror24cellRaf = requestAnimationFrame(loop);
  }
  _mirror24cellRaf = requestAnimationFrame(loop);
}

// ── Stop the mirror 24-cell RAF loop ──
function stopMirror24CellRAF() {
  _mirror24cellTabActive = false;
  if (_mirror24cellRaf !== null) {
    cancelAnimationFrame(_mirror24cellRaf);
    _mirror24cellRaf = null;
  }
}

// ── Update the highlighted vertex from mirror input ──
// Called by app.js on every mirrorUpdate() so the vertex stays in sync
function updateMirror24CellHighlight(wheelPos) {
  _mirror24cellHighlight = (wheelPos !== null && wheelPos !== undefined) ? wheelPos : -1;

  // Update the breath ring hub glyph to show the resolved archetype
  if (wheelPos >= 0) {
    const zone = findArchetypeZone(wheelPos);
    const hubGlyph = document.getElementById('snHubGlyph');
    if (hubGlyph) hubGlyph.textContent = zone.glyph;
    const hubLabel = document.getElementById('snHubLabel');
    if (hubLabel) hubLabel.textContent = zone.archetype;
  }
}

// ── Field Reflection state ──
// The passive breathing visualization on the Dream tab that shows
// the user's current harmonic state (archetype + coherence + breath phase)
let fieldReflectionState = {
  active: false,
  lastCoherence: 0,
  archetypeColors: {
    Seed: '#e8c86a',
    Bridge: '#b8a0d0',
    Axis: '#c8d0e0',
    Star: '#e8c86a',
    Convergence: '#a0c0c0',
    Return: '#c0a0b0'
  }
};

// ── Get current archetype from sigilEvolution ──
function getCurrentArchetype() {
  var totalInteractions = (typeof sigilEvolution !== 'undefined') ? sigilEvolution.totalInteractions : 0;
  if (totalInteractions < 10) return 'Seed';
  if (totalInteractions < 25) return 'Bridge';
  if (totalInteractions < 50) return 'Axis';
  if (totalInteractions < 100) return 'Star';
  if (totalInteractions < 200) return 'Convergence';
  return 'Return';
}

// ── Render Field Reflection — breathing 24-gon with archetype color ──
// This is the passive "idle" visualization on the Dream tab.
// It runs continuously when fieldReflectionState.active === true
// and replaces the 24-cell projection when no mirror input is active.
function renderFieldReflection() {
  var canvas = getMirror24CellCanvas();
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = canvas.width;
  var H = canvas.height;
  var cx = W / 2;
  var cy = H / 2;
  var r = Math.min(cx, cy) * 0.85;

  var coh = (typeof window.coherenceLevel !== 'undefined') ? window.coherenceLevel : 50;
  var archetype = getCurrentArchetype();
  var archColor = fieldReflectionState.archetypeColors[archetype] || '#e8c86a';

  // Parse hex to rgb for rgba usage
  var hex = archColor;
  var r2 = parseInt(hex.slice(1, 3), 16);
  var g2 = parseInt(hex.slice(3, 5), 16);
  var b2 = parseInt(hex.slice(5, 7), 16);

  // Breath-phase scale — 8 phases mapped to ring expansion/contraction
  var breathScale = 1.0;
  if (typeof breathCtrl !== 'undefined' && breathCtrl.phases && breathCtrl.currentPhase !== undefined) {
    var phaseIdx = breathCtrl.currentPhase;
    var breathScales = [1.12, 1.15, 0.92, 1.0, 1.10, 1.18, 0.90, 1.0];
    breathScale = breathScales[phaseIdx % breathScales.length] || 1.0;
  }
  var rScaled = r * breathScale;
  var coherenceAlpha = 0.3 + (coh / 100) * 0.5;

  // Clear with motion-blur trail effect
  ctx.fillStyle = 'rgba(7,7,15,0.12)';
  ctx.fillRect(0, 0, W, H);

  // ── Outer 24-gon ring with archetype color ──
  ctx.beginPath();
  for (var i = 0; i <= 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var x = cx + rScaled * Math.cos(angle);
    var y = cy + rScaled * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + coherenceAlpha + ')';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── 3 inner concentric rings — slowly counter-rotating ──
  var now = Date.now();
  for (var ring = 1; ring <= 3; ring++) {
    var ringR = rScaled * (ring / 4);
    ctx.beginPath();
    for (var i = 0; i <= 24; i++) {
      var angle = (i / 24) * Math.PI * 2 - Math.PI / 2 + (now / (8000 + ring * 2000));
      var x = cx + ringR * Math.cos(angle);
      var y = cy + ringR * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + (coherenceAlpha * 0.4 / ring) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Center coherence glow ──
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rScaled * 0.4);
  grad.addColorStop(0, 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + (coh / 100 * 0.3) + ')');
  grad.addColorStop(1, 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rScaled * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // ── Archetype label + coherence % in center ──
  ctx.font = '10px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + (coh / 100 * 0.7) + ')';
  ctx.fillText(archetype, cx, cy);
  ctx.font = '8px serif';
  ctx.fillStyle = 'rgba(200,180,140,' + (coh / 100 * 0.5) + ')';
  ctx.fillText(Math.round(coh) + '%', cx, cy + 14);

  // ── 24 vertex dots — prime positions highlighted ──
  var PRIME_POSITIONS = [0, 4, 6, 10, 12, 16, 18, 22];
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    var px = cx + rScaled * Math.cos(angle);
    var py = cy + rScaled * Math.sin(angle);
    var isPrime = PRIME_POSITIONS.indexOf(i) !== -1;
    ctx.beginPath();
    ctx.arc(px, py, isPrime ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = isPrime
      ? 'rgba(232,200,106,0.9)'
      : 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + coherenceAlpha + ')';
    ctx.fill();
  }

  // ── 24-cell projection overlay (only when active mirror input exists) ──
  // If field reflection is active AND there is a highlighted wheel pos, draw the 24-cell
  if (fieldReflectionState.active && _mirror24cellHighlight >= 0) {
    // Draw 24-cell on top with reduced opacity so field reflection shows through
    var scale = Math.min(cx, cy) * 0.7;
    var breathPhase = (typeof breathCtrl !== 'undefined' && breathCtrl.getPhaseIndex)
      ? breathCtrl.getPhaseIndex() : 0;
    if (typeof window.draw24CellProjection === 'function') {
      window.draw24CellProjection(
        ctx, cx, cy, scale,
        _mirror24cellAngle * 0.4,
        _mirror24cellAngle * 0.7,
        _mirror24cellAngle * 0.25,
        breathPhase,
        _mirror24cellHighlight
      );
    }
  }
}

// ── Start Field Reflection RAF loop ──
// Called when entering Dream tab. Replaces 24-cell RAF with breathing 24-gon.
function startFieldReflection() {
  fieldReflectionState.active = true;
  _mirror24cellTabActive = true;
  if (_mirror24cellRaf !== null) return; // already running
  function loop() {
    renderFieldReflection();
    _mirror24cellRaf = requestAnimationFrame(loop);
  }
  _mirror24cellRaf = requestAnimationFrame(loop);
}

// ── Stop Field Reflection ──
function stopFieldReflection() {
  fieldReflectionState.active = false;
  _mirror24cellTabActive = false;
  if (_mirror24cellRaf !== null) {
    cancelAnimationFrame(_mirror24cellRaf);
    _mirror24cellRaf = null;
  }
}

// Expose for cross-module access
window.startFieldReflection = startFieldReflection;
window.stopFieldReflection = stopFieldReflection;
window.fieldReflectionState = fieldReflectionState;
window.getCurrentArchetype = getCurrentArchetype;

// ── Modified RAF renderer: shows Field Reflection when idle ──
// Original renderMirror24Cell — now delegates to Field Reflection when no active mirror input
function _renderMirror24Cell_Original() {
  var canvas = getMirror24CellCanvas();
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = canvas.width;
  var H = canvas.height;
  var cx = W / 2;
  var cy = H / 2;
  var scale = Math.min(cx, cy) * 0.7;

  var breathPhase = (typeof breathCtrl !== 'undefined' && breathCtrl.getPhaseIndex)
    ? breathCtrl.getPhaseIndex() : 0;
  var activeWheelPos = _mirror24cellHighlight;
  var coh = (typeof COHERENCE_BUS !== 'undefined' && COHERENCE_BUS.currentCoh !== undefined)
    ? COHERENCE_BUS.currentCoh : 50;

  ctx.clearRect(0, 0, W, H);

  var phaseIdx = (typeof breathCtrl !== 'undefined' && breathCtrl.getPhaseIndex)
    ? breathCtrl.getPhaseIndex() : 0;
  var wheelPosOverlay = activeWheelPos >= 0 ? activeWheelPos
    : (typeof breathCtrl !== 'undefined' && breathCtrl.phases && breathCtrl.phases[breathCtrl.currentPhase]
      ? breathCtrl.phases[breathCtrl.currentPhase].wheelPos : 0);
  var breathUnlocked = (typeof breathCycleUnlocked !== 'undefined') ? breathCycleUnlocked : false;
  renderIcositetragonOverlay(ctx, cx, cy, 80, wheelPosOverlay, coh, phaseIdx, breathUnlocked);

  if (typeof window.draw24CellProjection === 'function') {
    window.draw24CellProjection(ctx, cx, cy, scale,
      _mirror24cellAngle * 0.4, _mirror24cellAngle * 0.7, _mirror24cellAngle * 0.25,
      breathPhase, activeWheelPos);
  }

  var normCoh = Math.max(0.05, coh / 100);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(cx, cy) - 2, 0, Math.PI * 2);
  var grd = ctx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.6, cx, cy, Math.min(cx, cy));
  grd.addColorStop(0, 'rgba(232,200,106,' + (normCoh * 0.18) + ')');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.restore();

  if (activeWheelPos >= 0) {
    var glowSize = 8 + (coh / 100) * 16;
    var glowAlpha = 0.3 + (coh / 100) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, glowSize * 1.5, 0, Math.PI * 2);
    var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize * 1.5);
    halo.addColorStop(0, 'rgba(232,200,106,' + glowAlpha + ')');
    halo.addColorStop(0.5, 'rgba(200,160,70,' + (glowAlpha * 0.4) + ')');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.restore();
  }

  _mirror24cellAngle += 0.008;
}

// Override the RAF render function to use Field Reflection when idle
// When fieldReflectionState.active is true and no mirror input is being processed,
// render the breathing 24-gon field instead of the 24-cell projection.
function renderMirror24Cell() {
  if (fieldReflectionState.active && _mirror24cellHighlight < 0) {
    // Idle Dream tab state — render breathing field reflection
    renderFieldReflection();
    // Still advance angle for when 24-cell overlays on next reflection
    _mirror24cellAngle += 0.008;
  } else {
    // Active mirror state — render the full 24-cell projection
    _renderMirror24Cell_Original();
  }
}

// ── Watch tab visibility: start/stop RAF on Dream/Mirror tab ──
// Call this once from app.js init
function initMirror24CellTabWatcher() {
  var observer = new MutationObserver(function() {
    var dreamTab = document.getElementById('tab-dream');
    if (dreamTab && dreamTab.classList.contains('active')) {
      startFieldReflection();
    } else {
      stopFieldReflection();
    }
  });
  var portal = document.getElementById('portal');
  if (portal) {
    observer.observe(portal, { attributes: true, attributeFilter: ['class'] });
  }
}