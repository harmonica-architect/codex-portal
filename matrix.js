<script>
/Ã—â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HARMONIC GLYPH MATRIX v2 â€” 12Ã—12 Enhanced
   Multi-select drag Â· Save/load Â· Resonance preview Â· Intensity
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
  { id:'duality',     label:'Duality',       sub:'yinâˆ•yang' },
];

const ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];
const ANGLE_FREQ = [432,456.9,483.3,510.6,539.8,570.6,603.4,637.9,674.0,712.0,752.4,795.0];
const TONAL_NAMES = ['A','Aâ™¯','B','C','Câ™¯','D','Dâ™¯','E','F','Fâ™¯','G','Gâ™¯'];

const CORE_GLYPHS = [
  {g:'â–³',   n:'Seed',          a:'Seed carrier â€” beginnings, potential, the first breath of form.'},
  {g:'â—â–³â–·', n:'Bridge',        a:'Bridge â€” duality held in balance, opposites meeting through you.'},
  {g:'â—‡',   n:'Axis',          a:'Axis â€” stillness is your power, the perpendicular to all paths.'},
  {g:'â¬Ÿ',   n:'Return',        a:'Return â€” completion flows back into the spiral, a cycle finished.'},
  {g:'â–³Ì…',  n:'Deep Silence',  a:'Deep silence â€” the field knows you as the space between notes.'},
  {g:'âŠ•',   n:'Convergence',   a:'Convergence â€” two worlds merging, a marriage of breath and geometry.'},
  {g:'âŠ—',   n:'Recursion',     a:'Recursion â€” the fold returning to itself, consciousness seeing itself.'},
  {g:'â—ˆ',   n:'Star Seed',     a:'Star seed â€” origin point of all spokes, the Monad before division.'},
  {g:'â¬¡',   n:'Harm Weave',   a:'Harmonic weave â€” six directions unified, balance at the center.'},
  {g:'â—§',   n:'Inversion',     a:'Inversion seal â€” collapsed potential, a triangle turned inside.'},
  {g:'â—¨',   n:'Eversion',      a:'Eversion seal â€” form turning outward, emergence from within.'},
  {g:'âŸ¡',   n:'Light Anchor',  a:'Light anchor â€” crystalline frequency, the note that holds the chord.'},
  {g:'â—‡â—‡',  n:'Twin Axis',     a:'Twin axis â€” two diamonds, the 5D axis doubled in stillness.'},
  {g:'â–³â–³',  n:'Twin Seed',     a:'Twin seed â€” the smallest triangle repeated, resonance amplified.'},
  {g:'âŠ›',   n:'Star Bloom',    a:'Star bloom â€” twelve-pointed emergence, the field opening.'},
  {g:'â—¬',   n:'Crystal Axis',  a:'Crystal axis â€” diamond rotating through its own depth.'},
  {g:'â—»',   n:'Square Seed',   a:'Square seed â€” four-cornered stability, earth made visible.'},
  {g:'âŒ“',   n:'Arrow Return',  a:'Arrow return â€” the spiral pointing back to its origin.'},
  {g:'â—°',   n:'First Breath',  a:'First breath â€” the initial inflation, spirit entering form.'},
  {g:'â—±',   n:'Second Breath', a:'Second breath â€” the world shaping its own breath.'},
];

const GEO = ['â–³','â–¡','â—‡','â¬¡','â–³','â–½','â—','â–·','â§ˆ','â§‡','â—‹','â—»'];
const MONADIC = ['â˜‰','â—‰','âŠ™','â—‹','â—Ž','â—','â—’','â—“','â˜¤','â™¢','â–³','âˆž'];
const QUASI = [1,0,1,0,1,0,1,0,1,0,1,0];
const BREATH_COLS = ['Inhale','Inhale','Hold','Hold','Hold','Hold','Exhale','Exhale','Exhale','Still','Still','Inhale'];
const ELEMENTS = ['ðŸ”¥','ðŸ’§','ðŸŒ¬ï¸','ðŸŒ','â—ˆ','âœ¦','âš¡','ðŸŒ™','â˜€ï¸','â­','ðŸ’«','ðŸ”®'];
const DUALITY = ['â—‹','â—','â—','â—‘','â—”','â—•','â—“','â—’','â˜¯','â˜¯','âŠ•','âŠ—'];
const DIM_LAYERS = ['2D','2D','2D','3D','3D','3D','3D','4D','4D','4D','5D','5D'];
const TEMPORAL = ['dawn','morning','noon','afternoon','dusk','evening','midnight','deep night','pre-dawn','1st watch','2nd watch','3rd watch'];
const SPECTRAL = ['#b30000','#cc4400','#cc6600','#998800','#88aa00','#44aa44','#00aa88','#0088cc','#0044cc','#4400cc','#8800cc','#aa0044'];
const DR_VALS = [1,2,3,4,5,6,7,8,9,1,2,3];

