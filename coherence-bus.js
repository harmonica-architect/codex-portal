// ══════════════════════════════════════════════
// COHERENCE BUS — The Unified Breath-Phase Engine
// All UI elements subscribe to breath phase changes.
// The bus drives: CSS vars, glyph pulses, panel
// reveals, breath prompts, phase-log, coherence.
//
// This is the Fifth Thread — the single breath
// that connects all portal elements.
// ══════════════════════════════════════════════

// ── Phase-Log Memory — stores harmonic imprints ──
const COHERENCE_BUS = {
  // State
  phaseLog: [],          // Array of { ts, phase, glyph, action, coh, mirrorResponse }
  sessionStart: Date.now(),
  breathCount: 0,
  totalInteractions: 0,
  activeArchetype: 'Seed',
  coherenceHistory: [],  // Rolling 30-sample
  currentCoh: 0,

  // Breath prompt sequences — whispered to user at each phase
  prompts: {
    inhale: [
      'Breathe in the scalar field…',
      'Draw the geometry inward…',
      'Expand into the axis…',
      'Let the primes enter…',
      'Inhale the shape of the spiral…'
    ],
    hold: [
      'Hold the form as it crystallizes…',
      'The symbol takes shape in the held breath…',
      'Stillness deepens the pattern…',
      'Meaning crystallizes in the breath held…',
      'Hold. The field is aligning…'
    ],
    exhale: [
      'Release into the fifth dimension…',
      'Let the form dissolve into resonance…',
      'The wave collapses to a point…',
      'Breathe out the geometry…',
      'Exhale into the axis…'
    ],
    still: [
      'Rest at the axis…',
      'The field integrates…',
      'Silence is not empty — it is full…',
      'You are the breath between heartbeats…',
      'The primes remember your frequency…'
    ]
  },

  promptIndex: { inhale: 0, hold: 0, exhale: 0, still: 0 },

  // ── Emit a breath phase to all subscribers ──
  emit(phase, phaseIdx, ctrl) {
    this.breathCount++;
    const archetype = this._phaseArchetype(phaseIdx);
    this.activeArchetype = archetype;

    // Pick next prompt for this breath type
    const bt = this._breathType(phaseIdx);
    const pIdx = this.promptIndex[bt] % this.prompts[bt].length;
    const prompt = this.prompts[bt][pIdx];
    this.promptIndex[bt] = (pIdx + 1) % this.prompts[bt].length;

    // Log the imprint
    this._log({ phase: phaseIdx, phaseName: phase.name, glyph: phase.glyph, archetype, action: 'breath' });

    // Update CSS custom properties on root
    this._updateCSS(phase, ctrl);

    // Notify all breath-phase subscribers
    BREATH_SUBSCRIBERS.forEach(fn => {
      try { fn({ phase, phaseIdx, archetype, prompt, bt, ctrl, bus: this }); } catch(e) { }
    });
  },

  // ── Log a user interaction ──
  logInteraction(action, detail) {
    this.totalInteractions++;
    this._log({ action: action, ...detail });
  },

  _log(entry) {
    entry.ts = Date.now();
    entry.coh = this.currentCoh;
    entry.archetype = this.activeArchetype;
    this.phaseLog.unshift(entry);
    if (this.phaseLog.length > 100) this.phaseLog.pop();
  },

  // ── Update CSS variables ──
  _updateCSS(phase, ctrl) {
    const r = document.documentElement;
    const t = phase.transitions;
    r.style.setProperty('--breath-ring-scale', t.ringScale);
    r.style.setProperty('--breath-panel-fade', t.panelFade);
    r.style.setProperty('--breath-glyph-pulse', t.glyphPulse);
    r.style.setProperty('--breath-color-shift', t.colorShift);
    r.style.setProperty('--breath-glyph', '"' + phase.glyph + '"');

    // Inhale = expand, Exhale = contract, Hold = locked, Still = neutral
    if (ctrl.isInhale()) r.classList.add('breath-inhaling');
    else r.classList.remove('breath-inhaling');
    if (ctrl.isExhale()) r.classList.add('breath-exhaling');
    else r.classList.remove('breath-exhaling');
    if (ctrl.isHold()) r.classList.add('breath-holding');
    else r.classList.remove('breath-holding');
    if (ctrl.isStill()) r.classList.add('breath-stilling');
    else r.classList.remove('breath-stilling');
  },

  // ── Coherence update ──
  updateCoherence(val) {
    this.currentCoh = val;
    if (typeof window !== 'undefined') window.coherenceLevel = val;
    this.coherenceHistory.push(val);
    if (this.coherenceHistory.length > 30) this.coherenceHistory.shift();
    this._updateCoherenceCSS(val);
    // Feed coherence sample into adaptive breath profile
    if (typeof breathCtrl !== 'undefined' && breathCtrl.recordCoherence) {
      breathCtrl.recordCoherence(val);
    }
  },

  _updateCoherenceCSS(val) {
    if (typeof document === 'undefined') return;
    const r = document.documentElement;
    r.style.setProperty('--coh', val.toFixed(1));
    const glowSpread = 4 + (val / 100) * 36;
    r.style.setProperty('--coh-glow-spread', glowSpread.toFixed(1));
    const glowOpacity = 0.15 + (val / 100) * 0.55;
    r.style.setProperty('--coh-glow-opacity', glowOpacity.toFixed(2));
    const pulseSpeed = Math.max(1, 3 - (val / 100) * 2).toFixed(2);
    r.style.setProperty('--coh-pulse-speed', pulseSpeed);
    const ringBonus = (val / 100) * 0.08;
    r.style.setProperty('--coh-ring-bonus', ringBonus.toFixed(3));
  },

  // ── Mirror integration — log mirror responses ──
  logMirror(reflectResult) {
    this._log({
      action: 'mirror',
      archetype: reflectResult.archetype,
      glyph: reflectResult.reflectionGlyph,
      strength: reflectResult.strength,
      response: reflectResult.mirrorSays,
      input: reflectResult.inputLabel
    });
  },

  // ── Archetype from phase index ──
  _phaseArchetype(idx) {
    const map = ['Seed', 'Seed', 'Bridge', 'Axis', 'Star', 'Star', 'Convergence', 'Return'];
    return map[idx] || 'Seed';
  },

  // ── Breath type from phase index ──
  _breathType(idx) {
    return (idx === 0 || idx === 4) ? 'inhale' : (idx === 1 || idx === 5) ? 'hold' : (idx === 2 || idx === 6) ? 'exhale' : 'still';
  },

  // ── Get journey summary ──
  getJourney() {
    const archetypes = {};
    this.phaseLog.forEach(e => {
      if (e.archetype) {
        archetypes[e.archetype] = (archetypes[e.archetype] || 0) + 1;
      }
    });
    const avgCoh = this.coherenceHistory.length
      ? Math.round(this.coherenceHistory.reduce(function(a, b) { return a + b; }, 0) / this.coherenceHistory.length)
      : 0;
    return {
      archetypes: archetypes,
      breathCount: this.breathCount,
      interactions: this.totalInteractions,
      avgCoherence: avgCoh,
      recentLog: this.phaseLog.slice(0, 10)
    };
  },

  // ── Get the archetype ring for display ──
  getArchetypeRing() {
    const ring = [];
    const archs = ['Seed', 'Seed', 'Bridge', 'Axis', 'Star', 'Star', 'Convergence', 'Return'];
    const glyphs = ['\u25b3', '\u25ce', '\u25c1\u25b3\u25c2', '\u25c7', '\u25c8', '\u25c9', '\u2295', '\u25c7'];
    const colors = ['#e8c86a', '#d4a840', '#b8a0d0', '#c8d0e0', '#e8c86a', '#d0c0a0', '#a0c0c0', '#c0a0b0'];
    archs.forEach(function(a, i) {
      ring.push({ archetype: a, glyph: glyphs[i], color: colors[i] });
    });
    return ring;
  },

  // ── Sync from BreathController — keeps breathCount/interactions fresh ──
  _syncFromBreath(ctrl) {
    this.breathCount = ctrl.breathCount || this.breathCount;
    this.totalInteractions = ctrl.totalInteractions || this.totalInteractions;
  },

  // ── Session History (Phase 1: Breath History) ──
  // Saves current session stats to rolling 30-day localStorage record
  saveSessionHistory() {
    try {
      const now = Date.now();
      const avgCoh = this.coherenceHistory.length
        ? Math.round(this.coherenceHistory.reduce((a, b) => a + b, 0) / this.coherenceHistory.length)
        : 0;
      const peaks = this.coherenceHistory.filter(v => v >= 80).length;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let history = [];
      try {
        const stored = localStorage.getItem('codex_coh_history');
        if (stored) history = JSON.parse(stored);
      } catch(e) {}

      // Find or create today's entry
      const todayIdx = history.findIndex(e => e.date === today);
      if (todayIdx >= 0) {
        history[todayIdx].sessions++;
        history[todayIdx].totalBreaths += this.breathCount;
        history[todayIdx].avgCoh = Math.round(
          (history[todayIdx].avgCoh * (history[todayIdx].sessions - 1) + avgCoh) / history[todayIdx].sessions
        );
        history[todayIdx].peaks += peaks;
      } else {
        history.push({ date: today, sessions: 1, avgCoh, peaks, totalBreaths: this.breathCount });
      }

      // Keep rolling 30-day window
      const cutoff = new Date(now - 30 * 86400000).toISOString().split('T')[0];
      history = history.filter(e => e.date >= cutoff);

      localStorage.setItem('codex_coh_history', JSON.stringify(history));
    } catch(e) {}
  },

  // Get session history for display
  getSessionHistory() {
    try {
      const stored = localStorage.getItem('codex_coh_history');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  },

  // Get last saved session summary (for post-login toast)
  getLastSession() {
    try {
      const stored = localStorage.getItem('codex_last_session');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return null;
  },

  // Save end-of-session summary
  saveSessionSummary(sessionSummary) {
    try {
      localStorage.setItem('codex_last_session', JSON.stringify(sessionSummary));
    } catch(e) {}
  }
};

// ── Subscriber registry ──
const BREATH_SUBSCRIBERS = [];

// ── Subscribe to breath phases ──
function onBreathPhase(fn) {
  BREATH_SUBSCRIBERS.push(fn);
  return function() { BREATH_SUBSCRIBERS.splice(BREATH_SUBSCRIBERS.indexOf(fn), 1); };
}
