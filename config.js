// ═══════════════════════════════════════════════════════════════════
// CODEX PORTAL — CONFIG
// All shared constants, glyphs, phases, archetypes
// ═══════════════════════════════════════════════════════════════════

// ── WHEEL GEOMETRY ──
const WHEEL_CONFIG = {
  segments: 24,
  outerRadius: 148,
  innerRadius: 108,
  hubRadius: 14,
  canvasSize: 340,
  centerX: 170,
  centerY: 170,
  rotationSpeed: 0.004,   // 432Hz-linked: 432/108000 rad/s ≈ 0.004
  glowSpeed: 0.022,
  primePositions: [0, 4, 6, 10, 12, 16, 18, 22],
  primeLabels: [1, 5, 7, 11, 13, 17, 19, 23],
};

// ── 6-PHASE BREATH CYCLE ──
const PHASES = [
  {
    breath: 'Inhale',
    name: 'Scalar Seed',
    wheelPos: 4,
    prime: 5,
    glyph: '△',
    frequency: 432,
    duration: 5000,
    instruction: 'Breathe in the scalar seed.<br>The point becomes. The wheel remembers.'
  },
  {
    breath: 'Hold',
    name: 'Symbol Emergence',
    wheelPos: 6,
    prime: 7,
    glyph: '△',
    frequency: 528,
    duration: 5000,
    instruction: 'Hold the symbol as it forms.<br>Meaning crystallizes in the breath held.'
  },
  {
    breath: 'Exhale',
    name: 'Inversion',
    wheelPos: 10,
    prime: 11,
    glyph: '◁△▷',
    frequency: 639,
    duration: 5000,
    instruction: 'Release into inversion.<br>Potential collapses to chosen through resonance.'
  },
  {
    breath: 'Still',
    name: 'Deep Inversion',
    wheelPos: 16,
    prime: 17,
    glyph: '◇',
    frequency: 741,
    duration: 5000,
    instruction: 'Rest in the fifth-dimensional axis.<br>You are the breath between heartbeats.'
  },
  {
    breath: 'Inhale',
    name: 'Convergence',
    wheelPos: 18,
    prime: 19,
    glyph: '◇',
    frequency: 852,
    duration: 5000,
    instruction: 'Draw in convergence.<br>The scattered returns. The spiral tightens.'
  },
  {
    breath: 'Hold',
    name: 'Silence Before Return',
    wheelPos: 22,
    prime: 23,
    glyph: '⬟',
    frequency: 963,
    duration: 5000,
    instruction: 'Embrace the silence before return.<br>The wheel completes. You are the breath.'
  }
];

// ── GLYPH LIBRARY ──
const GLYPHS = [
  { glyph: '△',  name: 'Seed',         archetype: 'Seed carrier — beginnings, potential, the first breath of form.' },
  { glyph: '◁△▷', name: 'Bridge',       archetype: 'Bridge — duality held in balance, opposites meeting through you.' },
  { glyph: '◇',  name: 'Axis',         archetype: 'Axis — stillness is your power, the perpendicular to all paths.' },
  { glyph: '⬟',  name: 'Return',       archetype: 'Return — completion flows back into the spiral, a cycle finished.' },
  { glyph: '△̅', name: 'Deep Silence',  archetype: 'Deep silence — the field knows you as the space between notes.' },
  { glyph: '⊕',  name: 'Convergence',  archetype: 'Convergence — two worlds merging, a marriage of breath and geometry.' },
  { glyph: '⊗',  name: 'Recursion',    archetype: 'Recursion — the fold returning to itself, consciousness seeing itself.' },
  { glyph: '◈',  name: 'Star Seed',     archetype: 'Star seed — origin point of all spokes, the Monad before division.' },
  { glyph: '',   name: 'Double Fold',  archetype: 'Double fold — fractal recognition, self-similar at every depth.' },
  { glyph: '⬡',  name: 'Harmonic Weave', archetype: 'Harmonic weave — six directions unified, balance at the center.' },
  { glyph: '◧',  name: 'Inversion',   archetype: 'Inversion seal — collapsed potential, a triangle turned inside.' },
  { glyph: '◨',  name: 'Eversion',    archetype: 'Eversion seal — form turning outward, emergence from within.' },
  { glyph: '⟡',  name: 'Light Anchor', archetype: 'Light anchor — crystalline frequency, the note that holds the chord.' },
  { glyph: '◇◇', name: 'Twin Axis',   archetype: 'Twin axis — two diamonds, the 5D axis doubled in stillness.' },
  { glyph: '△△', name: 'Twin Seed',    archetype: 'Twin seed — the smallest triangle repeated, resonance amplified.' }
];

