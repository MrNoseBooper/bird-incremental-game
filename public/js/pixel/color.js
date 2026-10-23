const parsed = new Map();

/** "#rrggbb" -> [r, g, b] */
export function rgb(hex) {
  if (!parsed.has(hex)) parsed.set(hex, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  return parsed.get(hex);
}

const toHex = (channels) => `#${channels
  .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0'))
  .join('')}`;

/** Blends two colours: t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Lightens (amount > 0) or darkens (amount < 0). Shadows lean navy and lights lean warm, as in pixel art. */
export function shade(hex, amount) {
  return mix(hex, amount > 0 ? '#fffbe8' : '#14182e', Math.abs(amount));
}
