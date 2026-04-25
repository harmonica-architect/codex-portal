// matrix-resonance.js — Bridge from Mirror Mode text to matAddr geometric resonance
// Part of Priority 3: wire Mirror Mode → geometric resonance

// Load embed-data (available globally via script tag in matrix-explorer.html)
// For use in portal, we need to reference window.EMBED_DATA if present

// ── Text → Frequency ──
// Digital root maps text to a harmonic frequency
// 24-gon wheel: each wheel position maps to a musical note/interval
// We map wheel position (0-23) to frequency via solfeggio-adjacent tones

const WHEEL_FREQS = [
  396, 417, 528, 639, 741,  // positions 0-4  (Letter, Liberation, Creation, Ascension, Manifest)
  852, 963, 174, 285, 396,  // positions 5-9  (Knowledge, Transformation, Earth/root)
  507, 618, 729, 840, 951,  // positions 10-14 (Inner strength, Unity, Flow)
  162, 273, 384, 495, 606,  // positions 15-19 (Release, Calm, Clearing)
  717, 828, 939, 432        // positions 20-23 (New beginnings, High frequency, Unity)
];

// ── Frequency → V,F ──
// Frequency maps to V (0-11) and F (0-11) via harmonic quantization
// We use the frequency's digital root and harmonic series position

function frequencyToVF(freq) {
  if (!freq || freq <= 0) return { V: 0, F: 0 };
  // Normalize freq to range 100-1000
  const f = Math.max(100, Math.min(1000, freq));
  // Use logarithm to map to V (musical octave-like)
  const logFreq = Math.log2(f);
  const V = Math.floor((logFreq - 6.5) * 1.5) % 12; // V roughly tracks octave
  // Use frequency modulo 12 to determine F
  const F = Math.floor(f % 12) + Math.floor((f / 12) % 12);
  return { V: Math.abs(V), F: Math.abs(F) % 12 };
}

// ── Text → Wheel Position ──
function textToWheelPos(text) {
  if (!text) return 0;
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum += text.charCodeAt(i);
  }
  return sum % 24;
}

// ── Text → Frequency ──
function textToFrequency(text) {
  const wheelPos = textToWheelPos(text);
  return WHEEL_FREQS[wheelPos % 24];
}

// ── Wheel Position → matAddr (via V,F system) ──
// The 24-gon wheel position maps to F (col) for a given V row
// For Mirror Mode lookup, we fix V based on breath phase or text weight

function wheelPosToMatAddr(wheelPos, V = 5) {
  // V defaults to 5 (musical/spiritual domain)
  // F = wheel position maps to F_col directly
  const F = wheelPos % 12;
  return V * 12 + F;
}

// ── Full chain: Text → matAddr ──
function textToMatAddr(text, V = null) {
  const wheelPos = textToWheelPos(text);
  const freq = WHEEL_FREQS[wheelPos % 24];
  const vf = frequencyToVF(freq);
  const V_row = V !== null ? V : vf.V;
  const F_col = vf.F;
  return {
    wheelPos,
    frequency: freq,
    V: V_row,
    F: F_col,
    matAddr: V_row * 12 + F_col
  };
}

// ── Breath phase → V override ──
// Mirror Mode maps breath phases to different V rows
const BREATH_V_MAP = {
  inhale: 3,   // Scalar seed — foundational geometry
  hold: 6,     // Transformation — wave phenomena
  exhale: 9,   // Coherence — Riemann/quantum
  still: 11    // Deep integration — temporal axis
};

// ── Lookup items at a matAddr ──
function lookupMatAddr(matAddr) {
  if (!window.EMBED_DATA) return [];
  return window.EMBED_DATA.filter(d => d.matAddr === matAddr);
}

// ── Get resonance display info for a matAddr ──
function getResonanceInfo(matAddr) {
  const items = lookupMatAddr(matAddr);
  if (!items.length) {
    return {
      matAddr,
      count: 0,
      domains: [],
      items: [],
      label: 'No resonance data yet',
      glyph: '·'
    };
  }

  const domains = [...new Set(items.map(it => it.domain))];
  const codexItems = items.filter(it => it.domain === 'codex');
  const label = codexItems.length > 0
    ? codexItems[0].name
    : items[0].name;

  // Pick glyph based on dominant domain
  const domainGlyphs = { protein:'◈', music:'♫', finance:'◈', anthro:'◉', codex:'⬡' };
  const glyph = domainGlyphs[domains[0]] || '·';

  return {
    matAddr,
    count: items.length,
    domains,
    items: items.slice(0, 5).map(it => ({ name: it.name, domain: it.domain, term_de: it.term_de })),
    label,
    glyph
  };
}

// ── Build resonance result for Mirror Mode reflect() ──
function buildResonanceResult(text, breathPhase = null) {
  const V_override = breathPhase ? (BREATH_V_MAP[breathPhase] || null) : null;
  const { wheelPos, frequency, V, F, matAddr } = textToMatAddr(text, V_override);
  const resonance = getResonanceInfo(matAddr);

  return {
    wheelPos,
    frequency,
    V,
    F,
    matAddr,
    resonanceLabel: resonance.label,
    resonanceGlyph: resonance.glyph,
    resonanceCount: resonance.count,
    resonanceDomains: resonance.domains,
    resonanceItems: resonance.items
  };
}

// Export for use by mirror-mode.js
window.matrixResonance = {
  textToWheelPos,
  textToFrequency,
  frequencyToVF,
  wheelPosToMatAddr,
  textToMatAddr,
  lookupMatAddr,
  getResonanceInfo,
  buildResonanceResult,
  WHEEL_FREQS
};