/* â”€â”€ STATE â”€â”€ */
let selectedCells = {};      // key: "row_col" â†’ {row,col,layer,info}
let intensities = {};        // key: "row_col" â†’ 0..100
let savedCombos = [];        // [{name, cells:[{row,col,glyph,freq,layer}], ts}]
let audioCtx = null;
let isDragging = false;
let dragStart = null;
let dragMode = false;
let tutorialDone = localStorage.getItem('matrix_tutorial_done') === '1';

/* â”€â”€ AUDIO â”€â”€ */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, vol=0.25, dur=1.2, type='sine') {
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

function playChord(freqs, vol=0.2, dur=2.0) {
  try {
    const ctx = getAudioCtx();
    freqs.forEach((f,i) => {
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
  // Play fundamental + 2 harmonics for a rich chime
  playTone(info.freq, intensities[`${info.row}_${info.col}`] / 400 || 0.18, 1.4);
}

/* â”€â”€ CELL INFO â”€â”€ */
function getCellInfo(rowIdx, col) {
  const layer = LAYERS[rowIdx];
  const freq = ANGLE_FREQ[col];
  const deg = ANGLES[col];
  let glyph='', val='', name='', archetype='', attrs='';

  switch(layer.id) {
    case 'numerical':
      glyph = CORE_GLYPHS[DR_VALS[col] % CORE_GLYPHS.length].g;
      val = DR_VALS[col];
      name = 'Digital Root ' + val;
      archetype = 'The breath of number ' + val + '/9. ' + (val===9?'Completion, return to unity.':val===1?'Origin point, the Monad.':'Cycles through form.');
      attrs = 'DR:' + val + ' Â· ' + deg + 'Â°';
      break;
    case 'geometric':
      glyph = GEO[col];
      val = layer.sub;
      name = 'Geometric: ' + GEO[col];
      archetype = 'Form language at the ' + deg + 'Â° axis.';
      attrs = GEO[col] + ' Â· ' + deg + 'Â°';
      break;
    case 'tonal':
      glyph = CORE_GLYPHS[col % CORE_GLYPHS.length].g;
      val = TONAL_NAMES[col] + ' ' + freq.toFixed(0) + 'Hz';
      name = 'Tone: ' + TONAL_NAMES[col];
      archetype = 'The note at ' + freq.toFixed(1) + ' Hz. ' + (col===0?'Seed tone, origin of the chromatic scale.':'Harmonic ' + (col+1) + '/12.');
      attrs = TONAL_NAMES[col] + ' Â· ' + freq.toFixed(1) + ' Hz';
      break;
    case 'symbolic':
      { const cg = CORE_GLYPHS[col % CORE_GLYPHS.length]; glyph=cg.g; name=cg.n; archetype=cg.a; val='pos '+col; attrs=deg+'Â°'; break; }
    case 'monadic':
      glyph = MONADIC[col]; val='Ï†â¿'; name='Monadic: '+MONADIC[col];
      archetype='The golden ratio in self-similar recursion at '+deg+'Â°.'; attrs='Ï†-spiral Â· '+deg+'Â°';
      break;
    case 'quasi':
      glyph = QUASI[col]?'âœ¦':'Â·'; val=QUASI[col]?'QP':'res'; name=QUASI[col]?'Quasi-Prime':'Quasi-Residue';
      archetype = QUASI[col]
        ?'A prime-adjacent position. Primes remember through '+CORE_GLYPHS[col%CORE_GLYPHS.length].n+'.'
        :'Composite residue at '+deg+'Â°. Part of the prime field.';
      attrs=(QUASI[col]?'quasi-prime':'residue')+' Â· '+deg+'Â°';
      break;
    case 'breath':
      glyph = BREATH_COLS[col]==='Inhale'?'â–³':BREATH_COLS[col]==='Hold'?'â—‡':'â—â–·'; val=BREATH_COLS[col];
      name='Breath: '+BREATH_COLS[col]; archetype='The '+BREATH_COLS[col]+' phase at '+deg+'Â°.'; attrs=BREATH_COLS[col]+' Â· '+deg+'Â°';
      break;
    case 'color':
      glyph='â—'; val=SPECTRAL[col]; name='Spectral: '+SPECTRAL[col];
      archetype='The color of '+freq.toFixed(0)+' Hz light. Wavelength '+deg+'Â°.';
      attrs=SPECTRAL[col]+' Â· '+deg+'Â°';
      break;
    case 'elemental':
      glyph=ELEMENTS[col]; val=ELEMENTS[col]; name='Element: '+ELEMENTS[col];
      archetype='The element of the '+deg+'Â° axis.'; attrs=ELEMENTS[col]+' Â· '+deg+'Â°';
      break;
    case 'dimensional':
      glyph=['â–³','â—‡','â—‹','â—‰','â—ˆ','â–¡','â¬¡','â¬¢','âŠ™','â—°','â—±','â—¬'][col];
      val=DIM_LAYERS[col]; name='Dimensional: '+DIM_LAYERS[col];
      archetype='The '+DIM_LAYERS[col]+' projection at '+deg+'Â°.'; attrs=DIM_LAYERS[col]+' Â· '+deg+'Â°';
      break;
    case 'temporal':
      glyph=['â—Œ','â— ','â—¡','â—','â—‰','â—‹','â—','â—‘','â—‡','â–³','â–¡','â—Ž'][col];
      val=TEMPORAL[col]; name='Temporal: '+TEMPORAL[col];
      archetype='The '+TEMPORAL[col]+' phase of temporal breath.'; attrs=TEMPORAL[col]+' Â· '+deg+'Â°';
      break;
    case 'duality':
      glyph=DUALITY[col]; val=col%2===0?'â—‹Â·â—':'â—Â·â—‹'; name='Duality: '+DUALITY[col];
      archetype='Yin and yang in dynamic balance at '+deg+'Â°.'; attrs=deg+'Â°';
      break;
  }

  const PRIME_POS_24 = [0,4,6,10,12,16,18,22];
  const isPrime = PRIME_POS_24.includes(col*2);

  return { glyph, val, name, archetype, attrs, freq, deg, layer, row: rowIdx, col, isPrime };
}

/* â”€â”€ BUILD MATRIX â”€â”€ */
function buildMatrix() {
  const container = document.getElementById('harmonicMatrix');
  container.innerHTML = '';

  // Corner
  const corner = document.createElement('div');
  corner.className = 'cell-corner';
  corner.textContent = 'LAYERS';
  container.appendChild(corner);

  // Column headers
  ANGLES.forEach((deg, i) => {
    const h = document.createElement('div');
    h.className = 'col-h';
    h.textContent = deg+'Â°';
    h.title = TONAL_NAMES[i]+' '+ANGLE_FREQ[i].toFixed(1)+'Hz';
    container.appendChild(h);
  });

  // Data rows
  LAYERS.forEach((layer, rowIdx) => {
    const rh = document.createElement('div');
    rh.className = 'row-header';
    rh.innerHTML = `<span>${layer.label}</span><span class="row-sub">${layer.sub}</span>`;
    rh.title = layer.desc || layer.label;
    container.appendChild(rh);

    for (let col=0; col<12; col++) {
      const cell = document.createElement('div');
      cell.className = 'm-cell';
      cell.dataset.row = rowIdx;
      cell.dataset.col = col;
      const info = getCellInfo(rowIdx, col);
      cell.innerHTML = `<span class="cell-glyph">${info.glyph}</span><span class="cell-val">${info.val}</span>${info.isPrime?'<span class="cell-prime">âœ¦</span>':''}`;
      container.appendChild(cell);
    }
  });

  buildRuler();
}

/* â”€â”€ DRAG SELECTION â”€â”€ */
function getCellFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el || !el.classList.contains('m-cell')) return null;
  return el;
}

function getCellsInRect(r1, r2) {
  const cells = [...document.querySelectorAll('.m-cell')];
  const minR = Math.min(r1.row, r2.row), maxR = Math.max(r1.row, r2.row);
  const minC = Math.min(r1.col, r2.col), maxC = Math.max(r1.col, r2.col);
  return cells.filter(c => {
    const r=+c.dataset.row, col=+c.dataset.col;
    return r>=minR && r<=maxR && col>=minC && col<=maxC;
  });
}

function selectCell(cell, info) {
  const key = info.row+'_'+info.col;
  if (!selectedCells[key]) {
    selectedCells[key] = info;
    intensities[key] = 65;
    cell.classList.add('selected');
    cell.classList.add('just-selected');
    setTimeout(() => cell.classList.remove('just-selected'), 350);
    playSelectChime(info);
    updateIntensityPanel();
    updatePreview();
  }
}

function deselectCell(key) {
  delete selectedCells[key];
  delete intensities[key];
  document.querySelectorAll('.m-cell').forEach(c => {
    if (c.dataset.row+'_'+c.dataset.col === key) c.classList.remove('selected');
  });
  updateIntensityPanel();
  updatePreview();
}

function clearAll() {
  Object.keys(selectedCells).forEach(k => deselectCell(k));
  selectedCells = {};
  intensities = {};
  updateIntensityPanel();
  updatePreview();
}

/* Mouse events */
const matrixScroll = document.getElementById('matrixScroll');
let mouseDown = false;

matrixScroll.addEventListener('mousedown', e => {
  if (e.target.classList.contains('m-cell') || e.target.closest('.m-cell')) {
    const cell = e.target.classList.contains('m-cell') ? e.target : e.target.closest('.m-cell');
    e.preventDefault();
    mouseDown = true;
    isDragging = false;
    dragStart = { x: e.clientX, y: e.clientY, row: +cell.dataset.row, col: +cell.dataset.col };
  }
});

document.addEventListener('mousemove', e => {
  if (!mouseDown || !dragStart) return;
  const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
  if (!isDragging && Math.sqrt(dx*dx+dy*dy) > 6) {
    isDragging = true;
    dragMode = true;
  }
  if (isDragging) {
    drawDragRect(dragStart, e);
    const hoverCell = getCellFromPoint(e.clientX, e.clientY);
    if (hoverCell) {
      const r = +hoverCell.dataset.row, col = +hoverCell.dataset.col;
      const cells = getCellsInRect(
        { row: dragStart.row, col: dragStart.col },
        { row: r, col: col }
      );
      // Add newly hovered cells
      cells.forEach(c => {
        const row=+c.dataset.row, col=+c.dataset.col;
        const info = getCellInfo(row,col);
        const key = row+'_'+col;
        if (!selectedCells[key]) selectCell(c, info);
      });
    }
  }
});

document.addEventListener('mouseup', e => {
  if (!mouseDown) return;
  mouseDown = false;
  hideDragRect();
  if (!isDragging && dragStart) {
    // Single click
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      const row=+cell.dataset.row, col=+cell.dataset.col;
      const info = getCellInfo(row,col);
      const key = row+'_'+col;
      if (selectedCells[key]) {
        deselectCell(key);
      } else {
        selectCell(cell, info);
      }
    }
  }
  isDragging = false;
  dragMode = false;
  dragStart = null;
});

function drawDragRect(start, e) {
  const rect = document.getElementById('dragRect');
  const scrollEl = document.getElementById('matrixScroll');
  const sRect = scrollEl.getBoundingClientRect();
  const x1 = start.x - sRect.left + scrollEl.scrollLeft;
  const y1 = start.y - sRect.top + scrollEl.scrollTop;
  const x2 = e.clientX - sRect.left + scrollEl.scrollLeft;
  const y2 = e.clientY - sRect.top + scrollEl.scrollTop;
  const left = Math.min(x1,x2), top = Math.min(y1,y2);
  const width = Math.abs(x2-x1), height = Math.abs(y2-y1);
  rect.style.cssText = `display:block;left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
}

function hideDragRect() {
  document.getElementById('dragRect').style.display = 'none';
}

/* â”€â”€ TOOLTIP â”€â”€ */
const tooltip = document.getElementById('tooltip');
document.getElementById('matrixScroll').addEventListener('mousemove', e => {
  const cell = e.target.closest('.m-cell');
  if (cell) {
    const info = getCellInfo(+cell.dataset.row, +cell.dataset.col);
    document.getElementById('ttGlyph').textContent = info.glyph;
    document.getElementById('ttName').textContent = info.name;
    document.getElementById('ttArch').textContent = info.archetype;
    tooltip.style.display = 'block';
    const tx = e.clientX + 14, ty = e.clientY + 10;
    tooltip.style.left = Math.min(tx, window.innerWidth - 200) + 'px';
    tooltip.style.top = Math.min(ty, window.innerHeight - 100) + 'px';
  } else {
    tooltip.style.display = 'none';
  }
});
document.getElementById('matrixScroll').addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

/* â”€â”€ PREVIEW PANEL â”€â”€ */
function updatePreview() {
  const entries = Object.values(selectedCells);
  const sigil = document.getElementById('previewSigil');
  const freqEl = document.getElementById('comboFreq');
  const layersEl = document.getElementById('comboLayers');
  const barsEl = document.getElementById('resonanceBars');

  if (entries.length === 0) {
    sigil.innerHTML = '<span class="preview-empty">â—‡</span>';
    freqEl.textContent = '';
    layersEl.textContent = '';
    barsEl.innerHTML = '';
    return;
  }

  // Composite sigil glyph
  const uniqueGlyphs = [...new Set(entries.map(e=>e.glyph))];
  sigil.innerHTML = uniqueGlyphs.slice(0,12).map(g=>`<span class="prev-glyph">${g}</span>`).join('');

  // Average frequency
  const avgFreq = entries.reduce((s,e)=>s+e.freq,0)/entries.length;
  freqEl.textContent = 'â—‡ ' + avgFreq.toFixed(1) + ' Hz avg';

  // Layer diversity
  const layers = [...new Set(entries.map(e=>e.layer.label))];
  layersEl.textContent = layers.join(' Â· ');

  // Resonance bars (per selected cell)
  barsEl.innerHTML = '';
  entries.slice(0,12).forEach(e => {
    const bar = document.createElement('div');
    bar.className = 'res-bar';
    const pct = ((e.freq - 432) / (795 - 432)) * 100;
    const intensity = intensities[e.row+'_'+e.col] || 65;
    bar.style.height = (pct * intensity / 100 * 0.9 + 5) + 'px';
    bar.style.background = `hsl(${40 + pct * 0.5}, 70%, ${30 + intensity*0.4}%)`;
    bar.title = e.glyph + ' ' + e.freq.toFixed(1) + 'Hz';
    barsEl.appendChild(bar);
  });
}

/* â”€â”€ INTENSITY PANEL â”€â”€ */
function updateIntensityPanel() {
  const list = document.getElementById('intensityList');
  const entries = Object.values(selectedCells);

  if (entries.length === 0) {
    list.innerHTML = '<div style="font-size:0.55rem;color:var(--muted);font-style:italic;text-align:center;">Select cells to adjust intensity</div>';
    return;
  }

  list.innerHTML = '';
  entries.forEach(e => {
    const key = e.row+'_'+e.col;
    const item = document.createElement('div');
    item.className = 'intensity-item';
    item.innerHTML = `
      <span class="intensity-glyph">${e.glyph}</span>
      <input type="range" class="intensity-slider" min="0" max="100" value="${intensities[key]||65}" data-key="${key}">
      <span class="intensity-hz">${e.freq.toFixed(0)}Hz</span>
      <button class="intensity-remove" data-key="${key}">âœ•</button>
    `;
    list.appendChild(item);
  });
}

document.getElementById('intensityList').addEventListener('input', e => {
  if (e.target.classList.contains('intensity-slider')) {
    const key = e.target.dataset.key;
    intensities[key] = +e.target.value;
    const info = selectedCells[key];
    if (info) playTone(info.freq, intensities[key]/400 || 0.18, 0.8);
    updatePreview();
  }
});

document.getElementById('intensityList').addEventListener('click', e => {
  if (e.target.classList.contains('intensity-remove')) {
    deselectCell(e.target.dataset.key);
  }
});

/* â”€â”€ SAVED COMBINATIONS â”€â”€ */
const STORAGE_KEY = 'matrix_saved_combos';

function loadSaved() {
  try { savedCombos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { savedCombos = []; }
}

function saveSaved() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCombos));
}

function renderSaved() {
  const list = document.getElementById('savedList');
  if (savedCombos.length === 0) {
    list.innerHTML = '<div class="no-saved">No saved combinations yet.</div>';
    return;
  }
  list.innerHTML = '';
  savedCombos.forEach((combo, i) => {
    const item = document.createElement('div');
    item.className = 'saved-item';
    const glyphs = combo.cells.slice(0,8).map(c=>c.glyph).join('');
    item.innerHTML = `
      <div class="saved-item-info">
        <div class="saved-item-name">${combo.name}</div>
        <div class="saved-item-meta">${combo.cells.length} glyphs Â· ${new Date(combo.ts).toLocaleDateString()}</div>
      </div>
      <span class="saved-item-glyphs">${glyphs}</span>
      <button class="saved-item-del" data-index="${i}">âœ•</button>
    `;
    item.title = 'Click to load';
    item.onclick = (e) => {
      if (e.target.classList.contains('saved-item-del')) return;
      loadCombo(combo);
    };
    item.querySelector('.saved-item-del').onclick = (e) => {
      e.stopPropagation();
      savedCombos.splice(i, 1);
      saveSaved();
      renderSaved();
    };
    list.appendChild(item);
  });
}

function loadCombo(combo) {
  clearAll();
  combo.cells.forEach(c => {
    const cell = document.querySelector(`.m-cell[data-row="${c.row}"][data-col="${c.col}"]`);
    if (cell) {
      const info = getCellInfo(c.row, c.col);
      selectCell(cell, info);
    }
  });
}

function saveCurrentCombo() {
  const entries = Object.values(selectedCells);
  if (entries.length === 0) { alert('Select at least one glyph first.'); return; }
  const name = prompt('Name this harmonic sigil:', 'Sigil ' + (savedCombos.length+1));
  if (!name) return;
  const combo = {
    name,
    cells: entries.map(e => ({ row:e.row, col:e.col, glyph:e.glyph, freq:e.freq, layer:e.layer.label })),
    ts: Date.now()
  };
  savedCombos.push(combo);
  saveSaved();
  renderSaved();
}

/* â”€â”€ RANDOMIZE â”€â”€ */
function randomize() {
  clearAll();
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 glyphs
  const usedKeys = new Set();
  const rows = [...Array(12).keys()];
  const cols = [...Array(12).keys()];

  for (let i=0; i<count; i++) {
    let row, col, key;
    let attempts = 0;
    do {
      row = rows[Math.floor(Math.random()*rows.length)];
      col = cols[Math.floor(Math.random()*cols.length)];
      key = row+'_'+col;
      attempts++;
    } while (usedKeys.has(key) && attempts < 50);
    usedKeys.add(key);
    const cell = document.querySelector(`.m-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      const info = getCellInfo(row, col);
      selectCell(cell, info);
    }
  }

  // Play all selected tones as chord
  const entries = Object.values(selectedCells);
  if (entries.length > 0) {
    const freqs = entries.map(e=>e.freq);
    playChord(freqs, 0.15, 2.5);
  }
}

