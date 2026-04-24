// Verify 24-cell geometry
function genVerts() {
  const vs = [];
  for (let axis = 0; axis < 3; axis++) {
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sy = -1; sy <= 1; sy += 2) {
        const v = [0, 0, 0];
        const nonZeroAxes = [0, 1, 2].filter(a => a !== axis);
        v[nonZeroAxes[0]] = sx;
        v[nonZeroAxes[1]] = sy;
        vs.push(v);
      }
    }
  }
  return vs;
}
const Verts = genVerts();

const edgeSet = new Set();
for (let i = 0; i < Verts.length; i++) {
  for (let j = i + 1; j < Verts.length; j++) {
    const dx = Verts[i][0] - Verts[j][0];
    const dy = Verts[i][1] - Verts[j][1];
    const dz = Verts[i][2] - Verts[j][2];
    const d2 = dx*dx + dy*dy + dz*dz;
    if (Math.abs(d2 - 2) < 0.001) edgeSet.add([i, j]);
  }
}

const allDists = [];
for (let i = 0; i < Verts.length; i++) {
  for (let j = i+1; j < Verts.length; j++) {
    const dx = Verts[i][0]-Verts[j][0];
    const dy = Verts[i][1]-Verts[j][1];
    const dz = Verts[i][2]-Verts[j][2];
    allDists.push(+Math.sqrt(dx*dx+dy*dy+dz*dz).toFixed(4));
  }
}
const uniqueDists = [...new Set(allDists)].sort((a,b)=>a-b);
console.log('Unique distances:', uniqueDists.slice(0,8));
console.log('Vertex count:', Verts.length, '(expected 24)');
console.log('Edge count:', edgeSet.size, '(expected 96)');
