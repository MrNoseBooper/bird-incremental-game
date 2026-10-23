import { PixelGrid } from './raster.js';

const OUTLINE = '#1a1c2c';
const EYE = '#1a1c2c';
const SHINE = '#ffffff';

// The art is laid out in the backend's plumage units (0-100 across the bird) and scaled down to pixels.
// pivot: what the body tilts around; anchor: the point that sits on the ground (between the feet).
const SIDE = { unit: 0.23, originX: -24, originY: -6, width: 32, height: 30, pivot: [46, 54], anchor: [46, 84] };
const FRONT = { unit: 0.22, originX: -30, originY: -4, width: 36, height: 23, pivot: [50, 56], anchor: [50, 87] };

const BODY_TILT = -0.244;
const WING_TILT = -0.314;

/** Where the head goes for each head pose, and how far the beak tips down (radians). */
const HEADS = {
  up: { dx: 0, dy: 0, beak: 0 },
  low: { dx: 4, dy: 9, beak: 0.5 },
  down: { dx: 7, dy: 17, beak: 1 },
  tucked: { dx: -3, dy: 5, beak: 0.25 },
};

const SIDE_WINGS = {
  up: [[66, 50], [56, 42], [42, 16], [30, -2], [46, 34]],
  mid: [[66, 50], [58, 44], [18, 38], [4, 46], [30, 58]],
  down: [[66, 52], [56, 48], [40, 76], [30, 92], [48, 64]],
};

/** Spread wings seen from the front (the left wing; the right one is its mirror image). */
const FRONT_WINGS = {
  up: [[32, 46], [26, 40], [4, 8], [-16, 0], [6, 30], [20, 52]],
  out: [[32, 48], [26, 44], [-6, 34], [-24, 46], [2, 58], [22, 60]],
  down: [[32, 52], [26, 50], [2, 70], [-12, 86], [10, 76], [24, 64]],
};

/** Each leg: from the body to the ground. */
const LEGS = {
  stand: [[[45, 73], [43, 84]], [[57, 73], [57, 84]]],
  step: [[[45, 73], [39, 84]], [[57, 73], [61, 84]]],
  crouch: [[[45, 75], [44, 84]], [[57, 75], [58, 84]]],
};

/** Cells around a 2×2 eye, for the coloured eye ring some species have. */
const RING = [[-1, -2], [0, -2], [-2, -1], [1, -1], [-2, 0], [1, 0], [-1, 1], [0, 1]];

/** Every animation as a list of poses, one per frame. Owls (front view) look around instead of pecking. */
export const ANIMATIONS = {
  side: {
    idle: [{}, { bob: 1 }],
    blink: [{ eyes: 'closed' }],
    walk: [{ legs: 'step' }, { legs: 'stand', bob: 1 }],
    hop: [{ legs: 'crouch', bob: 1 }, { legs: 'tuck', wing: 'mid' }],
    peck: [{ head: 'low' }, { head: 'down' }],
    fly: [{ wing: 'up', legs: 'tuck' }, { wing: 'mid', legs: 'tuck' }, { wing: 'down', legs: 'tuck' }, { wing: 'mid', legs: 'tuck' }],
    sleep: [{ head: 'tucked', eyes: 'closed' }, { head: 'tucked', eyes: 'closed', bob: 1 }],
    dive: [{ pitch: 1.15, legs: 'tuck' }],
  },
  front: {
    idle: [{}, { bob: 1 }],
    blink: [{ eyes: 'closed' }],
    walk: [{ sway: -1, foot: 'left' }, { sway: 1, foot: 'right' }],
    hop: [{ bob: 1 }, { wings: 'out' }],
    peck: [{ look: -1 }, { look: 1 }],
    fly: [{ wings: 'up' }, { wings: 'out' }, { wings: 'down' }, { wings: 'out' }],
    sleep: [{ eyes: 'closed', bob: 1 }, { eyes: 'closed' }],
    dive: [{ wings: 'up' }],
  },
};

/** One frame of a bird as a pixel grid. Pure, so it can be tested without a browser. */
export function paintBird(plumage, pose = {}) {
  return plumage.pose === 'front' ? paintFront(plumage, pose) : paintSide(plumage, pose);
}

const sprites = new WeakMap();

/** Every animation frame of a species as canvases facing right and left, built once per species. */
export function birdSprites(plumage) {
  if (!sprites.has(plumage)) {
    const front = plumage.pose === 'front';
    const view = front ? FRONT : SIDE;
    const frames = {};
    for (const [name, poses] of Object.entries(ANIMATIONS[front ? 'front' : 'side'])) {
      frames[name] = poses.map((pose) => {
        const grid = paintBird(plumage, pose);
        return { right: grid.toCanvas(), left: grid.toCanvas(true) };
      });
    }
    const [x, y] = view.anchor;
    sprites.set(plumage, {
      frames,
      width: view.width,
      height: view.height,
      anchorX: Math.round((x - view.originX) * view.unit),
      anchorY: Math.floor((y - view.originY) * view.unit),
    });
  }
  return sprites.get(plumage);
}

