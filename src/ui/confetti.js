// Pixel confetti: square particles drawn on a full-screen canvas, snapped to a pixel grid.

const PIXEL = 8;
const DURATION_MS = 3000;

function paletteColors() {
  const styles = getComputedStyle(document.documentElement);
  return ['--px-yellow', '--px-pink', '--px-cyan', '--px-orange', '--px-red', '--px-white'].map((name) =>
    styles.getPropertyValue(name).trim(),
  );
}

export function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);
  const colors = paletteColors();

  const particles = Array.from({ length: 140 }, () => ({
    x: width / 2 + (Math.random() - 0.5) * width * 0.3,
    y: height * 0.45,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 16 - 6,
    size: PIXEL * (Math.random() < 0.3 ? 2 : 1),
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const startedAt = performance.now();
  function frame(now) {
    const elapsed = now - startedAt;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x / PIXEL) * PIXEL, Math.round(p.y / PIXEL) * PIXEL, p.size, p.size);
    }
    if (elapsed < DURATION_MS) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
