// ══════════════════════════════════════════════
// BREATH CONTROLLER — The Breath Loop Engine
// Drives ALL UI animation via breath phases
// ══════════════════════════════════════════════

// ── PYTHAGOREAN 24-TONE HARMONIC SERIES ──
// Each wheel position (0–23) maps to a frequency via the Pythagorean 
// tuning series: base 432 Hz × (3/2)^n for position n.
// This is the Codex harmonic geometry — each breath phase is a point 
// on the 24-gon wheel and each wheel position has its own harmonic signature.
const PYTHAGOREAN_FREQS = Array.from({ length: 24 }, (_, n) =>
  Math.round(432 * Math.pow(1.5, n) / Math.pow(2, Math.floor(n * Math.log2(1.5))))
);

// Index 0 = 432 Hz (the Codex scalar seed — all harmonics derive from it)
// Each subsequent position is a perfect fifth above the previous.
// Example positions: 0=432, 4=528 (nearest to 528), 12≈741, 23≈963
// The full 24-tone wheel closes at 432 × 2^(-8) ≡ 432 (octave equivalence)

class BreathController {
  constructor() {
    // Breath phase definitions — 8 phases for the sigil ring full cycle
    // Each phase maps to a wheel position (0–23) on the 24-gon wheel.
    // Frequencies use the Pythagorean 24-tone series keyed to wheelPos.
    // Index 0  → 432 Hz (Scalar Seed)
    // Index 4  → ~528 Hz (Symbol Emergence — the "miracle" tone)
    // Index 12 → ~741 Hz (Deep Inversion)
    // Index 20 → ~864 Hz (Silence Return)
    // Index 23 → ~963 Hz (Unity)
    this.phases = [
      {
        name: 'Inhale',
        glyph: '◎',
        duration: 5000,
        animClass: 'breath-inhale',
        cssDur: '5s',
        wheelPos: 0,  // 432 Hz — scalar seed
        transitions: { ringScale: 1.15, panelFade: 0.6, glyphPulse: 1.12, colorShift: 'rgba(232,200,106,0.08)' }
      },
      {
        name: 'Hold-In',
        glyph: '◉',
        duration: 3700,
        animClass: 'breath-hold-in',
        cssDur: '3.7s',
        wheelPos: 8,  // ~513 Hz — bridge from seed
        transitions: { ringScale: 1.18, panelFade: 0.3, glyphPulse: 1.15, colorShift: 'rgba(200,160,80,0.10)' }
      },
      {
        name: 'Exhale',
        glyph: '○',
        duration: 5900,
        animClass: 'breath-exhale',
        cssDur: '5.9s',
        wheelPos: 4,  // ~528 Hz — symbol emergence
        transitions: { ringScale: 0.92, panelFade: 0.8, glyphPulse: 0.95, colorShift: 'rgba(150,130,180,0.06)' }
      },
      {
        name: 'Still',
        glyph: '·',
        duration: 4300,
        animClass: 'breath-still',
        cssDur: '4.3s',
        wheelPos: 16, // ~639 Hz — axis stillness
        transitions: { ringScale: 1.0, panelFade: 1.0, glyphPulse: 1.0, colorShift: 'rgba(100,120,140,0.05)' }
      },
      {
        name: 'Inhale-2',
        glyph: '◎',
        duration: 5300,
        animClass: 'breath-inhale',
        cssDur: '5.3s',
        wheelPos: 12, // ~741 Hz — deep inversion
        transitions: { ringScale: 1.13, panelFade: 0.55, glyphPulse: 1.10, colorShift: 'rgba(232,200,106,0.07)' }
      },
      {
        name: 'Hold-Peak',
        glyph: '◉',
        duration: 7100,
        animClass: 'breath-hold-peak',
        cssDur: '7.1s',
        wheelPos: 20, // ~864 Hz — convergence peak
        transitions: { ringScale: 1.20, panelFade: 0.2, glyphPulse: 1.18, colorShift: 'rgba(180,140,220,0.09)' }
      },
      {
        name: 'Exhale-Release',
        glyph: '○',
        duration: 6100,
        animClass: 'breath-exhale',
        cssDur: '6.1s',
        wheelPos: 6,  // ~639 Hz — release
        transitions: { ringScale: 0.90, panelFade: 0.75, glyphPulse: 0.92, colorShift: 'rgba(120,100,160,0.06)' }
      },
      {
        name: 'Rest',
        glyph: '◇',
        duration: 4700,
        animClass: 'breath-rest',
        cssDur: '4.7s',
        wheelPos: 23, // ~963 Hz — unity return
        transitions: { ringScale: 1.0, panelFade: 1.0, glyphPulse: 1.0, colorShift: 'rgba(80,100,120,0.04)' }
      }
    ];

    this.currentPhase = 3; // Start at Still
    this.isActive = false;
    this.timer = null;
    this.listeners = [];
    this.audioCtx = null;
    this.element = null; // bound DOM element
    this.breathCount = 0; // increments each _tick — full cycle every 24
    this.audioMuted = localStorage.getItem('breathAudioMuted') === 'true';
    this._initAudio();

    // Custom event for cascade animation (full cycle = 24 breaths = 3 ring rotations)
    this.cascadeListeners = [];

    // Cycle-complete listeners — fire after 1 full 8-phase breath cycle
    this._cycleCompleteListeners = [];

    // ── ADAPTIVE BREATH STATE ──
    // Tracks per-phase coherence to learn the user's breathing pattern
    this.breathProfile = this._loadBreathProfile();
    // Rolling window: coherence samples per phase for current session
    this._sessionCohSamples = Array.from({ length: this.phases.length }, () => []);
    // Number of completed cycles in this session
    this._sessionCycles = 0;

    // Bind
    this._tick = this._tick.bind(this);
  }

