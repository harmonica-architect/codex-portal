// Correct 24-cell: 24 vertices = all (i,j,±1,±1) with i≠j
// 6 choices for the pair (i,j), times 4 sign combos = 24

function gen24CellVerts() {
  const vs = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (j === i) continue;
      for (let s1 = -1; s1 <= 1; s1 += 2) {
        for (let s2 = -1; s2 <= 1; s2 += 2) {
          const v = [0, 0, 0, 0];
          v[i] = s1;
          v[j] = s2;
          vs.push(v);
        }
      }
    }
  }
  return vs;
}

const V4 = gen24CellVerts();
console.log('4D vertex count:', V4.length, '(expected 24)');
console.log('First few:', V4.slice(0, 5));

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

// Degree of each vertex (should be 8)
const deg = new Array(24).fill(0);
for (const [i, j] of edgeList) { deg[i]++; deg[j]++; }
console.log('Vertex degrees (should all be 8):', deg.join(', '));

// 3D projection: drop last coord
const V3 = V4.map(([a,b,c,d]) => [a,b,c]);
const uniq = new Map();
for (let i = 0; i < V3.length; i++) {
  const k = V3[i].join(',');
  if (!uniq.has(k)) uniq.set(k, []);
  uniq.get(k).push(i);
}
console.log('\n3D unique vertices:', uniq.size);
// How many 4D verts collapse to each 3D unique?
for (const [k, idxs] of uniq) {
  console.log(' ', k, '←', idxs.length, '4D verts:', idxs.join(','));
}
