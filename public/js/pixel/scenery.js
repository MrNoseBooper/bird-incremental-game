import { mix } from './color.js';
import { PixelGrid } from './raster.js';

/** Height of one aviary strip in art pixels. */
export const ROW_HEIGHT = 36;

const DAY_SKY = ['#3a7bd5', '#468ade', '#5399e6', '#61a8ee', '#73b8f3', '#89c8f7', '#a3d6fa'];
const NIGHT_SKY = ['#0a0f26', '#0e1531', '#131c3e', '#18244c', '#1e2c5a', '#253568', '#2d3f77'];
const STRIP_SKY = ['#8fd3ff', '#a8ddff', '#c2e8ff'];

const cache = new Map();
const cached = (key, build) => {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
};

/** Seeded random numbers (mulberry32), so a scene looks the same every time it is painted. */
function seeded(text) {
  let seed = [...text].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const column = (width, valueAt) => Array.from({ length: width }, (_, x) => valueAt(x));

/** Horizontal colour bands with a dithered seam between them: the classic pixel-art gradient. */
function bands(colors, x, y, top, bottom) {
  const position = ((y - top) / (bottom - top)) * colors.length;
  const i = Math.max(0, Math.min(colors.length - 1, Math.floor(position)));
  const next = Math.min(colors.length - 1, i + 1);
  return position - i > 0.7 && (x + y) % 2 ? colors[next] : colors[i];
}

function paint(width, height, colorAt) {
  const grid = new PixelGrid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) grid.set(x, y, colorAt(x, y));
  }
  return grid.toCanvas();
}

