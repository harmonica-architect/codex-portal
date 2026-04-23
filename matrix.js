/* ═══════════════════════════════════════════════════════════════════
   HARMONIC GLYPH MATRIX v2 — 12×12 Enhanced
   Multi-select drag · Save/load · Resonance preview · Intensity
   ═══════════════════════════════════════════════════════════════════ */

const LAYERS = [
  { id:'numerical',   label:'Numerical',   sub:'digital root' },
  { id:'geometric',   label:'Geometric',    sub:'form language' },
  { id:'tonal',       label:'Tonal',        sub:'432Hz scale' },
  { id:'symbolic',    label:'Symbolic',      sub:'archetype' },
  { id:'monadic',     label:'Monadic',       sub:'phi spiral' },
  { id:'quasi',       label:'Quasi-Prime',   sub:'residue field' },
  { id:'breath',      label:'Breath Phase',  sub:'cycle state' },
  { id:'color',       label:'Color',         sub:'spectral' },
  { id:'elemental',   label:'Elemental',     sub:'classical' },
  { id:'dimensional', label:'Dimensional',  sub:'depth axis' },
  { id:'temporal',    label:'Temporal',      sub:'time breath' },
  { id:'duality',     label:'Duality',       sub:'yin/yang' },
];

const ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];
const ANGLE_FREQ = [432,456.9,483.3,510.6,539.8,570.6,603.4,637.9,674.0,712.0,752.4,795.0];
const TONAL_NAMES = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];

// 12 glyphs — one per wheel column, each with its harmonic frequency
const GLYPH_FREQS = [
  { g:'△',   n:'Seed',        f:432,  a:'Seed — origin of form. The first breath. 432Hz = scalar wave baseline.' },
  { g:'◁△▷', n:'Bridge',      f:456.9, a:'Bridge — duality held in balance. 456.9Hz = 4th harmonic of A.' },
  { g:'◇',   n:'Axis',        f:483.3, a:'Axis — stillness as power. 483.3Hz = 5th harmonic of A.' },
  { g:'⬟',   n:'Return',      f:510.6, a:'Return — completion. 510.6Hz = 6th harmonic of A.' },
  { g:'△̅',  n:'Deep Silence', f:539.8, a:'Deep silence — space between notes. 539.8Hz = perfect 5th above 360Hz.' },
  { g:'⊕',   n:'Convergence', f:570.6, a:'Convergence — two worlds merge. 570.6Hz = major 3rd above 432Hz.' },
  { g:'⊗',   n:'Recursion',  f:603.4, a:'Recursion — fold returning to itself. 603.4Hz = tritone.' },
  { g:'◈',   n:'Star Seed',  f:637.9, a:'Star seed — origin before division. 637.9Hz = minor 3rd above 570.6Hz.' },
  { g:'⬡',   n:'Harm Weave', f:674.0, a:'Harmonic weave — six directions unified. 674.0Hz = major 6th above 432Hz.' },
  { g:'◧',   n:'Inversion',  f:712.0, a:'Inversion seal — collapse. 712.0Hz = augmented 4th above 570.6Hz.' },
  { g:'◨',   n:'Eversion',   f:752.4, a:'Eversion seal — emergence from within. 752.4Hz = perfect 4th above 570.6Hz.' },
  { g:'⟡',   n:'Light Anchor', f:795.0, a:'Light anchor — crystalline frequency. 795.0Hz = octave of 397.5Hz.' },
];

