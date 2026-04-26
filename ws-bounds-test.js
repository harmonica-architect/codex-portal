/**
 * WebSocket Bounds Validation Test
 * Tests handleWSMessage() clamping logic for field_state and users_count messages.
 * 
 * Run: node ws-bounds-test.js
 */

const WS_URL = 'wss://codex-portal.onrender.com';

// ── Mock WebSocket to test handleWSMessage bounds logic ──
function testHandleWSMessage() {
  let serverPhase, globalCoherence, totalUsers, inSyncCount, wsConnected;
  const logs = [];

  function updateFieldStatus(msg) { logs.push(msg); }

  // Mock handleWSMessage (copied from app.js handleWSMessage logic)
  function handleWSMessage(msg) {
    switch (msg.type) {
      case 'field_state':
        serverPhase = Math.max(0, Math.min(5, msg.phase ?? 0));
        globalCoherence = Math.max(0, Math.min(100, msg.globalCoherence ?? 0));
        totalUsers = Math.max(0, Math.min(10000, msg.userCount ?? 0));
        inSyncCount = Math.max(0, Math.min(totalUsers, msg.inSyncCount ?? 0));
        updateFieldStatus(
          totalUsers > 0
            ? `${totalUsers} breather${totalUsers !== 1 ? 's' : ''} in field | ${inSyncCount} in phase | field coherence ${Math.round(globalCoherence)}%`
            : 'Waiting for field connection...'
        );
        break;
      case 'users_count':
        totalUsers = Math.max(0, Math.min(10000, msg.count ?? 0));
        break;
    }
  }

  let passed = 0, failed = 0;

  function check(label, actual, expected) {
    if (actual === expected) {
      console.log('  ✅ ' + label + ' → ' + actual);
      passed++;
    } else {
      console.log('  ❌ ' + label + ' → got ' + actual + ', expected ' + expected);
      failed++;
    }
  }

  console.log('\n── field_state bounds ──');

  handleWSMessage({ type: 'field_state', phase: -5, globalCoherence: -999, userCount: -1, inSyncCount: -50 });
  check('phase clamped to 0', serverPhase, 0);
  check('globalCoherence clamped to 0', globalCoherence, 0);
  check('totalUsers clamped to 0', totalUsers, 0);
  check('inSyncCount clamped to 0', inSyncCount, 0);

  handleWSMessage({ type: 'field_state', phase: 999, globalCoherence: 9999, userCount: 99999, inSyncCount: 99999 });
  check('phase clamped to 5', serverPhase, 5);
  check('globalCoherence clamped to 100', globalCoherence, 100);
  check('totalUsers clamped to 10000', totalUsers, 10000);
  check('inSyncCount clamped to totalUsers', inSyncCount, 10000);

  handleWSMessage({ type: 'field_state', phase: 3, globalCoherence: 72.5, userCount: 42, inSyncCount: 15 });
  check('phase exact 3', serverPhase, 3);
  check('globalCoherence exact 72.5 (stored unrounded, displayed rounded)', globalCoherence, 72.5);
  check('totalUsers exact 42', totalUsers, 42);
  check('inSyncCount exact 15', inSyncCount, 15);

  handleWSMessage({ type: 'field_state', phase: null, globalCoherence: null, userCount: null, inSyncCount: null });
  check('phase null → 0', serverPhase, 0);
  check('globalCoherence null → 0', globalCoherence, 0);
  check('totalUsers null → 0', totalUsers, 0);
  check('inSyncCount null → 0', inSyncCount, 0);

  handleWSMessage({ type: 'field_state', userCount: 500, inSyncCount: 1000 }); // inSyncCount > totalUsers
  check('inSyncCount clamped to totalUsers when over', inSyncCount, 500);

  console.log('\n── users_count bounds ──');

  totalUsers = null;
  handleWSMessage({ type: 'users_count', count: -5 });
  check('users_count negative → 0', totalUsers, 0);

  handleWSMessage({ type: 'users_count', count: 50000 });
  check('users_count over 10000 → 10000', totalUsers, 10000);

  handleWSMessage({ type: 'users_count', count: 17 });
  check('users_count exact 17', totalUsers, 17);

  console.log('\n── updateFieldStatus format ──');
  handleWSMessage({ type: 'field_state', phase: 2, globalCoherence: 68, userCount: 7, inSyncCount: 3 });
  check('status plural "breathers"', logs[logs.length - 1].includes('breathers'), true);

  totalUsers = 1; logs.length = 0;
  handleWSMessage({ type: 'field_state', phase: 1, globalCoherence: 80, userCount: 1, inSyncCount: 1 });
  check('status singular "breather"', logs[logs.length - 1].includes('breather ') && !logs[logs.length - 1].includes('breathers'), true);

  handleWSMessage({ type: 'field_state', phase: 0, globalCoherence: 0, userCount: 0, inSyncCount: 0 });
  check('zero users → "Waiting for field connection"', logs[logs.length - 1].includes('Waiting'), true);

  console.log('\n═══════════════════════════════');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  return failed === 0;
}

// ── Live WebSocket connection test (optional, skip if server unreachable) ──
async function testLiveWebSocket() {
  console.log('\n── Live WebSocket connection to ' + WS_URL + ' ──');
  
  return new Promise((resolve) => {
    let ws;
    let timeout = setTimeout(() => {
      console.log('  ⏱️  Server not reachable (timeout) — skipping live WS test');
      if (ws) ws.close();
      resolve(false);
    }, 5000);

    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('  ✅ WebSocket connected');
        
        // Send a join and wait for field_state
        ws.send(JSON.stringify({ type: 'join', sigil: 'test', coherence: 0, phase: 0 }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          console.log('  📩 Received message type: ' + msg.type);
          
          if (msg.type === 'field_state') {
            console.log('     users in field: ' + msg.userCount + ', coherence: ' + msg.globalCoherence + ', phase: ' + msg.phase);
            ws.close();
            clearTimeout(timeout);
            resolve(true);
          }
        } catch (e) {
          console.log('  ⚠️  Failed to parse message: ' + e.message);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        console.log('  ❌ WebSocket error — server may be down or CORS blocked');
        resolve(false);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        console.log('  🔌 WebSocket closed');
        resolve(false);
      };
    } catch (e) {
      clearTimeout(timeout);
      console.log('  ❌ Failed to create WebSocket: ' + e.message);
      resolve(false);
    }
  });
}

// ── Run ──
const boundsOk = testHandleWSMessage();
console.log('\nBounds validation: ' + (boundsOk ? '✅ PASS' : '❌ FAIL'));

// Live WS test — only run if explicitly requested or not in CI
const runLive = process.argv.includes('--live');
if (runLive) {
  testLiveWebSocket().then(ok => {
    console.log('\nLive WebSocket: ' + (ok ? '✅ OK' : '❌ FAIL'));
    process.exit(ok ? 0 : 1);
  });
} else {
  console.log('\n(Run with --live to test actual WS connection)');
  process.exit(boundsOk ? 0 : 1);
}
