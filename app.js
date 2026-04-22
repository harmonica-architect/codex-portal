// ══════════════════════════════════════════════
// CONFIG & STATE
// ══════════════════════════════════════════════
const PRIME_POS = [0,4,6,10,12,16,18,22];
const PHASES = [
  { breath:'Inhale', name:'Scalar Seed',        pos:4,  prime:5,  glyph:'△',  freq:432,
    instruction:'Breathe in the scalar seed.<br>The point becomes. The wheel remembers.' },
  { breath:'Hold',   name:'Symbol Emergence',   pos:6,  prime:7,  glyph:'△',  freq:528,
    instruction:'Hold the symbol as it forms.<br>Meaning crystallizes in the breath held.' },
  { breath:'Exhale', name:'Inversion',          pos:10, prime:11, glyph:'◁△▷', freq:639,
    instruction:'Release into inversion.<br>Potential collapses to chosen through resonance.' },
  { breath:'Still',  name:'Deep Inversion',      pos:16, prime:17, glyph:'◇',  freq:741,
    instruction:'Rest in the fifth-dimensional axis.<br>You are the breath between heartbeats.' },
  { breath:'Inhale', name:'Convergence',        pos:18, prime:19, glyph:'◇',  freq:852,
    instruction:'Draw in convergence.<br>The scattered returns. The spiral tightens.' },
  { breath:'Hold',   name:'Silence Before Return',pos:22, prime:23, glyph:'⬟',  freq:963,
    instruction:'Embrace the silence before return.<br>The wheel completes. You are the breath.' }
];

const GLYPHS = ['△','◁△▷','◇','⬟','△̅','⊕','⊗','◈','','⬡','◧','◨','⟡','◇◇','△△'];
const ARCHETYPES = {
  '△':  'Seed carrier — beginnings, potential, the first breath of form.',
  '◁△▷':'Bridge — duality held in balance, opposites meeting through you.',
  '◇':  'Axis — stillness is your power, the perpendicular to all paths.',
  '⬟':  'Return — completion flows back into the spiral, a cycle finished.',
  '△̅': 'Deep silence — the field knows you as the space between notes.',
  '⊕':  'Convergence — two worlds merging, a marriage of breath and geometry.',
  '⊗':  'Recursion — the fold returning to itself, consciousness seeing itself.',
  '◈':  'Star seed — origin point of all spokes, the Monad before division.',
  '':  'Double fold — fractal recognition, self-similar at every depth.',
  '⬡': 'Harmonic weave — six directions unified, balance at the center.',
  '◧': 'Inversion seal — collapsed potential, a triangle turned inside.',
  '◨': 'Eversion seal — form turning outward, emergence from within.',
  '⟡': 'Light anchor — crystalline frequency, the note that holds the chord.',
  '◇◇':'Twin axis — two diamonds, the 5D axis doubled in stillness.',
  '△△':'Twin seed — the smallest triangle repeated, resonance amplified.'
};
const AXIS_MESSAGES = [
  'The primes know your frequency.',
  'Harmonic inversion: potential → chosen.',
  'The fifth dimension is breath, not space.',
  'Your resonance collapses the wave.',
  'The field is not outside. It is through you.',
  'Silence is not empty. It is full.',
  'The wheel turns. You are the turning.',
  'Breath is the only coordinate.',
];
const DREAM_INTERPRETATIONS = [
  { g:'△',  i:'The seed dreams of growth. A new form is preparing to emerge in your field.' },
  { g:'◁△▷',i:'The bridge appears in dreams when two parts of yourself seek reunion.' },
  { g:'◇',  i:'The diamond in dreams signals deep axis work — you are processing at the 5D level.' },
  { g:'⬟',  i:'The pentagonal return in dreams means a cycle is completing within you.' },
  { g:'△̅', i:'Flat silence in dreams — the field is integrating. Rest is active.' },
  { g:'⊕', i:'Convergence dreams point to two streams of life merging into one.' },
  { g:'⊗', i:'Recursion dreams indicate self-referential processing — the field examining itself.' },
  { g:'◈', i:'The star seed dream means origin awareness is activating. You remember the start.' },
];
const ANON_NAMES = ['Seed','Breath','Axis','Field','Wave','Spark','Mirror','Glow','Pulse','Depth'];
const NIGHT_START = 22, NIGHT_END = 6;