/* â”€â”€ ROW / COLUMN SELECT â”€â”€ */
function selectRow() {
  const row = parseInt(prompt('Enter row (1-12):', '1'));
  if (isNaN(row)||row<1||row>12) return;
  const rowIdx = row-1;
  document.querySelectorAll(`.m-cell[data-row="${rowIdx}"]`).forEach(cell => {
    const info = getCellInfo(rowIdx, +cell.dataset.col);
    if (!selectedCells[rowIdx+'_'+cell.dataset.col]) selectCell(cell, info);
  });
}

function selectCol() {
  const col = parseInt(prompt('Enter column angle (0-330, multiples of 30):', '0'));
  if (isNaN(col)) return;
  const colIdx = ANGLES.indexOf(col);
  if (colIdx === -1) { alert('Invalid angle. Use 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, or 330.'); return; }
  document.querySelectorAll(`.m-cell[data-col="${colIdx}"]`).forEach(cell => {
    const info = getCellInfo(+cell.dataset.row, colIdx);
    if (!selectedCells[+cell.dataset.row+'_'+colIdx]) selectCell(cell, info);
  });
}

/* â”€â”€ RULER â”€â”€ */
function buildRuler() {
  const ruler = document.getElementById('freqRuler');
  ruler.innerHTML = '';
  ANGLES.forEach((deg, i) => {
    const chip = document.createElement('div');
    chip.className = 'freq-chip';
    chip.innerHTML = `<span>${ANGLE_FREQ[i].toFixed(0)}</span>${TONAL_NAMES[i]}\n${deg}Â°`;
    ruler.appendChild(chip);
  });
}

