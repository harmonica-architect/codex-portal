const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'resonator.js');
let content = fs.readFileSync(file, 'utf8');

// Update the soundscape frequency array from 5 Solfeggio to 12 glyph harmonics
const oldFreqs = '[432, 528, 639, 741, 852]';
const newFreqs = '[432, 456.9, 483.3, 510.6, 539.8, 570.6, 603.4, 637.9, 674.0, 712.0, 752.4, 795.0]';

if (!content.includes(oldFreqs)) {
  console.error('Could not find the old frequency array — check resonator.js');
  process.exit(1);
}

content = content.replace(oldFreqs, newFreqs);

// Add cache-bust to the script tag in resonator.html
const htmlFile = path.join(__dirname, 'resonator.html');
let html = fs.readFileSync(htmlFile, 'utf8');
if (!html.includes('resonator.js?v=')) {
  html = html.replace('resonator.js"', 'resonator.js?v=2"');
  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(' resonator.html cache-bust added');
} else {
  console.log(' resonator.html already has cache-bust');
}

fs.writeFileSync(file, content, 'utf8');
console.log(' resonator.js updated — 12 glyph harmonics in soundscape');
