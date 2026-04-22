// ═══════════════════════════════════════════════════════════════════
// CODEX PORTAL — STATE.JS
// Unified state manager for all three tools
// ═══════════════════════════════════════════════════════════════════

// ── CODEX STATE SCHEMA ──
const CODEX_STATE_KEY = 'codex_state';

const DEFAULT_STATE = {
  sigil: [],           // [glyph1, glyph2, glyph3] — personal sigil
  cycle: [5, 5, 5],   // [inhale, hold, exhale] breath cycle
  difficultyLevel: 1, // 1–4 (Resonator adaptive difficulty)
  coherence: 0,       // current coherence 0–100
  savedCombos: [],    // MatrixGlyph saved combos
  onboardingComplete: false,
  activeTab: 'wheel'  // 'wheel' | 'resonator' | 'matrix'
};

// ── ACTIVE STATE (in-memory) ──
let _state = null;

// ── LOAD STATE ──
function loadState() {
  if (_state) return _state; // already loaded
  try {
    const raw = localStorage.getItem(CODEX_STATE_KEY);
    if (raw) {
      _state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } else {
      _state = { ...DEFAULT_STATE };
    }
  } catch (e) {
    _state = { ...DEFAULT_STATE };
  }
  return _state;
}

// ── SAVE STATE (writes to localStorage + broadcasts) ──
function saveState() {
  if (!_state) return;
  try {
    localStorage.setItem(CODEX_STATE_KEY, JSON.stringify(_state));
  } catch (e) {
    // localStorage may be full or unavailable
  }
}

// ── UPDATE STATE — merge a partial patch into state ──
function updateState(patch) {
  loadState();
  _state = { ..._state, ...patch };
  saveState();
  // Cross-tool sync: broadcast via localStorage event
  broadcastStateChange(_state);
  // Cross-tool sync: send via WebSocket if connected
  broadcastViaWS(_state);
}

// ── GET STATE ──
function getState() {
  return loadState();
}

// ── CROSS-TOOL SYNC: localStorage event ──
function broadcastStateChange(state) {
  // Dispatch a custom event that other tabs/tools can listen to
  try {
    window.dispatchEvent(new CustomEvent('codex_state_changed', {
      detail: { state }
    }));
  } catch (e) {
    // May fail in non-browser context
  }
}

// ── CROSS-TOOL SYNC: WebSocket broadcast ──
// Returns a function to send via WS (must be injected by caller)
let _wsSender = null;

function registerWSSender(fn) {
  _wsSender = fn;
}

function broadcastViaWS(state) {
  if (_wsSender) {
    try {
      _wsSender({ type: 'state_sync', state });
    } catch (e) {
      // WS not connected — ignore
    }
  }
}

// ── COHERENCE UPDATE (lightweight, high-frequency) ──
function updateCoherence(value) {
  loadState();
  _state.coherence = value;
  // Don't save every coherence tick — just sync in memory + via WS
  try {
    window.dispatchEvent(new CustomEvent('codex_coherence_update', {
      detail: { coherence: value }
    }));
  } catch (e) { }
  if (_wsSender) {
    try {
      _wsSender({ type: 'coherence_update', coherence: value });
    } catch (e) { }
  }
}

// ── LISTEN FOR REMOTE STATE CHANGES (from other tabs/tools) ──
function listenForStateChanges(callback) {
  window.addEventListener('codex_state_changed', (e) => {
    if (callback) callback(e.detail.state);
  });
}

// ── MODULE EXPORTS ──
window.CodexState = {
  loadState,
  saveState,
  updateState,
  getState,
  updateCoherence,
  registerWSSender,
  listenForStateChanges,
  DEFAULT_STATE,
  CODEX_STATE_KEY
};
