// sigil-nav.js - Sigil Navigator v4 (clean rebuild)
(function() {
  'use strict';

  var SIGIL_TABS = [
    { sigil: '⊙', glyph: '⊙', label: 'Home',      tab: 'home',     freq: 432, desc: 'Dashboard · Field breath · Coherence pulse' },
    { sigil: '◎', glyph: '◎', label: 'Wheel',     tab: 'wheel',    freq: 528, desc: '24-cell · Prime wheel · Harmonic mapping' },
    { sigil: '◇', glyph: '◇', label: 'Codex',     tab: 'codex',    freq: 444, desc: 'Matrix explorer · Domain resonance · Entry mode' },
    { sigil: '◉', glyph: '◉', label: 'Dream',     tab: 'dream',    freq: 639, desc: '24-cell mirror · Standing wave · Monadic field' },
    { sigil: '○', glyph: '○', label: 'Journal',   tab: 'journal',  freq: 741, desc: 'Wave function · Collapse history · Harmonic log' },
    { sigil: '◈', glyph: '◈', label: 'Matrix',    tab: 'matrix',   freq: 852, desc: 'Domain explorer · matAddr index · Frequency map' },
    { sigil: '◇', glyph: '◇', label: 'Resonator', tab: 'resonator', freq: 963, desc: 'Field tuning · Monadic spiral · Harmonic resonance' },
    { sigil: '·', glyph: '·', label: 'Profile',   tab: 'profile',  freq: 174, desc: 'Personal field · Breath history · Coherence history' },
  ];

  var sn = {
    activeIndex: 0,
    isTransitioning: false,
    pendingTab: null,
    pendingTarget: null, // guards against enterPortal's double-call race
    coherenceLevel: 50,
    globalCoherence: 0,
    breathLocked: false,
    orbitAnimId: null,
  };

  // DOM helpers
  function getSn()     { return document.getElementById('sigilNavWrap'); }
  function getHub()    { return document.getElementById('snHub'); }
  function getHubGlyph() { return document.getElementById('snHubGlyph'); }
  function getHubLabel() { return document.getElementById('snHubLabel'); }
  function getOrbitOuter() { return document.getElementById('snOrbitOuter'); }

  // Init
  function initSigilNav() {
    document.querySelectorAll('.sn-dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        var idx = parseInt(dot.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) navigateToSigil(idx);
      });
    });

    // Mobile nav drawer items — map data-tab to SIGIL_TABS index and navigate
    document.querySelectorAll('.mnd-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var tab = item.getAttribute('data-tab');
        if (!tab) return;
        for (var t = 0; t < SIGIL_TABS.length; t++) {
          if (SIGIL_TABS[t].tab === tab) {
            navigateToSigil(t);
            return;
          }
        }
      });
    });

    if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
      breathCtrl.onPhaseChange(function(phase, phaseIdx, ctrl) {
        if (typeof updateSigilNavBreath === 'function') {
          updateSigilNavBreath(phase, phaseIdx, ctrl);
        }
      });
    }

    if (typeof breathCtrl !== 'undefined' && breathCtrl.onCascade) {
      breathCtrl.onCascade(function(breathCount, ctrl) {
        if (typeof triggerBreathCascade === 'function') triggerBreathCascade();
      });
    }

    // Restore tab from cross-page navigation
    var pendingTab = localStorage.getItem('pendingTab');
    if (pendingTab) {
      localStorage.removeItem('pendingTab');
      var idx = -1;
      for (var t = 0; t < SIGIL_TABS.length; t++) {
        if (SIGIL_TABS[t].tab === pendingTab) { idx = t; break; }
      }
      if (idx !== -1) {
        activateDot(idx);
        sn.activeIndex = idx;
        sn.isTransitioning = false;
        var tabEl = document.getElementById('tab-' + pendingTab);
        if (tabEl) {
          document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
          tabEl.classList.add('active');
        }
      }
    }

    startOrbitAnimation();
  }

  // Navigate
  function navigateToSigil(idx) {
    // Guard: if a transition is running, queue this target instead of dropping it
    if (sn.isTransitioning) {
      sn.pendingTarget = idx;
      return;
    }
    // Skip if already on this target
    if (idx === sn.activeIndex) return;

    var target = SIGIL_TABS[idx];
    if (!target) return;

    // Breath gate check for locked tabs
    if (typeof window.checkBreathGate === 'function') {
      var canPass = window.checkBreathGate(target.tab);
      if (!canPass) return;
    }

    if (typeof stopWheelAnimation === 'function') stopWheelAnimation();
    if (typeof stopMiniWheelAnimation === 'function') stopMiniWheelAnimation();
    if (typeof stopPrimeTracker === 'function') stopPrimeTracker();
    if (target.tab !== 'dream' && typeof stopMirror24CellRAF === 'function') {
      stopMirror24CellRAF();
    }

    sn.isTransitioning = true;

    if (typeof breathCtrl !== 'undefined') breathCtrl.playNavTone(idx);

    activateDot(idx);
    updateSigilHub(idx, true);

    var tabEl = document.getElementById('tab-' + target.tab);
    if (!tabEl) {
      localStorage.setItem('pendingTab', target.tab);
      window.location.href = 'index.html';
      sn.isTransitioning = false;
      sn.activeIndex = idx;
      return;
    }

    breathPhaseTransition(tabEl, function() {
      document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
      tabEl.classList.add('active');
      sn.activeIndex = idx;
      sn.isTransitioning = false;
      if (target.tab === 'dream' && typeof startMirror24CellRAF === 'function') {
        startMirror24CellRAF();
      }
      if (target.tab === 'profile' && typeof renderFractalTimeline === 'function') {
        setTimeout(renderFractalTimeline, 80);
      }
      sn.breathLocked = false;
      sn.pendingTab = null;
      // Flush any queued target that arrived during this transition
      if (sn.pendingTarget !== null && sn.pendingTarget !== idx) {
        var next = sn.pendingTarget;
        sn.pendingTarget = null;
        navigateToSigil(next);
      }
    });
  }

  // Breath-phase transition
  function breathPhaseTransition(tabEl, callback) {
    tabEl.classList.add('breath-transitioning');
    var dur = 4000;
    if (typeof breathCtrl !== 'undefined' && breathCtrl.getPhase) {
      var ph = breathCtrl.getPhase();
      if (ph && ph.duration) dur = ph.duration;
    }
    var transitionMs = Math.min(dur * 0.4, 800);
    setTimeout(function() {
      tabEl.classList.remove('breath-transitioning');
      callback();
    }, transitionMs);
  }

  // Update hub glyph + label
  function updateSigilHub(idx, animate) {
    var hg = getHubGlyph();
    var hl = getHubLabel();
    if (!hg || !hl) return;
    var e = SIGIL_TABS[idx];
    if (!e) return;
    if (animate) {
      hg.style.transform = 'scale(1.3) rotate(15deg)';
      setTimeout(function() {
        hg.textContent = e.glyph;
        hg.style.transform = '';
      }, 150);
    } else {
      hg.textContent = e.glyph;
    }
    hl.textContent = e.label;
  }

  // Activate dot
  function activateDot(idx) {
    document.querySelectorAll('.sn-dot').forEach(function(d, i) {
      d.classList.toggle('sn-dot-active', i === idx);
    });
    // Also update mobile drawer active state
    var targetTab = SIGIL_TABS[idx] ? SIGIL_TABS[idx].tab : null;
    document.querySelectorAll('.mnd-item').forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-tab') === targetTab);
    });
  }

  // Flash dot
  function flashDot(idx, state) {
    var dot = document.querySelector('.sn-dot[data-idx="' + idx + '"]');
    if (dot) dot.classList.toggle('flash', state === 'on');
  }

  // Breath update - scale dots + glow hub
  function updateSigilNavBreath(phase, phaseIdx, ctrl) {
    var dots = document.querySelectorAll('.sn-dot');
    dots.forEach(function(dot, i) {
      var bs = 1.0;
      if (ctrl.isInhale()) bs = 1.0 + (phaseIdx < 2 ? 0.12 : 0.08);
      if (ctrl.isHold())   bs = 1.15;
      if (ctrl.isExhale()) bs = 0.92;
      if (ctrl.isStill())  bs = 1.0;
      dot.style.transform = 'translate(-50%,-50%) scale(' + bs.toFixed(2) + ')';
      if (i === sn.activeIndex) {
        dot.classList.toggle('glow-breathe', ctrl.isInhale());
      }
    });

    var hub = getHub();
    if (hub) {
      var coh = (sn.coherenceLevel + sn.globalCoherence) / 2;
      hub.style.boxShadow = '0 0 ' + Math.min(coh / 100 * 20, 20) + 'px rgba(232,200,106,' + Math.min(coh / 100 * 0.6, 0.6) + ')';
    }

    var hg = getHubGlyph();
    if (hg && !sn.isTransitioning) hg.textContent = phase.glyph;
  }

  // Orbit animation
  function stopOrbitAnimation() {
    if (sn && sn.orbitAnimId) {
      cancelAnimationFrame(sn.orbitAnimId);
      sn.orbitAnimId = null;
    }
  }

  function startOrbitAnimation() {
    var outer = getOrbitOuter();
    if (!outer) return;
    var angle = 0;

    function animate() {
      var speed = 0.0003 + (sn.coherenceLevel / 100) * 0.0007;
      angle = (angle + speed * 16.67) % (Math.PI * 2);
      outer.style.transform = 'rotateX(' + (Math.sin(angle * 2) * 15) + 'deg) rotateY(' + (Math.cos(angle * 2) * 15) + 'deg)';
      sn.orbitAnimId = requestAnimationFrame(animate);
    }

    stopOrbitAnimation();
    sn.orbitAnimId = requestAnimationFrame(animate);
  }

  // Cascade flash
  function triggerBreathCascade() {
    var dots = document.querySelectorAll('.sn-dot');
    dots.forEach(function(dot, i) {
      setTimeout(function() {
        dot.classList.add('flash');
        setTimeout(function() { dot.classList.remove('flash'); }, 600);
      }, i * 80);
    });
  }

  // Coherence
  function setSigilNavCoherence(local, global) {
    sn.coherenceLevel = local;
    sn.globalCoherence = global;
    var wrap = getSn();
    if (wrap) {
      var avg = (local + global) / 2;
      wrap.style.setProperty('--sigil-glow-opacity', Math.min(avg / 100 * 0.5, 0.5).toFixed(2));
      wrap.style.setProperty('--sigil-glow-spread', Math.min(avg / 100 * 15, 15).toFixed(1) + 'px');
    }
  }

  // Public helpers
  function navTo(tab) {
    for (var t = 0; t < SIGIL_TABS.length; t++) {
      if (SIGIL_TABS[t].tab === tab) { navigateToSigil(t); return; }
    }
  }

  function navToMatrix()   { window.location.href = 'matrix.html'; }
  function navToResonator() { window.location.href = 'resonator.html'; }

  // Cleanup
  window.addEventListener('beforeunload', function() { stopOrbitAnimation(); });

  // Expose globals
  window.sigilNav = sn;
  window.SIGIL_TABS = SIGIL_TABS;
  window.navigateToSigil = navigateToSigil;
  window.initSigilNav = initSigilNav;
  window.updateSigilNavBreath = updateSigilNavBreath;
  window.navTo = navTo;
  window.navToMatrix = navToMatrix;
  window.navToResonator = navToResonator;
  window.setSigilNavCoherence = setSigilNavCoherence;
  window.triggerBreathCascade = triggerBreathCascade;
  window.startOrbitAnimation = startOrbitAnimation;
  window.stopOrbitAnimation = stopOrbitAnimation;

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSigilNav);
  } else {
    initSigilNav();
  }

}());