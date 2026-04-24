// ══════════════════════════════════════════════
// SIGIL NAVIGATOR — Glyph Portal Navigation
// Replaces linear tab bar with breath-gated
// glyph portals. Each sigil is a thread.
// ══════════════════════════════════════════════

const SIGIL_TABS = [
  { sigil: '⊙', glyph: '⊙', label: 'Home',    tab: 'home',     freq: 432, desc: 'Dashboard · Field breath · Coherence pulse' },
  { sigil: '◎', glyph: '◎', label: 'Wheel',   tab: 'wheel',    freq: 528, desc: '24-spoke breath wheel · Prime axis spiral' },
  { sigil: '◇', glyph: '◇', label: 'Codex',   tab: 'codex',    freq: 639, desc: 'Glyph library · Recursion seals · Archetypes' },
  { sigil: '◉', glyph: '◉', label: 'Dream',   tab: 'dream',    freq: 741, desc: 'Post-cycle dream record · Symbol emergence' },
  { sigil: '○', glyph: '○', label: 'Journal', tab: 'journal',  freq: 396, desc: 'Field journal · Breath-integrated entries' },
  { sigil: '◈', glyph: '◈', label: 'Matrix',  tab: 'matrix',   freq: 468, desc: '12×12 harmonic resonance grid · Sigil mapping' },
  { sigil: '◇', glyph: '◇', label: 'Resonator', tab: 'resonator', freq: 594, desc: 'Sound geometry · Waveform collapse · Soundscapes' },
  { sigil: '·', glyph: '·', label: 'Profile', tab: 'profile',  freq: 702, desc: 'Cycles · Sigil memory · Harmonic signature' }
];

let sigilNav = {
  activeIndex: 0,
  isTransitioning: false,
  pendingTab: null,
  breathLocked: false,
  unlockTimer: null,
  orbitAngle: 0,
  orbitAnimId: null,
  coherenceLevel: 0,
  globalCoherence: 0,
};

// Expose globally for tests and debugging
window.sigilNav = sigilNav;

// ── Init sigil navigator ──
function initSigilNav() {
  console.log('[initSigilNav] called, pendingTab=', localStorage.getItem('pendingTab'));
  // Click on orbit dots
  document.querySelectorAll('.sn-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.idx);
      navigateToSigil(idx);
    });
  });

  // Listen to breath controller
  if (typeof breathCtrl !== 'undefined') {
    breathCtrl.onPhaseChange((phase, phaseIdx, ctrl) => {
      updateSigilNavBreath(phase, phaseIdx, ctrl);
    });
  }

  // Coherence-aware orbit animation
  startOrbitAnimation();

  // Restore active tab from sigil nav cross-page navigation
  const pendingTab = localStorage.getItem('pendingTab');
  if (pendingTab) {
    localStorage.removeItem('pendingTab');
    const idx = SIGIL_TABS.findIndex(t => t.tab === pendingTab);
    if (idx !== -1) {
      // Activate the dot and tab silently (skip breath gate after page reload)
      // NOTE: we update window.sigilNav which is already initialized above
      activateDot(idx);
      window.sigilNav.activeIndex = idx;
      window.sigilNav.isTransitioning = false;
      const tabEl = document.getElementById('tab-' + pendingTab);
      if (tabEl) {
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        tabEl.classList.add('active');
      }
      // Toggle .non-home on portal (CSS reads this for visibility)
      document.getElementById('portal').classList.toggle('non-home', pendingTab !== 'home');
      if (pendingTab === 'home') updateSigilHub(idx, false);
    }
  } else {
    // First load on index.html — home tab is active, hide sigil nav
    const portal = document.getElementById('portal');
    if (portal) portal.classList.remove('non-home');
  }
}

// ── Navigate to a sigil tab ──
function navigateToSigil(idx, skipBreathGate = false) {
  const sn = window.sigilNav;
  // Sigil nav is always immediate — no breath gate (home tab breath ring handles breath navigation)
  if (idx === sn.activeIndex) return;
  if (sn.isTransitioning) return;

  const target = SIGIL_TABS[idx];
  if (!target) return;

  performSigilTransition(idx, sn);
}

// ── ANIMATION CLEANUP ──
function stopOrbitAnimation() {
  if (sigilNav.orbitAnimId) {
    cancelAnimationFrame(sigilNav.orbitAnimId);
    sigilNav.orbitAnimId = null;
  }
}

window.addEventListener('beforeunload', () => {
  stopOrbitAnimation();
});

function performSigilTransition(idx, sn) {
  stopOrbitAnimation();  // cancel orbit RAF before tab switch
  sn.isTransitioning = true;

  // Play sigil tone
  if (typeof breathCtrl !== 'undefined') {
    breathCtrl.playNavTone(idx);
  }

  // Animate the orbit dot
  activateDot(idx);

  // Update hub
  updateSigilHub(idx, true);

  // Switch tab content with breath transition
  const tabEl = document.getElementById('tab-' + target.tab);
  if (!tabEl) {
    // Internal tab rendered in index.html — save active tab to localStorage, navigate to index
    localStorage.setItem('pendingTab', target.tab);
    window.location.href = 'index.html';
    sn.isTransitioning = false;
    sn.activeIndex = idx;
    return;
  }

  // Breath-phase tab transition
  breathPhaseTransition(tabEl, () => {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    // Show target
    tabEl.classList.add('active');
    sn.activeIndex = idx;
    sn.isTransitioning = false;

    // Show sigil nav header unless on home tab
    const portal = document.getElementById('portal');
    if (portal) portal.classList.toggle('non-home', target.tab !== 'home');

    // Clear breath lock
    sn.breathLocked = false;
    sn.pendingTab = null;
  });
}

