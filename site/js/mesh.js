// Hero background: the Andes drawn as a network mesh, with packets travelling the ridges.
// Same motif and seed as the LinkedIn banner, so the two feel like one piece of work.

const SEED = 2026;
const LINE = '214,220,228';
const AMBER = '251,191,36';
const FILL = '#0a0b0d';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLayers(width, height, rng) {
  const narrow = width < 700;
  const step = narrow ? 44 : 56;
  const specs = [
    { base: 0.74, amp: 0.08, alpha: 0.2, rows: 3 },
    { base: 0.83, amp: 0.07, alpha: 0.34, rows: 3 },
    { base: 0.92, amp: 0.055, alpha: 0.55, rows: 3 }
  ];

  return specs.map((spec) => {
    const phases = [rng() * 6.28, rng() * 6.28, rng() * 6.28];
    const cols = Math.ceil(width / step) + 2;
    const rows = [];
    for (let r = 0; r < spec.rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const x = (c - 0.5) * step + (rng() - 0.5) * step * 0.5;
        const u = x / Math.max(width, 900);
        const ridge =
          Math.sin(u * 5.1 + phases[0]) * 0.55 +
          Math.sin(u * 11.3 + phases[1]) * 0.3 +
          Math.sin(u * 23.7 + phases[2]) * 0.15;
        const top = height * (spec.base - spec.amp * (ridge + 0.4));
        const y = top + r * (narrow ? 30 : 36) + (r ? (rng() - 0.5) * 14 : 0);
        row.push({ x, y, hot: rng() < 0.05 });
      }
      rows.push(row);
    }
    return { ...spec, rows };
  });
}

function drawStatic(ctx, width, height, layers, rng) {
  ctx.clearRect(0, 0, width, height);

  // A sparse constellation in the sky, as on the banner.
  const stars = [];
  const count = Math.round(width / 46);
  for (let i = 0; i < count; i++) {
    stars.push({ x: rng() * width, y: rng() * height * 0.3 });
  }
  ctx.lineWidth = 1;
  stars.forEach((star, i) => {
    const next = stars[i + 1];
    if (next && Math.hypot(next.x - star.x, next.y - star.y) < 190) {
      ctx.strokeStyle = `rgba(${LINE},0.07)`;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(${LINE},0.3)`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  });

  for (const layer of layers) {
    const ridge = layer.rows[0];

    // Solid body so nearer ridges hide the ones behind.
    ctx.fillStyle = FILL;
    ctx.beginPath();
    ctx.moveTo(ridge[0].x, height);
    ridge.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(ridge[ridge.length - 1].x, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(${LINE},${layer.alpha * 0.5})`;
    ctx.beginPath();
    layer.rows.forEach((row, r) => {
      const below = layer.rows[r + 1];
      row.forEach((p, c) => {
        const right = row[c + 1];
        if (right && r > 0) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(right.x, right.y);
        }
        if (below) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(below[c].x, below[c].y);
          if (below[c + 1]) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(below[c + 1].x, below[c + 1].y);
          }
        } else {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, height);
        }
      });
    });
    ctx.stroke();

    // The ridge line itself, brighter.
    ctx.strokeStyle = `rgba(${LINE},${layer.alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ridge.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.lineWidth = 1;

    layer.rows.forEach((row, r) => {
      row.forEach((p) => {
        ctx.fillStyle = p.hot ? `rgba(${AMBER},${Math.min(1, layer.alpha + 0.35)})` : `rgba(${LINE},${layer.alpha + (r ? 0 : 0.25)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.hot ? 2.2 : r ? 1.3 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
}

export function initMesh({ reducedMotion }) {
  const canvas = document.getElementById('mesh');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const buffer = document.createElement('canvas');
  const bufferCtx = buffer.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let layers = [];
  let packets = [];
  let frame = 0;
  let visible = true;

  function setup() {
    const rect = canvas.getBoundingClientRect();
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    if (!width || !height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [canvas, buffer]) {
      c.width = width * dpr;
      c.height = height * dpr;
    }
    const rng = mulberry32(SEED);
    layers = buildLayers(width, height, rng);
    bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStatic(bufferCtx, width, height, layers, rng);

    const prng = mulberry32(SEED + 7);
    packets = Array.from({ length: width < 700 ? 4 : 7 }, (_, i) => ({
      layer: layers[1 + (i % 2)],
      t: prng() * 40,
      speed: 0.5 + prng() * 0.7,
      dir: i % 3 === 0 ? -1 : 1
    }));
    paint(0);
  }

  function paint(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buffer, 0, 0);
    if (reducedMotion) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const packet of packets) {
      const ridge = packet.layer.rows[0];
      const span = ridge.length - 1;
      packet.t = (packet.t + packet.dir * packet.speed * dt + span) % span;
      const i = Math.floor(packet.t);
      const f = packet.t - i;
      const a = ridge[i];
      const b = ridge[i + 1];
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
      glow.addColorStop(0, `rgba(${AMBER},0.55)`);
      glow.addColorStop(1, `rgba(${AMBER},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 12, y - 12, 24, 24);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = 0;
  function tick(now) {
    frame = 0;
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    paint(dt);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (reducedMotion || frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  setup();

  let resizeTimer = 0;
  let lastWidth = width;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Mobile browsers fire resize when the address bar hides; only rebuild on width changes.
      if (Math.round(canvas.getBoundingClientRect().width) === lastWidth) return;
      setup();
      lastWidth = width;
    }, 150);
  });

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) start();
  });
}