const CORE_GLYPHS = [
  {g:'△',   n:'Seed',          a:'Seed carrier — beginnings, potential, the first breath of form.'},
  {g:'◁△▷', n:'Bridge',        a:'Bridge — duality held in balance, opposites meeting through you.'},
  {g:'◇',   n:'Axis',          a:'Axis — stillness is your power, the perpendicular to all paths.'},
  {g:'⬟',   n:'Return',        a:'Return — completion flows back into the spiral, a cycle finished.'},
  {g:'△̅',  n:'Deep Silence',  a:'Deep silence — the field knows you as the space between notes.'},
  {g:'⊕',   n:'Convergence',   a:'Convergence — two worlds merging, a marriage of breath and geometry.'},
  {g:'⊗',   n:'Recursion',     a:'Recursion — the fold returning to itself, consciousness seeing itself.'},
  {g:'◈',   n:'Star Seed',     a:'Star seed — origin point of all spokes, the Monad before division.'},
  {g:'⬡',   n:'Harm Weave',   a:'Harmonic weave — six directions unified, balance at the center.'},
  {g:'◧',   n:'Inversion',     a:'Inversion seal — collapsed potential, a triangle turned inside.'},
  {g:'◨',   n:'Eversion',      a:'Eversion seal — form turning outward, emergence from within.'},
  {g:'⟡',   n:'Light Anchor',  a:'Light anchor — crystalline frequency, the note that holds the chord.'},
  {g:'◇◇',  n:'Twin Axis',     a:'Twin axis — two diamonds, the 5D axis doubled in stillness.'},
  {g:'△△',  n:'Twin Seed',     a:'Twin seed — the smallest triangle repeated, resonance amplified.'},
  {g:'◈',   n:'Star Bloom',    a:'Star bloom — twelve-pointed emergence, the field opening.'},
  {g:'◇',   n:'Crystal Axis',  a:'Crystal axis — diamond rotating through its own depth.'},
  {g:'⬡',   n:'Square Seed',   a:'Square seed — four-cornered stability, earth made visible.'},
  {g:'◁',   n:'Arrow Return',  a:'Arrow return — the spiral pointing back to its origin.'},
  {g:'△',   n:'First Breath',  a:'First breath — the initial inflation, spirit entering form.'},
  {g:'◇',   n:'Second Breath', a:'Second breath — the world shaping its own breath.'},
];

// Geometric forms at each 30 degree position
const GEO = ['△','□','◇','⬡','△','▭','◁','▷','⬡','◧','◨','⬡'];

// Phi-spiral monadic symbols
const MONADIC = ['☉','☽','☿','♀','♂','♃','♄','⚷','☼','☾','△','∞'];

// Quasi-prime: 1 = prime-adjacent residue, 0 = composite residue
const QUASI = [1,0,1,0,1,0,1,0,1,0,1,0];

// Breath phase at each column
const BREATH_COLS = ['Inhale','Inhale','Hold','Hold','Hold','Hold','Exhale','Exhale','Exhale','Still','Still','Inhale'];

// Classical elements at each 30 degree position
const ELEMENTS = ['🜂','🜄','🜁','🜃','△','✧','⚡','☽','☀','◐','◧','◨'];

// Duality at each position
const DUALITY = ['◁','▷','◁','▷','◁','▷','⊕','⊗','⊕','⊗','⊕','⊗'];

// Dimensional projection at each column
const DIM_LAYERS = ['2D','2D','2D','3D','3D','3D','3D','4D','4D','4D','5D','5D'];

// Temporal phases
const TEMPORAL = ['dawn','morning','noon','afternoon','dusk','evening','midnight','deep night','pre-dawn','1st watch','2nd watch','3rd watch'];

// Spectral colors at each frequency position
const SPECTRAL = ['#b30000','#cc4400','#cc6600','#998800','#88aa00','#44aa44','#00aa88','#0088cc','#0044cc','#4400cc','#8800cc','#aa0044'];

// Digital root at each column
const DR_VALS = [1,2,3,4,5,6,7,8,9,1,2,3];

/* ── STATE ── */
let selectedCells = {};
let intensities = {};
let savedCombos = [];
let audioCtx = null;
let isDragging = false;
let dragStart = null;
let dragMode = false;

