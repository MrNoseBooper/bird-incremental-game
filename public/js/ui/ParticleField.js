const TAU = Math.PI * 2;
const MAX_PARTICLES = 400;
const REDUCED_MOTION = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Each particle is a few pixels: [dx, dy, colour]. Kinds with two shapes tumble between them.
const SHAPES = {
  seed: [
    [[0, 0, '#3b3631'], [0, 1, '#e9e2d0'], [0, 2, '#3b3631']],
    [[0, 0, '#3b3631'], [1, 0, '#e9e2d0'], [2, 0, '#3b3631']],
  ],
  petal: [
    [[0, 0, '#ffd23f'], [1, 0, '#ffd23f'], [0, 1, '#f0a91b']],
    [[0, 0, '#ffd23f'], [0, 1, '#ffd23f'], [1, 1, '#f0a91b']],
  ],
  drop: [[[0, 0, '#d6f3ff'], [0, 1, '#8fd3ff']]],
  feather: [
    [[0, 0, '#73eff7'], [1, 1, '#41a6f6'], [2, 2, '#3b5dc9']],
    [[2, 0, '#73eff7'], [1, 1, '#41a6f6'], [0, 2, '#3b5dc9']],
  ],
  sparkle: [
    [[0, 0, '#ffffff']],
    [[0, 0, '#ffffff'], [-1, 0, '#73eff7'], [1, 0, '#73eff7'], [0, -1, '#73eff7'], [0, 1, '#73eff7']],
  ],
  glint: [
    [[0, 0, '#fff6c4']],
    [[0, 0, '#fff6c4'], [-1, 0, '#ffcd34'], [1, 0, '#ffcd34'], [0, -1, '#ffcd34'], [0, 1, '#ffcd34']],
  ],
};
const TWINKLES = new Set(['sparkle', 'glint']); // big when fresh, shrinking to a dot as they fade

/** Pixel particles for the cove: seed rain (back layer), click bursts, splashes and sparkles (front), fireflies. */
export class ParticleField {
  constructor() {
    this.particles = [];
    this.rainOwed = 0;
    this.fireflies = Array.from({ length: 14 }, () => ({
      x: Math.random(), y: 0.4 + Math.random() * 0.4, phase: Math.random() * TAU,
    }));
  }

  /** Throws `count` particles of `kind` out from (x, y), in art pixels and art pixels per second. */
  burst(x, y, kind, count, { speed = 60, angle = -Math.PI / 2, spread = TAU, life = 0.9, gravity = 180 } = {}) {
    if (REDUCED_MOTION) return;
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const direction = angle + (Math.random() - 0.5) * spread;
      const velocity = speed * (0.45 + Math.random() * 0.75);
      this.particles.push({
        kind, x, y, gravity, rain: false,
        vx: Math.cos(direction) * velocity,
        vy: Math.sin(direction) * velocity,
        age: 0,
        life: life * (0.7 + Math.random() * 0.6),
        tumble: Math.random() * 4,
      });
    }
  }

  /** Spawns rain, moves everything and drops what has landed in the river or faded out. */
  update(dt, { width, river, rainPerSecond }) {
    if (!REDUCED_MOTION) this.rainOwed += rainPerSecond * dt;
    for (; this.rainOwed >= 1 && this.particles.length < MAX_PARTICLES; this.rainOwed -= 1) {
      this.particles.push({
        kind: Math.random() < 0.15 ? 'petal' : 'seed', rain: true, gravity: 0,
        x: Math.random() * width, y: -3, vx: (Math.random() - 0.5) * 6, vy: 18 + Math.random() * 18,
        age: 0, life: Infinity, tumble: Math.random() * 4,
      });
    }
    this.particles = this.particles.filter((p) => {
      p.age += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.age < p.life && p.y < river + 2;
    });
  }

  /** Draws the 'back' layer (rain) or the 'front' layer (everything else). */
  draw(ctx, layer) {
    for (const p of this.particles) {
      if (p.rain !== (layer === 'back')) continue;
      const shapes = SHAPES[p.kind];
      const shape = TWINKLES.has(p.kind)
        ? shapes[p.age < p.life * 0.5 ? 1 : 0]
        : shapes[Math.floor(p.age * 5 + p.tumble) % shapes.length];
      ctx.globalAlpha = p.rain ? 1 : Math.min(1, (p.life - p.age) / (p.life * 0.4));
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      for (const [dx, dy, color] of shape) {
        ctx.fillStyle = color;
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Fireflies blinking over the hills at night. */
  drawFireflies(ctx, now, night, width, height) {
    if (night < 0.05 || REDUCED_MOTION) return;
    const t = now / 1000;
    for (const fly of this.fireflies) {
      const glow = Math.sin(t * 2 + fly.phase * 3);
      if (glow <= 0) continue;
      const x = Math.round((fly.x + Math.sin(t * 0.2 + fly.phase) * 0.06) * width);
      const y = Math.round((fly.y + Math.cos(t * 0.15 + fly.phase) * 0.05) * height);
      ctx.globalAlpha = night * glow * 0.35;
      ctx.fillStyle = '#d9ff7a';
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
      ctx.globalAlpha = night * glow;
      ctx.fillStyle = '#f4ffb0';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}
