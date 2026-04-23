const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'matrix.js');
const content = fs.readFileSync(file);

// ── Patch 1: Replace BREATH_HIGHLIGHT_COLS with richer data ──────────────
// Old 12-entry flat array (only 6 values used as phase indices)
// New: per-phase data with name, color, and active glyph column
const oldBreathData = Buffer.from('var BREATH_ROW_IDX = 6;\r\nvar BREATH_HIGHLIGHT_COLS = [1,4,6,10,16,18];');
const newBreathData = Buffer.from(
  '/* Breath phase data — one entry per phase, maps to resonator broadcast values */\r\n' +
  'var BREATH_ROW_IDX = 6;\r\n' +
  'var BREATH_PHASES = [\r\n' +
  '  { name: \'Inhale\',  glyph: \'&#x25B3;\',  color: \'rgba(180,140,220,0.35)\', textColor: \'#c8b0e0\', col: 1  }, // phase 0\r\n' +
  '  { name: \'Hold\',    glyph: \'&#x25C7;\',  color: \'rgba(200,160,220,0.35)\', textColor: \'#d0b0e0\', col: 4  }, // phase 1\r\n' +
  '  { name: \'Hold\',    glyph: \'&#x25C7;\',  color: \'rgba(200,160,220,0.35)\', textColor: \'#d0b0e0\', col: 6  }, // phase 2\r\n' +
  '  { name: \'Exhale\',  glyph: \'&#x25C1;&#x25B7;\', color: \'rgba(120,180,160,0.35)\', textColor: \'#90c0b0\', col: 10 }, // phase 3\r\n' +
  '  { name: \'Exhale\',  glyph: \'&#x25C1;&#x25B7;\', color: \'rgba(120,180,160,0.35)\', textColor: \'#90c0b0\', col: 16 }, // phase 4\r\n' +
  '  { name: \'Still\',   glyph: \'&#x27E8;&#x27E9;\', color: \'rgba(232,200,106,0.25)\', textColor: \'rgba(232,200,106,0.7)\', col: 18 }, // phase 5\r\n' +
  '];\r\n' +
  'var currentBreathPhase = -1; // -1 = not synced yet\r\n' +
  'var lastPhaseTime = 0;'
);

const pos1 = content.indexOf(oldBreathData);
if (pos1 === -1) { console.error('Breath data not found'); process.exit(1); }
console.log('Found breath data at byte', pos1);

const before1 = content.slice(0, pos1);
const after1 = content.slice(pos1 + oldBreathData.length);
const tmp1 = Buffer.concat([before1, newBreathData, after1]);
console.log('Breath data replaced');

// ── Patch 2: Replace highlightBreathRow with full-featured version ─────────
const oldFn = Buffer.from(
  'function highlightBreathRow(phase) {\r\n' +
  '  [].slice.call(document.querySelectorAll(\'.m-cell\')).forEach(function(c) {\r\n' +
  '    var r = +c.dataset.row;\r\n' +
  '    if (r === BREATH_ROW_IDX) {\r\n' +
  '      var col = +c.dataset.col;\r\n' +
  '      c.style.background = BREATH_HIGHLIGHT_COLS[phase] === col ? \'rgba(232,200,106,0.15)\' : \'\';\r\n' +
  '    } else {\r\n' +
  '      c.style.background = \'\';\r\n' +
  '    }\r\n' +
  '  });\r\n' +
  '}'
);

