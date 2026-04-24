// ══════════════════════════════════════════════
// BREATH CONTROLLER — The Breath Loop Engine
// Drives ALL UI animation via breath phases
// ══════════════════════════════════════════════

class BreathController {
  constructor() {
    // Breath phase definitions — 8 phases for the sigil ring full cycle
    this.phases = [
      {
        name: 'Inhale',
        glyph: '◎',
        duration: 5000,
        animClass: 'breath-inhale',
        cssDur: '5s',
        toneFreq: 432,
        transitions: { ringScale: 1.15, panelFade: 0.6, glyphPulse: 1.12, colorShift: 'rgba(232,200,106,0.08)' }
      },
      {
        name: 'Hold-In',
        glyph: '◉',
        duration: 3700,
        animClass: 'breath-hold-in',
        cssDur: '3.7s',
        toneFreq: 483,
        transitions: { ringScale: 1.18, panelFade: 0.3, glyphPulse: 1.15, colorShift: 'rgba(200,160,80,0.10)' }
      },
      {
        name: 'Exhale',
        glyph: '○',
        duration: 5900,
        animClass: 'breath-exhale',
        cssDur: '5.9s',
        toneFreq: 528,
        transitions: { ringScale: 0.92, panelFade: 0.8, glyphPulse: 0.95, colorShift: 'rgba(150,130,180,0.06)' }
      },
      {
        name: 'Still',
        glyph: '·',
        duration: 4300,
        animClass: 'breath-still',
        cssDur: '4.3s',
        toneFreq: 570,
        transitions: { ringScale: 1.0, panelFade: 1.0, glyphPulse: 1.0, colorShift: 'rgba(100,120,140,0.05)' }
      },
      {
        name: 'Inhale-2',
        glyph: '◎',
        duration: 5300,
        animClass: 'breath-inhale',
        cssDur: '5.3s',
        toneFreq: 639,
        transitions: { ringScale: 1.13, panelFade: 0.55, glyphPulse: 1.10, colorShift: 'rgba(232,200,106,0.07)' }
      },
      {
        name: 'Hold-Peak',
        glyph: '◉',
        duration: 7100,
        animClass: 'breath-hold-peak',
        cssDur: '7.1s',
        toneFreq: 741,
        transitions: { ringScale: 1.20, panelFade: 0.2, glyphPulse: 1.18, colorShift: 'rgba(180,140,220,0.09)' }
      },
      {
        name: 'Exhale-Release',
        glyph: '○',
        duration: 6100,
        animClass: 'breath-exhale',
        cssDur: '6.1s',
        toneFreq: 795,
        transitions: { ringScale: 0.90, panelFade: 0.75, glyphPulse: 0.92, colorShift: 'rgba(120,100,160,0.06)' }
      },
      {
        name: 'Rest',
        glyph: '◇',
        duration: 4700,
        animClass: 'breath-rest',
        cssDur: '4.7s',
        toneFreq: 432,
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

    // Custom event for cascade animation (full cycle = 24 breaths = 3 ring rotations)
    this.cascadeListeners = [];

    // Bind
    this._tick = this._tick.bind(this);
  }

  // ── Audio ──
  ac() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  }

  playTone(freq, vol = 0.06, dur = 1.8) {
    try {
      const ctx = this.ac();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur + 0.1);
    } catch (e) { }
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
    const next = this.phases[this.currentPhase];

    // Schedule next
    clearTimeout(this.timer);
    this.timer = setTimeout(this._tick, next.duration);
  }

  // ── Fire cascade event every 24 breaths (3 full ring rotations) ──
  onCascade(fn) {
    this.cascadeListeners.push(fn);
    return () => { this.cascadeListeners = this.cascadeListeners.filter(f => f !== fn); };
  }

  _fireCascade() {
    this.cascadeListeners.forEach(fn => { try { fn(this.breathCount, this); } catch(e) { } });
  }

  // ── Public API ──
  start(el) {
    if (this.isActive) return;
    this.isActive = true;
    this.element = el;
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
    this.playTone(freqs[sigilIndex % freqs.length], 0.07, 1.2);
  }

  playNavTone(tabIndex) {
    const tones = [432, 528, 639, 741, 396, 468, 594, 702];
    this.playTone(tones[tabIndex % tones.length], 0.08, 1.4);
  }
}

// Singleton
const breathCtrl = new BreathController();
