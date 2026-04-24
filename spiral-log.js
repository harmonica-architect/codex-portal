// ══════════════════════════════════════════════
// SPIRAL LOG — Journey Memory Visualization
// Renders the phase-log as a living spiral map.
// The spiral has 8 breath-phase positions (matching
// the 8 breath phases / archetype zones).
// Each entry appears as a glowing node whose size
// and brightness reflect recency and coherence.
// Connecting arcs show archetypal flow.
// ══════════════════════════════════════════════

const SPIRAL_LOG = {
  container: null,
  canvas: null,
  ctx: null,
  animId: null,
  entries: [],        // { ts, archetype, glyph, action, coh }
  archetypeAngles: {}, // precomputed

  // Archetype → angle on the spiral (in radians, clock positions)
  ARCHETYPE_MAP: {
    'Seed':      0,    // 12 o'clock
    'Seed·2':    Math.PI / 4,
    'Bridge':    Math.PI / 2,   // 3 o'clock
    'Axis':      3 * Math.PI / 4,
    'Star':      Math.PI,       // 6 o'clock
    'Star·2':    5 * Math.PI / 4,
    'Convergence': 3 * Math.PI / 2, // 9 o'clock
    'Return':    7 * Math.PI / 4
  },

  GLYPH_MAP: {
    'Seed': '△', 'Seed·2': '◎', 'Bridge': '◁△▷',
    'Axis': '◇', 'Star': '◎', 'Star·2': '◉',
    'Convergence': '○', 'Return': '·'
  },

  COLORS: {
    'Seed': '#e8c86a', 'Bridge': '#b8a0d0', 'Axis': '#c8d0e0',
    'Star': '#e8c86a', 'Convergence': '#a0c0c0', 'Return': '#c0a0b0'
  },

  // ── Mount the spiral log ──
  mount(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._animate();
  },

  _resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  },

  // ── Add an entry from the phase log ──
  addEntry(entry) {
    this.entries.push({
      ...entry,
      birth: Date.now()
    });
    // Keep last 40 entries visible
    if (this.entries.length > 40) this.entries.shift();
  },

  // ── Animate the spiral ──
  _animate() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.82;

    ctx.clearRect(0, 0, w, h);

    // Background subtle glow
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    bgGrad.addColorStop(0, 'rgba(232,200,106,0.03)');
    bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();

    // Draw archetype ring positions (8 nodes)
    const now = Date.now();
    for (const [arch, angle] of Object.entries(this.ARCHETYPE_MAP)) {
      const rx = cx + Math.cos(angle - Math.PI / 2) * maxR;
      const ry = cy + Math.sin(angle - Math.PI / 2) * maxR;
      const color = this.COLORS[arch] || '#e8c86a';

      // Ring track
      ctx.beginPath();
      ctx.arc(rx, ry, 14, 0, Math.PI * 2);
      ctx.strokeStyle = color + '28';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center glyph
      ctx.font = '11px serif';
      ctx.fillStyle = color + '90';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.GLYPH_MAP[arch] || '·', rx, ry);
    }

    // Draw connecting arcs between entries (archetype flow)
    if (this.entries.length > 1) {
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 1; i < Math.min(this.entries.length, 12); i++) {
        const prev = this.entries[i - 1];
        const curr = this.entries[i];
        const pa = this.ARCHETYPE_MAP[prev.archetype];
        const ca = this.ARCHETYPE_MAP[curr.archetype];
        if (pa === undefined || ca === undefined) continue;

        const age = Math.max(1, (now - curr.birth) / 1000);
        const alpha = Math.max(0.05, 0.4 / Math.log(age + 1));
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(pa - Math.PI / 2) * maxR,
          cy + Math.sin(pa - Math.PI / 2) * maxR
        );
        ctx.bezierCurveTo(
          cx + Math.cos(pa - Math.PI / 2) * maxR * 0.5,
          cy + Math.sin(pa - Math.PI / 2) * maxR * 0.5,
          cx + Math.cos(ca - Math.PI / 2) * maxR * 0.5,
          cy + Math.sin(ca - Math.PI / 2) * maxR * 0.5,
          cx + Math.cos(ca - Math.PI / 2) * maxR,
          cy + Math.sin(ca - Math.PI / 2) * maxR
        );
        ctx.strokeStyle = (this.COLORS[curr.archetype] || '#e8c86a') +
          Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw entry nodes (newest = brightest, largest)
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      const arch = e.archetype || 'Seed';
      const angle = this.ARCHETYPE_MAP[arch];
      if (angle === undefined) continue;

      const age = (now - e.birth) / 1000; // seconds
      const coh = (e.coh || 50) / 100;
      const size = Math.max(3, Math.min(10, 10 * coh)) * Math.max(0.3, 1 - age / 120);
      const alpha = Math.max(0.1, Math.min(1, 1 - age / 90));
      const color = (this.COLORS[arch] || '#e8c86a');

      // Glow
      const grd = ctx.createRadialGradient(
        cx + Math.cos(angle - Math.PI / 2) * maxR,
        cy + Math.sin(angle - Math.PI / 2) * maxR, 0,
        cx + Math.cos(angle - Math.PI / 2) * maxR,
        cy + Math.sin(angle - Math.PI / 2) * maxR, size * 3
      );
      grd.addColorStop(0, color + Math.round(alpha * 200).toString(16).padStart(2, '0'));
      grd.addColorStop(1, color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle - Math.PI / 2) * maxR,
        cy + Math.sin(angle - Math.PI / 2) * maxR,
        size * 3, 0, Math.PI * 2
      );
      ctx.fill();

      // Core dot
      ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle - Math.PI / 2) * maxR,
        cy + Math.sin(angle - Math.PI / 2) * maxR,
        size, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Center coherence pulse
    const pulse = 0.5 + 0.5 * Math.sin(now / 800);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22 + pulse * 6);
    const cohVal = typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.currentCoh : 50;
    const cohAlpha = (cohVal / 100 * 0.5).toFixed(2);
    centerGrad.addColorStop(0, `rgba(232,200,106,${cohAlpha})`);
    centerGrad.addColorStop(1, 'rgba(232,200,106,0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 28 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    this.animId = requestAnimationFrame(() => this._animate());
  },

  // ── Feed from COHERENCE_BUS phase log ──
  syncFromBus() {
    if (typeof COHERENCE_BUS === 'undefined') return;
    const log = COHERENCE_BUS.phaseLog;
    if (!log || !log.length) return;
    // Add only new entries
    const lastTs = this.entries.length ? this.entries[this.entries.length - 1].ts : 0;
    log.forEach(e => {
      if (e.ts > lastTs) this.addEntry(e);
    });
  },

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
};