const icons = new WeakMap();

/** The bird standing still, trimmed tight, for <img> tags: { url, width, height } in art pixels. */
export function birdIcon(plumage) {
  if (!icons.has(plumage)) {
    const grid = paintBird(plumage).crop(1);
    icons.set(plumage, { url: grid.toCanvas().toDataURL(), width: grid.width, height: grid.height });
  }
  return icons.get(plumage);
}

export function birdImg(plumage, scale = 2, className = 'px') {
  const { url, width, height } = birdIcon(plumage);
  return `<img class="${className}" src="${url}" width="${width * scale}" height="${height * scale}" alt="">`;
}

// A tiny flying bird for the ring around the sunflower: b body, h head, k beak, l belly, w wing, t tail.
const TINY = {
  up: ['..ww.....', '..www....', '..wwwbh..', 'tbbbbbhhk', '.llllll..', '.........'],
  mid: ['.........', '.........', 'wwwwwbh..', 'tbbbbbhhk', '.llllll..', '.........'],
  down: ['.........', '.........', '.....bh..', 'tbbbbbhhk', '.lwwwll..', '..www....'],
};

/** Four wingbeat frames of the tiny flyer in a species' colours. */
export function tinyFlyerFrames(plumage) {
  const c = colorsOf(plumage);
  const palette = { b: plumage.body, h: c.head, k: plumage.beak, l: plumage.belly, w: plumage.wing, t: c.tail };
  return ['up', 'mid', 'down', 'mid'].map((name) => {
    const grid = PixelGrid.fromRows(TINY[name], palette, 1);
    grid.outline(OUTLINE);
    return { right: grid.toCanvas(), left: grid.toCanvas(true) };
  });
}

function colorsOf(p) {
  const head = p.head ?? p.body;
  const breast = p.breast ?? p.belly;
  return { head, face: p.face ?? head, breast, throat: p.throat ?? breast, tail: p.tail ?? p.wing };
}

/** Converts plumage units to pixels, applying the pose's bob (px down), sway (px across) and pitch (body tilt). */
function painter(grid, view, { bob = 0, sway = 0, pitch = 0 } = {}) {
  const [px, py] = view.pivot;
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const point = (x, y) => {
    const rx = px + (x - px) * cos - (y - py) * sin;
    const ry = py + (x - px) * sin + (y - py) * cos;
    return [(rx - view.originX) * view.unit + sway, (ry - view.originY) * view.unit + bob];
  };
  return {
    point,
    ellipse(cx, cy, rx, ry, color, angle = 0, within = null) {
      const [x, y] = point(cx, cy);
      grid.ellipse(x, y, rx * view.unit, ry * view.unit, color, { angle: angle + pitch, within });
    },
    polygon(points, color, within = null) {
      grid.polygon(points.map(([x, y]) => point(x, y)), color, { within });
    },
    line(x0, y0, x1, y1, color) {
      const [ax, ay] = point(x0, y0).map(Math.floor);
      const [bx, by] = point(x1, y1).map(Math.floor);
      grid.line(ax, ay, bx, by, color);
    },
  };
}

function drawEye(grid, [x, y], plumage, closed, look = 0) {
  if (plumage.eye_ring) {
    for (const [dx, dy] of RING) if (grid.get(x + dx, y + dy)) grid.set(x + dx, y + dy, plumage.eye_ring);
  }
  if (closed) {
    grid.set(x - 1, y, EYE);
    grid.set(x, y, EYE);
    return;
  }
  x += look;
  grid.set(x - 1, y - 1, EYE);
  grid.set(x, y - 1, SHINE);
  grid.set(x - 1, y, EYE);
  grid.set(x, y, EYE);
}

