import { Bird } from '../models/Bird.js';
import { Upgrade } from '../models/Upgrade.js';
import { Buffs } from '../systems/Buffs.js';
import { Combo } from '../systems/Combo.js';
import { DayNightCycle } from '../systems/DayNightCycle.js';
import { TaskBoard } from '../systems/TaskBoard.js';
import { Visitor } from '../systems/Visitor.js';

const SAVE_VERSION = 2;
const CATCH_UP_AFTER_SECONDS = 60; // longer gaps (sleep, throttled tabs) are paid at the day/night average

/**
 * The game state and its rules. No DOM in here, so it also runs under Node tests.
 * Fires 'phasechange', 'kingfisherarrive'/'kingfisherleave', 'goldenarrive'/'goldenleave' and 'taskdone'.
 */
export class Game extends EventTarget {
  constructor(content, { clock = Date.now, random = Math.random } = {}) {
    super();
    const now = clock();
    this.rules = content.rules;
    this.clock = clock;
    this.random = random;
    this.birds = content.birds.map((def) => new Bird(def));
    this.upgrades = content.upgrades.map((def) => new Upgrade(def));
    this.boons = content.boons;
    this.cycle = new DayNightCycle(content.rules);
    this.kingfisher = new Visitor(content.kingfisher, now, { interval: 'kingfisher_interval', stay: 'kingfisher_stay', random });
    this.goldenSeed = new Visitor(content.golden_seed, now, { interval: 'golden_interval', stay: 'golden_stay', random });
    this.buffs = new Buffs();
    this.combo = new Combo();
    this.tasks = new TaskBoard(content.tasks, random);
    this.seeds = 0;
    this.feathers = 0;
    this.seedsEarned = 0;
    this.clicks = 0;
    this.kingfisherCatches = 0;
    this.goldenCatches = 0;
    this.pets = 0;
    this.lastTick = now;
    this.wasDay = this.isDay(now);
    this.recomputeStats();
    this.tasks.fill(this);
  }

  bird(id) {
    return this.birds.find((bird) => bird.id === id);
  }

  upgrade(id) {
    return this.upgrades.find((upgrade) => upgrade.id === id);
  }

  isDay(now = this.clock()) {
    return this.cycle.at(now).isDay;
  }

  productionPerSecond(isDay = this.isDay()) {
    return this.birds.reduce((sum, bird) => sum + bird.production(this.stats, isDay), 0) * this.stats.global;
  }

  averageProductionPerSecond() {
    return this.cycle.average(this.productionPerSecond(true), this.productionPerSecond(false));
  }

  clickPower() {
    return this.stats.click + this.stats.click_from_production * this.productionPerSecond();
  }

  /** The combo bonus on shakes: it grows every 10 shakes in a row, up to the combo cap. */
  comboMultiplier(now = this.clock()) {
    const shakes = Math.min(Math.floor(this.combo.current(now, this.stats.combo_window) / 10) * 10, this.rules.combo_full);
    return 1 + (shakes / this.rules.combo_full) * (this.stats.combo_cap - 1);
  }

  click() {
    const now = this.clock();
    this.combo.hit(now, this.stats.combo_window);
    const gained = this.clickPower() * this.comboMultiplier(now);
    this.clicks += 1;
    this.#earn(gained);
    return gained;
  }

  /** Petting a bird in the aviary: a shake's worth of seeds plus a few seconds of that bird's foraging. */
  petBird(id) {
    const perBird = this.bird(id).ratePerBird(this.stats) * this.stats.global;
    const gained = (this.clickPower() + perBird * this.rules.pet_seconds) * this.stats.pet_power;
    this.pets += 1;
    this.#earn(gained);
    return gained;
  }

  birdCost(bird, amount = 1) {
    return Math.ceil(bird.cost(this.rules.cost_growth, amount) * this.stats.bird_cost);
  }

  buyBird(id, amount = 1) {
    const bird = this.bird(id);
    const cost = this.birdCost(bird, amount);
    if (this.seeds < cost) return false;
    this.seeds -= cost;
    bird.owned += amount;
    return true;
  }

  canAfford(upgrade) {
    return this[upgrade.currency] >= upgrade.cost; // currency is 'seeds' or 'feathers', same as the wallet fields
  }

  buyUpgrade(id) {
    const upgrade = this.upgrade(id);
    if (upgrade.purchased || !upgrade.isUnlocked(this) || !this.canAfford(upgrade)) return false;
    this[upgrade.currency] -= upgrade.cost;
    upgrade.purchased = true;
    this.recomputeStats();
    return true;
  }

  catchKingfisher() {
    if (!this.kingfisher.catch(this.clock(), this.stats)) return 0;
    const feathers = this.kingfisher.def.feathers_per_catch + this.stats.kingfisher_feathers;
    this.kingfisherCatches += 1;
    this.feathers += feathers;
    return feathers;
  }

  /** Catches the golden seed if one is out. Returns { boon, seeds, feathers }, or null if there was none. */
  catchGoldenSeed() {
    const now = this.clock();
    if (!this.goldenSeed.catch(now, this.stats)) return null;
    this.goldenCatches += 1;
    const boon = pickWeighted(this.boons, this.random);
    const power = this.stats.golden_power;
    const seeds = boon.seconds_of_seeds
      ? Math.max(this.clickPower() * 30, this.averageProductionPerSecond() * boon.seconds_of_seeds) * power
      : 0;
    this.#earn(seeds);
    this.feathers += boon.feathers;
    if (boon.duration) {
      this.buffs.add(boon, now, power);
      this.recomputeStats();
    }
    return { boon, seeds, feathers: boon.feathers };
  }

