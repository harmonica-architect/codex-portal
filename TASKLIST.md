# Codex Portal — Harmonic Field Mirror
## Your Task List

**Live branch:** `harmonic-field-mirror` on https://github.com/harmonica-architect/codex-portal
**Create PR:** https://github.com/harmonica-architect/codex-portal/pull/new/harmonic-field-mirror

---

## Quick Win Tasks (Start Here)

### [ ] T1 — Add your 3 fav glyphs and hit Enter
Visit the portal at `http://localhost:3738` (run `node server.js` in `reg-codex/icox/`) and enter the field.

### [ ] T2 — Try the breath cycle
Click **Begin Cycle**. Watch the wheel breathe through all 6 phases. Notice the coherence bar climbing.

### [ ] T3 — Click any wheel node
An expanding ripple wave should emanate from the position you clicked. A white highlight stays on the selected position.

---

## Core Field Tasks

### [ ] T4 — Night Mode
Click **☽ Night Mode**. Notice how the `--gold` shifts toward violet during breath hold.

### [ ] T5 — Glyph Overlay Toggle
In Advanced Tools, toggle **△** glyph overlay. The glyphs breathe in size at each prime node.

### [ ] T6 — Personal Tone
In Advanced Tools, set your frequency to something personal (e.g., 396 Hz forLiberation). A sine tone plays when you click a glyph button.

### [ ] T7 — View the 12×12 MatrixGlyph
Click **Open 12×12 Matrix** in the Codex tab. Toggle through all 8 layers. Notice the spectral color ramp.

### [ ] T8 — View the Resonator Breath Guide
Click **Resonator** in the nav. Audio breath guidance with 432 Hz drone.

---

## Harmonic Enhancement Tasks (from RECURSIVE-HARMONIC-PLAN.md)

These are tagged by difficulty.

### Easy

- [ ] **T9 — Add frequency ratio labels** (`R2.1`) — Ratios like 3/2, 5/4 already appear at `breathHold > 0.65` on prime nodes. Try it: start the breath cycle, wait until inhale-hold peak, watch the ratios appear.

- [ ] **T10 — Observe the quasi-prime shimmer** (`R4.1`) — Non-prime nodes that are near primes (25, 49, 77...) breathe violet. Select position 25 on the wheel and watch it shimmer.

- [ ] **T11 — The φ-spiral** (`R5.3`) — A golden ratio spiral overlays the wheel. At `breathHold > 0.7`, the spiral line thickens and brightens.

- [ ] **T12 — 4-Quadrant color wash** (`R4.2`) — The wheel background has red-orange / gold / green / blue-violet sectors. Can you see the quaternion symmetry in the color bands?

### Medium

- [ ] **T13 — Integrate `zero-variance-stations.json` into the Res Grid** (`R3.1`) — Load the 30 zero-variance stations and mark them with concentric rings on the 144-cell grid. See `C:\Users\c\.openclaw\workspace\reg-codex\HarmonicData\zero-variance-stations.json`.

- [ ] **T14 — Add interference ripple lines** (`R3.2`) — When two occupied positions are in the same residue class mod 30, draw a faint line between them. Their alpha oscillates at the interference frequency.

- [ ] **T15 — Coherence Waveform Panel** (`R3.3`) — Add a small canvas in the Res grid that renders the combined wave of all occupied positions as a scrolling waveform.

- [ ] **T16 — Digital root heatmap** (`R2.3`) — Tint each grid cell with its digital root color (1=warm red, 9=violet). The 9-class residue pattern becomes visible as a heatmap.

### Advanced

- [ ] **T17 — Harmonic Resonance Score** (`R6.2`) — Compute a multi-dimensional coherence score combining: breath alignment + prime proximity + wave coherence + cross-domain span. Display as a small radar/spider chart.

- [ ] **T18 — 9th Mean Baseline** (`R6.3`) — Draw the Logarithmic Baseline on the Res grid axis. Items far from it have high "resonance deviation." Color-code deviation as a new gradient layer.

- [ ] **T19 — 120-cell / Dodecahedron toggle** (`R5.2`) — The portal already has 120-cell projection geometry. Wire up the polyhedral toggle to switch between tetra/octa/icosa/120-cell projections, each with its own breath signature.

- [ ] **T20 — Prime density tick marks** (`R4.3`) — At each wheel node, draw radiating tick marks proportional to the count of primes within ±5 positions. The prime constellation becomes visible.

---

## Git Workflow

1. **Make changes** in `C:\Users\c\.openclaw\workspace\reg-codex\icox\`
2. **Run tests:** `node icox-tests.js` and `node run-tests.js`
3. **Commit:** `git add . && git commit -m "description"`
4. **Push to your mirror branch:** `git push origin master:harmonic-field-mirror`
5. **Create PR:** https://github.com/harmonica-architect/codex-portal/pull/new/harmonic-field-mirror

---

## Code Map

| File | What it does |
|------|-------------|
| `app.js` | Wheel canvas, breath loop, WebSocket coherence, all drawing |
| `index.html` | Portal UI, tabs, canvas |
| `style.css` | All styling, CSS custom properties |
| `matrix.js` | 12×12 MatrixGlyph with 8 layers |
| `resonator.js` | Audio breath guide |
| `server.js` | WebSocket server on port 3738 |
| `state.js` | localStorage + WS state, cross-tool sync |
| `icox-tests.js` | 202 unit tests |
| `run-tests.js` | Playwright runner (25 browser tests) |

---

## Running the Portal

```bash
cd C:\Users\c\.openclaw\workspace\reg-codex\icox
node server.js
# Open http://localhost:3738
```

---

## Breath Custom Properties (for CSS)

| Property | What it does |
|----------|-------------|
| `--breath-hold` | 0→1→0 over 6s. Use in CSS: `opacity: calc(var(--breath-hold) * 0.5)` |
| `--gold` | Shifts toward violet-blue during breath hold |

---

## Files to Read for Context

- `C:\Users\c\.openclaw\workspace\reg-codex\icox\HARMONIC-UX.md` — breath UX spec
- `C:\Users\c\.openclaw\workspace\reg-codex\RECURSIVE-HARMONIC-PLAN.md` — full enhancement plan
- `C:\Users\c\.openclaw\workspace\reg-codex\icox\CODEX_ARCHITECTURE.md` — system design
