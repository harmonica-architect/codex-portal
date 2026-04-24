// 24-cell geometry verification
// 24-cell vertices in 4D: all permutations of (±1, ±1, 0, 0)
// Edges connect vertices at Euclidean distance √2 in 4D.

// Generate 24 vertices: all (x,y,z,w) where exactly one coord is 0, others are ±1
function gen24CellVerts4D() {
  const vs = [];
  for (let zero = 0; zero < 4; zero++) {
    for (let s1 = -1; s1 <= 1; s1 += 2) {
      for (let s2 = -1; s2 <= 1; s2 += 2) {
        const v = [0, 0, 0, 0];
        const nz = [0, 1, 2, 3].filter(a => a !== zero);
        v[nz[0]] = s1;
        v[nz[1]] = s2;
        vs.push(v);
      }
    }
  }
  return vs;
}

const V4 = gen24CellVerts4D();
console.log('4D vertex count:', V4.length, '(expected 24)');

// Compute 4D edge lengths
const edgeSet = new Set();
const edgeList = [];
for (let i = 0; i < V4.length; i++) {
  for (let j = i + 1; j < V4.length; j++) {
    let d2 = 0;
    for (let k = 0; k < 4; k++) d2 += (V4[i][k] - V4[j][k]) ** 2;
    if (Math.abs(d2 - 2) < 0.01) {
      edgeSet.add(`${i}-${j}`);
      edgeList.push([i, j]);
    }
  }
}
console.log('4D edges at d=√2:', edgeList.length, '(expected 96)');

// ── 3D projection ──
// Orthographic projection: drop W coordinate
// But the resulting 3D vertices won't all be unique!
const V3 = V4.map(([x,y,z,w]) => [x,y,z]);
// Count unique
const uniq = new Map();
for (let i = 0; i < V3.length; i++) {
  const key = V3[i].map(v => v.toFixed(3)).join(',');
  if (!uniq.has(key)) uniq.set(key, { count: 0, idx4D: [] });
  uniq.get(key).count++;
  uniq.get(key).idx4D.push(i);
}
console.log('\n3D projection:');
console.log('Unique 3D vertices:', uniq.size);
for (const [key, val] of uniq) {
  console.log(' ', key, ': count='+val.count, '  4D idxs='+val.idx4D.join(','));
}