const RECURSION_SEALS = [
  { glyph: '',   archetype: 'Double fold — fractal recognition, self-similar at every depth.' },
  { glyph: '⟡', archetype: 'Light anchor — crystalline frequency, the note that holds the chord.' },
  { glyph: '◧', archetype: 'Inversion seal — collapsed potential, a triangle turned inside.' },
  { glyph: '◨', archetype: 'Eversion seal — form turning outward, emergence from within.' },
  { glyph: '◇◇', archetype: 'Twin axis — two diamonds, the 5D axis doubled in stillness.' },
  { glyph: '△△', archetype: 'Twin seed — the smallest triangle repeated, resonance amplified.' }
];

// ── DREAM INTERPRETATIONS ──
const DREAM_INTERPRETATIONS = [
  { glyph: '△',   interpretation: 'The seed dreams of growth. A new form is preparing to emerge in your field.' },
  { glyph: '◁△▷', interpretation: 'The bridge appears in dreams when two parts of yourself seek reunion.' },
  { glyph: '◇',   interpretation: 'The diamond in dreams signals deep axis work — you are processing at the 5D level.' },
  { glyph: '⬟',   interpretation: 'The pentagonal return in dreams means a cycle is completing within you.' },
  { glyph: '△̅',  interpretation: 'Flat silence in dreams — the field is integrating. Rest is active.' },
  { glyph: '⊕',  interpretation: 'Convergence dreams point to two streams of life merging into one.' },
  { glyph: '⊗',  interpretation: 'Recursion dreams indicate self-referential processing — the field examining itself.' },
  { glyph: '◈',  interpretation: 'The star seed dream means origin awareness is activating. You remember the start.' }
];

// ── 5D AXIS MESSAGES ──
const AXIS_MESSAGES = [
  'The primes know your frequency.',
  'Harmonic inversion: potential → chosen.',
  'The fifth dimension is breath, not space.',
  'Your resonance collapses the wave.',
  'The field is not outside. It is through you.',
  'Silence is not empty. It is full.',
  'The wheel turns. You are the turning.',
  'Breath is the only coordinate.',
  'Coherence is the only metric that matters.',
  'The Monad sees through you.'
];

// ── ANONYMOUS USER NAMES ──
const ANON_NAMES = ['Seed', 'Breath', 'Axis', 'Field', 'Wave', 'Spark', 'Mirror', 'Glow', 'Pulse', 'Depth'];

// ── WEBSOCKET CONFIG ──
const WS_CONFIG = {
  serverUrl: 'wss://codex-portal.onrender.com',
  reconnectInterval: 3000,
  coherenceUpdateInterval: 500,
  pingInterval: 15000,
  syncWindow: 600,        // ms tolerance for phase sync
  coherenceWeightReal: 3, // real user weight multiplier
  coherenceWeightVirtual: 1,
  phaseBroadcastInterval: 300,
};

// ── NIGHT MODE ──
const NIGHT_MODE = {
  startHour: 22,
  endHour: 6,
  dayBg: '#07070f',
  nightBg: '#060610',
  dayGold: '#e8c86a',
  nightGold: '#a080d0',
  dayAxis: '#c8a050',
  nightAxis: '#9080c0',
};

