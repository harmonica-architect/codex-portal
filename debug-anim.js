// TEMPORARY DEBUG — add to index.html before app.js loads
// This will help trace Edge animation issues
(function() {
  function log(tag, msg) {
    console.log('[DEBUG-' + tag + '] ' + msg);
  }

  document.addEventListener('DOMContentLoaded', function() {
    log('DOM', 'Content loaded');

    // Check if sigil nav elements exist
    var snOrbit = document.getElementById('snOrbitOuter');
    var snDots = document.querySelectorAll('.sn-dot');
    var brDots = document.querySelectorAll('.br-dot');
    var brOrbit = document.getElementById('brOrbit');
    var hub = document.getElementById('snHub');

    log('Elements', 'snOrbit=' + !!snOrbit + ' snDots=' + snDots.length + ' brDots=' + brDots.length + ' brOrbit=' + !!brOrbit + ' hub=' + !!hub);

    // Check breathCtrl
    log('BreathCtrl', 'typeof=' + typeof breathCtrl + ' isActive=' + (breathCtrl && breathCtrl.isActive));

    // Check coherenceLevel
    log('Coherence', 'window.coherenceLevel=' + window.coherenceLevel);

    // Monitor snOrbit transform
    var lastTransform = '';
    setInterval(function() {
      if (snOrbit && snOrbit.style.transform !== lastTransform) {
        lastTransform = snOrbit.style.transform;
        log('snOrbit', 'transform: ' + lastTransform);
      }
    }, 1000);

    // Check RAF status
    log('RAF', 'requestAnimationFrame in window: ' + typeof requestAnimationFrame);
    log('RAF', 'cancelAnimationFrame in window: ' + typeof cancelAnimationFrame);

    // Check CSS
    var computedSnDot = window.getComputedStyle(snDots[0] || document.body);
    log('CSS', 'sn-dot transition: ' + (computedSnDot.transition || 'none'));
    log('CSS', 'sn-dot animation: ' + (computedSnDot.animation || 'none'));

    // Check breath ring elements
    if (brOrbit) {
      var computedBrOrbit = window.getComputedStyle(brOrbit);
      log('CSS', 'br-orbit display: ' + computedBrOrbit.display + ' position: ' + computedBrOrbit.position);
    }

    // Monitor breath phase changes
    if (typeof breathCtrl !== 'undefined' && breathCtrl.onPhaseChange) {
      var origOnPhaseChange = breathCtrl.onPhaseChange.bind(breathCtrl);
      breathCtrl.onPhaseChange = function(cb) {
        return origOnPhaseChange(function(phase, phaseIdx, ctrl) {
          log('PhaseChange', 'phase=' + phaseIdx + ' name=' + phase.name + ' glyph=' + phase.glyph);
          cb(phase, phaseIdx, ctrl);
        });
      };
    }
  });
})();