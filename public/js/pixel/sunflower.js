import { mix } from './color.js';
import { PixelGrid } from './raster.js';

const TAU = Math.PI * 2;
const SWAY = [-0.06, -0.03, 0, 0.03, 0.06, 0.03, 0, -0.03];
const plain = (hex) => hex;
const moonlit = (hex) => mix(hex, '#141a3a', 0.5);

/** Size of the sunflower art, where its head is, and how far the petals reach from the head's centre. */
export const SUNFLOWER = { width: 44, height: 66, headX: 22, headY: 20, reach: 20 };

/** The swaying frames and the squashed "pressed" frame, in daylight or moonlight colours. */
export function sunflowerFrames(night = false) {
  const tint = night ? moonlit : plain;
  return {
    sway: SWAY.map((angle) => paintSunflower(angle, 1, tint).toCanvas()),
    press: paintSunflower(0, 0.9, tint).toCanvas(),
  };
}

export function paintSunflower(angle, scale, tint = plain) {
  const { width, height, headX: cx, headY: cy } = SUNFLOWER;
  const g = new PixelGrid(width, height);
  g.polygon([[20.5, 27], [23.5, 27], [24.5, height], [19.5, height]], tint('#3f8a2c'));
  g.ellipse(13.5, 45, 7.5, 2.8, tint('#4fa83a'), { angle: -0.5 });
  g.ellipse(30.5, 53, 7.5, 2.8, tint('#4fa83a'), { angle: 0.45 });
  for (let i = 0; i < 16; i++) {
    const a = angle + (i / 16) * TAU;
    g.ellipse(cx + Math.cos(a) * 13.5 * scale, cy + Math.sin(a) * 13.5 * scale, 5.6 * scale, 2.3 * scale, tint('#f0a91b'), { angle: a });
  }
  for (let i = 0; i < 16; i++) {
    const a = angle + ((i + 0.5) / 16) * TAU;
    g.ellipse(cx + Math.cos(a) * 11 * scale, cy + Math.sin(a) * 11 * scale, 5 * scale, 2.1 * scale, tint('#ffd23f'), { angle: a });
  }
  g.ellipse(cx, cy, 8.6 * scale, 8.6 * scale, tint('#7a4a22'));
  g.outline(tint('#3d2412'));
  g.shade(tint('#3d2412'));
  // Seeds spiral out at the golden angle, like a real sunflower head.
  for (let i = 0; i < 44; i++) {
    const r = 1.18 * Math.sqrt(i + 0.6) * scale;
    const a = i * 2.39996;
    g.set(Math.floor(cx + Math.cos(a) * r), Math.floor(cy + Math.sin(a) * r), tint('#3b2210'));
  }
  return g;
}

/** Spinning sunbeams: `steps` frames covering one beam's turn, dithered so they fade toward the edge. */
export function rayFrames(radius, { beams = 16, color = '#fff3b0', steps = 12 } = {}) {
  const size = radius * 2;
  const period = TAU / beams;
  return Array.from({ length: steps }, (_, step) => {
    const grid = new PixelGrid(size, size);
    const turn = (step / steps) * period;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - radius;
        const dy = y + 0.5 - radius;
        const distance = Math.hypot(dx, dy) / radius;
        const along = (((Math.atan2(dy, dx) - turn) % period) + period) % period;
        if (distance > 1 || along > period * 0.42) continue;
        if (distance > 0.62 && (x + y) % 2) continue;
        if (distance > 0.82 && x % 2) continue;
        grid.set(x, y, color);
      }
    }
    return grid.toCanvas();
  });
}
