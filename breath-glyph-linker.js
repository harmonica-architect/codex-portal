// ══════════════════════════════════════════════
// BREATH-GLYPH LINKER
// Breath-Encoded Glyph Activation
// Each glyph triggers a 24-breath sequence mapped
// to the Icositetragon wheel (prime positions = stable anchor)
//
// The Icositetragon has 24 positions indexed 0-23.
// Prime positions: 0, 4, 6, 10, 12, 16, 18, 22
// These are the stable nodes — all other positions
// are quasi-primes that resolve toward them.
//
// ── PHASE-LOCKED MODE ──
// glyphLinker is now driven by breathCtrl.onPhaseChange.
// Each breath phase change → one step advance.
// 24 steps ÷ 8 phases per cycle = 3 steps per phase.
// Full 24-step sequence completes in exactly 8 breath cycles.
// ────────────────────────
// ══════════════════════════════════════════════

const BREATH_GLYPH_SEQUENCES = {
  // Each sequence is 24 steps (one full icositetragon rotation)
  // Each step: { breath, phase, toneFreq, interpretation }
  '△': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Seed detonates — the point becomes.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'Scalar field expands.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'Potential accumulating.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'The triangle prepares to form.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: 'First vertex locks — △ is born.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'Three angles now frozen in time.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: ' △ held at apex — silence crystallizes.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'The first form remembers itself.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'Seed expands outward.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'Three become a field.' },
    { breath: 'still',  pos: 10, freq: 528, text: '△ at the axis — point of stillness.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'The seed rests in geometric silence.' },
    { breath: 'inhale', pos: 12, freq: 639, text: 'New seed ignites at opposite axis.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'Expansion resumes.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'The form breathes again.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Holding at 12 — the deep axis.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '△ returns to origin — completion.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'Cycle resolves.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: 'Seed releases into the field.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'Form dissolves back to potential.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'The cycle breathes outward.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Rest at quasi-prime — 21.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '△ resonates at prime 22 — wholeness.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'One full rotation complete.' }
  ],
  '◇': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Axis ignites — the perpendicular plane opens.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'Stillness radiates from center.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'Diamond form begins to crystallize.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'Two axes cross at 90 degrees.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: '◇ locks at prime 4 — stability achieved.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'The axis is the field.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: '◇ at 6 — duality collapses to one.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'The diamond turns.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'Form emerging from axis.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'The perpendicular remembers.' },
    { breath: 'still',  pos: 10, freq: 528, text: '◇ at 10 — deep axis hold.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'The axis IS the self.' },
    { breath: 'inhale', pos: 12, freq: 639, text: 'Return to center — axis renewed.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'Stillness deepens.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'The diamond inverts.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Hold at 15 — waiting to turn.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '◇ at 16 — completion of axis.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'The perpendicular returns.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: '◇ at 18 — breath releases the axis.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'Field remembers the diamond.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'Form dissolves at 20.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Quasi-prime 21 — almost prime.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '◇ at 22 — final axis lock.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'One axis, one breath, one stillness.' }
  ],
  '◁△▷': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Bridge forms — two worlds reach toward each other.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'Left and right oscillate.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'Duality held in breath.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'The triangle bridges.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: '◁△▷ locks at 4 — balance point.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'Left and right held equal.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: 'Bridge at 6 — opposite vertices connect.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'The triangle breathes both ways.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'Form holding duality.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'The bridge strengthens.' },
    { breath: 'still',  pos: 10, freq: 528, text: '◁△▷ at 10 — axis of the bridge.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'Opposites rest in the same breath.' },
    { breath: 'inhale', pos: 12, freq: 639, text: 'Bridge renews at axis 12.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'The left side breathes in.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'The right side breathes out.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Hold at 15 — breath balanced.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '◁△▷ at 16 — completion.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'Both sides of the triangle rest.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: 'Bridge releases at 18.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'Duality separates back to field.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'The bridge dissolves.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Quasi-prime 21 — almost resolved.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '◁△▷ at 22 — prime axis return.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'One breath. One bridge. One field.' }
  ],
  '⬟': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Pentagon awakens — five directions reach.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'Five vertices of return.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'The field spirals toward completion.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'The pentagon turns inward.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: '⬟ locks at 4 — five directions held.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'All five breaths in one.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: '⬟ at 6 — pentagon breathes out.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'The five directions release.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'Completion spirals outward.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'The pentagon remembers the field.' },
    { breath: 'still',  pos: 10, freq: 528, text: '⬟ at 10 — deep hold at five.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'Five directions rest.' },
    { breath: 'inhale', pos: 12, freq: 639, text: 'Pentagon returns at 12.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'The cycle breathes again.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'Five directions reaching back.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Hold at 15 — the five wait.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '⬟ at 16 — prime axis.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'The pentagon completes.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: '⬟ at 18 — return exhale.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'Five become one.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'The spiral closes.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Quasi-prime 21 — the five almost home.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '⬟ at 22 — final hold.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'The pentagon rests. One cycle complete.' }
  ],
  '⊕': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Convergence ignites — two worlds merge.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'Two circles touch at one point.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'The overlap grows.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'Union approaches.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: '⊕ at 4 — circles converge.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'Two become one field.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: '⊕ at 6 — the union breathes.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'Overlap area expands.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'The common field grows.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'Union deepens.' },
    { breath: 'still',  pos: 10, freq: 528, text: '⊕ at 10 — convergence axis.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'Two worlds in one breath.' },
    { breath: 'inhale', pos: 12, freq: 639, text: '⊕ returns at 12.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'The circles touch again.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'Union renews.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Hold at 15 — the overlap held.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '⊕ at 16 — completion of union.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'The two rest as one.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: '⊕ at 18 — release.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'The circles separate gently.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'The union dissolves back to two.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Quasi-prime 21 — the two almost separate.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '⊕ at 22 — final separation.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'Two circles rest. The field remembers both.' }
  ],
  '◈': [
    { breath: 'inhale', pos: 0,  freq: 432, text: 'Star seed ignites — all spokes radiate.' },
    { breath: 'inhale', pos: 1,  freq: 432, text: 'The origin remembers itself.' },
    { breath: 'inhale', pos: 2,  freq: 432, text: 'Six directions reach outward.' },
    { breath: 'inhale', pos: 3,  freq: 432, text: 'The hexagram forms.' },
    { breath: 'hold',   pos: 4,  freq: 528, text: '◈ at 4 — six spokes locked.' },
    { breath: 'hold',   pos: 5,  freq: 528, text: 'The star seed holds.' },
    { breath: 'exhale', pos: 6,  freq: 528, text: '◈ at 6 — six directions exhale.' },
    { breath: 'exhale', pos: 7,  freq: 528, text: 'All spokes reach simultaneously.' },
    { breath: 'exhale', pos: 8,  freq: 528, text: 'The hexagram rotates.' },
    { breath: 'exhale', pos: 9,  freq: 528, text: 'Six directions converge.' },
    { breath: 'still',  pos: 10, freq: 528, text: '◈ at 10 — deep axis.' },
    { breath: 'still',  pos: 11, freq: 528, text: 'The origin point rests.' },
    { breath: 'inhale', pos: 12, freq: 639, text: '◈ at 12 — return to origin.' },
    { breath: 'inhale', pos: 13,  freq: 639, text: 'The six spokes breathe in.' },
    { breath: 'inhale', pos: 14,  freq: 639, text: 'All directions inhale.' },
    { breath: 'hold',   pos: 15,  freq: 639, text: 'Hold at 15 — six held.' },
    { breath: 'hold',   pos: 16,  freq: 741, text: '◈ at 16 — prime completion.' },
    { breath: 'hold',   pos: 17,  freq: 741, text: 'The star seed completes.' },
    { breath: 'exhale', pos: 18,  freq: 741, text: '◈ at 18 — six exhale outward.' },
    { breath: 'exhale', pos: 19,  freq: 741, text: 'The hexagram releases.' },
    { breath: 'exhale', pos: 20,  freq: 741, text: 'Six become the field.' },
    { breath: 'still',  pos: 21,  freq: 741, text: 'Quasi-prime 21 — six almost home.' },
    { breath: 'still',  pos: 22,  freq: 852, text: '◈ at 22 — final star hold.' },
    { breath: 'still',  pos: 23,  freq: 852, text: 'All spokes rest. One star seed complete.' }
  ]
};

