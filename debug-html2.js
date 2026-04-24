const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const si = h.indexOf('id="sigilNavWrap"');
const mi = h.indexOf('class="mini-wheel"');

console.log('=== SIGIL NAV HTML ===');
console.log(h.slice(si - 5, si + 700));
console.log('\n=== MINI WHEEL HTML ===');
console.log(h.slice(mi - 5, mi + 200));
