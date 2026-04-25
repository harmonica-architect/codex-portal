const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'resonator.html');
let content = fs.readFileSync(file, 'utf8');

// Replace soundscape section using regex
const pattern = /<div id="soundscapeRows">[\s\S]*?<\/div>\s*<\/div>\s*<!-- BREATH CYCLE -->/;
const replacement = `<div id="soundscapeRows">
        <div class="srow">
          <span class="snd-icon">&#x25B3;</span>
          <span class="srow-label" style="min-width:38px;">432</span>
          <div class="snd-toggle-mini on" data-f="432" id="sndToggle432"></div>
          <input type="range" class="snd-vol-mini" id="sndVol432" min="0" max="100" value="30">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25C1;&#x25B3;&#x25B7;</span>
          <span class="srow-label" style="min-width:38px;">457</span>
          <div class="snd-toggle-mini" data-f="456.9" id="sndToggle4569"></div>
          <input type="range" class="snd-vol-mini" id="sndVol4569" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25C7;</span>
          <span class="srow-label" style="min-width:38px;">483</span>
          <div class="snd-toggle-mini" data-f="483.3" id="sndToggle4833"></div>
          <input type="range" class="snd-vol-mini" id="sndVol4833" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x2B1F;</span>
          <span class="srow-label" style="min-width:38px;">511</span>
          <div class="snd-toggle-mini" data-f="510.6" id="sndToggle5106"></div>
          <input type="range" class="snd-vol-mini" id="sndVol5106" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25B3;&#x304;</span>
          <span class="srow-label" style="min-width:38px;">540</span>
          <div class="snd-toggle-mini" data-f="539.8" id="sndToggle5398"></div>
          <input type="range" class="snd-vol-mini" id="sndVol5398" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x2295;</span>
          <span class="srow-label" style="min-width:38px;">571</span>
          <div class="snd-toggle-mini on" data-f="570.6" id="sndToggle5706"></div>
          <input type="range" class="snd-vol-mini" id="sndVol5706" min="0" max="100" value="20">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x2297;</span>
          <span class="srow-label" style="min-width:38px;">603</span>
          <div class="snd-toggle-mini" data-f="603.4" id="sndToggle6034"></div>
          <input type="range" class="snd-vol-mini" id="sndVol6034" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25C8;</span>
          <span class="srow-label" style="min-width:38px;">638</span>
          <div class="snd-toggle-mini" data-f="637.9" id="sndToggle6379"></div>
          <input type="range" class="snd-vol-mini" id="sndVol6379" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x2B21;</span>
          <span class="srow-label" style="min-width:38px;">674</span>
          <div class="snd-toggle-mini" data-f="674.0" id="sndToggle6740"></div>
          <input type="range" class="snd-vol-mini" id="sndVol6740" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25E7;</span>
          <span class="srow-label" style="min-width:38px;">712</span>
          <div class="snd-toggle-mini" data-f="712.0" id="sndToggle7120"></div>
          <input type="range" class="snd-vol-mini" id="sndVol7120" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x25E8;</span>
          <span class="srow-label" style="min-width:38px;">752</span>
          <div class="snd-toggle-mini" data-f="752.4" id="sndToggle7524"></div>
          <input type="range" class="snd-vol-mini" id="sndVol7524" min="0" max="100" value="0">
        </div>
        <div class="srow">
          <span class="snd-icon">&#x27A1;</span>
          <span class="srow-label" style="min-width:38px;">795</span>
          <div class="snd-toggle-mini on" data-f="795.0" id="sndToggle7950"></div>
          <input type="range" class="snd-vol-mini" id="sndVol7950" min="0" max="100" value="10">
        </div>
      </div>
    </div>

    <!-- BREATH CYCLE -->`;

const result = content.replace(pattern, replacement);
if (result === content) {
  console.error('Pattern not found — no changes made');
  process.exit(1);
}
fs.writeFileSync(file, result, 'utf8');
console.log('Done — soundscape updated to 12 glyph frequencies');
