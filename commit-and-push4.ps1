git add -A
git commit -m "feat: coherence-driven CSS vars + proportional sigil nav pulse
- COHERENCE_BUS.updateCoherence() now drives CSS custom properties:
  --coh, --coh-glow-spread, --coh-glow-opacity, --coh-pulse-speed, --coh-ring-bonus
- @keyframes cohPulseHub: glow spread/opacity/speed driven by --coh vars
- .sn-orbit-outer: ring glow scales with --coh (up to 40px spread at 100%)
- .sn-hub.coh-pulse: pulse speed goes from 3s (0%) to 1s (100%)
- :root defaults set at the CSS level"
git push