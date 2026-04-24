// 24-cell geometry verification
// 24-cell: 24 vertices = all permutations of (±1, ±1, 0, 0) with 2 non-zero coords
// Edges at Euclidean distance √2 in 4D

function genVerts4D() {
  const vs = [];
  // All 4 choices of which coordinate is 0
  for (let zero = 0; zero < 4; zero++) {
    // All 3 other coordinates: choose 2 to be non-zero, then assign signs
    const nz = [0,1,2,3].filter(i => i !== zero);
    // For the 2 non-zero coords, all sign combos
    for (let s0 = -1; s0 <= 1; s0 += 2) {
      for (let s1 = -1; s1 <= 1; s1 += 2) {
        const v = [0, 0, 0, 0];
        v[nz[0]] = s0;
        v[nz[1]] = s1;
        vs.push(v);
      }
    }
  }
  return vs;
}

const V4 = genVerts4D();
console.log('4D vertex count:', V4.length, '(expected 24)');

// Edges at distance √2
const edgeList = [];
for (let i = 0; i < V4.length; i++) {
  for (let j = i + 1; j < V4.length; j++) {
    let d2 = 0;
    for (let k = 0; k < 4; k++) d2 += (V4[i][k] - V4[j][k]) ** 2;
    if (Math.abs(d2 - 2) < 0.01) edgeList.push([i, j]);
  }
}
console.log('4D edge count:', edgeList.length, '(expected 96)');
console.log('Degree of each vertex (should all be 8):');
const deg = new Array(24).fill(0);
for (const [i, j] of edgeList) { deg[i]++; deg[j]++; }
console.log(deg.join(', '));

// Project to 3D by dropping last coordinate
const V3 = V4.map(([a,b,c,d]) => [a, b, c]);
// Count unique
const uniq = new Map();
for (let i = 0; i < V3.length; i++) {
  const k = V3[i].join(',');
  if (!uniq.has(k)) uniq.set(k, []);
  uniq.get(k).push(i);
}
console.log('\n3D unique vertices:', uniq.size, '(expected 12 for cuboctahedron)');
for (const [k, idxs] of uniq) {
  console.log(' ', k, '← 4D idxs:', idxs.join(','));
}