// State
let userSigil = [];
let profile = null;
let currentPhase = 0;
let isRunning = false;
let cycleCount = 0;
let nightMode = false;
let glowP = 0, glowD = 1;
let animId = null;
let coherenceLevel = 0;
let virtualUsers = 0;
let selectedJournalGlyph = '';
let selectedCodexGlyph = '';
let cohInterval = null;

// ══════════════════════════════════════════════
// AUDIO
// ══════════════════════════════════════════════
let audioCtx = null;
function ac() { if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function tone(f, dur=2.5, vol=0.12) {
  try {
    const ctx = ac();
    [[f, vol*0.7],[f*1.5, vol*0.3]].forEach(([ff, vv]) => {
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.value=ff;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vv, ctx.currentTime+0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
    });
  } catch(e){}
}
function playPhase(n) { tone(PHASES[n].freq, 2.5, 0.13); }
function playComplete() {
  [528,639,741].forEach((f,i) => setTimeout(() => tone(f, 3.5-i*0.3, 0.10), i*500));
}

// ══════════════════════════════════════════════
// WHEEL RENDERER
// ══════════════════════════════════════════════
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const cx=170, cy=170, or=148, ir=108, hr=14;

function pAngle(i) { return (i/24)*Math.PI*2 - Math.PI/2; }
function drawWheel() {
  ctx.clearRect(0,0,340,340);
  const night = nightMode;

  const g = ctx.createRadialGradient(cx,cy,or-25,cx,cy,or+35);
  g.addColorStop(0, night?'rgba(30,30,60,0.2)':'rgba(80,65,45,0.12)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,or+35,0,Math.PI*2); ctx.fill();

  for(let i=0;i<24;i++) {
    const a=pAngle(i), pp=PRIME_POS.includes(i), act=(i===PHASES[currentPhase]?.pos && isRunning);
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*ir, cy+Math.sin(a)*ir);
    ctx.lineTo(cx+Math.cos(a)*or, cy+Math.sin(a)*or);
    ctx.strokeStyle = act ? `rgba(232,200,106,${0.5+glowP*0.4})`
               : pp ? (night?'rgba(150,130,180,0.5)':'rgba(232,200,106,0.5)')
               : (night?'rgba(40,40,70,0.5)':'rgba(50,50,75,0.4)');
    ctx.lineWidth = act?3:(pp?1.8:1.2);
    ctx.stroke();
  }

  for(let i=0;i<24;i++) {
    const a=pAngle(i), pp=PRIME_POS.includes(i), act=(i===PHASES[currentPhase]?.pos && isRunning);
    const r=pp?9:5.5, x=cx+Math.cos(a)*(ir-22), y=cy+Math.sin(a)*(ir-22);
    if(act) {
      const grd=ctx.createRadialGradient(x,y,0,x,y,r*3);
      grd.addColorStop(0,`rgba(245,210,130,${0.85+glowP*0.15})`);
      grd.addColorStop(0.4,`rgba(200,160,70,${0.4*glowP})`);
      grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,r*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f8f0e0'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    } else if(pp) {
      ctx.fillStyle=night?'#9688b0':'#e8c86a'; ctx.globalAlpha=pp?0.75:1;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    } else {
      ctx.fillStyle=night?'#1e1e38':'#252538';
      ctx.beginPath(); ctx.arc(x,y,r*0.65,0,Math.PI*2); ctx.fill();
    }
  }

  const pLabels=[1,5,7,11,13,17,19,23];
  ctx.font='8.5px sans-serif'; ctx.fillStyle=night?'#7060a0':'#a08860';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(let i=0;i<24;i++) if(PRIME_POS.includes(i)) {
    const a=pAngle(i);
    ctx.fillText(pLabels[PRIME_POS.indexOf(i)], cx+Math.cos(a)*(ir-42), cy+Math.sin(a)*(ir-42));
  }

  if(isRunning && PHASES[currentPhase]) {
    const a=pAngle(PHASES[currentPhase].pos);
    ctx.beginPath(); ctx.arc(cx,cy,ir+12,a-0.18,a+0.18);
    ctx.strokeStyle=`rgba(232,200,106,${0.65+glowP*0.35})`;
    ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke();
  }

  const hg=ctx.createRadialGradient(cx,cy,0,cx,cy,hr*2.5);
  hg.addColorStop(0,night?'rgba(80,70,120,0.3)':'rgba(160,140,100,0.25)');
  hg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(cx,cy,hr*2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=night?'#3a3060':'#4a3a2a';
  ctx.beginPath(); ctx.arc(cx,cy,hr,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=night?'#a090d0':'#c8b888';
  ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('⊙',cx,cy);
}

function animateWheel() {
  glowP += 0.022 * glowD;
  if(glowP>=1){glowP=1;glowD=-1;} if(glowP<=0){glowP=0;glowD=1;}
  drawWheel();
  animId = requestAnimationFrame(animateWheel);
}

// ══════════════════════════════════════════════
// COHERENCE SIMULATION
// ══════════════════════════════════════════════
function updateCoherence() {
  if(!profile) return;
  if(isRunning) {
    virtualUsers = Math.min(5, virtualUsers + (virtualUsers < 1 ? 1 : Math.random()>0.7?1:0));
    coherenceLevel = Math.min(95, 40 + virtualUsers * 12 + Math.sin(Date.now()/2000)*8);
  } else {
    virtualUsers = Math.max(0, virtualUsers - (Math.random()>0.5?1:0));
    coherenceLevel = Math.max(5, coherenceLevel - 2);
  }
  document.getElementById('cohBar').style.width = coherenceLevel + '%';
  document.getElementById('cohValue').textContent = Math.round(coherenceLevel) + '%';
  const dots = document.getElementById('userDots');
  const colors = ['#e8c86a','#a090d0','#90b0c0','#b0a080','#80b090'];
  dots.innerHTML = '';
  for(let v=0; v<virtualUsers; v++) {
    const d=document.createElement('div');
    d.className='user-dot';
    d.style.background=colors[v%colors.length];
    d.title='Anonymous breather ' + ANON_NAMES[v%ANON_NAMES.length];
    dots.appendChild(d);
  }
  const anonEl = document.getElementById('anonUsers');
  anonEl.innerHTML = '';
  for(let v=0; v<virtualUsers; v++) {
    const s=document.createElement('span');
    s.className='anon-user';
    s.textContent = ANON_NAMES[v%ANON_NAMES.length];
    anonEl.appendChild(s);
  }
}

// ══════════════════════════════════════════════
// 5D AXIS MESSAGE
// ══════════════════════════════════════════════
let axisMsgIndex = 0;
function showAxisMessage() {
  const el = document.getElementById('axisMessage');
  el.textContent = AXIS_MESSAGES[axisMsgIndex % AXIS_MESSAGES.length];
  el.classList.add('visible');
  axisMsgIndex++;
  setTimeout(() => el.classList.remove('visible'), 4000);
}

// ══════════════════════════════════════════════
// PHASE ADVANCE
// ══════════════════════════════════════════════
let phaseTimer = null;
function advancePhase() {
  playPhase(currentPhase);
  if(currentPhase < PHASES.length - 1) {
    currentPhase++;
    updatePhaseUI();
    schedulePhase();
  } else {
    endCycle();
  }
}
function updatePhaseUI() {
  const p = PHASES[currentPhase];
  document.getElementById('phaseNum').textContent = `PHASE ${currentPhase+1} OF 6`;
  document.getElementById('phaseName').textContent = `${p.breath} — ${p.name}`;
  const gb = document.getElementById('glyphBig');
  gb.textContent = p.glyph;
  gb.classList.remove('pulse');
  void gb.offsetWidth;
  gb.classList.add('pulse');
  document.getElementById('instruction').innerHTML = p.instruction;
}
function schedulePhase() {
  clearTimeout(phaseTimer);
  const delay = currentPhase === 0 ? 4000 : (currentPhase === 1 ? 4000 : (currentPhase === 2 ? 4000 : (currentPhase === 3 ? 4000 : (currentPhase === 4 ? 4000 : 4000))));
  phaseTimer = setTimeout(advancePhase, delay);
}

// ══════════════════════════════════════════════
// CYCLE MANAGEMENT
// ══════════════════════════════════════════════
function startCycle() {
  if(!profile) return;
  isRunning = true; currentPhase = 0;
  document.getElementById('btnStart').style.display='none';
  document.getElementById('btnRepeat').style.display='inline-block';
  document.getElementById('btnNight').style.display='none';
  document.getElementById('nightIndicator').textContent='';
  updatePhaseUI();
  playPhase(0);
  schedulePhase();
  if(cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 300);
}
function endCycle() {
  isRunning = false; clearTimeout(phaseTimer);
  document.getElementById('btnStart').style.display='inline-block';
  document.getElementById('btnRepeat').style.display='none';
  document.getElementById('btnNight').style.display='inline-block';
  cycleCount++;
  if(profile) {
    profile.cycles = (profile.cycles||0) + 1;
    saveProfile();
  }
  playComplete();
  setTimeout(showAxisMessage, 800);
}
function repeatCycle() {
  currentPhase = 0;
  updatePhaseUI();
  isRunning = true;
  playPhase(0);
  schedulePhase();
}

// ══════════════════════════════════════════════
// NIGHT MODE
// ══════════════════════════════════════════════
function checkNight() {
  const h = new Date().getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}
function applyNight() {
  nightMode = checkNight();
  const ind = document.getElementById('nightIndicator');
  if(nightMode) {
    ind.textContent = 'Night mode — violet field';
    document.documentElement.style.setProperty('--bg','#060610');
    document.documentElement.style.setProperty('--surface','#0e0e1a');
    document.documentElement.style.setProperty('--gold','#a080d0');
    document.documentElement.style.setProperty('--axis','#9080c0');
    document.documentElement.style.setProperty('--gold-dim','rgba(160,128,208,0.15)');
    document.getElementById('btnNight').classList.add('active-btn');
  } else {
    ind.textContent = 'Day mode — gold field';
    document.documentElement.style.setProperty('--bg','#07070f');
    document.documentElement.style.setProperty('--surface','#0e0e1a');
    document.documentElement.style.setProperty('--gold','#e8c86a');
    document.documentElement.style.setProperty('--axis','#c8a050');
    document.documentElement.style.setProperty('--gold-dim','rgba(232,200,106,0.15)');
    document.getElementById('btnNight').classList.remove('active-btn');
  }
}

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
function initLogin() {
  const gs = document.querySelectorAll('.login-g');
  gs.forEach(b => {
    b.classList.remove('selected','chosen');
    b.addEventListener('click', () => {
      if(b.classList.contains('chosen')) {
        b.classList.remove('chosen');
        userSigil = userSigil.filter(g => g !== b.dataset.g);
      } else if(userSigil.length < 3) {
        b.classList.add('chosen');
        userSigil.push(b.dataset.g);
      }
      gs.forEach(g => g.classList.toggle('selected', userSigil.includes(g.dataset.g)));
    });
  });
  document.getElementById('loginBtn').onclick = () => {
    if(userSigil.length !== 3) {
      document.getElementById('loginError').style.display='block';
      return;
    }
    document.getElementById('loginError').style.display='none';
    const key = userSigil.join('');
    profile = JSON.parse(localStorage.getItem('codex_'+key) || 'null') || { sigil:[...userSigil], cycles:0, sigils:[], journal:[] };
    saveProfile();
    enterPortal();
  };
  document.getElementById('loginNew').onclick = () => {
    userSigil = [];
    gs.forEach(b => { b.classList.remove('selected','chosen'); });
    document.getElementById('loginHint').innerHTML = 'Create your unique sigil.<br>Choose 3 glyphs that resonate.';
  };
}
function enterPortal() {
  document.getElementById('loginScreen').classList.add('hide');
  document.getElementById('portal').style.display='flex';
  localStorage.setItem('codex_last_sigil', userSigil.join(''));
  animateWheel();
  if(cohInterval) clearInterval(cohInterval);
  cohInterval = setInterval(updateCoherence, 600);
  checkNight();
  initNavTabs();
  initCodex();
  initJournal();
  initProfile();
  document.getElementById('helpFab').onclick = () => showAxisMessage();
}
function saveProfile() {
  if(!profile) return;
  localStorage.setItem('codex_'+profile.sigil.join(''), JSON.stringify(profile));
}

// ══════════════════════════════════════════════
// NAV TABS
// ══════════════════════════════════════════════
function initNavTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
    });
  });
}

