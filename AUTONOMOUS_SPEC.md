// ═══════════════════════════════════════════════════════════
// AUTONOMOUS AGENT SPEC — Codex Portal Night Cycle
// Branch: develop | Target: master (merge after review)
// ═══════════════════════════════════════════════════════════

// MISSION: Improve the Codex Portal while c sleeps.
// Work on 'develop' branch. Commit as you go.
// Check tests after each session. Keep tests passing.
// Be systematic. Document every commit message with emoji prefix.

// ── CURRENT SYSTEM STATE ──
// Live site: https://harmonica-architect.github.io/codex-portal/
// master: fully tested, all 34/34 GUI, 28/28 animation passing
// develop: just merged from master — same state as master right now
// All 8 sigil nav tabs wired, breath controller adaptive, glyph intelligence active

// ── WORK SEQUENCE (execute in order) ──

// ═══ PHASE 1: RESONANCE TREND LOG (Profile tab) ═══
// Commit prefix: "📊"
// Add to Profile tab: a "Breath History" section showing coherence over time.
// - Use localStorage key 'codex_coh_history' to persist a rolling 30-day record
// - Structure: { date: 'YYYY-MM-DD', sessions: N, avgCoh: N, peaks: N, totalBreaths: N }
// - After each session (beforeunload or logout), save current session's coherence stats
// - Display as a simple list in Profile tab: date, avg coherence, breath count
// - Also show trend arrow: ↑ improving / → stable / ↓ declining vs previous week average
// - Keep it minimal and elegant. No canvas needed — just HTML list rows.
// - Wire via COHERENCE_BUS or breathCtrl lifecycle events
// - Test: run `node gui-test.js` — ensure Profile tab still works

// ═══ PHASE 2: CYCLE REPORT — End-of-Session Summary ═══
// Commit prefix: "📋"
// When user logs out or closes portal (beforeunload), generate a session summary.
// - Show: total breaths, avg coherence, dominant archetype, session duration, journal entries
// - Store in localStorage as 'codex_last_session' so it can be shown on next login
// - On next portal open (after login), briefly display the previous session's summary
//   as a subtle toast/card overlay for 4 seconds then fade
// - Keep it non-intrusive — small bottom-left card, not blocking
// - Test: logout/login flow should show summary toast

// ═══ PHASE 3: BREATH PHASE HISTORY INDICATOR ═══
// Commit prefix "⏱"
// Show a subtle "breath rhythm" indicator next to the coherence bar.
// - Small dot-row (8 dots in a ring) showing which phases the user has hit most this session
// - Dots fill in as phases are completed — all 8 fill after one full cycle
// - After several cycles, the dots take on a "heavier" visual weight on phases where
//   the user consistently has higher coherence
// - This is different from the breathProfile panel — this is session-tactical, not learning
// - Wire via breathCtrl.onPhaseChange() in app.js
// - Keep it visually minimal: 8 tiny dots, 6px each, around the coherence ring
// - Test: `node gui-test.js` — coherence bar should still be visible

// ═══ PHASE 4: IMPROVE ADAPTIVE BREATH VISUAL FEEDBACK ═══
// Commit prefix "🌬"
// The breathProfile panel currently only shows after 2+ sessions.
// Make it more immediately useful:
// - After each cycle complete, update the phase bars in real time (already wired)
// - Add a subtle "adapted" animation: when durations shift, the coherence bar
//   briefly glows with a soft pulse to indicate the adaptation happened
// - After 5+ sessions: show the preferred phase ratio (inhale duration / exhale duration)
//   as a small "∿ 1.4" style indicator in the panel
// - Add a "breath quality" score to the panel: session coherence average / global average
//   displayed as a ratio like "1.12×" — above 1 means the session was above average
// - Test: `node gui-test.js` + `node animation-test.js`

// ═══ PHASE 5: ENHANCE SIGIL EVOLUTION DISPLAY ═══
// Commit prefix "✦"
// Improve the sigil evolution section in Profile tab:
// - Show a small evolution timeline: "Seed → Bridge → Axis → Star → Convergence → Return"
//   with the current stage highlighted
// - When milestones are hit, show a brief celebratory indicator (non-blocking)
// - Show "next milestone" hint: e.g. "3 more interactions to unlock ● Bridge"
// - This is pure UI/HTML — no new JS logic needed, just better renderProfile() output
// - Test: Profile tab renders without errors

// ═══ PHASE 6: COMMUNITY FIELD POLISH ═══
// Commit prefix: "🜂"
// The community resonance feature is present but should be made more discoverable:
// - In Profile tab, add a small "Coherence Resonance" section showing:
#   "Your field contributes to the collective harmonic matrix."
#   "[View Collective Field]" button that opens the community resonance panel
// - Add to sigil-nav: when hovering over the Codex dot, briefly show
#   "X resonance connections active" if the field has data
// - The actual community-field.js already exists — just wire the UI better
// - Test: `node gui-test.js` — Profile tab, sigil nav still work

// ═══ PHASE 7: ICON/FAVICON + TITLE POLISH ═══
// Commit prefix: "🎨"
// - Add a simple favicon: a 24-gon or 8-phase breath symbol (inline SVG in HTML head)
// - Update page <title> to "🜂 Codex Portal" (already done? check index.html)
// - Ensure mobile touch icons are set (apple-touch-icon etc.)
// - No functional change — just polish
// - Test: page loads correctly, title shows in browser tab

// ═══ PHASE 8: FINAL TEST + SUMMARY COMMIT ═══
// Commit prefix: "✅"
// - Run: node gui-test.js (all must pass)
// - Run: node animation-test.js (all must pass)
// - Write a commit message summarizing all changes made
// - Push develop branch

// ── RULES ──
// ⚠️ Keep tests passing. After every phase, run `node gui-test.js`
//   and fix any failures before moving to the next phase.
// ⚠️ If you encounter an issue you can't quickly resolve, document it
//   in a commit message and move to the next phase. Don't get stuck.
// ⚠️ Commit after each phase so there's a clear rollback point.
// ⚠️ Use commit prefixes: 📊 📋 ⏱ 🌬 ✦ 🜂 🎨 ✅
// ⚠️ Work on 'develop' branch only. Do NOT push to master.
// ⚠️ If localStorage is used, ensure keys are documented above.
// ⚠️ Do not modify animation-test.js or gui-test.js unless tests fail
//   due to genuine app behavior changes (not test errors).
// ⚠️ Do not touch community-resonance.js token handling — it's already secure.
// ⚠️ If the site goes offline or GitHub Pages deploy fails, that's a known
//   issue — document and continue. Do not re-attempt deploy in this session.

// ── SUCCESS CRITERIA ──
// After all phases: 34/34 GUI + 28/28 animation tests pass on develop
// develop branch pushed to origin
// c can review in the morning and merge to master when satisfied