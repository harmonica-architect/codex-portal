git add -A
git commit -m "feat: sigil nav hides on home tab, breath ring integrated in dashboard

- Home tab: breath ring (8-dot .br-dot) replaces sigil nav header ring
- Other tabs (Wheel, Codex, Dream, Journal, Profile): sigil nav header visible
- Tab switch toggles sigilNavWrap display based on target tab
- Breath ring: phase index drives active dot, hub shows phase glyph, click navigates
- Breath ring scales with inhale/exhale CSS animation
- Sigil nav header hidden on home init (restored from pendingTab localStorage)"
git push