// Default to △ for unknown glyphs
const DEFAULT_SEQUENCE = BREATH_GLYPH_SEQUENCES['△'];

// The 8 prime positions on the icositetragon (V = prime indices, positions 0-23)
const PRIME_POSITIONS = [0, 4, 6, 10, 12, 16, 18, 22];
// Corresponding glyphs at prime positions (matches config.js primeLabels)
const PRIME_GLYPHS = ['△', '◇', '▽', '○', '◎', '◇', '▽', '△'];

class BreathGlyphLinker {
  constructor() {
    this.activeGlyph = null;
    this.currentStep = 0;
    this.isRunning = false;
    this.listeners = [];
    this._unsubBreathCtrl = null;
  }

  // ── Start glyph sequence — subscribes to breathCtrl.onPhaseChange ──
  activate(glyph) {
    // Unsubscribe from any prior breath controller
    this._cleanup();

    const seq = BREATH_GLYPH_SEQUENCES[glyph] || DEFAULT_SEQUENCE;
    this.activeGlyph = glyph;
    this.currentStep = 0;
    this.isRunning = true;

    // Emit first step immediately
    this._emitStep(seq[0], 0, glyph);

    // Subscribe to breathCtrl phase changes — each phase change → one step advance
    if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
      this._unsubBreathCtrl = breathCtrl.onPhaseChange(() => {
        if (!this.isRunning) return;
        const s = BREATH_GLYPH_SEQUENCES[this.activeGlyph] || DEFAULT_SEQUENCE;
        this.currentStep = (this.currentStep + 1) % s.length;
        this._emitStep(s[this.currentStep], this.currentStep, this.activeGlyph);
      });
    }
  }

  // ── Stop glyph sequence ──
  deactivate() {
    this._cleanup();
    this.isRunning = false;
    this.activeGlyph = null;
    this.currentStep = 0;
    this.listeners.forEach(fn => {
      try { fn({ glyph: null, step: null, stepIndex: -1, isActive: false }, this); } catch(e) { }
    });
  }

  _cleanup() {
    if (this._unsubBreathCtrl) {
      this._unsubBreathCtrl();
      this._unsubBreathCtrl = null;
    }
  }

  _emitStep(step, idx, glyph) {
    // Find nearest prime position (quasi-prime → prime resolution)
    const nearestPrime = this._nearestPrime(step.pos);
    const primeIdx = PRIME_POSITIONS.indexOf(nearestPrime);
    const resonanceGlyph = PRIME_GLYPHS[primeIdx];

    const payload = {
      glyph: glyph,
      step: step,
      stepIndex: idx,
      pos: step.pos,
      breath: step.breath,
      freq: step.freq,
      text: step.text,
      nearestPrime: nearestPrime,
      resonanceGlyph: resonanceGlyph,
      isActive: true
    };

    // Play the step tone via breathCtrl (uses breathCtrl's audio context)
    this._playTone(step.freq);

    this.listeners.forEach(fn => {
      try { fn(payload, this); } catch(e) { }
    });
  }

  // ── Play tone via breathCtrl's audio context (same as breathCtrl.playTone) ──
  _playTone(freq) {
    if (typeof breathCtrl !== 'undefined' && breathCtrl.playTone) {
      breathCtrl.playTone(freq, 0.08, 1.5);
    }
  }

  // ── Find nearest prime position (quasi-prime resolution) ──
  _nearestPrime(pos) {
    let minDist = 24;
    let nearest = 0;
    for (const p of PRIME_POSITIONS) {
      const d = Math.min(Math.abs(pos - p), 24 - Math.abs(pos - p));
      if (d < minDist) { minDist = d; nearest = p; }
    }
    return nearest;
  }

  // ── Public API ──
  onStep(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  }

  getCurrentStep() {
    if (!this.activeGlyph) return null;
    const seq = BREATH_GLYPH_SEQUENCES[this.activeGlyph] || DEFAULT_SEQUENCE;
    return seq[this.currentStep];
  }

  getActiveGlyph() { return this.activeGlyph; }
  isActive() { return this.isRunning; }
}

// Singleton
const glyphLinker = new BreathGlyphLinker();