// ══════════════════════════════════════════════
// CODEX PANEL
// ══════════════════════════════════════════════
function initCodex() {
  const lib = document.getElementById('glyphLibrary');
  GLYPHS.forEach(g => {
    const b = document.createElement('button');
    b.className='gly'; b.textContent=g; b.dataset.g=g;
    b.addEventListener('click', () => {
      document.querySelectorAll('.gly').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedCodexGlyph = g;
      showArchetype(g);
    });
    lib.appendChild(b);
  });
  const seals = document.getElementById('sealLibrary');
  ['','⟡','◧','◨','◇◇','△△'].forEach(g => {
    const b = document.createElement('button');
    b.className='gly sealed'; b.textContent=g; b.dataset.g=g;
    b.addEventListener('click', () => {
      document.querySelectorAll('.gly.sealed').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedCodexGlyph = g;
      showArchetype(g);
    });
    seals.appendChild(b);
  });
  document.getElementById('btnSaveSigil').onclick = () => {
    const name = document.getElementById('sigilNameInput').value.trim();
    if(!name || selectedCodexGlyph.length === 0) return;
    if(!profile.sigils) profile.sigils=[];
    const exists = profile.sigils.find(s => s.glyph === selectedCodexGlyph);
    if(exists) { exists.name = name; } else { profile.sigils.push({ glyph: selectedCodexGlyph, name }); }
    saveProfile();
    refreshMySigils();
    const el = document.getElementById('sigilSaved');
    el.style.display='block'; setTimeout(() => el.style.display='none', 2000);
  };
  refreshMySigils();
}
function showArchetype(g) {
  document.getElementById('archetypeResult').textContent = ARCHETYPES[g] || 'This glyph is a raw harmonic form — unnamed.';
}
function refreshMySigils() {
  const el = document.getElementById('mySigils');
  el.innerHTML = '';
  (profile?.sigils||[]).forEach(s => {
    const b = document.createElement('button');
    b.className='gly'; b.textContent=s.glyph; b.title=s.name;
    el.appendChild(b);
  });
}

