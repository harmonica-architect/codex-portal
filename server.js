// Codex Portal V3.1 — Multi-User Breath Sync Server
// WebSocket + HTTP on port 3737
// Run: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3737;
const HTTP_DIR = path.join(__dirname);

// ── HTTP Server (serves the portal) ──
const server = http.createServer((req, res) => {
  let filePath = path.join(HTTP_DIR, req.url === '/' ? 'v3.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(HTTP_DIR, 'v3.html');
  const ext = path.extname(filePath);
  const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json' }[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

// ── WebSocket Server ──
const wss = new WebSocket.Server({ server });

// Client state
const clients = new Map(); // ws → { id, sigil, phase, lastSeen, joinedAt }
const ROOM = 'codex-field';
let serverPhase = 0; // 0-6 (6 = idle)
let serverPhaseStart = 0;
let unifiedBreath = false;
let serverCycleCount = 0;

function broadcast(data, exclude = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastAll(data) {
  broadcast(data, null);
}

function getClientCount() {
  let count = 0;
  wss.clients.forEach(() => count++);
  return count;
}

function getClientsData() {
  const list = [];
  clients.forEach((c, ws) => { if (ws.readyState === WebSocket.OPEN) list.push({ sigil: c.sigil, phase: c.phase }); });
  return list;
}

function calcCoherence() {
  const clientsArr = [];
  clients.forEach(c => { if (c.phase !== undefined) clientsArr.push(c.phase); });
  if (clientsArr.length < 2) return clientsArr.length === 1 ? 60 : 0;
  // Count how many are on same phase
  const counts = {};
  clientsArr.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  return Math.round((max / clientsArr.length) * 100);
}

function generateId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Phase advance broadcast
function advanceServerPhase() {
  if (serverPhase < 6) {
    serverPhase++;
    serverPhaseStart = Date.now();
    broadcastAll({
      type: 'phase',
      phase: serverPhase,
      timestamp: serverPhaseStart,
      cycleCount: serverCycleCount,
      coherence: calcCoherence(),
      users: getClientsData()
    });
    if (serverPhase < 6) {
      setTimeout(advanceServerPhase, 5000);
    } else {
      // Cycle complete
      serverCycleCount++;
      broadcastAll({ type: 'cycle_complete', cycleCount: serverCycleCount, coherence: calcCoherence(), users: getClientsData() });
      // Reset to idle after 3s
      setTimeout(() => {
        serverPhase = 0;
        broadcastAll({ type: 'idle', cycleCount: serverCycleCount, coherence: 0, users: getClientsData() });
      }, 3000);
    }
  }
}

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  clients.set(ws, { id: clientId, sigil: null, phase: 0, joinedAt: Date.now() });

  // Welcome
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    phase: serverPhase,
    cycleCount: serverCycleCount,
    unifiedBreath,
    totalClients: getClientCount(),
    users: getClientsData()
  }));

  // Notify others
  broadcast({ type: 'join', clientId, totalClients: getClientCount(), users: getClientsData() }, ws);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      const client = clients.get(ws);

      switch (msg.type) {
        case 'sigil':
          client.sigil = msg.sigil;
          broadcastAll({ type: 'sigil_update', clientId, sigil: msg.sigil, users: getClientsData() });
          break;

        case 'breath_update':
          // Client reports their current phase for coherence tracking
          client.phase = msg.phase;
          const coh = calcCoherence();
          broadcastAll({
            type: 'coherence_update',
            coherence: coh,
            users: getClientsData(),
            serverPhase
          });
          break;

        case 'start_unified':
          unifiedBreath = true;
          serverPhase = 0;
          serverPhaseStart = Date.now();
          broadcastAll({
            type: 'unified_start',
            phase: 0,
            timestamp: serverPhaseStart,
            initiator: clientId,
            users: getClientsData()
          });
          // Begin phase cycle
          setTimeout(advanceServerPhase, 3000);
          break;

        case 'stop_unified':
          unifiedBreath = false;
          serverPhase = 0;
          broadcastAll({ type: 'unified_stop', users: getClientsData() });
          break;

        case 'manual_phase':
          // Ritual leader can manually advance
          if (unifiedBreath && msg.phase !== undefined) {
            serverPhase = msg.phase;
            serverPhaseStart = Date.now();
            broadcastAll({
              type: 'phase',
              phase: serverPhase,
              timestamp: serverPhaseStart,
              manual: true,
              users: getClientsData()
            });
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          break;
      }
    } catch(e) {
      console.error('WS message error:', e.message);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    broadcastAll({
      type: 'leave',
      clientId: client?.id,
      totalClients: getClientCount(),
      users: getClientsData(),
      coherence: calcCoherence()
    });
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
    clients.delete(ws);
  });
});

// ── Health ping every 30s ──
setInterval(() => {
  broadcastAll({ type: 'health', totalClients: getClientCount(), serverPhase, uptime: Math.round(process.uptime()) });
}, 30000);

server.listen(PORT, () => {
  console.log(`Codex Portal V3.1 — Multi-User Node`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`WebSocket ready for breath sync`);
  console.log(`Node uptime: ${Math.round(process.uptime())}s | Clients: ${getClientCount()}`);
});