git add -A
git commit -m "feat: integrate sigil nav into breath ring on home dashboard

Breath ring replaces the 3-ring mini-wheel on the home tab:
- .breath-ring-wrap with 8 .br-dot glyphs on an orbit
- Phase index drives active dot highlight (phase 0-7 → dot 0-7)
- Hub shows current phase glyph
- Click any dot → navigate via navigateToSigil()
- Ring scales with breath inhale/exhale via CSS animation
- Sigil nav in portal header remains for non-home pages"
git push