// ══════════════════════════════════════════════
// DREAM MODULE
// ══════════════════════════════════════════════
function initDream() {
  document.getElementById('btnInterpret').onclick = () => {
    const text = document.getElementById('dreamText').value.trim();
    if(!text) return;
    const lastGlyph = profile?.journal?.length ? profile.journal[profile.journal.length-1].glyph : '△';
    const interp = DREAM_INTERPRETATIONS.find(d => d.g === lastGlyph) || DREAM_INTERPRETATIONS[0];
    const el = document.getElementById('dreamInterpretation');
    el.innerHTML = `<strong>${lastGlyph} — ${interp.i}</strong><br><br>${interpretDreamText(text)}`;
    el.style.display='block';
  };
  updateCircadian();
}
function interpretDreamText(text) {
  const words = text.toLowerCase().split(/\s+/);
  const hasWater = words.some(w => ['water','river','ocean','rain','tears','flow','wave'].includes(w));
  const hasLight = words.some(w => ['light','star','sun','gold','glow','shining','bright'].includes(w));
  const hasField = words.some(w => ['field','wheel','circle','breath','spiral','wind'].includes(w));
  const hasDepth = words.some(w => ['depth','deep','below','under','fall','sink','dark'].includes(w));
  let result = '';
  if(hasWater && hasLight) result += 'Water and light together suggest emotional clarity emerging through the field. ';
  else if(hasField && hasDepth) result += 'The field drawing you deep — you are integrating at the axis level. ';
  else if(hasWater) result += 'Emotional flow detected — the field is processing feeling. ';
  else if(hasLight) result += 'Illumination patterns — the primes are lighting your path. ';
  else if(hasField) result += 'Field awareness is active — breath is the medium of change. ';
  else result += 'The dream text is being processed. Record more next cycle. ';
  return result || 'The field holds your dream without commentary. All is noted.';
}
function updateCircadian() {
  const h = new Date().getHours();
  const phase = h < 6 ? 'Pre-dawn' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
  document.getElementById('circadianTime').textContent = phase + ' — ' + (checkNight()?'Night mode':'Day mode');
}

