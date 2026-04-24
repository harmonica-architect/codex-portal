// Correct 24-cell: 4D vertices as (±1, ±1, 0, 0) permutations
// Edges at distance √2 in 4D
// For visualization: project to 3D, then project to 2D circle

// Generate the 24 vertices: all (i,j,±1,±1) where i≠j
// This gives 12*4 = 48... but 24-cell has 24 vertices.
// CORRECT: all permutations of (±1, ±1, 0, 0) with exactly 2 non-zero
// = C(4,2)*2^2 = 6*4 = 24 ✓
function genVerts() {
  const vs = [];
  const coords = [0,1,2,3];
  for (const pair of [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]) {
    const [i, j] = pair;
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        const v = [0, 0, 0, 0];
        v[i] = s1; v[j] = s2;
        vs.push(v);
      }
    }
  }
  return vs;
}

const V4 = genVerts();
console.log('4D vertex count:', V4.length, '(expected 24)');

const edgeSet = new Set();
for (let i = 0; i < V4.length; i++) {
  for (let j = i+1; j < V4.length; j++) {
    let d2 = 0;
    for (let k = 0; k < 4; k++) d2 += (V4[i][k]-V4[j][k])**2;
    if (Math.abs(d2 - 2) < 0.01) {
      edgeSet.add([i,j]); edgeSet.add([j,i]);
    }
  }
}
const deg = new Array(24).fill(0);
for (const [i,j] of edgeSet) deg[i]++;
console.log('Edge count:', edgeSet.size/2, '(expected 96)');
console.log('Vertex degrees:', deg.join(','));

// 3D projection via stereographic projection from 4D to 3D
// S: (x,y,z,w) → (X/(1-w), Y/(1-w), Z/(1-w)) for w < 1
// For w = 1 (the "south pole"), we project differently
// Actually, stereographic from the north pole (1,0,0,0):
// S: (x,y,z,w) → (x/(1-w), y/(1-w), z/(1-w))
function stereo4to3(v) {
  const [x,y,z,w] = v;
  const denom = 1 - w;
  if (Math.abs(denom) < 0.001) return [x*1e10, y*1e10, z*1e10]; // w≈1: go to infinity
  return [x/denom, y/denom, z/denom];
}

// Also try orthographic (average with opposite)
function ortho4to3(v) {
  const [x,y,z,w] = v;
  return [(x+w)/2, (y)/2, (z)/2];
}

const V3s = V4.map(stereo4to3);
const uniq = new Map();
for (let i = 0; i < V3s.length; i++) {
  const k = V3s[i].map(v => +v.toFixed(4)).join(',');
  if (!uniq.has(k)) uniq.set(k, []);
  uniq.get(k).push(i);
}
console.log('\nStereographic 3D unique:', uniq.size);
for (const [k, idxs] of uniq) {
  const p = k.split(',').map(Number);
  const r = Math.sqrt(p[0]**2+p[1]**2+p[2]**2);
  console.log(' ', k, '→ r='+r.toFixed(3), 'count='+idxs.length, 'idxs='+idxs.join(','));
}

// Project to 2D circle (azimuthal equidistant)
const V2s = V3s.map(([x,y,z]) => {
  const r2 = Math.sqrt(x*x+y*y+z*z) || 1;
  const theta = Math.atan2(y, x);
  return [Math.cos(theta), Math.sin(theta)];
});

// Check uniqueness
const uniq2 = new Map();
for (let i = 0; i < V2s.length; i++) {
  const k = V2s[i].map(v => +v.toFixed(4)).join(',');
  if (!uniq2.has(k)) uniq2.set(k, []);
  uniq2.get(k).push(i);
}
console.log('\n2D circle projection unique:', uniq2.size);
for (const [k, idxs] of uniq2) {
  console.log(' ', k, '→ count='+idxs.length, 'idxs='+idxs.join(','));
}
