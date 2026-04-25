// 120-cell (hecatonicosachoron) projection for Codex Portal Wheel tab
// The 120-cell has 600 vertices in 4D, 120 dodecahedral cells.
// We project a representative subset (~120 pts) that captures the dodecahedral structure
// using golden-ratio (φ) spiral distributions on spherical shells.
//
// Approach:
//   120 vertices are arranged in 12 rings of 10 points each (pentagonal symmetry).
//   Each ring sits on a latitude band of a 3-sphere projected to 3D.
//   Rotation is slower than 24-cell to reflect deeper 4D recursion depth.
//   breathPhase drives a slow 4D precession rotation.

const 壱百弐拾 = (() => {
  const PHI = (1 + Math.sqrt(5)) / 2;       // Golden ratio ≈ 1.618
  const PHI_INV = 1 / PHI;                    // ≈ 0.618
  const PHI_SQ  = PHI * PHI;                  // ≈ 2.618

  // ── Generate 12 rings × 10 points = 120 projected vertices ──
  // Ring latitudes (in radians) derived from icosahedral symmetry
  const RING_LATS = [
    0,
    Math.acos(PHI_INV),
    Math.acos(PHI_INV),
    Math.PI / 2,
    Math.PI / 2,
    Math.acos(-PHI_INV),
    Math.acos(-PHI_INV),
    Math.PI - Math.acos(PHI_INV),
    Math.PI - Math.acos(PHI_INV),
    Math.PI
  ];
  // One ring at each pole, four pairs symmetric about equator

  function genRing(longitudeBase, lat, radius, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const theta = longitudeBase + (i / count) * Math.PI * 2;
      const x = radius * Math.cos(lat) * Math.cos(theta);
      const y = radius * Math.cos(lat) * Math.sin(theta);
      const z = radius * Math.sin(lat);
      pts.push([x, y, z]);
    }
    return pts;
  }

  // ── 120 vertices arranged in 12 rings of 10 ──
  function gen120Verts() {
    const verts = [];
    const R = 1.0; // base radius
    const r1 = R * PHI_INV;
    const r2 = R * PHI;

    // 12 rings
    const ringRadii  = [R,   r1,  r1,  r2,  r2,  r1,  r1,  r2,  r2,   R];
    const ringLats   = [
      0,
      Math.acos(PHI_INV),
      -Math.acos(PHI_INV),
      Math.PI / 2,
      -Math.PI / 2,
      Math.acos(PHI_INV),
      -Math.acos(PHI_INV),
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI
    ];
    // Longitude offsets per ring — pentagonal offset
    const PHI_OFFSET = Math.PI * 2 / 5; // 72°

    for (let ring = 0; ring < 12; ring++) {
      const r = ringRadii[ring % ringRadii.length];
      const lat = ringLats[ring];
      const baseLon = (ring % 2 === 0) ? 0 : PHI_OFFSET * 0.5;
      // Radius scales with cos(lat) so points sit on sphere
      const rSphere = r * Math.cos(lat + 1e-6); // avoid /0
      const pts = genRing(baseLon, lat, rSphere || 0.001, 10);
      verts.push(...pts);
    }
    return verts; // 120 vertices
  }

  const V3 = gen120Verts(); // 120 × [x,y,z] on approximate sphere

  // ── 4D → 3D stereographic (same projection axis as 24-cell) ──
  function stereo4to3(v4) {
    const [x, y, z, w] = v4;
    const d = 1 - w;
    if (Math.abs(d) < 0.001) return [x * 1e4, y * 1e4, z * 1e4];
    return [x / d, y / d, z / d];
  }

  // ── Lift 3D sphere point to 4D for slow 4D rotation ──
  function liftTo4D(v3, radius = 1.0) {
    const r = Math.sqrt(v3[0] ** 2 + v3[1] ** 2 + v3[2] ** 2) || 0.001;
    const w = radius * Math.cos(r / radius * Math.PI); // 4D coordinate from radial angle
    return [v3[0], v3[1], v3[2], w];
  }

  // ── 3D rotations ──
  function rotX([x, y, z], a) {
    return [x, Math.cos(a) * y - Math.sin(a) * z, Math.sin(a) * y + Math.cos(a) * z];
  }
  function rotY([x, y, z], a) {
    return [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
  }
  function rotZ([x, y, z], a) {
    return [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y, z];
  }

  // 4D rotation in XW plane (depth recursion rotation — much slower)
  function rotXW([x, y, z, w], a) {
    return [Math.cos(a) * x - Math.sin(a) * w, y, z, Math.sin(a) * x + Math.cos(a) * w];
  }

  // ── 3D → 2D perspective projection ──
  function proj3to2([x, y, z], camZ = 4.5) {
    const scale = camZ / (camZ - z);
    return [x * scale, y * scale];
  }

  return {
    // Project 120-cell vertex arrangement as 2D points + depth
    // Returns array of { x, y, depth, ring }
    project120Cell(breathPhase) {
      // Slow 4D rotation: ~1/5 speed of 24-cell's 3D rotation
      // This creates the "depth of recursion" effect
      const a4 = breathPhase * 0.003; // very slow precession
      const rx = breathPhase * 0.008;
      const ry = breathPhase * 0.012;
      const rz = breathPhase * 0.005;

      const pts2D = [];
      for (let i = 0; i < V3.length; i++) {
        const v3 = V3[i];
        // Lift to 4D
        const v4 = liftTo4D(v3);
        // Apply 4D rotation (depth precession)
        const v4r = rotXW(v4, a4);
        // Project to 3D
        const v3p = stereo4to3(v4r);
        // Apply 3D rotations
        const r = rotZ(rotY(rotX(v3p, rx), ry), rz);
        // Project to 2D
        const p2 = proj3to2(r);
        pts2D.push({
          x: p2[0],
          y: p2[1],
          depth: r[2], // Z after rotation for depth shading
          ring: Math.floor(i / 10) // 0-11 ring index
        });
      }
      return pts2D;
    },

    // Draw 120 gold dots on the canvas
    // ctx, cx, cy, scale: canvas context and geometry
    // breathPhase: drives slow rotation
    // activeWheelPos: unused for 120-cell (no per-vertex wheel mapping)
    draw(ctx, cx, cy, scale, breathPhase = 0) {
      const pts = this.project120Cell(breathPhase);
      const depths = pts.map(p => p.depth);
      const zMin = Math.min(...depths);
      const zMax = Math.max(...depths);
      const zRange = (zMax - zMin) || 1;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const zFrac = (p.depth - zMin) / zRange;

        const px = cx + p.x * scale;
        const py = cy - p.y * scale;

        // 120-cell dots: smaller (2-3px), gold tint
        const r = 1.2 + 1.0 * zFrac;
        const alpha = 0.25 + zFrac * 0.5;

        // Gold color — shifts toward white-gold at front, copper-gold at back
        const g = Math.round(190 + 60 * zFrac);
        const red = Math.round(180 + 40 * zFrac);
        const blue = Math.round(50 + zFrac * 40);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${red},${g},${blue},${alpha})`;
        ctx.fill();
      }
    }
  };
})();