/* ── AUDIO ── */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, vol, dur, type) {
  vol = vol === undefined ? 0.25 : vol;
  dur = dur === undefined ? 1.2 : dur;
  type = type === undefined ? 'sine' : type;
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playChord(freqs, vol, dur) {
  vol = vol === undefined ? 0.2 : vol;
  dur = dur === undefined ? 2.0 : dur;
  try {
    const ctx = getAudioCtx();
    freqs.forEach(function(f,i) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + i*0.06);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + i*0.06 + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.06 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i*0.06);
      o.stop(ctx.currentTime + i*0.06 + dur);
    });
  } catch(e) {}
}

function playSelectChime(info) {
  var vol = (intensities[info.row+'_'+info.col] || 65) / 400;
  if (vol < 0.05) vol = 0.18;
  playTone(info.freq, vol, 1.4);
}

function playGlyphTone(col) {
  var gf = GLYPH_FREQS[col % GLYPH_FREQS.length];
  if (gf) playTone(gf.f, 0.18, 1.5);
}

/* ── CELL INFO ── */
function getCellInfo(rowIdx, col) {
  var layer = LAYERS[rowIdx];
  var freq = ANGLE_FREQ[col];
  var deg = ANGLES[col];
  var glyph='', val='', name='', archetype='', attrs='';

  switch(layer.id) {
    case 'numerical':
      glyph = CORE_GLYPHS[DR_VALS[col] % CORE_GLYPHS.length].g;
      val = DR_VALS[col];
      name = 'Digital Root ' + val;
      archetype = 'The breath of number ' + val + '/9. ' + (val===9?'Completion, return to unity.':val===1?'Origin point, the Monad.':'Cycles through form.');
      attrs = 'DR:' + val + ' · ' + deg + '°';
      break;
    case 'geometric':
      glyph = GEO[col];
      val = layer.sub;
      name = 'Geometric: ' + GEO[col];
      archetype = 'Form language at the ' + deg + '° axis.';
      attrs = GEO[col] + ' · ' + deg + '°';
      break;
    case 'tonal':
      glyph = CORE_GLYPHS[col % CORE_GLYPHS.length].g;
      val = TONAL_NAMES[col] + ' ' + freq.toFixed(0) + 'Hz';
      name = 'Tone: ' + TONAL_NAMES[col];
      archetype = 'The note at ' + freq.toFixed(1) + ' Hz. ' + (col===0?'Seed tone, origin of the chromatic scale.':'Harmonic ' + (col+1) + '/12.');
      attrs = TONAL_NAMES[col] + ' · ' + freq.toFixed(1) + ' Hz';
      break;
    case 'symbolic':
      var cg = CORE_GLYPHS[col % CORE_GLYPHS.length];
      glyph=cg.g; name=cg.n; archetype=cg.a; val='pos '+col; attrs=deg+'°';
      break;
    case 'monadic':
      glyph = MONADIC[col]; val='phi^n'; name='Monadic: '+MONADIC[col];
      archetype='The golden ratio in self-similar recursion at '+deg+'°.'; attrs='phi-spiral · '+deg+'°';
      break;
    case 'quasi':
      glyph = QUASI[col]?'*':'·'; val=QUASI[col]?'QP':'res'; name=QUASI[col]?'Quasi-Prime':'Quasi-Residue';
      archetype = QUASI[col]
        ?'A prime-adjacent position. Primes remember through '+CORE_GLYPHS[col%CORE_GLYPHS.length].n+'.'
        :'Composite residue at '+deg+'°. Part of the prime field.';
      attrs=(QUASI[col]?'quasi-prime':'residue')+' · '+deg+'°';
      break;
    case 'breath':
      glyph = BREATH_COLS[col]==='Inhale'?'△':BREATH_COLS[col]==='Hold'?'◇':'◁▷'; val=BREATH_COLS[col];
      name='Breath: '+BREATH_COLS[col]; archetype='The '+BREATH_COLS[col]+' phase at '+deg+'°.'; attrs=BREATH_COLS[col]+' · '+deg+'°';
      break;
    case 'color':
      glyph='●'; val=SPECTRAL[col]; name='Spectral: '+SPECTRAL[col];
      archetype='The color of '+freq.toFixed(0)+' Hz light. Wavelength '+deg+'°.';
      attrs=SPECTRAL[col]+' · '+deg+'°';
      break;
    case 'elemental':
      glyph=ELEMENTS[col]; val=ELEMENTS[col]; name='Element: '+ELEMENTS[col];
      archetype='The element of the '+deg+'° axis.'; attrs=ELEMENTS[col]+' · '+deg+'°';
      break;
    case 'dimensional':
      glyph=['△','◇','◁','☉','◈','□','⬡','◆','☿','△','□','◇'][col];
      val=DIM_LAYERS[col]; name='Dimensional: '+DIM_LAYERS[col];
      archetype='The '+DIM_LAYERS[col]+' projection at '+deg+'°.'; attrs=DIM_LAYERS[col]+' · '+deg+'°';
      break;
    case 'temporal':
      glyph=['☀','☼','◐','◑','☽','☾','●','○','◇','△','□','◁'][col];
      val=TEMPORAL[col]; name='Temporal: '+TEMPORAL[col];
      archetype='The '+TEMPORAL[col]+' phase of temporal breath.'; attrs=TEMPORAL[col]+' · '+deg+'°';
      break;
    case 'duality':
      glyph=DUALITY[col]; val=col%2===0?'◁·▷':'▷·◁'; name='Duality: '+DUALITY[col];
      archetype='Yin and yang in dynamic balance at '+deg+'°.'; attrs=deg+'°';
      break;
  }

  var PRIME_POS_24 = [0,4,6,10,12,16,18,22];
  var isPrime = PRIME_POS_24.indexOf(col*2) !== -1;

  return { glyph: glyph, val: val, name: name, archetype: archetype, attrs: attrs, freq: freq, deg: deg, layer: layer, row: rowIdx, col: col, isPrime: isPrime };
}

