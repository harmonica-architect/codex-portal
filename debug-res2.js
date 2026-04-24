const fs = require('fs');
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');

const domIdx = buf.indexOf(Buffer.from('DOMContentLoaded'));
console.log('DOMContentLoaded block:');
console.log(buf.slice(domIdx, domIdx + 300).toString('utf8'));

console.log('\n---\n');

const dwIdx = buf.indexOf(Buffer.from('function drawWheel'));
console.log('drawWheel start:');
console.log(buf.slice(dwIdx, dwIdx + 120).toString('utf8'));

console.log('\n---\n');

const scIdx = buf.indexOf(Buffer.from('function syncCycleUI'));
console.log('syncCycleUI start:');
console.log(buf.slice(scIdx, scIdx + 200).toString('utf8'));