const newFn = Buffer.from(
  '/* Full breath-guided glyph activation:\r\n' +
  '   - Highlights the active phase row with color + glow\r\n' +
  '   - Activates the glyph column for the current phase\r\n' +
  '   - Plays a soft tone on phase transitions\r\n' +
  '   - Updates the breath phase indicator strip */\r\n' +
  'function highlightBreathRow(phase) {\r\n' +
  '  if (phase < 0 || phase >= BREATH_PHASES.length) return;\r\n' +
  '  var pd = BREATH_PHASES[phase];\r\n' +
  '  var now = Date.now();\r\n\r\n' +
  '  // Play a soft chime on phase transition (throttled to avoid double-fire)\r\n' +
  '  if (currentBreathPhase !== phase && currentBreathPhase !== -1 && (now - lastPhaseTime) > 400) {\r\n' +
  '    playBreathChime(pd, phase);\r\n' +
  '  }\r\n' +
  '  currentBreathPhase = phase;\r\n' +
  '  lastPhaseTime = now;\r\n\r\n' +
  '  // Update the breath phase indicator strip if present\r\n' +
  '  var strip = document.getElementById(\'breathStrip\');\r\n' +
  '  if (strip) {\r\n' +
  '    var chips = strip.querySelectorAll(\'.breath-chip\');\r\n' +
  '    chips.forEach(function(ch, i) {\r\n' +
  '      ch.classList.toggle(\'active\', i === phase);\r\n' +
  '      ch.style.color = i === phase ? pd.textColor : \'\';\r\n' +
  '    });\r\n' +
  '    var label = strip.querySelector(\'.breath-phase-label\');\r\n' +
  '    if (label) { label.textContent = pd.name; label.style.color = pd.textColor; }\r\n' +
  '  }\r\n\r\n' +
  '  // Highlight cells: row 6 gets phase color, glyph column gets column glow\r\n' +
  '  [].slice.call(document.querySelectorAll(\'.m-cell\')).forEach(function(c) {\r\n' +
  '    var r = +c.dataset.row;\r\n' +
  '    var col = +c.dataset.col;\r\n' +
  '    if (r === BREATH_ROW_IDX) {\r\n' +
  '      // Highlight the glyph column for this phase\r\n' +
  '      var isActiveCol = (col === pd.col);\r\n' +
  '      c.style.background = isActiveCol ? pd.color : \'\';\r\n' +
  '      c.style.boxShadow = isActiveCol ? \'0 0 12px \' + pd.color.replace(\'0.35)\', \'0.5)\') : \'\';\r\n' +
  '    } else {\r\n' +
  '      c.style.background = \'\';\r\n' +
  '      c.style.boxShadow = \'\';\r\n' +
  '    }\r\n' +
  '  });\r\n\r\n' +
  '  // Also highlight the glyph column across ALL rows (column flash)\r\n' +
  '  [].slice.call(document.querySelectorAll(\'.m-cell[data-col=\\'\' + pd.col + \'\\']\')).forEach(function(c) {\r\n' +
  '    c.style.boxShadow = \'0 0 8px \' + pd.color.replace(\'0.35)\', \'0.4)\');\r\n' +
  '  });\r\n' +
  '}\r\n\r\n' +
  'function playBreathChime(pd, phase) {\r\n' +
  '  try {\r\n' +
  '    var ctx = getAudioCtx();\r\n' +
  '    // Play the glyph frequency for the active column, soft and short\r\n' +
  '    var freq = ANGLE_FREQ[pd.col] || 432;\r\n' +
  '    var o = ctx.createOscillator();\r\n' +
  '    var g = ctx.createGain();\r\n' +
  '    o.type = \'sine\';\r\n' +
  '    o.frequency.value = freq;\r\n' +
  '    g.gain.setValueAtTime(0, ctx.currentTime);\r\n' +
  '    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);\r\n' +
  '    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);\r\n' +
  '    o.connect(g); g.connect(ctx.destination);\r\n' +
  '    o.start(); o.stop(ctx.currentTime + 1.2);\r\n' +
  '  } catch(e) {}\r\n' +
  '}'
);

const pos2 = tmp1.indexOf(oldFn);
if (pos2 === -1) { console.error('highlightBreathRow not found'); process.exit(1); }
console.log('Found highlightBreathRow at byte', pos2);

const before2 = tmp1.slice(0, pos2);
const after2 = tmp1.slice(pos2 + oldFn.length);
const tmp2 = Buffer.concat([before2, newFn, after2]);
console.log('highlightBreathRow replaced');

// ── Patch 3: Update the event listener to be more robust ──────────────────
const oldListener = Buffer.from(
  'window.addEventListener(\'codex_phase_update\', function(e) {\r\n' +
  '    highlightBreathRow(e.detail && e.detail.phase || 0);\r\n' +
  '  });'
);
const newListener = Buffer.from(
  'window.addEventListener(\'codex_phase_update\', function(e) {\r\n' +
  '    // Phase is passed as a simple number: 0=inhale, 2=hold, 4=exhale, etc.\r\n' +
  '    var raw = e.detail && (e.detail.phase !== undefined) ? e.detail.phase : 0;\r\n' +
  '    // Map the raw phase value to our BREATH_PHASES index\r\n' +
  '    var phaseMap = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5 };\r\n' +
  '    var idx = phaseMap[raw] !== undefined ? phaseMap[raw] : (raw >= 0 && raw < BREATH_PHASES.length ? raw : 0);\r\n' +
  '    highlightBreathRow(idx);\r\n' +
  '  });'
);

const pos3 = tmp2.indexOf(oldListener);
if (pos3 === -1) { console.error('Event listener not found'); process.exit(1); }
console.log('Found event listener at byte', pos3);

const before3 = tmp2.slice(0, pos3);
const after3 = tmp2.slice(pos3 + oldListener.length);
const tmp3 = Buffer.concat([before3, newListener, after3]);
console.log('Event listener updated');