/* ── BUILD MATRIX ── */
function buildMatrix() {
  var container = document.getElementById('harmonicMatrix');
  container.innerHTML = '';

  var corner = document.createElement('div');
  corner.className = 'cell-corner';
  corner.textContent = 'LAYERS';
  container.appendChild(corner);

  for (var i = 0; i < ANGLES.length; i++) {
    var h = document.createElement('div');
    h.className = 'col-h';
    h.textContent = ANGLES[i]+'°';
    h.title = TONAL_NAMES[i]+' '+ANGLE_FREQ[i].toFixed(1)+'Hz';
    container.appendChild(h);
  }

  for (var ri = 0; ri < LAYERS.length; ri++) {
    var layer = LAYERS[ri];
    var rh = document.createElement('div');
    rh.className = 'row-header';
    rh.innerHTML = '<span>'+layer.label+'</span><span class="row-sub">'+layer.sub+'</span>';
    container.appendChild(rh);

    for (var col = 0; col < 12; col++) {
      var cell = document.createElement('div');
      cell.className = 'm-cell';
      cell.dataset.row = ri;
      cell.dataset.col = col;
      var info = getCellInfo(ri, col);
      cell.innerHTML = '<span class="cell-glyph">'+info.glyph+'</span><span class="cell-val">'+info.val+'</span>'+(info.isPrime?'<span class="cell-prime">*</span>':'');
      container.appendChild(cell);
    }
  }

  buildRuler();
}

/* ── DRAG SELECTION ── */
function getCellFromPoint(x, y) {
  var el = document.elementFromPoint(x, y);
  if (!el || !el.classList.contains('m-cell')) return null;
  return el;
}

function getCellsInRect(r1, r2) {
  var cells = [].slice.call(document.querySelectorAll('.m-cell'));
  var minR = Math.min(r1.row, r2.row), maxR = Math.max(r1.row, r2.row);
  var minC = Math.min(r1.col, r2.col), maxC = Math.max(r1.col, r2.col);
  return cells.filter(function(c) {
    var r=+c.dataset.row, col=+c.dataset.col;
    return r>=minR && r<=maxR && col>=minC && col<=maxC;
  });
}

