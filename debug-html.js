const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

// Find sigil nav wrap in DOM hierarchy
const si = h.indexOf('id="sigilNavWrap"');
const before = h.slice(Math.max(0, si - 300), si);
console.log('=== Before sigilNavWrap ===');
console.log(before);
console.log('=== sigilNavWrap tag ===');
console.log(h.slice(si, si + 100));