/* â”€â”€ REVEAL ANIMATION â”€â”€ */
function revealWave() {
  const cells = [...document.querySelectorAll('.m-cell')];
  cells.forEach(c => c.style.opacity = '0');
  cells.forEach((c, i) => {
    const row = +c.dataset.row;
    setTimeout(() => {
      c.style.transition = 'opacity 0.35s ease';
      c.style.opacity = '1';
    }, row * 55 + Math.random() * 20);
  });
}

/* â”€â”€ TUTORIAL â”€â”€ */
function showTutorial() {
  if (tutorialDone) return;
  document.getElementById('tutorialOverlay').style.display = 'flex';
}

document.getElementById('tutorialBegin').onclick = () => {
  tutorialDone = true;
  localStorage.setItem('matrix_tutorial_done', '1');
  document.getElementById('tutorialOverlay').style.display = 'none';
  getAudioCtx(); // Unlock audio context
  playChord([432, 528, 639], 0.2, 3.0); // Welcome chime
};

document.getElementById('tutorialSkip').onclick = () => {
  tutorialDone = true;
  localStorage.setItem('matrix_tutorial_done', '1');
  document.getElementById('tutorialOverlay').style.display = 'none';
};

/* Click anywhere on overlay = dismiss (matrix is fully covered, all clicks hit overlay) */
document.getElementById('tutorialOverlay').addEventListener('click', e => {
  e.stopPropagation(); // prevent drag-rect or cell clicks
  document.getElementById('tutorialSkip').click();
});

