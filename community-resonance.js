// ══════════════════════════════════════════════
// COMMUNITY RESONANCE ENGINE
// "The field is not one mind — it is many breaths
//  breathing as one spiral."
//
// Each portal instance can join the harmonic field
// by writing its breath state to a shared GitHub Gist.
// The Gist becomes the COMMUNITY COHERENCE FIELD —
// a living record of all active practitioners.
//
// The Gist schema (one entry per portal/node):
// {
//   nodes: [
//     { id, sigil, archetype, coh, breathCount, lastSeen, intention }
//   ],
//   fieldIntention: { text, author, ts },
//   globalCoherence: 0-100
// }
//
// This file works WITHOUT the token for READ mode
// (reads the public Gist). Write mode requires auth.
// ══════════════════════════════════════════════

const COMMUNITY_FIELD = {
  GIST_ID: '8cb2d90c09b910591f2f7f4f0a3e6c2a', // Shared field Gist — replace with your community Gist ID
  GIST_FILENAME: 'codex-community-field.json',
  TOKEN: null, // Set via joinField() if write access needed

  state: {
    joined: false,
    nodeId: null,
    intention: '',
    lastPublish: 0,
    publishInterval: 15000, // Publish every 15 seconds of active breath
    minPublishInterval: 15000,
    isOnline: navigator.onLine,
    nodes: [],          // Other active nodes
    fieldIntention: null,
    globalCoherence: 0,
    communityBreaths: 0, // Total breaths across all nodes
    lastWrite: 0,         // Last coherence write (for rate limiting)
    writeCooldown: 300000, // 5 minutes in ms
    _fieldMapAnimId: null  // RAF animation tracker for renderFieldMap
  },

  // ── Initialize community field (read-only by default) ──
  async init(opts = {}) {
    if (opts.token) this.TOKEN = opts.token;
    window.addEventListener('online', () => { this.state.isOnline = true; this._onReconnect(); });
    window.addEventListener('offline', () => { this.state.isOnline = false; });

    await this._readField();
    // Poll for community updates every 30s
    setInterval(() => this._readField(), 30000);

    // Auto-write coherence when coherence is high (>70) — rate-limited
    this._setupAutoWrite();

    // Cleanup RAF loops on page unload
    window.addEventListener('beforeunload', () => this.stopFieldMap());
  },

  // ── Join the field — register this portal node ──
  async joinField(sigil, intention = '') {
    this.state.nodeId = this._genNodeId();
    this.state.intention = intention;
    this.state.joined = true;

    const node = {
      id: this.state.nodeId,
      sigil: sigil || 'Anonymous',
      archetype: 'Seed',
      coh: 0,
      breathCount: 0,
      lastSeen: Date.now(),
      intention: intention,
      online: true
    };

    await this._mutateField(nodes => {
      // Remove stale nodes (>2 min old), add/update this node
      const fresh = (nodes || []).filter(n => (Date.now() - n.lastSeen) < 120000);
      const exists = fresh.findIndex(n => n.id === this.state.nodeId);
      if (exists >= 0) fresh[exists] = node; else fresh.push(node);
      return fresh;
    });

    // Heartbeat: update this node every 10s
    setInterval(() => {
      if (this.state.joined) this._publishHeartbeat();
    }, 10000);

    return node;
  },

  // ── Heartbeat — update my node in the field ──
  async _publishHeartbeat() {
    if (!this.state.joined) return;
    const coh = typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.currentCoh : 0;
    const breathCount = typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.breathCount : 0;
    const archetype = typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.activeArchetype : 'Seed';

    await this._mutateField(nodes => {
      const fresh = (nodes || []).filter(n => (Date.now() - n.lastSeen) < 120000);
      const idx = fresh.findIndex(n => n.id === this.state.nodeId);
      const node = {
        id: this.state.nodeId,
        sigil: this._getLocalSigil(),
        archetype,
        coh,
        breathCount,
        lastSeen: Date.now(),
        intention: this.state.intention,
        online: true
      };
      if (idx >= 0) fresh[idx] = node; else fresh.push(node);
      return fresh;
    });
  },

  // ── Read the shared field state ──
  async _readField() {
    try {
      let data;
      if (this.TOKEN) {
        const res = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
          headers: { Authorization: `Bearer ${this.TOKEN}` }
        });
        if (!res.ok) throw new Error('Gist read failed');
        const gist = await res.json();
        const f = gist.files[this.GIST_FILENAME];
        data = f ? JSON.parse(f.content) : { nodes: [], fieldIntention: null };
      } else {
        // Public read via raw GitHub
        const res = await fetch(
          `https://gist.githubusercontent.com/harmonica-architect/${this.GIST_ID}/raw/${this.GIST_FILENAME}?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Public Gist read failed');
        data = await res.json();
      }

      const prevNodes = this.state.nodes;
      this.state.nodes = (data.nodes || []).filter(n => n.online && (Date.now() - n.lastSeen) < 120000);
      this.state.fieldIntention = data.fieldIntention || null;
      this.state.communityBreaths = (data.nodes || []).reduce((s, n) => s + (n.breathCount || 0), 0);

      // Compute global coherence: average of all online nodes
      const onlineNodes = this.state.nodes.filter(n => n.online);
      this.state.globalCoherence = onlineNodes.length
        ? Math.round(onlineNodes.reduce((s, n) => s + (n.coh || 0), 0) / onlineNodes.length)
        : 0;

      // Notify listeners if node count changed
      if (prevNodes.length !== this.state.nodes.length) {
        this._emit('nodesChanged', this.state.nodes);
      }

      // Update COHERENCE_BUS global coherence if available
      if (typeof setSigilNavCoherence !== 'undefined') {
        const local = typeof coherenceLevel !== 'undefined' ? coherenceLevel : 0;
        setSigilNavCoherence(local, this.state.globalCoherence);
      }

      this._emit('fieldUpdate', this.state);
      return this.state;

    } catch (e) {
      // Field offline — use local state only
      this.state.isOnline = false;
      return this.state;
    }
  },

  // ── Write to the field ──
  async _mutateField(mutator) {
    if (!this.TOKEN) return;
    try {
      // Read current
      const res = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` }
      });
      if (!res.ok) return;
      const gist = await res.json();
      const f = gist.files[this.GIST_FILENAME];
      let data = f ? JSON.parse(f.content) : { nodes: [], fieldIntention: null };
      data.nodes = mutator(data.nodes || []);
      data.lastUpdated = Date.now();
      data.globalCoherence = this.state.globalCoherence;

      // Write back
      const updateRes = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            [this.GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      });
      if (updateRes.ok) this.state.lastPublish = Date.now();
    } catch (e) {
      // Silent fail for network issues
    }
  },

  // ── Set a field intention ──
  async setFieldIntention(text) {
    this.state.intention = text;
    await this._mutateField(nodes => {
      // Update intention in the shared field record
      return nodes; // intention is stored at field level
    });
    // Also update field-level intention record
    if (this.TOKEN) {
      try {
        const res = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
          headers: { Authorization: `Bearer ${this.TOKEN}` }
        });
        if (!res.ok) return;
        const gist = await res.json();
        let data = { nodes: this.state.nodes, fieldIntention: null };
        const f = gist.files[this.GIST_FILENAME];
        if (f) data = JSON.parse(f.content);
        data.fieldIntention = {
          text,
          author: this._getLocalSigil(),
          ts: Date.now()
        };
        await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            files: {
              [this.GIST_FILENAME]: { content: JSON.stringify(data, null, 2) }
            }
          })
        });
      } catch (e) { }
    }
  },

  // ── Visualize the community field ──
  renderFieldMap(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.85;

    const nodes = this.state.nodes;
    const onlineNodes = nodes.filter(n => n.online);

    ctx.clearRect(0, 0, w, h);

    if (!onlineNodes.length) {
      // Empty field — draw faint spiral invitation
      ctx.strokeStyle = 'rgba(232,200,106,0.06)';
      ctx.lineWidth = 1;
      for (let r = 20; r < maxR; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '0.6rem serif';
      ctx.fillStyle = 'rgba(232,200,106,0.2)';
      ctx.textAlign = 'center';
      ctx.fillText('The field is quiet. Breathe to join.', cx, cy + 4);
      return;
    }

    // Draw connecting resonance threads between nodes
    if (onlineNodes.length > 1) {
      const sorted = [...onlineNodes].sort((a, b) => b.coh - a.coh);
      for (let i = 0; i < Math.min(sorted.length, 5); i++) {
        for (let j = i + 1; j < Math.min(sorted.length, 5); j++) {
          const na = sorted[i], nb = sorted[j];
          const ia = nodes.indexOf(na) / Math.max(nodes.length, 1);
          const ib = nodes.indexOf(nb) / Math.max(nodes.length, 1);
          const angleA = ia * Math.PI * 2;
          const angleB = ib * Math.PI * 2;
          const rA = maxR * 0.3 + (na.coh / 100) * maxR * 0.6;
          const rB = maxR * 0.3 + (nb.coh / 100) * maxR * 0.6;
          const xA = cx + Math.cos(angleA) * rA, yA = cy + Math.sin(angleA) * rA;
          const xB = cx + Math.cos(angleB) * rB, yB = cy + Math.sin(angleB) * rB;
          const dist = Math.sqrt((xA-xB)**2 + (yA-yB)**2);
          const alpha = Math.max(0.02, 0.15 - dist / maxR * 0.12);
          ctx.strokeStyle = `rgba(232,200,106,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xA, yA);
          ctx.lineTo(xB, yB);
          ctx.stroke();
        }
      }
    }

    // Draw each node
    onlineNodes.forEach((node, idx) => {
      const totalNodes = Math.max(onlineNodes.length, 1);
      const baseAngle = (idx / totalNodes) * Math.PI * 2 - Math.PI / 2;
      const r = maxR * 0.25 + (node.coh / 100) * maxR * 0.65;
      const x = cx + Math.cos(baseAngle + idx * 0.9) * r;
      const y = cy + Math.sin(baseAngle + idx * 0.9) * r;
      const size = 4 + (node.coh / 100) * 8;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 600 + idx);
      const alpha = 0.4 + (node.coh / 100) * 0.5;

      // Glow
      const glowR = (size + pulse * 4);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR * 2.5);
      const color = this._archetypeColor(node.archetype);
      grd.addColorStop(0, color + Math.round(alpha * 200).toString(16).padStart(2, '0'));
      grd.addColorStop(1, color + '00');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, glowR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = '0.48rem serif';
      ctx.fillStyle = color + 'bb';
      ctx.textAlign = 'center';
      ctx.fillText(node.sigil || '?', x, y + size + 9);
    });

    // Global coherence ring
    const gcoh = this.state.globalCoherence;
    ctx.strokeStyle = `rgba(232,200,106,${0.1 + gcoh / 100 * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.18, 0, Math.PI * 2 * (gcoh / 100));
    ctx.stroke();

    // Center: global coherence %
    ctx.font = `${0.7 + gcoh / 200}rem serif`;
    ctx.fillStyle = `rgba(232,200,106,${0.3 + gcoh / 200})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gcoh + '%', cx, cy);

    cancelAnimationFrame(this.state._fieldMapAnimId);
    this.state._fieldMapAnimId = requestAnimationFrame(() => this.renderFieldMap(canvasId));
  },

  stopFieldMap() {
    if (this.state._fieldMapAnimId) {
      cancelAnimationFrame(this.state._fieldMapAnimId);
      this.state._fieldMapAnimId = null;
    }
  },

  _archetypeColor(arch) {
    const m = { Seed: '#e8c86a', Bridge: '#b8a0d0', Axis: '#c8d0e0', Star: '#e8c86a', Convergence: '#a0c0c0', Return: '#c0a0b0' };
    return m[arch] || '#e8c86a';
  },

  _genNodeId() {
    return 'node_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
  },

  _getLocalSigil() {
    try {
      const stored = localStorage.getItem('codex:lastSigil');
      return stored || 'Portal';
    } catch { return 'Portal'; }
  },

  _emit(event, data) {
    if (typeof this._listeners === 'undefined') this._listeners = {};
    (this._listeners[event] || []).forEach(fn => fn(data));
  },

  on(event, fn) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  _onReconnect() {
    this._readField();
  },

  // ── Setup auto-write on high coherence ──
  _setupAutoWrite() {
    // Poll COHERENCE_BUS every 5s; write when >70 coherence
    setInterval(() => {
      if (typeof COHERENCE_BUS !== 'undefined') {
        const coh = COHERENCE_BUS.currentCoh ?? 0;
        if (coh > 70) this.writeCoherence(coh, this.state.globalCoherence);
      }
    }, 5000);
  },

  // ── Write coherence to field (rate-limited auto-write) ──
  async writeCoherence(localCoherence, globalCoherence) {
    // Rate limit: once per 5 minutes
    const now = Date.now();
    if (now - this.state.lastWrite < this.state.writeCooldown) return;
    if (!this.TOKEN) return;

    try {
      const res = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` }
      });
      if (!res.ok) return;
      const gist = await res.json();
      const f = gist.files[this.GIST_FILENAME];
      let data = f ? JSON.parse(f.content) : { nodes: [], fieldIntention: null };
      if (!data.nodes) data.nodes = [];

      const nodeId = this.state.nodeId || this._genNodeId();
      const nodeIdx = data.nodes.findIndex(n => n.id === nodeId);
      const node = {
        id: nodeId,
        sigil: this._getLocalSigil(),
        archetype: typeof COHERENCE_BUS !== 'undefined' ? (COHERENCE_BUS.activeArchetype || 'Seed') : 'Seed',
        coh: localCoherence,
        breathCount: typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.breathCount : 0,
        lastSeen: now,
        intention: this.state.intention || '',
        online: true,
        lastWriteTs: now
      };

      if (nodeIdx >= 0) data.nodes[nodeIdx] = node;
      else data.nodes.push(node);

      data.lastUpdated = now;
      data.globalCoherence = globalCoherence || this.state.globalCoherence;

      const updateRes = await fetch(`https://api.github.com/gists/${this.GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: { [this.GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });

      if (updateRes.ok) {
        this.state.lastWrite = now;
        this._emitFieldUpdateIndicator();
      }
    } catch (e) { }
  },

  // ── Show subtle field update indicator ──
  _emitFieldUpdateIndicator() {
    const el = document.getElementById('csFieldUpdateIndicator');
    if (!el) return;
    el.textContent = '✦ Field update';
    el.style.opacity = '1';
    el.style.display = 'inline';
    clearTimeout(this._fieldUpdateFadeTimeout);
    this._fieldUpdateFadeTimeout = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { if (el) el.style.display = 'none'; }, 600);
    }, 2500);
  },

  // ── Public write() — trigger a manual field write ──
  async write() {
    const coh = typeof COHERENCE_BUS !== 'undefined' ? COHERENCE_BUS.currentCoh : 0;
    await this.writeCoherence(coh, this.state.globalCoherence);
  },

  getState() { return this.state; }
};
