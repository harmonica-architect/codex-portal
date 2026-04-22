// ═══════════════════════════════════════════════════════════════════════
// CODEX PORTAL — server.js
// WebSocket + HTTP server with multi-user coherence tracking
// ═══════════════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3737;
const PUBLIC_DIR = path.join(__dirname);

// ── HTTP SERVER ──
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Remove query string
  filePath = filePath.split('?')[0];

  const fullPath = path.join(PUBLIC_DIR, filePath);
  const ext = path.extname(fullPath);
  const mimeType = mimeTypes[ext] || 'text/plain';

  try {
    const content = fs.readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(500);
      res.end('Server error');
    }
  }
});

// ── WEBSOCKET SERVER ──
const wss = new WebSocketServer({ server });

// Connected clients
const clients = new Map(); // clientId → { ws, sigil, coherence, phase, lastUpdate, joinedAt }

// Client ID counter
let clientIdCounter = 0;

// ── FIELD STATE CONFIG ──
const FIELD_CONFIG = {
  SYNC_WINDOW: 600,             // ms tolerance for "in phase" (matches client WS_CONFIG)
  COHERENCE_WEIGHT_REAL: 3,
  COHERENCE_WEIGHT_VIRTUAL: 1,
  PHASE_BROADCAST_INTERVAL: 300, // ms — server-authoritative phase broadcast
  CLIENT_TIMEOUT: 10000,         // ms — if no message from client in this time, mark inactive
  CYCLE_DURATION: 24000,        // ms — 6 phases × 4s each (server-authoritative)
  PHASE_COUNT: 6,
};

// Phase definitions (server-authoritative)
const PHASES_SERVER = [
  { name: 'Inhale — Scalar Seed',    breath: 'Inhale' },
  { name: 'Hold — Symbol Emergence',  breath: 'Hold' },
  { name: 'Exhale — Inversion',       breath: 'Exhale' },
  { name: 'Still — Deep Inversion',   breath: 'Still' },
  { name: 'Inhale — Convergence',     breath: 'Inhale' },
  { name: 'Hold — Silence Return',    breath: 'Hold' },
];

// ── SERVER-AUTHORITATIVE PHASE TRACKING ──
let serverCycleStart = Date.now();

function getServerPhase() {
  const elapsed = Date.now() - serverCycleStart;
  const cyclePos = elapsed % FIELD_CONFIG.CYCLE_DURATION;
  const phaseIndex = Math.floor(cyclePos / (FIELD_CONFIG.CYCLE_DURATION / FIELD_CONFIG.PHASE_COUNT));
  return Math.min(phaseIndex, FIELD_CONFIG.PHASE_COUNT - 1);
}

// ── GLOBAL COHERENCE COMPUTATION ──
function computeGlobalCoherence() {
  const activeClients = [...clients.values()].filter(c => {
    const inactive = Date.now() - c.lastUpdate > FIELD_CONFIG.CLIENT_TIMEOUT;
    return !inactive;
  });

  if (activeClients.length === 0) return 0;

  // Average personal coherences
  const avgPersonalCoherence = activeClients.reduce((s, c) => s + c.coherence, 0) / activeClients.length;

  // Sync bonus: how many users are in phase with server-authoritative phase
  const serverPhase = getServerPhase();
  const inSyncUsers = activeClients.filter(c => {
    // Client phase matches server phase within sync window
    return c.phase === serverPhase;
  });

  const syncRatio = activeClients.length > 0 ? inSyncUsers.length / activeClients.length : 0;
  const syncBonus = syncRatio * 20; // Up to 20% bonus for full sync

  return Math.min(100, Math.round(avgPersonalCoherence + syncBonus));
}

// ── FIELD STATE BROADCAST ──
function broadcastFieldState() {
  const serverPhase = getServerPhase();
  const activeClients = [...clients.values()].filter(c => {
    return Date.now() - c.lastUpdate < FIELD_CONFIG.CLIENT_TIMEOUT;
  });

  const inSyncCount = activeClients.filter(c => c.phase === serverPhase).length;
  const globalCoherence = computeGlobalCoherence();

  const payload = JSON.stringify({
    type: 'field_state',
    phase: serverPhase,
    phaseName: PHASES_SERVER[serverPhase].name,
    globalCoherence,
    userCount: activeClients.length,
    inSyncCount,
    serverTime: Date.now()
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) { // OPEN
      client.ws.send(payload);
    }
  });
}

// Broadcast field state every 300ms
setInterval(broadcastFieldState, FIELD_CONFIG.PHASE_BROADCAST_INTERVAL);

// ── WEBSOCKET CONNECTION HANDLING ──
wss.on('connection', (ws, req) => {
  const clientId = ++clientIdCounter;
  const client = {
    ws,
    sigil: '',
    coherence: 0,
    phase: 0,
    lastUpdate: Date.now(),
    joinedAt: Date.now(),
  };
  clients.set(clientId, client);

  console.log(`[WS] Client ${clientId} connected. Total: ${clients.size}`);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const c = clients.get(clientId);
      if (!c) return;

      c.lastUpdate = Date.now();

      switch (msg.type) {
        case 'join':
          c.sigil = msg.sigil || 'anon';
          c.coherence = 0;
          c.phase = 0;
          console.log(`[WS] Client ${clientId} joined as ${c.sigil}. Field: ${[...clients.values()].filter(x => x.sigil).length} users`);
          // Broadcast updated user count
          broadcast({ type: 'users_count', count: [...clients.values()].filter(x => x.sigil).length });
          break;

        case 'coherence_update':
          c.coherence = Math.max(0, Math.min(100, msg.coherence || 0));
          c.phase = Math.max(0, Math.min(5, msg.phase || 0));
          break;
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    const c = clients.get(clientId);
    clients.delete(clientId);
    console.log(`[WS] Client ${clientId} disconnected (${c?.sigil || 'unknown'}). Total: ${clients.size}`);
    // Broadcast updated user count
    broadcast({ type: 'users_count', count: [...clients.values()].filter(x => x.sigil).length });
  });

  ws.on('error', () => {
    clients.delete(clientId);
  });
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(payload);
    }
  });
}

// ── START ──
server.listen(PORT, () => {
  console.log(`🜂 Codex Portal server running on port ${PORT}`);
  console.log(`🜂 WebSocket: ws://localhost:${PORT}`);
  console.log(`🜂 HTTP: http://localhost:${PORT}`);
  console.log(`🜂 Serving: ${PUBLIC_DIR}`);
});