/* â”€â”€ INIT â”€â”€ */
buildMatrix();
loadSaved();
renderSaved();
updateIntensityPanel();
updatePreview();
setTimeout(revealWave, 250);

// â”€â”€ TUTORIAL: dismiss on click OUTSIDE the tutorial box (pointer-events: none on overlay) â”€â”€
document.addEventListener('click', e => {
  const overlay = document.getElementById('tutorialOverlay');
  if (!overlay || overlay.style.display === 'none') return;
  const box = overlay.querySelector('.tutorial-box');
  if (box && !box.contains(e.target)) {
    // Click landed on overlay background or document body outside the box â†’ skip
    document.getElementById('tutorialSkip').click();
  }
});
    const coh = parseFloat(e.newValue) || 0;
    updateCoherenceReactivity(coh);
  }
  if (e.key === 'codex_phase_update') {
    const phase = parseInt(e.newValue) || 0;
    highlightBreathRow(phase);
  }
});

// Coherence-reactive cell glow
function updateCoherenceReactivity(coh) {
  if (coh < 30) {
    document.querySelectorAll('.m-cell').forEach(c => c.style.boxShadow = '');
    return;
  }
  const intensity = (coh - 30) / 70;
  document.querySelectorAll('.m-cell.selected').forEach(c => {
    c.style.boxShadow = `0 0 ${6 + intensity*14}px rgba(232,200,106,${0.2 + intensity*0.4})`;
  });
}