/** A songbird in profile, facing right. */
function paintSide(p, pose) {
  const c = colorsOf(p);
  const head = HEADS[pose.head ?? 'up'];
  const grid = new PixelGrid(SIDE.width, SIDE.height);
  const silhouette = new PixelGrid(SIDE.width, SIDE.height);
  const pen = painter(grid, SIDE, pose);
  const [hx, hy] = [68 + head.dx, 35 + head.dy];
  const onHead = (points) => points.map(([x, y]) => [x + head.dx, y + head.dy]);

  const tail = p.tail_length;
  pen.polygon([[28, 51], [23, 65], [20 - tail * 0.9, 63 + tail * 0.45]], c.tail);
  if (p.crest) pen.polygon(onHead([[57, 25], [50, 12], [45, 5], [58, 8], [72, 21]]), p.crest);

  for (const target of [grid, silhouette]) {
    const draw = target === grid ? pen : painter(target, SIDE, pose);
    draw.ellipse(46, 54, 29, 23, p.body, BODY_TILT);
    draw.ellipse(hx, hy, 16, 16, c.head);
  }
  pen.ellipse(54, 71, 27, 13, p.belly, 0, silhouette);
  pen.ellipse(71, 56, 14, 14, c.breast, 0, silhouette);
  pen.ellipse(70 + head.dx, 42 + head.dy, 9, 7, c.face, 0, silhouette);
  pen.ellipse(81 + head.dx, 45 + head.dy, 6.5, 6, c.throat, 0, silhouette);

  const folded = !pose.wing;
  if (folded) pen.ellipse(44, 56, 19, 12, p.wing, WING_TILT);
  else pen.polygon(SIDE_WINGS[pose.wing], p.wing);

  const [bx, by] = [81 + head.dx, 35 + head.dy];
  const angle = head.beak;
  const reach = p.beak_length;
  pen.polygon([
    [bx + 4 * Math.sin(angle), by - 4 * Math.cos(angle)],
    [bx + reach * Math.cos(angle), by + reach * Math.sin(angle)],
    [bx - 4.5 * Math.sin(angle), by + 4.5 * Math.cos(angle)],
  ], p.beak);

  grid.outline(OUTLINE);
  grid.shade(OUTLINE);

  // Wing bars, legs and the eye go on after outlining so they stay crisp 1px details.
  if (folded && p.wing_bars) {
    pen.line(40.7, 49.2, 45.4, 63.4, p.wing_bars);
    pen.line(34.5, 52.8, 38.3, 64.2, p.wing_bars);
  }
  const ground = painter(grid, SIDE, { pitch: pose.pitch });
  for (const [[x0, y0], [x1, y1]] of LEGS[pose.legs ?? 'stand'] ?? []) {
    const [ax, ay] = pen.point(x0, y0).map(Math.floor);
    const [fx, fy] = ground.point(x1, y1).map(Math.floor);
    grid.line(ax, ay, fx, fy, p.legs);
    grid.set(fx + 1, fy, p.legs); // toe
  }
  drawEye(grid, pen.point(74 + head.dx, 32 + head.dy).map(Math.floor), p, pose.eyes === 'closed');
  return grid;
}

/** An owl-style bird facing the viewer. */
function paintFront(p, pose) {
  const c = colorsOf(p);
  const grid = new PixelGrid(FRONT.width, FRONT.height);
  const silhouette = new PixelGrid(FRONT.width, FRONT.height);
  const pen = painter(grid, FRONT, pose);

  if (pose.wings) {
    pen.polygon(FRONT_WINGS[pose.wings], p.wing);
    pen.polygon(FRONT_WINGS[pose.wings].map(([x, y]) => [100 - x, y]), p.wing);
  }
  if (p.tufts) {
    pen.polygon([[31, 30], [30, 12], [43, 22]], p.tufts);
    pen.polygon([[69, 30], [70, 12], [57, 22]], p.tufts);
  }
  pen.polygon([[43, 80], [50, 90], [57, 80]], c.tail);
  for (const target of [grid, silhouette]) {
    const draw = target === grid ? pen : painter(target, FRONT, pose);
    draw.ellipse(50, 56, 25, 29, p.body);
    draw.ellipse(50, 37, 24, 19, c.head);
  }
  pen.ellipse(50, 69, 18, 16, p.belly, 0, silhouette);
  pen.ellipse(50, 56, 15, 9, c.breast, 0, silhouette);
  pen.ellipse(40, 38, 11.5, 11.5, c.face, 0, silhouette);
  pen.ellipse(60, 38, 11.5, 11.5, c.face, 0, silhouette);
  if (!pose.wings) {
    pen.ellipse(28, 60, 8, 18, p.wing, 0.21);
    pen.ellipse(72, 60, 8, 18, p.wing, -0.21);
  }
  pen.polygon([[46.5, 43], [53.5, 43], [50, 43 + p.beak_length * 0.8]], p.beak);

  grid.outline(OUTLINE);
  grid.shade(OUTLINE);

  const ground = painter(grid, FRONT, { sway: pose.sway });
  for (const [x, side] of [[42, 'left'], [58, 'right']]) {
    const [fx, fy] = ground.point(x, 87).map(Math.floor);
    const raised = pose.foot === side ? 1 : 0;
    for (let dx = -1; dx <= 1; dx++) grid.set(fx + dx, fy - raised, p.legs);
  }
  for (const x of [41, 59]) drawEye(grid, pen.point(x, 38).map(Math.floor), p, pose.eyes === 'closed', pose.look);
  return grid;
}
