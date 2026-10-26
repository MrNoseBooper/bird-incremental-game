// Game rules, tested against a tiny made-up flock so balance changes don't break these tests.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../public/js/core/Game.js';
import { formatDuration, formatNumber, formatWords } from '../public/js/utils/format.js';

const plumage = {};
const task = (id, counter, base, extra = {}) => ({
  id, text: `${id} {n}`, counter, base, step: 0, peak: false, production_seconds: 0, reward_seconds: 10, feather_chance: 0, ...extra,
});
const content = {
  rules: {
    base_click: 1, cost_growth: 1.15, rest_rate: 0.25, day_seconds: 10, night_seconds: 10,
    combo_cap: 2, combo_window: 1, combo_full: 100, pet_seconds: 3,
  },
  birds: [
    { id: 'lark', name: 'Lark', activity: 'day', base_cost: 10, base_production: 1, plumage },
    { id: 'owl', name: 'Owl', activity: 'night', base_cost: 100, base_production: 10, plumage },
  ],
  kingfisher: {
    id: 'kingfisher', plumage, first_visit_seconds: 5, min_interval_seconds: 20,
    max_interval_seconds: 20, stay_seconds: 3, feathers_per_catch: 1,
  },
  golden_seed: { first_visit_seconds: 2, min_interval_seconds: 30, max_interval_seconds: 30, stay_seconds: 5 },
  boons: [{
    id: 'frenzy', name: 'Frenzy', description: '', weight: 1, seconds_of_seeds: 0, feathers: 0,
    duration: 10, effects: [{ stat: 'global', op: 'mul', value: 5 }],
  }],
  // Targets nobody reaches by accident, so tasks don't pay out in the other tests.
  tasks: [
    task('shake', 'clicks', 1000), task('pet', 'pets', 1000), task('combo', 'combo', 1000, { peak: true }),
    task('gather', 'seeds_earned', 1e12, { production_seconds: 40 }),
  ],
  upgrades: [
    { id: 'stem', currency: 'seeds', cost: 5, effects: [{ stat: 'click', op: 'mul', value: 2 }], requires: [{ stat: 'clicks', at_least: 3 }] },
    { id: 'larks', currency: 'seeds', cost: 1, effects: [{ stat: 'bird:lark', op: 'mul', value: 2 }], requires: [{ stat: 'owned:day', at_least: 1 }] },
    { id: 'sleepers', currency: 'feathers', cost: 1, effects: [{ stat: 'rest_rate', op: 'add', value: 0.25 }], requires: [] },
    { id: 'bargain', currency: 'feathers', cost: 1, effects: [{ stat: 'bird_cost', op: 'mul', value: 0.5 }], requires: [] },
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

test('quick shakes build a combo that multiplies seeds, and a pause breaks it', () => {
  const { game, clock } = newGame();
  for (let i = 0; i < 9; i++) {
    game.click();
    clock.now += 500;
  }
  assert.equal(game.click(), 1.1); // the 10th shake in a row adds 10%
  assert.equal(game.progress('combo'), 10);
  clock.now += 1500; // longer than the 1s window
  assert.equal(game.progress('combo'), 0);
  assert.equal(game.click(), 1);
  assert.equal(game.progress('best_combo'), 10);
});

test('a golden seed grants its boon, and timed boosts wear off', () => {
  const { game, clock } = newGame();
  game.bird('lark').owned = 1;
  clock.now = 2000;
  game.tick();
  assert.equal(game.catchGoldenSeed().boon.id, 'frenzy');
  assert.equal(game.productionPerSecond(true), 5);
  assert.equal(game.catchGoldenSeed(), null); // already caught
  clock.now = 12_500; // the frenzy lasts 10s
  game.tick();
  assert.equal(game.productionPerSecond(true), 1);
  assert.equal(game.progress('golden_catches'), 1);
});

test('petting pays a shake plus a few seconds of that bird’s foraging; discounts cut prices', () => {
  const { game } = newGame();
  game.bird('owl').owned = 1;
  assert.equal(game.petBird('owl'), 1 + 10 * 3);
  assert.equal(game.progress('pets'), 1);
  assert.equal(game.birdCost(game.bird('lark')), 10);
  game.feathers = 1;
  game.buyUpgrade('bargain');
  assert.equal(game.birdCost(game.bird('lark')), 5);
});

test('field tasks pay out when done, deal a different task, and can be swapped', () => {
  const clock = { now: 0 };
  const tasks = [task('shake', 'clicks', 3, { feather_chance: 1 }), ...content.tasks.slice(1)];
  const game = new Game({ ...content, tasks }, { clock: () => clock.now, random: () => 0 });
  assert.deepEqual(game.tasks.slots.map((t) => t.kind), ['shake', 'pet', 'combo']);
  const done = [];
  game.addEventListener('taskdone', (event) => done.push(event.detail));
  game.click();
  game.click();
  game.click();
  game.tick();
  assert.deepEqual(done, [{ text: 'shake 3', seeds: 20, feathers: 1 }]); // 20 shakes' worth beats 10s of no foraging
  assert.deepEqual([game.seeds, game.feathers, game.progress('tasks')], [23, 1, 1]);
  assert.equal(game.tasks.slots[0].kind, 'gather'); // the only kind not already on the board
  assert.equal(game.tasks.progressOf(game.tasks.slots[2], game), 3); // the combo task tracks the best combo since it was dealt
  game.rerollTask(0);
  assert.equal(game.tasks.slots[0].kind, 'shake');
});

test('saves round-trip, and junk in a save is ignored', () => {
  const { game } = newGame();
  game.seeds = 42;
  game.feathers = 2;
  game.pets = 7;
  game.click();
  game.bird('owl').owned = 3;
  game.upgrade('sleepers').purchased = true;
  const { game: copy } = newGame();
  copy.load(JSON.parse(JSON.stringify(game.toSave())));
  assert.deepEqual(copy.toSave(), game.toSave());
  assert.equal(copy.stats.rest_rate, 0.5);

  copy.load({ seeds: 'lots', feathers: -5, birds: { owl: NaN, dodo: 4 }, upgrades: ['nope'], tasks: 'junk' });
  assert.equal(copy.seeds, 0);
  assert.equal(copy.feathers, 0);
  assert.equal(copy.bird('owl').owned, 0);
  assert.equal(copy.upgrades.some((upgrade) => upgrade.purchased), false);
  assert.equal(copy.tasks.slots.length, 3);
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
