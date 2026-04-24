git add -A
git commit -m "feat: 24-cell wireframe geometry in Wheel tab

twentyfour-cell.js:
- Correct 24-cell: 24 vertices, 96 edges (verified: 4D→3D stereographic projection)
- 4D vertices: all (i,j,±1,±1) where i≠j (6 pairs × 4 sign combos = 24)
- Edges: 4D Euclidean distance √2 check (verified 96 edges, all vertices degree 8)
- 4D→3D stereographic from north pole, then perspective projection to 2D canvas
- Active vertex highlights when breath phase's wheelPos matches that segment
- Breath-driven harmonic wobble on X rotation, continuous Y/Z rotation

app.js:
- Added wheel24Rot state var for continuous 24-cell rotation
- animateWheel: advances wheel24Rot each frame
- drawWheel: calls 二十四.draw() as background layer before 2D glyphs
- breath phase wheelPos passed as activeWheelPos to highlight corresponding vertex"
git push