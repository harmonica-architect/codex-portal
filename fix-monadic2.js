const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

// Fix 6: standing wave interference at high coherence
c = c.replace(
  'onst interferenceAlpha = 0.06 + Math.abs(Math.sin(breathPhase * Math.PI * 2 * freq / 15)) * 0.12;',
  'onst interferenceAlpha = 0.06 + Math.abs(Math.sin(breathPhase * Math.PI * 2 * freq / 15)) * 0.12;\n  const coherenceBoost = (coherenceLevel || 0) / 100;\n  if (coherenceBoost > 0.6) {\n    const waveR = or * 0.85 + Math.sin(breathPhase * Math.PI * 4) * 12 * coherenceBoost;\n    ctx.beginPath();\n    ctx.arc(cx, cy, waveR, 0, Math.PI * 2);\n    ctx.strokeStyle = `rgba(232,200,106,${0.08 * coherenceBoost})`;\n    ctx.lineWidth = 0.5;\n    ctx.stroke();\n  }'
);

// Fix 4: sparkline archetype bands — insert before the closing brace of drawCohSparkline
const sparkIdx = c.indexOf('function drawCohSparkline(samples)');
if (sparkIdx > 0) {
  const strokeIdx = c.indexOf('ctx.stroke();', sparkIdx);
  let endIdx = -1;
  let pos = strokeIdx;
  while (pos < sparkIdx + 2000 && pos < c.length) {
    if (c.charAt(pos) === '\n' && c.charAt(pos + 1) === '}' && c.charAt(pos + 2) === '\n') {
      endIdx = pos;
      break;
    }
    pos++;
  }
  if (endIdx > 0) {
    const band = '\n  // ── Archetype color bands from phaseLog ──\n  if (typeof COHERENCE_BUS !== \'undefined\' && COHERENCE_BUS.phaseLog) {\n    const recent = COHERENCE_BUS.phaseLog.slice(0, 30).reverse();\n    const aW = W / 30;\n    const colorMap = {\n      Seed: \'#e8c86a\', Bridge: \'#b8a0d0\', Axis: \'#c8d0e0\',\n      Star: \'#d0c040\', Convergence: \'#a0c0c0\', Return: \'#c0a0b0\'\n    };\n    recent.forEach((entry, i) => {\n      const arch = entry.archetype || \'Seed\';\n      ctx.fillStyle = colorMap[arch] || \'#e8c86a\';\n      ctx.globalAlpha = 0.4;\n      ctx.fillRect(i * aW, H - 4, aW - 1, 4);\n      ctx.globalAlpha = 1;\n    });\n  }\n  ';
    c = c.slice(0, endIdx) + band + c.slice(endIdx);
  }
}

// Fix 10: ghost harmonic noise
c = c.replace(
  '// Ghost harmonic — subtle breathing presence\n        ctx.fillStyle = night\n          ? `rgba(30,30,56,${0.2 + bh * 0.25})`\n          : `rgba(40,40,64,${0.15 + bh * 0.2})`;\n        ctx.beginPath();\n        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);\n        ctx.fill();',
  '// Ghost harmonic — subtle breathing presence\n        const cohBoost = (coherenceLevel || 0) / 100;\n        ctx.fillStyle = night\n          ? `rgba(30,30,56,${0.2 + bh * 0.25})`\n          : `rgba(40,40,64,${0.15 + bh * 0.2})`;\n        ctx.beginPath();\n        ctx.arc(nx, ny, 3.5 * (1 + bh * 0.2), 0, Math.PI * 2);\n        ctx.fill();\n        // Low-coherence field noise\n        if (cohBoost < 0.3) {\n          const noiseAlpha = (0.3 - cohBoost) * 0.12;\n          ctx.fillStyle = night ? `rgba(80,60,120,${noiseAlpha})` : `rgba(200,160,80,${noiseAlpha})`;\n          ctx.beginPath();\n          ctx.arc(nx + (Math.random() - 0.5) * 8, ny + (Math.random() - 0.5) * 8, 2, 0, Math.PI * 2);\n          ctx.fill();\n        }'
);

fs.writeFileSync('app.js', c);
const lines = c.split('\n');
const checks = [
  'waveR = or * 0.85',
  'colorMap[arch]',
  'noiseAlpha',
  'cohBoost = (coherenceLevel',
];
checks.forEach(n => {
  const ok = lines.some(l => l.includes(n));
  console.log(ok ? 'OK ' + n : 'MISS ' + n);
});