// ── Patch 4: Add breath phase indicator HTML to buildMatrix ─────────────────
// Insert after the corner cell in buildMatrix — add a breathStrip div
const oldBuildMatrix = Buffer.from(
  'var corner = document.createElement(\'div\');\r\n' +
  'corner.className = \'cell-corner\';\r\n' +
  'corner.textContent = \'LAYERS\';\r\n' +
  'container.appendChild(corner);'
);
const newBuildMatrix = Buffer.from(
  'var corner = document.createElement(\'div\');\r\n' +
  'corner.className = \'cell-corner\';\r\n' +
  'corner.textContent = \'LAYERS\';\r\n' +
  'container.appendChild(corner);\r\n\r\n' +
  '// Breath phase indicator strip — injected above the breath row\r\n' +
  'var breathStrip = document.createElement(\'div\');\r\n' +
  'breathStrip.id = \'breathStrip\';\r\n' +
  'breathStrip.className = \'breath-strip\';\r\n' +
  'breathStrip.innerHTML = \'<div class=\"breath-strip-label\">Breathe</div>\' +\r\n' +
  '  BREATH_PHASES.map(function(p, i) {\r\n' +
  '    return \'<div class=\"breath-chip\' + (i === 0 ? \' active\' : \'\') + \'\" data-phase=\"\' + i + \'\" style=\"\' + (i === 0 ? \'color:\' + p.textColor : \'\') + \'\">' + p.name + \'</div>\';\r\n' +
  '  }).join(\'\') +\r\n' +
  '  \'<span class=\"breath-phase-label\" style=\"color:\' + BREATH_PHASES[0].textColor + \'\">\' + BREATH_PHASES[0].name + \'</span>\';\r\n' +
  'container.appendChild(breathStrip);'
);

const pos4 = tmp3.indexOf(oldBuildMatrix);
if (pos4 === -1) { console.error('buildMatrix injection point not found'); process.exit(1); }
console.log('Found buildMatrix injection at byte', pos4);

const before4 = tmp3.slice(0, pos4);
const after4 = tmp3.slice(pos4 + oldBuildMatrix.length);
const tmp4 = Buffer.concat([before4, newBuildMatrix, after4]);
console.log('buildMatrix updated with breath strip');

// ── Patch 5: Add CSS for the breath strip ──────────────────────────────────
const cssFile = path.join(__dirname, 'matrix.css');
let css = fs.readFileSync(cssFile, 'utf8');

// Add breath strip styles before the closing bracket of the file (or append)
const breathCSS = Buffer.from(
  '\r\n\r\n/* Breath phase indicator strip */\r\n' +
  '.breath-strip {\r\n' +
  '  grid-column: 1 / -1;\r\n' +
  '  display: flex;\r\n' +
  '  align-items: center;\r\n' +
  '  gap: 0.4rem;\r\n' +
  '  padding: 0.5rem 0.5rem;\r\n' +
  '  background: rgba(6,6,14,0.6);\r\n' +
  '  border-bottom: 1px solid rgba(232,200,106,0.08);\r\n' +
  '  margin-bottom: 0.25rem;\r\n' +
  '}\r\n' +
  '.breath-strip-label {\r\n' +
  '  font-size: 0.5rem;\r\n' +
  '  letter-spacing: 0.2em;\r\n' +
  '  color: var(--muted);\r\n' +
  '  text-transform: uppercase;\r\n' +
  '  margin-right: 0.2rem;\r\n' +
  '}\r\n' +
  '.breath-chip {\r\n' +
  '  font-size: 0.55rem;\r\n' +
  '  letter-spacing: 0.08em;\r\n' +
  '  color: var(--muted);\r\n' +
  '  padding: 0.2rem 0.5rem;\r\n' +
  '  border-radius: 10px;\r\n' +
  '  border: 1px solid transparent;\r\n' +
  '  transition: all 0.4s ease;\r\n' +
  '  cursor: default;\r\n' +
  '}\r\n' +
  '.breath-chip.active {\r\n' +
  '  border-color: rgba(232,200,106,0.3);\r\n' +
  '  background: rgba(232,200,106,0.08);\r\n' +
  '}\r\n' +
  '.breath-phase-label {\r\n' +
  '  margin-left: auto;\r\n' +
  '  font-size: 0.6rem;\r\n' +
  '  letter-spacing: 0.15em;\r\n' +
  '  font-weight: 500;\r\n' +
  '  transition: color 0.4s ease;\r\n' +
  '}\r\n'
);

// Append the CSS
const finalCSS = Buffer.concat([Buffer.from(css, 'utf8'), breathCSS]);
fs.writeFileSync(cssFile, finalCSS);
console.log('matrix.css breath strip styles added');

// ── Write final matrix.js ─────────────────────────────────────────────────
fs.writeFileSync(file, tmp4);
console.log('\nmatrix.js written — breath-guided interface complete');
