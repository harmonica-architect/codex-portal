// ══════════════════════════════════════════════
// PRIME AXIS TRACKER — 24-cell spiral through prime vertices
// Shows the spiral path through the 8 prime positions (mod 24)
// as the user breathes through the 24-cell
// ══════════════════════════════════════════════

const PRIME_POSITIONS = [2, 3, 5, 7, 11, 13, 17, 19]; // primes mod 24
const PRIME_NAMES    = ['2', '3', '5', '7', '11', '13', '17', '19'];

// Breath position maps to a 24-cell vertex (0–23)
function getCurrentBreathPos(breathCount) {
  return breathCount % 24;
}

function isPrimePosition(pos) {
  return PRIME_POSITIONS.includes(pos);
}

function getPrimeIndex(pos) {
  return PRIME_POSITIONS.indexOf(pos);
}

// Draw the prime axis tracker spiral visualization
function drawPrimeAxisTracker(ctx, x, y, size, currentPos, coherenceLevel) {
  ctx.clearRect(x - size, y - size, size * 2, size * 2);

  const centerX = x;
  const centerY = y;
  const ringR  = size * 0.72;

  // ── 24 nodes in ring ──
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const nx = centerX + Math.cos(angle) * ringR;
    const ny = centerY + Math.sin(angle) * ringR;

    const isPrime  = isPrimePosition(i);
    const isCurrent = i === currentPos;

    if (isPrime) {
      // Gold glow for prime positions
      const glow = isCurrent ? (coherenceLevel / 100) * 0.75 + 0.25 : 0.35;
      const r    = isCurrent ? 5 : 3;
      ctx.fillStyle = `rgba(232, 200, 106, ${glow})`;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (isCurrent) {
      // White for current non-prime
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dim for non-prime
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(nx, ny, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Spiral line connecting prime positions in order ──
  ctx.strokeStyle = 'rgba(232, 200, 106, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  PRIME_POSITIONS.forEach((pos, i) => {
    const angle = (pos / 24) * Math.PI * 2 - Math.PI / 2;
    const px = centerX + Math.cos(angle) * ringR;
    const py = centerY + Math.sin(angle) * ringR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // ── Label: current prime phase ──
  if (isPrimePosition(currentPos)) {
    const pi = getPrimeIndex(currentPos);
    ctx.fillStyle = 'rgba(232, 200, 106, 0.92)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P' + (pi + 1) + '/8', centerX, centerY + size + 8);
  }
}
