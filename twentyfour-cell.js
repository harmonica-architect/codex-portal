// 24-cell (icositetrachoron) for Codex Portal Wheel tab
// 4D vertices: all (i,j,±1,±1) where i≠j  →  24 vertices, 96 edges at √2
// Stereographic projection from 4D → 3D → 2D canvas
// The breath phase's wheelPos (0–23) maps to 4D vertex index

const_24cell = (() => {
  // ── Generate 24-cell 4D vertices ──
  function genVerts() {
    const vs = [];
    const pairs = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
    for (const [i, j] of pairs) {
      for (const s1 of [-1, 1]) {
        for (const s2 of [-1, 1]) {
          const v = [0, 0, 0, 0];
          v[i] = s1; v[j] = s2;
          vs.push(v);
        }
      }
    }
    return vs; // 24 vertices
  }
  const V4 = genVerts();

  // ── Build 96 edges (4D distance = √2) ──
  const Edges = [];
  for (let i = 0; i < V4.length; i++) {
    for (let j = i + 1; j < V4.length; j++) {
      let d2 = 0;
      for (let k = 0; k < 4; k++) d2 += (V4[i][k] - V4[j][k]) ** 2;
      if (Math.abs(d2 - 2) < 0.01) Edges.push([i, j]);
    }
  }

  // ── 4D → 3D stereographic projection ──
  // Project from the north pole (1,0,0,0) onto the w=0 hyperplane
  // S(x,y,z,w) = (x/(1-w), y/(1-w), z/(1-w))
  function stereo4to3(v) {
    const [x, y, z, w] = v;
    const d = 1 - w;
    if (Math.abs(d) < 0.001) return [x * 1e6, y * 1e6, z * 1e6];
    return [x / d, y / d, z / d];
  }

  const V3 = V4.map(stereo4to3);

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

  // ── 3D → 2D perspective projection onto canvas ──
  // Camera at (0, 0, camZ), looking toward origin
  function proj3to2([x, y, z], camZ = 4.5) {
    const scale = camZ / (camZ - z);
    return [x * scale, y * scale];
  }

  // ── Wheel position (0–23) → 4D vertex index ──
  // wheelPos maps to the 24 vertices in order
  function wheelPosToVert(pos) {
    return pos % 24;
  }

  return {
    V4, V3, Edges,

    // Draw the 24-cell wireframe on a 2D canvas
    // ctx: canvas 2D context
    // cx, cy: canvas center
    // scale: pixels per 3D unit
    // rx, ry, rz: 3D rotation angles
    // breathPhase: drives subtle harmonic wobble
    // activeWheelPos: current breath phase wheelPos (0–23), -1 = none
    draw(ctx, cx, cy, scale, rx, ry, rz, breathPhase = 0, activeWheelPos = -1) {
      // Breath-phase harmonic wobble on X rotation
      rx += Math.sin(breathPhase * 0.017) * 0.12;

      // Transform 4D → 3D (stereo) → rotate → project 3D → 2D
      const activeVert = (activeWheelPos >= 0) ? wheelPosToVert(activeWheelPos) : -1;

      const pts2D = V4.map(v => {
        const v3 = stereo4to3(v);
        const r = rotZ(rotY(rotX(v3, rx), ry), rz);
        return proj3to2(r);
      });

      // Per-vertex depth for shading (Z after 3D rotation)
      const depths3D = V4.map(v => {
        const r = rotZ(rotY(rotX(stereo4to3(v), rx), ry), rz);
        return r[2];
      });
      const zMin = Math.min(...depths3D);
      const zMax = Math.max(...depths3D);
      const zRange = (zMax - zMin) || 1;

      // ── Draw edges ──
      for (const [i, j] of Edges) {
        const zAvg = (depths3D[i] + depths3D[j]) / 2;
        const zFrac = (zAvg - zMin) / zRange;
        const alpha = 0.12 + zFrac * 0.5;
        const isActive = (i === activeVert || j === activeVert);

        const x1 = cx + pts2D[i][0] * scale;
        const y1 = cy - pts2D[i][1] * scale;
        const x2 = cx + pts2D[j][0] * scale;
        const y2 = cy - pts2D[j][1] * scale;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isActive
          ? `rgba(232,200,106,${0.7 + zFrac * 0.3})`
          : `rgba(130,110,180,${alpha})`;
        ctx.lineWidth = isActive ? 2.4 : 0.85;
        ctx.stroke();
      }

      // ── Draw vertices ──
      for (let i = 0; i < pts2D.length; i++) {
        const zFrac = (depths3D[i] - zMin) / zRange;
        const px = cx + pts2D[i][0] * scale;
        const py = cy - pts2D[i][1] * scale;
        const isActive = i === activeVert;
        const r = isActive ? 6 : Math.max(1.8, 2.5 * zFrac + 1.2);

        if (isActive) {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
          grd.addColorStop(0, 'rgba(232,200,106,0.9)');
          grd.addColorStop(0.4, 'rgba(200,160,70,0.3)');
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, r * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive
          ? 'rgba(232,200,106,1)'
          : `rgba(160,140,200,${0.2 + zFrac * 0.6})`;
        ctx.fill();
      }
    }
  };
})();

// Expose draw method for use by other modules (e.g. Mirror mode)
window.draw24CellProjection = function(ctx, cx, cy, scale, rx, ry, rz, breathPhase, activeWheelPos) {
 _24cell.draw(ctx, cx, cy, scale, rx, ry, rz, breathPhase, activeWheelPos);
};