/** Each habitat: given the strip size and a random source, returns colourAt(x, y). */
const HABITATS = {
  hedgerow(w, h, rnd) {
    const top = column(w, (x) => 10 + Math.round(Math.sin(x * 0.45) * 1.2 + Math.sin(x * 0.13 + 1) * 1.6));
    return (x, y) => {
      if (y >= h - 5) return rnd() < 0.2 ? '#4f3420' : '#6b4a2e';
      if (y === top[x]) return '#5cb34f';
      if (y > top[x]) return rnd() < 0.2 ? '#2f6e2c' : '#3f8f3a';
      return bands(STRIP_SKY, x, y, 0, top[x]);
    };
  },
  woodland(w, h, rnd) {
    const trunks = new Set();
    for (let x = 4; x < w; x += 18 + Math.floor(rnd() * 8)) [0, 1, 2].forEach((i) => trunks.add(x + i));
    const canopy = column(w, (x) => 7 + Math.round(Math.sin(x * 0.3) * 2 + Math.sin(x * 0.11) * 2));
    return (x, y) => {
      if (y >= h - 4) return rnd() < 0.3 ? '#3f2f1e' : '#4e3a24';
      if (y < canopy[x]) return y === canopy[x] - 1 ? '#2a5e2f' : rnd() < 0.25 ? '#2f6b34' : '#3e8042';
      if (trunks.has(x)) return trunks.has(x - 1) && trunks.has(x + 1) ? '#6b4a32' : '#4f3524';
      return bands(['#a6d8c0', '#bfe3d0', '#d5ecdf'], x, y, canopy[x], h - 4);
    };
  },
  garden(w, h, rnd) {
    return (x, y) => {
      if (y >= h - 6) {
        if (y === h - 6 && x % 7 === 3) return x % 14 === 3 ? '#e43b44' : '#ffcd75';
        return rnd() < 0.18 ? '#4a9a3a' : '#5fae46';
      }
      const picket = x % 5 < 2;
      if (picket && y >= h - 16 && !(y === h - 16 && x % 5 === 1)) return x % 5 === 0 ? '#f4f4f4' : '#d8dce6';
      if (y === h - 13 || y === h - 9) return '#e6e9f0';
      return bands(STRIP_SKY, x, y, 0, h - 6);
    };
  },
  heath(w, h, rnd) {
    const top = column(w, (x) => h - 9 + Math.round(Math.sin(x * 0.7) * 1.3 + Math.sin(x * 0.23) * 1.2));
    return (x, y) => {
      if (y >= h - 3) return rnd() < 0.25 ? '#4a3b2e' : '#5c4a3a';
      if (y >= top[x]) return rnd() < 0.12 ? '#f0c53a' : rnd() < 0.3 ? '#6e4672' : '#8b5a8e';
      return bands(['#e7a98b', '#f0c3a2', '#f5d8bd', '#d9c3dc'], x, y, 0, top[x]);
    };
  },
  meadow(w, h, rnd) {
    const grass = column(w, () => h - 7 - Math.floor(rnd() * 5));
    const flowers = column(w, () => (rnd() < 0.14 ? (rnd() < 0.5 ? '#ffffff' : '#ff9a3d') : null));
    return (x, y) => {
      if (y >= h - 3) return '#4f8f33';
      if (y === grass[x] - 1 && flowers[x]) return flowers[x];
      if (y >= grass[x]) return (x + y) % 3 ? '#6fb83f' : '#5aa332';
      return bands(['#86ccf5', '#a6dbf8', '#c8eafc'], x, y, 0, h - 7);
    };
  },
  barn(w, h, rnd) {
    return (x, y) => {
      if (y >= h - 4) return rnd() < 0.3 ? '#c49a45' : '#e0bb63';
      if (y === 5 || y === 6) return '#4f2d18';
      if (x % 9 === 0) return '#5e3420';
      return Math.floor(x / 9) % 2 ? '#8f4f2c' : '#9a5833';
    };
  },
  coast(w, h, rnd) {
    const cliff = column(w, (x) => h - 9 + Math.round(Math.sin(x * 0.2) * 1.5 + Math.sin(x * 0.07)));
    return (x, y) => {
      if (y === cliff[x]) return x % 6 === 2 && rnd() < 0.6 ? '#ff8fb1' : '#6cbf4a'; // turf dotted with sea pinks
      if (y > cliff[x]) {
        if (y < cliff[x] + 3) return rnd() < 0.3 ? '#5aa33d' : '#4f9636';
        return rnd() < 0.3 ? '#7d7466' : '#8f8676'; // cliff rock
      }
      if (y === 14) return '#7fc4e8';
      if (y > 14) return (x * 3 + y * 7) % 23 === 0 ? '#e8f6ff' : '#3d8fc7'; // sea with whitecaps
      return bands(['#a9dbf5', '#bfe4f8', '#d6eefb'], x, y, 0, 14);
    };
  },
  tundra(w, h, rnd) {
    const ridge = column(w, (x) => 8 + Math.round(Math.abs(Math.sin(x * 0.08 + 1)) * 6));
    const snowline = column(w, (x) => h - 8 + Math.round(Math.sin(x * 0.15) * 1.2));
    return (x, y) => {
      if (y === snowline[x]) return '#ffffff';
      if (y > snowline[x]) return rnd() < 0.15 ? '#d8e6f2' : '#eef5fb'; // snowfield
      if (y >= ridge[x]) {
        if (y < ridge[x] + 2) return '#f4f8fc'; // snowy peaks
        return (x + y) % 5 === 0 ? '#8c9db0' : '#a7b6c6';
      }
      return bands(['#b9d4ea', '#cde0f0', '#e0ecf6'], x, y, 0, h - 8);
    };
  },
  rainforest(w, h, rnd) {
    const vines = column(w, () => (rnd() < 0.08 ? 6 + Math.floor(rnd() * 12) : 0));
    const canopy = column(w, (x) => 5 + Math.round(Math.sin(x * 0.35) * 2 + Math.sin(x * 0.09) * 2));
    const ferns = column(w, (x) => h - 6 - Math.round(Math.abs(Math.sin(x * 0.5)) * 3));
    return (x, y) => {
      if (y >= h - 3) return '#24391b';
      if (y >= ferns[x]) return (x + y) % 2 ? '#2f7d3a' : '#3a9246';
      if (y < canopy[x]) return rnd() < 0.3 ? '#2a6d33' : '#3f9a4a';
      if (vines[x] && y < canopy[x] + vines[x]) return y % 3 ? '#2e6a2a' : '#4caf50';
      return bands(['#6cbf8a', '#86cc9d', '#a2d9b1'], x, y, 0, h - 6);
    };
  },
};