function selectCell(cell, info, skipAudio) {
  var key = info.row+'_'+info.col;
  if (!selectedCells[key]) {
    selectedCells[key] = info;
    intensities[key] = 65;
    cell.classList.add('selected');
    cell.classList.add('just-selected');
    setTimeout(function() { cell.classList.remove('just-selected'); }, 350);
    if (!skipAudio) {
      playSelectChime(info);
      playGlyphTone(info.col);
    }
    updateIntensityPanel();
    updatePreview();
  }
}

function deselectCell(key) {
  delete selectedCells[key];
  delete intensities[key];
  var cells = [].slice.call(document.querySelectorAll('.m-cell'));
  cells.forEach(function(c) {
    if (c.dataset.row+'_'+c.dataset.col === key) c.classList.remove('selected');
  });
  updateIntensityPanel();
  updatePreview();
}

function clearAll() {
  Object.keys(selectedCells).forEach(function(k) { deselectCell(k); });
  selectedCells = {};
  intensities = {};
  updateIntensityPanel();
  updatePreview();
}

/* ── MOUSE EVENTS ── */
var mouseDown = false;

function setupMouseEvents() {
  var matrixScroll = document.getElementById('matrixScroll');

  matrixScroll.addEventListener('mousedown', function(e) {
    var cell = e.target.closest('.m-cell');
    if (!cell) return;
    e.preventDefault();
    mouseDown = true;
    isDragging = false;
    dragStart = { x: e.clientX, y: e.clientY, row: +cell.dataset.row, col: +cell.dataset.col };
  });

  document.addEventListener('mousemove', function(e) {
    if (!mouseDown || !dragStart) return;
    var dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (!isDragging && Math.sqrt(dx*dx+dy*dy) > 6) {
      isDragging = true;
      dragMode = true;
    }
    if (isDragging) {
      drawDragRect(dragStart, e);
      var hoverCell = getCellFromPoint(e.clientX, e.clientY);
      if (hoverCell) {
        var r = +hoverCell.dataset.row, col = +hoverCell.dataset.col;
        var cells = getCellsInRect({ row: dragStart.row, col: dragStart.col }, { row: r, col: col });
        cells.forEach(function(c) {
          var row=+c.dataset.row, col=+c.dataset.col;
          var info = getCellInfo(row,col);
          var key = row+'_'+col;
          if (!selectedCells[key]) selectCell(c, info, true);
        });
      }
    }
  });

  document.addEventListener('mouseup', function(e) {
    if (!mouseDown) return;
    mouseDown = false;
    hideDragRect();
    if (!isDragging && dragStart) {
      var cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        var row=+cell.dataset.row, col=+cell.dataset.col;
        var info = getCellInfo(row,col);
        var key = row+'_'+col;
        if (selectedCells[key]) deselectCell(key);
        else selectCell(cell, info, false);
      }
    }
    isDragging = false;
    dragMode = false;
    dragStart = null;
  });
}

function drawDragRect(start, e) {
  var rect = document.getElementById('dragRect');
  var scrollEl = document.getElementById('matrixScroll');
  var sRect = scrollEl.getBoundingClientRect();
  var x1 = start.x - sRect.left + scrollEl.scrollLeft;
  var y1 = start.y - sRect.top + scrollEl.scrollTop;
  var x2 = e.clientX - sRect.left + scrollEl.scrollLeft;
  var y2 = e.clientY - sRect.top + scrollEl.scrollTop;
  rect.style.cssText = 'display:block;left:'+Math.min(x1,x2)+'px;top:'+Math.min(y1,y2)+'px;width:'+Math.abs(x2-x1)+'px;height:'+Math.abs(y2-y1)+'px;';
}

function hideDragRect() {
  document.getElementById('dragRect').style.display = 'none';
}