  // ── Audio ──
  _initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      /* audio not available (e.g. Safari private browsing) */
    }
  }

  // Play a soft sine tone for the breath phase — volume scales with coherence
  playPhaseTone(freq, coherenceLevel = 0) {
    if (!this.audioCtx || this.audioMuted) return;
    const vol = 0.08 + (coherenceLevel / 100) * 0.17; // 0.08–25
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.8);
  }

  // Legacy tone method — used by glyph ring, nav tones, etc.
  playTone(freq, vol = 0.15, dur = 1.8) {
    try {
      if (!this.audioCtx) this._initAudio();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const o = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, this.audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      o.connect(g);
      g.connect(this.audioCtx.destination);
      o.start();
      o.stop(this.audioCtx.currentTime + dur + 0.1);
    } catch (e) { }
  }

  toggleAudioMute() {
    this.audioMuted = !this.audioMuted;
    localStorage.setItem('breathAudioMuted', this.audioMuted ? 'true' : 'false');
    return this.audioMuted;
  }

  // ── Phase tick ──
  _tick() {
    const p = this.phases[this.currentPhase];

    // Count breaths and fire cascade on full cycle (every 24 = 3 rotations × 8 phases)
    this.breathCount++;
    if (this.breathCount % 24 === 0 && this.breathCount > 0) {
      this._fireCascade();
    }

    // Emit to all listeners
    this.listeners.forEach(fn => {
      try { fn(p, this.currentPhase, this); } catch (e) { }
    });

    // Advance
    this.currentPhase = (this.currentPhase + 1) % this.phases.length;

    // Detect full cycle completion — fires when phase returns to 0
    if (this.currentPhase === 0) {
      this._fireCycleComplete();
    }

    const next = this.phases[this.currentPhase];
    // Use adapted duration if profile has been adapted, otherwise base duration
    const nextDuration = this.breathProfile.adapted
      ? this.breathProfile.phaseDurations[this.currentPhase]
      : next.duration;

    // Play breath phase tone — Pythagorean 24-tone series keyed to wheelPos
    // The phase's wheelPos maps directly to PYTHAGOREAN_FREQS[wheelPos]
    this.playPhaseTone(PYTHAGOREAN_FREQS[p.wheelPos], typeof window.coherenceLevel !== 'undefined' ? window.coherenceLevel : 50);

    // Schedule next
    clearTimeout(this.timer);
    this.timer = setTimeout(this._tick, next.duration);
  }

  // ── Adaptive Breath Profile ──
  // Learns user's coherence patterns per phase and adapts durations accordingly.
  // Min/max duration bounds prevent runaway adaptation.
  static MIN_DURATION = 3000;
  static MAX_DURATION = 9000;
  // How much a phase can shift per cycle (10% max of its current value)
  static ADAPT_RATE = 0.10;
  // Number of sessions before adaptation becomes active
  static LEARN_SESSIONS = 2;

  _loadBreathProfile() {
    try {
      const s = localStorage.getItem('codex_breath_profile');
      if (s) return JSON.parse(s);
    } catch(e) {}
    return {
      sessions: 0,           // total sessions with breath data
      totalBreaths: 0,       // total breaths across all sessions
      phaseCoherence: Array.from({ length: this.phases.length }, () => ({ sum: 0, count: 0 })),
      phaseDurations: this.phases.map(p => p.duration),
      preferredRatio: null,   // inhale:exhale ratio when known
      dominantPhase: 0,       // phase with highest avg coherence
      lastSessionCoh: [],     // coherence samples from last session
      coherenceTrend: 0,      // +1 improving, 0 stable, -1 declining
      adapted: false,         // whether phase durations have been adapted
      updatedAt: Date.now()
    };
  }

  _saveBreathProfile() {
    this.breathProfile.updatedAt = Date.now();
    try { localStorage.setItem('codex_breath_profile', JSON.stringify(this.breathProfile)); } catch(e) {}
  }

  // Called from the coherence bus when coherence updates — samples current phase coherence
  _sampleCoherence(coh) {
    if (!this.isActive || coh === undefined || coh === null) return;
    this._sessionCohSamples[this.currentPhase].push(coh);
  }

  // Called when a full breath cycle completes — update profile and adapt durations
  _adaptCycleDurations() {
    this._sessionCycles++;

    // After each cycle, integrate session samples into the rolling profile
    for (let i = 0; i < this.phases.length; i++) {
      const samples = this._sessionCohSamples[i];
      if (!samples || samples.length === 0) continue;

      const sessionAvg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const p = this.breathProfile.phaseCoherence[i];
      const prevGlobal = p.count > 0 ? p.sum / p.count : 50;

      // Exponential moving average: new avg = 0.7 * old + 0.3 * new
      if (p.count > 0) {
        p.sum = prevGlobal * 0.7 + sessionAvg * 0.3;
      } else {
        p.sum = sessionAvg;
      }
      p.count++;
    }

    // Clear session samples for next cycle
    this._sessionCohSamples = Array.from({ length: this.phases.length }, () => []);

    // Only adapt after LEARN_SESSIONS cycles across sessions
    if (this.breathProfile.sessions < BreathController.LEARN_SESSIONS) return;

    // Find the phase with highest avg coherence (the user's "best" phase)
    let bestPhase = 0, bestCoh = 0;
    for (let i = 0; i < this.phases.length; i++) {
      const avg = this.breathProfile.phaseCoherence[i].sum;
      if (avg > bestCoh) { bestCoh = avg; bestPhase = i; }
    }
    this.breathProfile.dominantPhase = bestPhase;

    // Adapt: shift duration toward phases the user resonates with
    // Phases with coherence > global avg get +ADAPT_RATE, below get -ADAPT_RATE
    const globalAvg = this.breathProfile.phaseCoherence.reduce((a, b) => a + b.sum, 0) / this.phases.length;

    for (let i = 0; i < this.phases.length; i++) {
      const phaseAvg = this.breathProfile.phaseCoherence[i].sum;
      const deviation = phaseAvg - globalAvg;
      const shift = this.breathProfile.phaseDurations[i] * BreathController.ADAPT_RATE * (deviation / 100);

      let newDur = this.breathProfile.phaseDurations[i] + shift;
      // Clamp to bounds
      newDur = Math.max(BreathController.MIN_DURATION, Math.min(BreathController.MAX_DURATION, newDur));
      // Round to nearest 50ms for cleanliness
      this.breathProfile.phaseDurations[i] = Math.round(newDur / 50) * 50;
    }

    this.breathProfile.adapted = true;
    this._saveBreathProfile();

    // Notify UI that breath cycle has adapted
    if (typeof this._onBreathAdapted === 'function') {
      this._onBreathAdapted(this.breathProfile);
    }
  }

  // Called at session start — increments session count
  _openBreathSession() {
    this.breathProfile.sessions++;
    this._sessionCycles = 0;
    this._sessionCohSamples = Array.from({ length: this.phases.length }, () => []);
    this._saveBreathProfile();
  }

  // Returns current breath profile for UI display
  getBreathProfile() {
    var ratio = null;
    // Compute inhale/exhale ratio from adapted durations
    if (this.breathProfile.adapted && this.phases[2].duration > 0) {
      ratio = (this.breathProfile.phaseDurations[0] / this.phases[2].duration).toFixed(2);
    }
    // Compute global avg coherence across all recorded samples
    var allSamples = [];
    this.breathProfile.phaseCoherence.forEach(function(p) {
      if (p.count > 0) {
        for (var j = 0; j < p.count; j++) allSamples.push(p.sum / p.count);
      }
    });
    var globalAvg = allSamples.length > 0
      ? Math.round(allSamples.reduce(function(a, b) { return a + b; }, 0) / allSamples.length)
      : null;
    return {
      sessions: this.breathProfile.sessions,
      adapted: this.breathProfile.adapted,
      dominantPhase: this.breathProfile.dominantPhase,
      phaseCoherenceAvg: this.breathProfile.phaseCoherence.map(function(p) { return p.count > 0 ? Math.round(p.sum) : null; }),
      phaseDurations: this.breathProfile.phaseDurations.slice(),
      preferredRatio: ratio,
      globalAvgCoherence: globalAvg,
      isLearning: this.breathProfile.sessions < BreathController.LEARN_SESSIONS,
      learningProgress: Math.min(1, this.breathProfile.sessions / BreathController.LEARN_SESSIONS)
    };
  }

  // Reset breath profile to defaults
  resetBreathProfile() {
    this.breathProfile = {
      sessions: 0,
      totalBreaths: 0,
      phaseCoherence: Array.from({ length: this.phases.length }, () => ({ sum: 0, count: 0 })),
      phaseDurations: this.phases.map(p => p.duration),
      preferredRatio: null,
      dominantPhase: 0,
      lastSessionCoh: [],
      coherenceTrend: 0,
      adapted: false,
      updatedAt: Date.now()
    };
    this._saveBreathProfile();
  }

  // Called by coherence bus to feed coherence samples into breath profile
  recordCoherence(coh) {
    this._sampleCoherence(coh);
  }

  // ── Fire cascade event every 24 breaths (3 full ring rotations) ──
  onCascade(fn) {
    this.cascadeListeners.push(fn);
    return () => { this.cascadeListeners = this.cascadeListeners.filter(f => f !== fn); };
  }

  _fireCascade() {
    this.cascadeListeners.forEach(fn => { try { fn(this.breathCount, this); } catch(e) { } });
    if (typeof COHERENCE_BUS !== "undefined") COHERENCE_BUS._syncFromBreath(this);
  }

  // ── Cycle-complete — fire after every full 8-phase breath cycle ──
  onCycleComplete(fn) {
    this._cycleCompleteListeners.push(fn);
    return () => { this._cycleCompleteListeners = this._cycleCompleteListeners.filter(f => f !== fn); };
  }

  _fireCycleComplete() {
    this._cycleCompleteListeners.forEach(fn => { try { fn(this.breathCount); } catch(e) { } });
    // Adapt breath durations based on accumulated coherence data
    this._adaptCycleDurations();
  }

  // ── Public API ──
  start(el) {
    if (this.isActive) return;
    this.isActive = true;
    this.element = el;
    this._openBreathSession(); // Track this as a new breath session
    this._tick(); // Fire immediately
  }

  stop() {
    clearTimeout(this.timer);
    this.isActive = false;
  }

  onPhaseChange(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  }

  getPhase() { return this.phases[this.currentPhase]; }
  getPhaseIndex() { return this.currentPhase; }
  isInhale() { return this.currentPhase === 0 || this.currentPhase === 4; }
  isHold() { return this.currentPhase === 1 || this.currentPhase === 5; }
  isExhale() { return this.currentPhase === 2 || this.currentPhase === 6; }
  isStill() { return this.currentPhase === 3 || this.currentPhase === 7; }

  // ── Sigil tone sequence ──
  playSigilTone(sigilIndex) {
    // Each sigil in the ring plays its own frequency
    const freqs = [432, 456, 483, 510, 539, 570, 603, 638];
    this.playTone(freqs[sigilIndex % freqs.length], 0.15, 1.2);
  }

  playNavTone(tabIndex) {
    const tones = [432, 528, 639, 741, 396, 468, 594, 702];
    this.playTone(tones[tabIndex % tones.length], 0.18, 1.4);
  }
}

// Singleton
const breathCtrl = new BreathController();
window.breathCtrl = breathCtrl; // expose globally for cross-module access
