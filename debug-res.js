const fs = require('fs');
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');

// Check DOMContentLoaded
const domIdx = buf.indexOf(Buffer.from("DOMContentLoaded"));
console.log('DOMContentLoaded at byte', domIdx);
console.log(buf.slice(domIdx, domIdx + 400).toString('utf8'));

console.log('\n---\n');

// Check what drawWheel does
const dwIdx = buf.indexOf(Buffer.from('function drawWheel'));
console.log('drawWheel at byte', dwIdx);
console.log(buf.slice(dwIdx, dwIdx + 80).toString('utf8'));

console.log('\n---\n');

// Check initAudio
const iaIdx = buf.indexOf(Buffer.from('function initAudio'));
console.log('initAudio at byte', iaIdx);
console.log(buf.slice(iaIdx, iaIdx + 150).toString('utf8'));