/* ── TOOLTIP ── */
function setupTooltip() {
  var tooltip = document.getElementById('tooltip');
  var matrixScroll = document.getElementById('matrixScroll');

  matrixScroll.addEventListener('mousemove', function(e) {
    var cell = e.target.closest('.m-cell');
    if (cell) {
      var info = getCellInfo(+cell.dataset.row, +cell.dataset.col);
      document.getElementById('ttGlyph').textContent = info.glyph;
      document.getElementById('ttName').textContent = info.name;
      document.getElementById('ttArch').textContent = info.archetype;
      tooltip.style.display = 'block';
      var tx = e.clientX + 14, ty = e.clientY + 10;
      tooltip.style.left = Math.min(tx, window.innerWidth - 200) + 'px';
      tooltip.style.top = Math.min(ty, window.innerHeight - 100) + 'px';
    } else {
      tooltip.style.display = 'none';
    }
  });

  matrixScroll.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
  });
}

/* ── PREVIEW PANEL ── */
function updatePreview() {
  var entries = Object.values(selectedCells);
  var sigil = document.getElementById('previewSigil');
  var freqEl = document.getElementById('comboFreq');
  var layersEl = document.getElementById('comboLayers');
  var barsEl = document.getElementById('resonanceBars');

  if (entries.length === 0) {
    sigil.innerHTML = '<span class="preview-empty">◇</span>';
    freqEl.textContent = '';
    layersEl.textContent = '';
    barsEl.innerHTML = '';
    return;
  }

  var uniqueGlyphs = entries.map(function(e){ return e.glyph; }).filter(function(v,i,a){ return a.indexOf(v)===i; });
  sigil.innerHTML = uniqueGlyphs.slice(0,12).map(function(g){ return '<span class="prev-glyph">'+g+'</span>'; }).join('');

  var avgFreq = entries.reduce(function(s,e){ return s+e.freq; }, 0) / entries.length;
  freqEl.textContent = '◇ ' + avgFreq.toFixed(1) + ' Hz avg';

  var layers = entries.map(function(e){ return e.layer.label; }).filter(function(v,i,a){ return a.indexOf(v)===i; });
  layersEl.textContent = layers.join(' · ');

  barsEl.innerHTML = '';
  entries.slice(0,12).forEach(function(e) {
    var bar = document.createElement('div');
    bar.className = 'res-bar';
    var pct = ((e.freq - 432) / (795 - 432)) * 100;
    var intensity = intensities[e.row+'_'+e.col] || 65;
    bar.style.height = (pct * intensity / 100 * 0.9 + 5) + 'px';
    bar.style.background = 'hsl(' + (40 + pct * 0.5) + ', 70%, ' + (30 + intensity*0.4) + '%)';
    bar.title = e.glyph + ' ' + e.freq.toFixed(1) + 'Hz';
    barsEl.appendChild(bar);
  });
}

/* ── INTENSITY PANEL ── */
function updateIntensityPanel() {
  var list = document.getElementById('intensityList');
  var entries = Object.values(selectedCells);

  if (entries.length === 0) {
    list.innerHTML = '<div style="font-size:0.55rem;color:var(--muted);font-style:italic;text-align:center;">Select cells to adjust intensity</div>';
    return;
  }

  list.innerHTML = '';
  entries.forEach(function(e) {
    var key = e.row+'_'+e.col;
    var item = document.createElement('div');
    item.className = 'intensity-item';
    item.innerHTML = '<span class="intensity-glyph">'+e.glyph+'</span>' +
      '<input type="range" class="intensity-slider" min="0" max="100" value="'+(intensities[key]||65)+'" data-key="'+key+'">' +
      '<span class="intensity-hz">'+e.freq.toFixed(0)+'Hz</span>' +
      '<button class="intensity-remove" data-key="'+key+'">x</button>';
    list.appendChild(item);
  });
}

/* ── SAVED COMBINATIONS ── */
var STORAGE_KEY = 'matrix_saved_combos';

function loadSaved() {
  try { savedCombos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { savedCombos = []; }
}

function saveSaved() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCombos));
}

