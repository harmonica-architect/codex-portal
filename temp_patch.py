import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_fn = '''function refreshProfile() {
  const el = document.getElementById('profileContent');
  if (!profile) return;
  var totalInteractions = sigilEvolution.totalInteractions || 0;
  var stage = totalInteractions < 10 ? 'Seed' :
              totalInteractions < 25 ? 'Bridge' :
              totalInteractions < 50 ? 'Axis' :
              totalInteractions < 100 ? 'Star' :
              totalInteractions < 200 ? 'Convergence' : 'Return';
  var glyphsHtml = Object.keys(sigilEvolution.glyphs).map(function(g) {
    var gd = sigilEvolution.glyphs[g];
    var pct = Math.round(gd.weight * 100);
    var isUser = userSigil.includes(g);
    return '<div class="profile-glyph-row' + (isUser ? ' user-sigil' : '') + '">' +
           '<span class="pgr-glyph">' + g + '</span>' +
           '<div class="pgr-bar-wrap"><div class="pgr-bar" style="width:' + pct + '%"></div></div>' +
           '<span class="pgr-pct">' + pct + '%</span>' +
           '<span class="pgr-count">' + gd.interactions + '\\u21ba</span></div>';
  }).join('');
  el.innerHTML = `
    <div class="profile-sigil-section">
      <div class="pss-label">Your Sigil</div>
      <div class="pss-glyphs">${userSigil.join('')}</div>
      <div class="pss-stage">\\u25c8 ${stage} Stage</div>
    </div>
    <div class="profile-evolution-section">
      <div class="pes-label">Sigil Resonance</div>
      ${glyphsHtml}
    </div>
    <div class="profile-row"><span>Cycles completed</span><span>${profile.cycles || 0}</span></div>
    <div class="profile-row"><span>Journal entries</span><span>${profile.journal?.length || 0}</span></div>
    <div class="profile-row"><span>Total interactions</span><span>${totalInteractions}</span></div>
    <div class="profile-row"><span>Milestones</span><span>${sigilEvolution.milestones?.length || 0}</span></div>
    <div class="profile-row"><span>Personal tone</span><span>${toneFreq} Hz</span></div>
    <button class="logout-btn" id="btnLogout">\\u2298 Exit Portal</button>
  `;
  var logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) logoutBtn.onclick = function() {
    localStorage.removeItem(STORAGE_KEYS.lastSigil);
    location.reload();
  };
}'''

new_fn = '''function refreshProfile() {
  const el = document.getElementById('profileContent');
  if (!profile) return;
  var totalInteractions = sigilEvolution.totalInteractions || 0;
  var stage = totalInteractions < 10 ? 'Seed' :
              totalInteractions < 25 ? 'Bridge' :
              totalInteractions < 50 ? 'Axis' :
              totalInteractions < 100 ? 'Star' :
              totalInteractions < 200 ? 'Convergence' : 'Return';
  var glyphsHtml = Object.keys(sigilEvolution.glyphs).map(function(g) {
    var gd = sigilEvolution.glyphs[g];
    var pct = Math.round(gd.weight * 100);
    var isUser = userSigil.includes(g);
    return '<div class="profile-glyph-row' + (isUser ? ' user-sigil' : '') + '">' +
           '<span class="pgr-glyph">' + g + '</span>' +
           '<div class="pgr-bar-wrap"><div class="pgr-bar" style="width:' + pct + '%"></div></div>' +
           '<span class="pgr-pct">' + pct + '%</span>' +
           '<span class="pgr-count">' + gd.interactions + '\\u21ba</span></div>';
  }).join('');

  // Phase 1: Breath History section
  var breathHistoryHtml = '';
  if (typeof COHERENCE_BUS !== 'undefined') {
    var history = COHERENCE_BUS.getSessionHistory();
    if (history.length > 0) {
      var recent7 = history.slice(-7);
      var older7 = history.slice(-14, -7);
      var recentAvg = recent7.length > 0 ? recent7.reduce(function(s, e) { return s + e.avgCoh; }, 0) / recent7.length : 0;
      var olderAvg = older7.length > 0 ? older7.reduce(function(s, e) { return s + e.avgCoh; }, 0) / older7.length : 0;
      var trend = recentAvg > olderAvg + 3 ? '\\u2191' : recentAvg < olderAvg - 3 ? '\\u2193' : '\\u2192';
      var historyRows = history.slice().reverse().map(function(e) {
        var d = new Date(e.date + 'T00:00:00');
        var dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return '<div class="bhr-row">' +
          '<span class="bhr-date">' + dayStr + '</span>' +
          '<span class="bhr-sessions">' + e.sessions + 'x</span>' +
          '<span class="bhr-coh">' + e.avgCoh + '%</span>' +
          '<span class="bhr-breaths">' + e.totalBreaths + '\\u2022</span>' +
        '</div>';
      }).join('');
      breathHistoryHtml = '<div class="profile-breath-history">' +
        '<div class="pbh-header">' +
          '<span class="pbh-title">\\u25cf Breath History</span>' +
          '<span class="pbh-trend">' + trend + ' ' + Math.round(recentAvg) + '%</span>' +
        '</div>' +
        '<div class="bhr-list">' + historyRows + '</div>' +
      '</div>';
    }
  }

  el.innerHTML = '<div class="profile-sigil-section">' +
    '<div class="pss-label">Your Sigil</div>' +
    '<div class="pss-glyphs">' + userSigil.join('') + '</div>' +
    '<div class="pss-stage">\\u25c8 ' + stage + ' Stage</div>' +
  '</div>' +
  '<div class="profile-evolution-section">' +
    '<div class="pes-label">Sigil Resonance</div>' +
    glyphsHtml +
  '</div>' +
  breathHistoryHtml +
  '<div class="profile-row"><span>Cycles completed</span><span>' + (profile.cycles || 0) + '</span></div>' +
  '<div class="profile-row"><span>Journal entries</span><span>' + (profile.journal?.length || 0) + '</span></div>' +
  '<div class="profile-row"><span>Total interactions</span><span>' + totalInteractions + '</span></div>' +
  '<div class="profile-row"><span>Milestones</span><span>' + (sigilEvolution.milestones?.length || 0) + '</span></div>' +
  '<div class="profile-row"><span>Personal tone</span><span>' + toneFreq + ' Hz</span></div>' +
  '<button class="logout-btn" id="btnLogout">\\u2298 Exit Portal</button>';
  var logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) logoutBtn.onclick = function() {
    localStorage.removeItem(STORAGE_KEYS.lastSigil);
    location.reload();
  };
}'''

if old_fn in content:
    content = content.replace(old_fn, new_fn)
    print("Replaced refreshProfile function")
else:
    print("WARNING: refreshProfile function not found - checking with regex")
    # Try regex approach
    pattern = r'function refreshProfile\(\) \{.*?\n\}'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        print(f"Found at positions {m.start()}-{m.end()}")
        print("Sample:", repr(m.group()[:100]))
    else:
        print("Could not find with regex either")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