// Breath row highlight (phase 0=inhale,1=hold,2=exhale,3=still,4=inhale,5=hold)
const BREATH_ROW_IDX = 6; // row index for Breath Phase layer
const PHASE_ROWS = [0,1,2,3,4,5]; // inhale,inhale,hold,hold,exhale,exhale
const BREATH_HIGHLIGHT_COLS = [1,4,6,10,16,18]; // corresponding angular positions

function highlightBreathRow(phase) {
  document.querySelectorAll('.m-cell').forEach(c => {
    const r = +c.dataset.row;
    if (r === BREATH_ROW_IDX) {
      const col = +c.dataset.col;
      // Highlight the columns that match current phase
      c.style.background = BREATH_HIGHLIGHT_COLS[phase] === col
        ? 'rgba(232,200,106,0.15)'
        : '';
    } else {
      c.style.background = '';
    }
  });
}
setTimeout(showTutorial, 500);

/* â”€â”€ BUTTONS â”€â”€ */
document.getElementById('btnSaveCombo').onclick = saveCurrentCombo;
document.getElementById('btnRandomize').onclick = randomize;
document.getElementById('btnSelectRow').onclick = selectRow;
document.getElementById('btnSelectCol').onclick = selectCol;
document.getElementById('btnClearAll').onclick = clearAll;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') clearAll();
});

console.log('ðŸœ‚ Harmonic Glyph Matrix v2 â€” Enhanced loaded');
</script>
</body>