function renderSaved() {
  var list = document.getElementById('savedList');
  if (savedCombos.length === 0) {
    list.innerHTML = '<div class="no-saved">No saved combinations yet.</div>';
    return;
  }
  list.innerHTML = '';
  savedCombos.forEach(function(combo, i) {
    var item = document.createElement('div');
    item.className = 'saved-item';
    var glyphs = combo.cells.slice(0,8).map(function(c){ return c.glyph; }).join('');
    item.innerHTML = '<div class="saved-item-info"><div class="saved-item-name">'+combo.name+'</div><div class="saved-item-meta">'+combo.cells.length+' glyphs · '+new Date(combo.ts).toLocaleDateString()+'</div></div><span class="saved-item-glyphs">'+glyphs+'</span><button class="saved-item-del" data-index="'+i+'">x</button>';
    item.addEventListener('click', function(e) {
      if (e.target.classList.contains('saved-item-del')) return;
      loadCombo(combo);
    });
    item.querySelector('.saved-item-del').addEventListener('click', function(e) {
      e.stopPropagation();
      savedCombos.splice(i, 1);
      saveSaved();
      renderSaved();
    });
    list.appendChild(item);
  });
}

function loadCombo(combo) {
  clearAll();
  combo.cells.forEach(function(c) {
    var cell = document.querySelector('.m-cell[data-row="'+c.row+'"][data-col="'+c.col+'"]');
    if (cell) {
      var info = getCellInfo(c.row, c.col);
      selectCell(cell, info, true);
    }
  });
  var entries = Object.values(selectedCells);
  if (entries.length > 0) playChord(entries.map(function(e){ return e.freq; }), 0.15, 2.5);
}

function saveCurrentCombo() {
  var entries = Object.values(selectedCells);
  if (entries.length === 0) { alert('Select at least one glyph first.'); return; }
  var name = prompt('Name this harmonic sigil:', 'Sigil ' + (savedCombos.length+1));
  if (!name) return;
  var combo = {
    name: name,
    cells: entries.map(function(e) { return { row:e.row, col:e.col, glyph:e.glyph, freq:e.freq, layer:e.layer.label }; }),
    ts: Date.now()
  };
  savedCombos.push(combo);
  saveSaved();
  renderSaved();
}

/* ── RANDOMIZE ── */
function randomize() {
  clearAll();
  var count = 3 + Math.floor(Math.random() * 3);
  var usedKeys = {};

  for (var i = 0; i < count; i++) {
    var row, col, key, attempts = 0;
    do {
      row = Math.floor(Math.random() * 12);
      col = Math.floor(Math.random() * 12);
      key = row+'_'+col;
      attempts++;
    } while (usedKeys[key] && attempts < 50);
    usedKeys[key] = true;
    var cell = document.querySelector('.m-cell[data-row="'+row+'"][data-col="'+col+'"]');
    if (cell) {
      var info = getCellInfo(row, col);
      selectCell(cell, info, true);
    }
  }

  var entries = Object.values(selectedCells);
  if (entries.length > 0) playChord(entries.map(function(e){ return e.freq; }), 0.15, 2.5);
}

/* ── ROW / COLUMN SELECT ── */
function selectRow() {
  var row = parseInt(prompt('Enter row (1-12):', '1'));
  if (isNaN(row)||row<1||row>12) return;
  var rowIdx = row-1;
  var cells = [].slice.call(document.querySelectorAll('.m-cell[data-row="'+rowIdx+'"]'));
  cells.forEach(function(cell) {
    var info = getCellInfo(rowIdx, +cell.dataset.col);
    if (!selectedCells[rowIdx+'_'+cell.dataset.col]) selectCell(cell, info, true);
  });
}

function selectCol() {
  var col = parseInt(prompt('Enter column angle (0-330, multiples of 30):', '0'));
  if (isNaN(col)) return;
  var colIdx = ANGLES.indexOf(col);
  if (colIdx === -1) { alert('Invalid angle. Use 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, or 330.'); return; }
  var cells = [].slice.call(document.querySelectorAll('.m-cell[data-col="'+colIdx+'"]'));
  cells.forEach(function(cell) {
    var info = getCellInfo(+cell.dataset.row, colIdx);
    if (!selectedCells[+cell.dataset.row+'_'+colIdx]) selectCell(cell, info, true);
  });
}

