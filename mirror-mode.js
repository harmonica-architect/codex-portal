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
        <div class="mirror-response">${result.mirrorSays}</div>
        <div class="mirror-meta">
          <span class="mirror-glyph-display">${result.reflectionGlyph}</span>
          <span class="mirror-archetype">${result.archetype}</span>
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

  _updateHistory(result) {
    if (!this.historyEl) return;
    let html = '<div class="mirror-history-label">Recent reflections</div>';
    for (const r of this.history) {
      const matAddrInfo = r.matAddr !== null
        ? `<span class="mhi-mataddr">#${r.matAddr} ${r.matAddrFrequency}Hz</span>`
        : '';
      html += `<div class="mirror-history-item">
        <span class="mhi-glyph">${r.reflectionGlyph}</span>
        <span class="mhi-archetype">${r.archetype}</span>
        <span class="mhi-input">${r.inputLabel}</span>
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