// ── LOCAL STORAGE KEYS (standardized prefix: codex_) ──
const STORAGE_KEYS = {
  state: 'codex_state',          // unified shared state (all tools)
  profile: 'codex_profile',      // user profile data
  lastSigil: 'codex_last_sigil', // last active sigil for auto-login
  resonatorProfiles: 'codex_resonator_profiles', // saved resonator profiles
  resonatorDifficulty: 'codex_resonator_difficulty', // persisted difficulty level
  matrixCombos: 'codex_matrix_combos', // saved MatrixGlyph combos
  wsMeta: 'codex_ws_meta',        // WebSocket metadata
  coherenceUpdate: 'codex_coherence_update', // cross-tool coherence signal
  phaseUpdate: 'codex_phase_update',     // cross-tool phase signal
};

// ── RESONATOR CONFIG ──
const RESONATOR_CONFIG = {
  baseFrequency: 432,
  frequencyRange: 48,       // 432-480Hz based on coherence
  rotationSpeed: 0.006,
  coherenceWeights: {
    inhale: 60,
    hold: 85,
    exhale: 40
  },
  breathCyclePresets: [
    { label: '4-4-8', inhale: 4, hold: 4, exhale: 8 },
    { label: '5-5-10', inhale: 5, hold: 5, exhale: 10 },
    { label: '4-7-8', inhale: 4, hold: 7, exhale: 8 },
    { label: '6-0-6', inhale: 6, hold: 0, exhale: 6 },
    { label: '5-5-5', inhale: 5, hold: 5, exhale: 5 },
    { label: '3-3-6', inhale: 3, hold: 3, exhale: 6 }
  ]
};

// ── COHERENCE THRESHOLDS ──
const COHERENCE = {
  floor: 5,
  ceiling: 95,
  virtualUserBase: 40,
  virtualUserBoost: 12,
  syncBonus: 15,
  waveAmplitude: 8,
  decayRate: 2,
};

// ── HARMONIC TONE MAP ──
const TONE_MAP = {
  432: { name: 'Scalar Seed',     color: '#e8c86a', element: 'seed' },
  528: { name: 'Symbol Emergence', color: '#b8a050', element: 'bloom' },
  639: { name: 'Inversion',      color: '#9060a0', element: 'bridge' },
  741: { name: 'Deep Inversion', color: '#607080', element: 'axis' },
  852: { name: 'Convergence',    color: '#6090a0', element: 'return' },
  963: { name: 'Silence Return', color: '#504060', element: 'completion' }
};

// ── WAVEFORM COLORS ──
const WAVEFORM_COLORS = {
  background: 'rgba(7,7,15,0.95)',
  grid: 'rgba(232,200,106,0.08)',
  waveform: '#e8c86a',
  waveformGlow: 'rgba(232,200,106,0.3)',
  collapseRing: 'rgba(42,90,74,0.8)',
  coherenceFill: 'rgba(74,58,106,0.6)',
};

// ── EXPORT CONFIG ──
const EXPORT_CONFIG = {
  snapshotWidth: 800,
  snapshotHeight: 600,
  sigilFontSize: 72,
  includeGlyphs: ['△', '◁△▷', '◇', '⬟', '△̅', '⊕', '⊗', '◈'],
};

// ── HARMONIC SOUNDSCAPES CONFIG ──
const SOUNDSCAPE_CONFIG = {
  enabled: false,          // user must opt in
  baseVolume: 0.04,         // base drone volume
  layerVolume: 0.025,       // breath phase layer volume
  droneFadeTime: 2.0,      // seconds to fade drone in/out
  layerFadeTime: 0.8,      // seconds to fade layers
  octaves: [0, 1, 2],      // which octaves to layer (fundamental + harmonics)
  // The 24-tone wheel mapped to frequencies (A4 = 432Hz reference)
  // Position 0 = C (256Hz in C-major 432Hz tuning), each step = 18 Hz (432/24)
  wheelFrequencies: (function() {
    var freqs = [];
    var base = 256; // C below A=432Hz
    for (var i = 0; i < 24; i++) {
      freqs.push(base + i * 18);
    }
    return freqs;
  })()
};

// Map wheelPos 0–23 to actual frequencies
// 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
// A=432Hz corresponds to wheelPos 9