/* ── FREQUENCY RULER ── */
function buildRuler() {
  var ruler = document.getElementById('freqRuler');
  ruler.innerHTML = '';
  for (var i = 0; i < ANGLES.length; i++) {
    var chip = document.createElement('div');
    chip.className = 'freq-chip';
    chip.innerHTML = '<span>'+ANGLE_FREQ[i].toFixed(0)+'</span>'+TONAL_NAMES[i]+'\n'+ANGLES[i]+'°';
    ruler.appendChild(chip);
  }
}

/* ── REVEAL ANIMATION ── */
function revealWave() {
  var cells = [].slice.call(document.querySelectorAll('.m-cell'));
  cells.forEach(function(c) { c.style.opacity = '0'; });
  cells.forEach(function(c, i) {
    var row = +c.dataset.row;
    setTimeout(function() {
      c.style.transition = 'opacity 0.35s ease';
      c.style.opacity = '1';
    }, row * 55 + Math.random() * 20);
  });
}

/* ── CROSS-TOOL COHERENCE SYNC ── */
var BREATH_ROW_IDX = 6;
var BREATH_HIGHLIGHT_COLS = [1,4,6,10,16,18];

function updateCoherenceReactivity(coh) {
  if ( coh < 30) {
    [].slice.call(document.querySelectorAll('.m-cell')).forEach(function(c) { c.style.boxShadow = ''; });
    return;
  }
  var intensity = (coh - 30) / 70;
  [].slice.call(document.querySelectorAll('.m-cell.selected')).forEach(function(c) {
    c.style.boxShadow = '0 0 '+(6 + intensity*14)+'px rgba(232,200,106,'+(0.2 + intensity*0.4)+')';
  });
}

function highlightBreathRow(phase) {
  [].slice.call(document.querySelectorAll('.m-cell')).forEach(function(c) {
    var r = +c.dataset.row;
    if (r === BREATH_ROW_IDX) {
      var col = +c.dataset.col;
      c.style.background = BREATH_HIGHLIGHT_COLS[phase] === col ? 'rgba(232,200,106,0.15)' : '';
    } else {
      c.style.background = '';
    }
  });
}

/* ── BUTTONS ── */
function setupButtons() {
  document.getElementById('btnSaveCombo').onclick = saveCurrentCombo;
  document.getElementById('btnRandomize').onclick = randomize;
  document.getElementById('btnSelectRow').onclick = selectRow;
  document.getElementById('btnSelectCol').onclick = selectCol;
  document.getElementById('btnClearAll').onclick = clearAll;

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') clearAll();
  });

  document.getElementById('intensityList').addEventListener('input', function(e) {
    if (e.target.classList.contains('intensity-slider')) {
      var key = e.target.dataset.key;
      intensities[key] = +e.target.value;
      var info = selectedCells[key];
      if (info) playTone(info.freq, intensities[key]/400 || 0.18, 0.8);
      updatePreview();
    }
  });

  document.getElementById('intensityList').addEventListener('click', function(e) {
    if (e.target.classList.contains('intensity-remove')) deselectCell(e.target.dataset.key);
  });

  // Cross-tool sync via localStorage events
  window.addEventListener('codex_coherence_update', function(e) {
    updateCoherenceReactivity(e.detail && e.detail.coherence || 0);
  });

  window.addEventListener('codex_phase_update', function(e) {
    highlightBreathRow(e.detail && e.detail.phase || 0);
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  buildMatrix();
  loadSaved();
  setupMouseEvents();
  setupTooltip();
  setupButtons();
  renderSaved();
  updateIntensityPanel();
  updatePreview();
  setTimeout(revealWave, 250);
  console.log('\u25C7 Harmonic Glyph Matrix v2 \u2014 Enhanced loaded');
});
