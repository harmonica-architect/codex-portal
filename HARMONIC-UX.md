# HARMONIC-UX — Icox Breath-Driven UI

## Overview
Apply the same breath-driven principles from matrix-explorer to icox's Wheel UI.
The 6-second breath cycle (inhale → hold → exhale → rest) modulates visual elements
in harmonic resonance with the 6-phase breath cycle already running in the app.

---

## Breath Architecture

### Timing
- **Breath cycle:** 6 seconds (0→1→0 via RAF, same as matrix-explorer)
- `breathPhase`: global RAF-driven 0→1→0 ramp
- `breathHold()`: `Math.sin(breathPhase * Math.PI)` — peaks at 0.25 (mid-inhale-hold)

### Integration Points
- Breath loop runs continuously via `requestAnimationFrame`
- `drawWheel()` reads `breathHold()` each frame
- Coherence bar updates on breath phase changes
- CSS custom property `--breath-hold` is updated live for CSS animations

---

## Enhancement H1 — Breath RAF Loop (Foundation)

### What
Replace the current `glowP` ping-pong animation with a proper `breathPhase` 0→1→0 ramp.

### How
```javascript
let breathPhase = 0;
let breathDir = 1; // +1 = inhale, -1 = exhale
const BREATH_CYCLE_MS = 6000;

function breathTick(ts) {
  const dt = ts - lastBreathTs;
  breathPhase += (dt / BREATH_CYCLE_MS) * breathDir;
  if (breathPhase >= 1) { breathPhase = 1; breathDir = -1; }
  if (breathPhase <= 0) { breathPhase = 0; breathDir = 1; }
  lastBreathTs = ts;
  document.documentElement.style.setProperty('--breath-hold', breathHold());
  drawWheel();
  breathRafId = requestAnimationFrame(breathTick);
}
```

### Files
- `app.js`: Add `breathPhase`, `breathDir`, `lastBreathTs`, `breathTick()`, `breathHold()`.
- Stop calling `animateWheel()` on load; start `breathTick()` instead.

---

## Enhancement H2 — Breathing Wheel Dots

### What
Prime node dots breathe — radius and glow intensity modulate with `breathHold()`.

### How (in `drawWheel()`)
```javascript
const bh = breathHold();
// At prime nodes — breathing glow
if (pp) {
  const r = pp ? 9 : 5.5;
  const breatheR = r * (1 + bh * 0.12);         // 12% larger at peak hold
  const breatheAlpha = 0.7 + bh * 0.3;            // brighter at peak hold
  // glow radial gradient uses breatheR and breatheAlpha
}
```

### Visual
- At `bh = 0`: normal size, normal alpha
- At `bh = 1`: 12% larger radius, 30% more opacity

---

## Enhancement H3 — Selection Ripple Wave

### What
When user clicks a wheel node, an expanding ring ripples outward from that position.

### How
```javascript
let selectedWheelPos = null;
let rippleOrigin = null;
let ripplePhase = 0; // 0 = no ripple, 0→1 = expanding
let rippleRafId = null;

function onWheelClick(e) {
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - cx;
  const dy = e.clientY - rect.top - cy;
  const dist = Math.sqrt(dx*dx + dy*dy);
  // Determine clicked segment...
  if (clickedPos >= 0) {
    selectedWheelPos = clickedPos;
    startRipple(clickedPos);
  }
}

function startRipple(wp) {
  rippleOrigin = wp;
  ripplePhase = 0;
  if (rippleRafId) cancelAnimationFrame(rippleRafId);
  rippleRafId = requestAnimationFrame(rippleTick);
}

function rippleTick() {
  ripplePhase += 0.025; // ~40 frames to complete
  if (ripplePhase >= 1) { ripplePhase = 0; rippleOrigin = null; return; }
  drawWheel(); // will draw ripple
  rippleRafId = requestAnimationFrame(rippleTick);
}

// In drawWheel():
// if (rippleOrigin != null) {
//   const angle = pAngle(rippleOrigin);
//   const rippleR = ripplePhase * (or - ir);
//   const alpha = (1 - ripplePhase) * 0.6;
//   ctx.beginPath();
//   ctx.arc(cx + (ir + rippleR/2) * Math.cos(angle), cy + (ir + rippleR/2) * Math.sin(angle), 12, 0, Math.PI * 2);
//   ctx.strokeStyle = `rgba(232,200,106,${alpha})`;
//   ctx.lineWidth = 2;
//   ctx.stroke();
// }
```

