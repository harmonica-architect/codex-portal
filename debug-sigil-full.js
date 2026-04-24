const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const si = h.indexOf('id="sigilNavWrap"');
console.log(h.slice(si - 5, si + 850));