  rerollTask(i) {
    this.tasks.reroll(i, this);
  }

  /** Counters that upgrades, headlines and tasks check (see Progress in backend/upgrades/base.py). */
  progress(key) {
    switch (key) {
      case 'clicks': return this.clicks;
      case 'seeds_earned': return this.seedsEarned;
      case 'birds': return this.birds.reduce((sum, bird) => sum + bird.owned, 0);
      case 'species': return this.birds.filter((bird) => bird.owned > 0).length;
      case 'upgrades': return this.upgrades.filter((upgrade) => upgrade.purchased).length;
      case 'kingfisher_catches': return this.kingfisherCatches;
      case 'golden_catches': return this.goldenCatches;
      case 'pets': return this.pets;
      case 'tasks': return this.tasks.completed;
      case 'combo': return this.combo.current(this.clock(), this.stats.combo_window);
      case 'best_combo': return this.combo.best;
      default: break;
    }
    if (!key.startsWith('owned:')) return 0;
    const target = key.slice('owned:'.length); // a bird id or an activity ('day' / 'night')
    return this.birds.reduce((sum, bird) => (bird.id === target || bird.activity === target ? sum + bird.owned : sum), 0);
  }

  tick() {
    const now = this.clock();
    const seconds = Math.max(0, (now - this.lastTick) / 1000);
    this.lastTick = now;
    if (this.buffs.expire(now)) this.recomputeStats();
    const isDay = this.isDay(now);
    if (seconds > CATCH_UP_AFTER_SECONDS) this.catchUp(seconds);
    else this.#earn(this.productionPerSecond(isDay) * seconds);

    if (isDay !== this.wasDay) {
      this.wasDay = isDay;
      this.dispatchEvent(new Event('phasechange'));
    }
    for (const [visitor, name] of [[this.kingfisher, 'kingfisher'], [this.goldenSeed, 'golden']]) {
      const visit = visitor.update(now, this.stats);
      if (visit) this.dispatchEvent(new Event(`${name}${visit}`));
    }
    for (const done of this.tasks.update(this)) {
      this.#earn(done.seeds);
      this.feathers += done.feathers;
      this.dispatchEvent(new CustomEvent('taskdone', { detail: done }));
    }
  }

  /** Credits time spent away (closed tab, sleep) at the average day/night rate. Returns seeds gained. */
  catchUp(seconds) {
    if (!(seconds > 0)) return 0;
    const gained = this.averageProductionPerSecond() * seconds;
    this.#earn(gained);
    return gained;
  }

  recomputeStats() {
    const { rules } = this;
    const stats = {
      click: rules.base_click,
      click_from_production: 0,
      global: 1,
      rest_rate: rules.rest_rate,
      bird_cost: 1,
      kingfisher_interval: 1,
      kingfisher_stay: 1,
      kingfisher_feathers: 0,
      golden_interval: 1,
      golden_stay: 1,
      golden_power: 1,
      combo_cap: rules.combo_cap,
      combo_window: rules.combo_window,
      pet_power: 1,
      task_reward: 1,
    };
    for (const upgrade of this.upgrades) if (upgrade.purchased) upgrade.applyTo(stats);
    this.buffs.applyTo(stats);
    this.stats = stats;
  }

  toSave() {
    return {
      version: SAVE_VERSION,
      seeds: this.seeds,
      feathers: this.feathers,
      seedsEarned: this.seedsEarned,
      clicks: this.clicks,
      kingfisherCatches: this.kingfisherCatches,
      goldenCatches: this.goldenCatches,
      pets: this.pets,
      bestCombo: this.combo.best,
      birds: Object.fromEntries(this.birds.map((bird) => [bird.id, bird.owned])),
      upgrades: this.upgrades.filter((upgrade) => upgrade.purchased).map((upgrade) => upgrade.id),
      tasks: this.tasks.toSave(),
    };
  }

  /** Restores a save, ignoring anything malformed or no longer in the game. Version 1 saves load too. */
  load(save) {
    this.seeds = amount(save.seeds);
    this.feathers = amount(save.feathers);
    this.seedsEarned = amount(save.seedsEarned);
    this.clicks = amount(save.clicks);
    this.kingfisherCatches = amount(save.kingfisherCatches);
    this.goldenCatches = amount(save.goldenCatches);
    this.pets = amount(save.pets);
    this.combo.best = amount(save.bestCombo);
    for (const bird of this.birds) bird.owned = Math.floor(amount(save.birds?.[bird.id]));
    const bought = new Set(Array.isArray(save.upgrades) ? save.upgrades : []);
    for (const upgrade of this.upgrades) upgrade.purchased = bought.has(upgrade.id);
    this.recomputeStats();
    this.tasks.load(save.tasks, this);
  }

  #earn(seeds) {
    this.seeds += seeds;
    this.seedsEarned += seeds;
  }
}

const amount = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

function pickWeighted(options, random) {
  let roll = random() * options.reduce((sum, option) => sum + option.weight, 0);
  return options.find((option) => (roll -= option.weight) < 0) ?? options[options.length - 1];
}