---

## Enhancement H4 — Coherence Bar Breath

### What
The `#cohBar` and `#cohValue` breathe — bar glows and value pulses during breath hold.

### How
```javascript
// In breathTick, also update coherence display
const bh = breathHold();
const cohEl = document.getElementById('cohBar');
const cohVal = document.getElementById('cohValue');
if (cohEl) {
  // Add breath glow to bar
  cohEl.style.boxShadow = bh > 0.5 ? `0 0 ${bh * 12}px rgba(232,200,106,${bh * 0.5})` : '';
}
if (cohVal) {
  cohVal.style.opacity = 0.7 + bh * 0.3;
}
```

---

## Enhancement H5 — Axis Band Breath

### What
The `.axis-band` glow intensity is modulated by `breathHold()` via CSS custom property.

### How
```css
.axis-band {
  opacity: calc(0.3 + var(--breath-hold, 0) * 0.6);
  filter: blur(calc(2px - var(--breath-hold, 0) * 1px));
}
```

---

## Enhancement H6 — Night Mode Accent Breath Shift

### What
During breath hold, the gold accent `#e8c86a` shifts toward blue-violet `#b0b0ff`.

### How
```javascript
// In breathTick:
const bh = breathHold();
if (bh > 0.6) {
  document.documentElement.style.setProperty('--gold', `rgb(${Math.round(232 - bh*112)},${Math.round(200 - bh*88)},${Math.round(106 + bh*149)})`);
} else {
  document.documentElement.style.setProperty('--gold', nightMode ? '#a090d0' : '#e8c86a');
}
```

---

## Enhancement H7 — Ghost Harmonics (subtle non-prime nodes)

### What
Non-prime wheel nodes have faint ghost presence that breathes with the field.

### How (in `drawWheel()`)
```javascript
// Ghost nodes at non-prime, non-active positions
if (!pp && !act) {
  const bh = breathHold();
  ctx.fillStyle = night
    ? `rgba(30,30,56,${0.2 + bh * 0.25})`
    : `rgba(40,40,64,${0.15 + bh * 0.2})`;
  ctx.beginPath();
  ctx.arc(nx, ny, r * 0.5 * (1 + bh * 0.2), 0, Math.PI * 2);
  ctx.fill();
}
```

---

## Testing Strategy

### Unit Tests (icox-tests.js)
Add breath function tests:
- `breathHold()` returns 0 at phase 0 and 1, returns 1 at phase 0.5
- `breathTick` advances phase correctly over time
- `startRipple` initializes ripple state correctly

### Playwright UI Tests (icox-ui.spec.js)
Add breath UI tests:
- Canvas wheel renders after login
- Coherence bar exists and updates
- Clicking wheel sets ripple state
- Breath phase advances over 2 seconds

---

## Coherent Evolution Cycles

Each cycle: TEST → REFACTOR → VERIFY → COMMIT

- **Cycle 1:** H1 — Breath RAF loop foundation + H4 (coherence bar breath)
- **Cycle 2:** H2 — Breathing wheel dots + H7 (ghost harmonics)
- **Cycle 3:** H3 — Selection ripple wave
- **Cycle 4:** H5 — Axis band breath (CSS custom property)
- **Cycle 5:** H6 — Night mode accent shift
- **Cycle 6:** Full integration + GUI harmonization pass

---

## File Map

| File | Role |
|------|------|
| `app.js` | All breath logic, drawWheel(), ripple, coherence bar |
| `style.css` | CSS custom property `--breath-hold`, axis band breath |
| `index.html` | Canvas, coherence bar, phase display |
| `icox-tests.js` | Unit tests for breath functions |
| `icox-ui.spec.js` | Playwright browser tests |
