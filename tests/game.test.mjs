// Game rules, tested against a tiny made-up flock so balance changes don't break these tests.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../public/js/core/Game.js';
import { formatDuration, formatNumber, formatWords } from '../public/js/utils/format.js';

const plumage = {};
const content = {
  rules: { base_click: 1, cost_growth: 1.15, rest_rate: 0.25, day_seconds: 10, night_seconds: 10 },
  birds: [
    { id: 'lark', name: 'Lark', activity: 'day', base_cost: 10, base_production: 1, plumage },
    { id: 'owl', name: 'Owl', activity: 'night', base_cost: 100, base_production: 10, plumage },
  ],
  kingfisher: {
    id: 'kingfisher', plumage, first_visit_seconds: 5, min_interval_seconds: 20,
    max_interval_seconds: 20, stay_seconds: 3, feathers_per_catch: 1,
  },
  upgrades: [
    { id: 'stem', currency: 'seeds', cost: 5, effects: [{ stat: 'click', op: 'mul', value: 2 }], requires: [{ stat: 'clicks', at_least: 3 }] },
    { id: 'larks', currency: 'seeds', cost: 1, effects: [{ stat: 'bird:lark', op: 'mul', value: 2 }], requires: [{ stat: 'owned:day', at_least: 1 }] },
    { id: 'sleepers', currency: 'feathers', cost: 1, effects: [{ stat: 'rest_rate', op: 'add', value: 0.25 }], requires: [] },
  ],
};

function newGame() {
  const clock = { now: 0 };
  const game = new Game(content, { clock: () => clock.now, random: () => 0 });
  return { game, clock };
}

test('shaking the sunflower earns seeds', () => {
  const { game } = newGame();
  assert.equal(game.click(), 1);
  assert.equal(game.seeds, 1);
  assert.equal(game.clicks, 1);
});

test('birds need enough seeds and cost more with each purchase', () => {
  const { game } = newGame();
  assert.equal(game.buyBird('lark'), false);
  game.seeds = 100;
  assert.equal(game.buyBird('lark'), true);
  assert.equal(game.seeds, 90);
  assert.equal(game.bird('lark').cost(1.15), 12); // ceil(10 * 1.15)
});

test('buying in bulk charges the sum of each bird’s price', () => {
  const { game } = newGame();
  const lark = game.bird('lark');
  const tenOneByOne = Array.from({ length: 10 }, (_, i) => 10 * 1.15 ** i).reduce((a, b) => a + b);
  assert.equal(lark.cost(1.15, 10), Math.ceil(tenOneByOne));
  game.seeds = lark.cost(1.15, 10) - 1;
  assert.equal(game.buyBird('lark', 10), false);
  game.seeds += 1;
  assert.equal(game.buyBird('lark', 10), true);
  assert.equal(lark.owned, 10);
  assert.equal(game.seeds, 0);
});

test('resting birds forage at the rest rate', () => {
  const { game } = newGame();
  game.bird('lark').owned = 2;
  game.bird('owl').owned = 1;
  assert.equal(game.productionPerSecond(true), 2 + 10 * 0.25);
  assert.equal(game.productionPerSecond(false), 2 * 0.25 + 10);
});

test('seeds accrue each tick and dusk fires a phase change', () => {
  const { game, clock } = newGame();
  const phases = [];
  game.addEventListener('phasechange', () => phases.push(game.isDay() ? 'day' : 'night'));
  game.bird('lark').owned = 1;
  clock.now = 4000;
  game.tick();
  assert.equal(game.seeds, 4);
  clock.now = 11000;
  game.tick();
  assert.deepEqual(phases, ['night']);
});

test('upgrades unlock from progress, apply once, and can be paid in feathers', () => {
  const { game } = newGame();
  game.seeds = 100;
  assert.equal(game.buyUpgrade('stem'), false); // needs 3 clicks first
  game.click();
  game.click();
  game.click();
  assert.equal(game.buyUpgrade('stem'), true);
  assert.equal(game.clickPower(), 2);
  assert.equal(game.buyUpgrade('stem'), false);

  assert.equal(game.buyUpgrade('larks'), false); // needs a day bird
  game.bird('lark').owned = 1;
  assert.equal(game.buyUpgrade('larks'), true);
  assert.equal(game.productionPerSecond(true), 2);

  assert.equal(game.buyUpgrade('sleepers'), false); // seeds can't buy feather upgrades
  game.feathers = 1;
  assert.equal(game.buyUpgrade('sleepers'), true);
  assert.equal(game.feathers, 0);
  assert.equal(game.stats.rest_rate, 0.5);
});

test('the kingfisher visits, pays feathers when caught, and leaves if ignored', () => {
  const { game, clock } = newGame();
  const events = [];
  game.addEventListener('kingfisherarrive', () => events.push('arrive'));
  game.addEventListener('kingfisherleave', () => events.push('leave'));
  assert.equal(game.catchKingfisher(), 0);
  clock.now = 5000;
  game.tick();
  assert.equal(game.catchKingfisher(), 1);
  assert.equal(game.feathers, 1);
  assert.equal(game.catchKingfisher(), 0); // already gone
  clock.now = 25000; // next visit is 20s after the catch
  game.tick();
  clock.now = 28000; // and lasts 3s
  game.tick();
  assert.deepEqual(events, ['arrive', 'arrive', 'leave']);
});

test('saves round-trip, and junk in a save is ignored', () => {
  const { game } = newGame();
  game.seeds = 42;
  game.feathers = 2;
  game.bird('owl').owned = 3;
  game.upgrade('sleepers').purchased = true;
  const { game: copy } = newGame();
  copy.load(JSON.parse(JSON.stringify(game.toSave())));
  assert.deepEqual(copy.toSave(), game.toSave());
  assert.equal(copy.stats.rest_rate, 0.5);

  copy.load({ seeds: 'lots', feathers: -5, birds: { owl: NaN, dodo: 4 }, upgrades: ['nope'] });
  assert.equal(copy.seeds, 0);
  assert.equal(copy.feathers, 0);
  assert.equal(copy.bird('owl').owned, 0);
  assert.equal(copy.upgrades.some((upgrade) => upgrade.purchased), false);
});

test('time away is paid at the average day/night rate', () => {
  const { game, clock } = newGame();
  game.bird('lark').owned = 4; // 4/s by day, 1/s by night
  assert.equal(game.catchUp(100), 250);
  assert.equal(game.catchUp(NaN), 0);
  clock.now = 120_000; // a long gap inside the loop (sleep, throttled tab) uses the same average
  game.tick();
  assert.equal(game.seeds, 250 + 2.5 * 120);
});

test('numbers are abbreviated and never round up', () => {
  assert.equal(formatNumber(999.99), '999');
  assert.equal(formatNumber(1234567), '1.23M');
  assert.equal(formatNumber(0.3, 1), '0.3');
  assert.equal(formatNumber(1e40), '1.00e+40');
  assert.equal(formatDuration(65.2), '1:06');
  assert.equal(formatWords(123456.9), '123,456');
  assert.equal(formatWords(51_314_000_000_000_000), '51.314 quadrillion');
});