/** The background of one aviary strip, painted once per habitat and width. */
export function habitatScene(habitat, width) {
  return cached(`${habitat}:${width}`, () => paint(width, ROW_HEIGHT, HABITATS[habitat](width, ROW_HEIGHT, seeded(habitat))));
}

/** The cove's sky and hills, in daylight or moonlight. */
export function coveBackdrop(width, height, night) {
  return cached(`cove:${width}x${height}:${night}`, () => {
    const far = column(width, (x) => Math.round(height * 0.62 + Math.sin(x * 0.05) * 4 + Math.sin(x * 0.13 + 2) * 2));
    const near = column(width, (x) => Math.round(height * 0.7 + Math.sin(x * 0.07 + 1) * 5 + Math.sin(x * 0.19) * 1.5));
    const tint = night ? (hex) => mix(hex, '#101632', 0.55) : (hex) => hex;
    return paint(width, height, (x, y) => {
      if (y === near[x]) return tint('#5bb04d');
      if (y > near[x]) return tint(y < near[x] + 3 && (x + y) % 2 ? '#4a9b40' : '#3f8a37');
      if (y === far[x]) return tint('#8fd16d');
      if (y > far[x]) return tint('#6fbf55');
      return bands(night ? NIGHT_SKY : DAY_SKY, x, y, 0, Math.round(height * 0.66));
    });
  });
}

/** The sun, with its rays pulsing between two lengths. */
export function sunFrames() {
  return [3, 4].map((rayLength) => {
    const grid = new PixelGrid(25, 25);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const length = i % 2 ? rayLength - 1 : rayLength;
      for (let r = 8; r < 8 + length; r++) grid.set(Math.floor(12.5 + Math.cos(a) * r), Math.floor(12.5 + Math.sin(a) * r), '#ffe066');
    }
    grid.ellipse(12.5, 12.5, 6.5, 6.5, '#ffb627');
    grid.ellipse(12.5, 12.5, 5.5, 5.5, '#ffd23f');
    grid.ellipse(11.5, 11.5, 3, 3, '#fff3a0');
    return grid.toCanvas();
  });
}

export function moonSprite() {
  const grid = new PixelGrid(15, 15);
  grid.ellipse(7.5, 7.5, 6, 6, '#cfc9b3');
  grid.ellipse(6.8, 7, 5.4, 5.6, '#f4f1de');
  for (const [x, y] of [[5, 5], [8, 9], [4, 9], [9, 4]]) grid.set(x, y, '#d9d3bd');
  return grid.toCanvas();
}

/** Three puffy clouds of different sizes. */
export function cloudSprites() {
  return [
    [[6, 7, 4], [11, 5, 5], [16, 7, 4], [11, 8, 4]],
    [[5, 5, 3], [9, 4, 4], [13, 6, 3]],
    [[5, 6, 4], [10, 4, 4.5], [15, 5, 4], [20, 7, 3]],
  ].map((puffs) => {
    const grid = new PixelGrid(26, 12);
    for (const [x, y, r] of puffs) grid.ellipse(x, y, r, r, '#ffffff');
    for (let x = 0; x < grid.width; x++) {
      for (let y = grid.height - 1; y >= 0; y--) {
        if (grid.get(x, y)) {
          grid.set(x, y, '#dcecff'); // shaded underside
          break;
        }
      }
    }
    return grid.toCanvas();
  });
}

/** The branch over the river where the Kingfisher perches. */
export function branchSprite() {
  const grid = new PixelGrid(36, 9);
  grid.polygon([[0, 4], [36, 3], [36, 7], [0, 7.5]], '#6b4a2e');
  grid.line(0, 4, 35, 3, '#8b6340');
  grid.line(9, 4, 5, 0, '#6b4a2e');
  grid.ellipse(4, 1.5, 2.5, 1.2, '#4fa83a', { angle: -0.4 });
  grid.ellipse(22, 2, 2.5, 1.2, '#5cb34f', { angle: 0.5 });
  grid.outline('#2a1a10');
  return grid.toCanvas();
}