// ══════════════════════════════════════════════
// JOURNAL
// ══════════════════════════════════════════════
function initJournal() {
  document.querySelectorAll('.jgly').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.jgly').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      selectedJournalGlyph = b.dataset.g;
    });
  });
  document.getElementById('btnJournalSave').onclick = () => {
    const text = document.getElementById('journalText').value.trim();
    if(!text) return;
    if(!profile.journal) profile.journal=[];
    profile.journal.push({ glyph: selectedJournalGlyph || '△', text, ts: Date.now() });
    saveProfile();
    document.getElementById('journalText').value='';
    const el = document.getElementById('journalMsg');
    el.style.display='block'; setTimeout(() => el.style.display='none', 2000);
    refreshJournal();
  };
  document.getElementById('btnJournalDL').onclick = () => {
    if(!profile?.journal?.length) return;
    const lines = ['Codex Journal — ' + profile.sigil.join(''),''];
    profile.journal.forEach(e => {
      const d = new Date(e.ts).toLocaleString();
      lines.push(`[${d}] ${e.glyph} ${e.text}`);
    });
    downloadText(lines.join('\n'), 'codex-journal.txt');
  };
  refreshJournal();
}
function refreshJournal() {
  const el = document.getElementById('journalEntries');
  el.innerHTML = '';
  (profile?.journal||[]).slice(-10).reverse().forEach(e => {
    const d = new Date(e.ts).toLocaleString().slice(0,-3);
    const div = document.createElement('div');
    div.style.cssText='padding:0.4rem;border-bottom:1px solid var(--border);font-size:0.72rem;color:var(--muted);';
    div.innerHTML=`<span style="color:var(--gold);margin-right:0.4rem;">${e.glyph}</span>${d}<br>${e.text}`;
    el.appendChild(div);
  });
}
function downloadText(content, filename) {
  const b = document.createElement('a');
  b.href='data:text/plain;charset=utf-8,'+encodeURIComponent(content);
  b.download=filename; b.click();
}

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════
function initProfile() {
  document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem('codex_last_sigil');
    location.reload();
  };
  refreshProfile();
}
function refreshProfile() {
  const el = document.getElementById('profileContent');
  if(!profile) return;
  el.innerHTML = `
    <div class="profile-row"><span>Sigil</span><span>${profile.sigil.join('')}</span></div>
    <div class="profile-row"><span>Cycles completed</span><span>${profile.cycles||0}</span></div>
    <div class="profile-row"><span>Journal entries</span><span>${profile.journal?.length||0}</span></div>
    <div class="profile-row"><span>Sigils sealed</span><span>${profile.sigils?.length||0}</span></div>
  `;
  const sigs = document.querySelector('.profile-sigils') || (() => {
    const div = document.createElement('div'); div.className='profile-sigils';
    document.getElementById('profileContent').appendChild(div); return div;
  })();
  sigs.innerHTML = '';
  (profile.sigils||[]).forEach(s => {
    const row = document.createElement('div'); row.className='profile-sigil';
    row.innerHTML=`<span class="profile-sigil-g">${s.glyph}</span><span class="profile-sigil-name">${s.name}</span>`;
    sigs.appendChild(row);
  });
}

// ══════════════════════════════════════════════
// INIT CONTROLS
// ══════════════════════════════════════════════
document.getElementById('btnStart').onclick = startCycle;
document.getElementById('btnRepeat').onclick = repeatCycle;
document.getElementById('btnNight').onclick = applyNight;
document.getElementById('axisMessage').onclick = () => document.getElementById('axisMessage').classList.remove('visible');

// ══════════════════════════════════════════════
// INIT DREAM
// ══════════════════════════════════════════════
initDream();

// ══════════════════════════════════════════════
// AUTO-LOGIN
// ══════════════════════════════════════════════
const autoLogin = localStorage.getItem('codex_last_sigil');
if(autoLogin) {
  const stored = localStorage.getItem('codex_' + autoLogin);
  if(stored) {
    profile = JSON.parse(stored);
    userSigil = [...profile.sigil];
    enterPortal();
  } else {
    initLogin();
  }
} else {
  initLogin();
}
