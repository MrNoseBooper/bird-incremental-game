// The pixel-art painter and the aviary birds' behaviour. Both are pure, so they run without a browser.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANIMATIONS, paintBird } from '../public/js/pixel/birds.js';
import { ICONS } from '../public/js/pixel/icons.js';
import { BirdActor } from '../public/js/ui/BirdActor.js';

const OUTLINE = '#1a1c2c';
const SHINE = '#ffffff';
const SPARROW = {
  body: '#8b5a35', belly: '#ddd3c2', wing: '#6e4528', beak: '#3a3330', legs: '#c79e7e',
  beak_length: 9, tail_length: 14, eye_size: 3.4, pose: 'side',
};
const OWL = { ...SPARROW, face: '#c58f5a', beak_length: 8, eye_size: 5.4, pose: 'front' };

const count = (grid, color) => grid.cells.filter((cell) => cell === color).length;
const rightmost = (grid) => Math.max(...grid.cells.map((cell, i) => (cell ? i % grid.width : -1)));

function seeded(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

test('every animation frame paints an outlined bird', () => {
  for (const [plumage, view] of [[SPARROW, 'side'], [OWL, 'front']]) {
    for (const [name, poses] of Object.entries(ANIMATIONS[view])) {
      poses.forEach((pose, i) => {
        const grid = paintBird(plumage, pose);
        assert.ok(count(grid, OUTLINE) > 20, `${view} ${name}[${i}] has an outline`);
        assert.ok(count(grid, plumage.belly) + count(grid, plumage.wing) > 0, `${view} ${name}[${i}] has colour`);
      });
    }
  }
});

test('open eyes catch the light; closed eyes do not', () => {
  assert.equal(count(paintBird(SPARROW), SHINE), 1);
  assert.equal(count(paintBird(SPARROW, { eyes: 'closed' }), SHINE), 0);
  assert.equal(count(paintBird(OWL), SHINE), 2);
});

test('wingbeat frames really differ, and a longer beak reaches further', () => {
  const wingbeat = ANIMATIONS.side.fly.map((pose) => paintBird(SPARROW, pose).cells.join());
  assert.equal(new Set(wingbeat).size, 3); // up, mid, down (mid comes round twice)
  assert.ok(rightmost(paintBird({ ...SPARROW, beak_length: 25 })) >= rightmost(paintBird(SPARROW)) + 3);
});

test('icons are 12×12 and only use their own palette', () => {
  for (const [name, { palette, rows }] of Object.entries(ICONS)) {
    assert.equal(rows.length, 12, name);
    for (const row of rows) {
      assert.equal(row.length, 12, `${name}: "${row}"`);
      for (const char of row) assert.ok(char === '.' || char in palette, `${name} uses "${char}"`);
    }
  }
});

test('aviary birds try everything but never leave their strip', () => {
  const actor = new BirdActor({ minX: 10, maxX: 150, x: 80, random: seeded(7) });
  const seen = new Set();
  for (let i = 0; i < 4000; i++) {
    actor.update(1 / 30, true);
    seen.add(actor.state);
    assert.ok(actor.x >= 10 && actor.x <= 150, `x=${actor.x} while ${actor.state}`);
  }
  for (const state of ['idle', 'walk', 'hop', 'peck', 'fly']) assert.ok(seen.has(state), `never chose ${state}`);
});

test('a new bird flies in, lands, and sleeps while its species rests', () => {
  const actor = new BirdActor({ minX: 10, maxX: 150, x: 80, arriving: true, random: seeded(3) });
  assert.equal(actor.state, 'fly');
  assert.ok(actor.x < 10 || actor.x > 150, 'starts outside the strip');
  for (let i = 0; i < 300; i++) actor.update(1 / 30, false);
  assert.deepEqual([actor.state, actor.lift, actor.pose.animation], ['sleep', 0, 'sleep']);
  actor.update(1 / 30, true);
  assert.equal(actor.state, 'idle');
});

test('with reduced motion a bird only idles', () => {
  const actor = new BirdActor({ minX: 10, maxX: 150, x: 80, still: true, random: seeded(5) });
  for (let i = 0; i < 600; i++) {
    actor.update(1 / 30, true);
    assert.equal(actor.state, 'idle');
  }
});
