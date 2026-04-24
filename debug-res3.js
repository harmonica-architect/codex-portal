const fs = require('fs');
const buf = fs.readFileSync('C:/Users/c/.openclaw/workspace/codex-portal/resonator.js');

// Find drawWheel full function
const dwIdx = buf.indexOf(Buffer.from('function drawWheel()'));
const dwEndChunk = buf.slice(dwIdx, dwIdx + 5000);
// Find where it ends (next function or end of file)
const nextFn = dwEndChunk.indexOf(Buffer.from('\nfunction '));
const dwEnd = nextFn > 0 ? dwIdx + nextFn : buf.length;
console.log('drawWheel function:');
console.log(buf.slice(dwIdx, dwEnd).toString('utf8'));

console.log('\n---\n');

// Find animate() to understand the loop
const anIdx = buf.indexOf(Buffer.from('function animate('));
if (anIdx > 0) {
  const anEndChunk = buf.slice(anIdx, anIdx + 2000);
  const anNext = anEndChunk.indexOf(Buffer.from('\nfunction '));
  const anEnd = anNext > 0 ? anIdx + anNext : buf.length;
  console.log('animate() function:');
  console.log(buf.slice(anIdx, anEnd).toString('utf8').slice(0, 600));
}