// ── Breath-phase-gated tab transition ──
function breathPhaseTransition(tabEl, callback) {
  // Add breath-transitioning class (CSS handles the animation)
  tabEl.classList.add('breath-transitioning');

  // Duration based on current breath phase
  const dur = breathCtrl.getPhase().duration || 4000;
  const phaseName = breathCtrl.getPhase().name;

  // During exhale/hold — transitions are faster (field is receptive)
  // During inhale — transitions are slower (field is contracting)
  let transitionMs;
  if (breathCtrl.isExhale() || breathCtrl.isStill()) {
    transitionMs = Math.min(dur * 0.4, 800);
  } else {
    transitionMs = Math.min(dur * 0.25, 600);
  }

  setTimeout(() => {
    tabEl.classList.remove('breath-transitioning');
    callback();
  }, transitionMs);
}

// ── Update sigil hub display ──
function updateSigilHub(idx, animate = true) {
  const glyph = SIGIL_TABS[idx].glyph;
  const label = SIGIL_TABS[idx].label;
  const hubGlyph = document.getElementById('snHubGlyph');
  const hubLabel = document.getElementById('snHubLabel');
  if (!hubGlyph || !hubLabel) return;

  if (animate) {
    // Breath-scale animation
    hubGlyph.classList.remove('breath-pop');
    void hubGlyph.offsetWidth;
    hubGlyph.classList.add('breath-pop');
  }

  hubGlyph.textContent = glyph;
  hubLabel.textContent = label;
}

// ── Dot activation states ──
function activateDot(idx) {
  document.querySelectorAll('.sn-dot').forEach((d, i) => {
    d.classList.remove('active', 'passed', 'queued');
    if (i === idx) d.classList.add('active');
    else if (i < idx) d.classList.add('passed');
  });
}

function flashDot(idx, state) {
  const dot = document.querySelectorAll('.sn-dot')[idx];
  if (!dot) return;
  dot.classList.add(state);
  setTimeout(() => dot.classList.remove(state), 600);
}

// ── Breath-driven sigil updates ──
function updateSigilNavBreath(phase, phaseIdx, ctrl) {
  // Update dot positions based on breath phase
  const dots = document.querySelectorAll('.sn-dot');
  dots.forEach((dot, i) => {
    // Breath expansion effect
    const baseScale = 1.0;
    let breathScale = baseScale;
    if (ctrl.isInhale()) breathScale = 1.0 + (phaseIdx < 2 ? 0.12 : 0.08);
    if (ctrl.isHold()) breathScale = 1.15;
    if (ctrl.isExhale()) breathScale = 1.0 - 0.08;
    if (ctrl.isStill()) breathScale = 1.0;

    dot.style.setProperty('--breath-scale', breathScale.toFixed(2));

    // Active tab gets extra glow during inhale
    if (i === sigilNav.activeIndex) {
      if (ctrl.isInhale()) {
        dot.classList.add('glow-breathe');
      } else {
        dot.classList.remove('glow-breathe');
      }
    }
  });

  // Coherence glow on the hub
  const hub = document.getElementById('snHub');
  if (hub) {
    const coh = (sigilNav.coherenceLevel + sigilNav.globalCoherence) / 2;
    const glowOpacity = Math.min(coh / 100 * 0.6, 0.6);
    const glowSpread = Math.min(coh / 100 * 20, 20);
    hub.style.boxShadow = `0 0 ${glowSpread}px rgba(232,200,106,${glowOpacity})`;
  }

  // Check pending tab
  if (sigilNav.pendingTab !== null && (ctrl.isStill() || ctrl.isHold())) {
    const pending = sigilNav.pendingTab;
    sigilNav.pendingTab = null;
    // Small delay to let the still phase settle
    setTimeout(() => performSigilTransition(pending), 300);
  }

  // Update hub glyph to match breath phase
  const hubGlyph = document.getElementById('snHubGlyph');
  if (hubGlyph && !sigilNav.isTransitioning) {
    hubGlyph.textContent = phase.glyph;
  }
}

// ── Orbit animation — dots orbit at speed ∝ coherence ──
function startOrbitAnimation() {
  const outer = document.getElementById('snOrbitOuter');
  if (!outer) return;
  let angle = 0;

  function animate() {
    // Base rotation speed modified by coherence
    const baseSpeed = 0.0003;
    const cohBoost = (sigilNav.coherenceLevel / 100) * 0.0007;
    const speed = baseSpeed + cohBoost;
    angle += speed;

    if (outer) {
      outer.style.transform = `rotate(${angle}rad)`;
    }

    sigilNav.orbitAnimId = requestAnimationFrame(animate);
  }
  animate();
}

// ── Set coherence levels ──
function setSigilNavCoherence(local, global) {
  sigilNav.coherenceLevel = local || 0;
  sigilNav.globalCoherence = global || 0;
}

// ── Public navigation helpers ──
function navTo(tab) {
  const idx = SIGIL_TABS.findIndex(s => s.tab === tab);
  if (idx !== -1) {
    navigateToSigil(idx, true);
  }
}

function navToMatrix() {
  window.location.href = 'matrix.html';
}

function navToResonator() {
  window.location.href = 'resonator.html';
}
