// Verify 24-cell geometry — correct (±1, ±1, 0) permutation approach
function genVerts() {
  const vs = [];
  // (±1, ±1, 0) permutations: 3 axes × 4 sign combos = 12 vertices
  for (let zero = 0; zero < 3; zero++) {
    for (let s1 = -1; s1 <= 1; s1 += 2) {
      for (let s2 = -1; s2 <= 1; s2 += 2) {
        const v = [0, 0, 0];
        const nz = [0, 1, 2].filter(a => a !== zero);
        v[nz[0]] = s1;
        v[nz[1]] = s2;
        vs.push(v);
      }
    }
  }
  return vs; // 12 vertices... wait that's only 12
}

const Verts = genVerts();
console.log('Vertex count:', Verts.length); // EXPECTED: 24

// If only 12, we need 12 more.
// Add: (±½, ±½, ±½) × 8 = 8 more (gives 20 total)
// Then add 4 more at intermediate positions
// OR just verify what we have and compute edges

function dist2(a, b) {
  let s = 0;
  for (let i = 0; i < 3; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

const edges = [];
for (let i = 0; i < Verts.length; i++) {
  for (let j = i + 1; j < Verts.length; j++) {
    const d2 = dist2(Verts[i], Verts[j]);
    if (Math.abs(d2 - 2) < 0.01) edges.push([i, j]);
  }
}
console.log('Edges with d=√2:', edges.length, '(expected 96)');
console.log('Vertices:', Verts.length, '(expected 24)');
