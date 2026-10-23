import { Bird } from '../models/Bird.js';
import { Upgrade } from '../models/Upgrade.js';
import { DayNightCycle } from '../systems/DayNightCycle.js';
import { KingfisherVisitor } from '../systems/KingfisherVisitor.js';

const SAVE_VERSION = 1;
const CATCH_UP_AFTER_SECONDS = 60; // longer gaps (sleep, throttled tabs) are paid at the day/night average

/**
 * The game state and its rules. No DOM in here, so it also runs under Node tests.
 * Fires 'phasechange', 'kingfisherarrive' and 'kingfisherleave' events.
 */
export class Game extends EventTarget {
  constructor(content, { clock = Date.now, random = Math.random } = {}) {
    super();
    const now = clock();
    this.rules = content.rules;
    this.clock = clock;
    this.birds = content.birds.map((def) => new Bird(def));
    this.upgrades = content.upgrades.map((def) => new Upgrade(def));
    this.cycle = new DayNightCycle(content.rules);
    this.kingfisher = new KingfisherVisitor(content.kingfisher, now, random);
    this.seeds = 0;
    this.feathers = 0;
    this.seedsEarned = 0;
    this.clicks = 0;
    this.lastTick = now;
    this.wasDay = this.isDay(now);
    this.recomputeStats();
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

  click() {
    const gained = this.clickPower();
    this.clicks += 1;
    this.#earn(gained);
    return gained;
  }

  buyBird(id, amount = 1) {
    const bird = this.bird(id);
    const cost = bird.cost(this.rules.cost_growth, amount);
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
    const feathers = this.kingfisher.catch(this.clock(), this.stats);
    this.feathers += feathers;
    return feathers;
  }

  /** Counters that upgrade requirements check: 'clicks', 'seeds_earned' or 'owned:<bird id or activity>'. */
  progress(key) {
    if (key === 'clicks') return this.clicks;
    if (key === 'seeds_earned') return this.seedsEarned;
    if (!key.startsWith('owned:')) return 0;
    const target = key.slice('owned:'.length);
    return this.birds.reduce((sum, bird) => (bird.id === target || bird.activity === target ? sum + bird.owned : sum), 0);
  }

  tick() {
    const now = this.clock();
    const seconds = Math.max(0, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const isDay = this.isDay(now);
    if (seconds > CATCH_UP_AFTER_SECONDS) this.catchUp(seconds);
    else this.#earn(this.productionPerSecond(isDay) * seconds);

    if (isDay !== this.wasDay) {
      this.wasDay = isDay;
      this.dispatchEvent(new Event('phasechange'));
    }
    const visit = this.kingfisher.update(now, this.stats);
    if (visit) this.dispatchEvent(new Event(`kingfisher${visit}`));
  }

  /** Credits time spent away (closed tab, sleep) at the average day/night rate. Returns seeds gained. */
  catchUp(seconds) {
    if (!(seconds > 0)) return 0;
    const gained = this.averageProductionPerSecond() * seconds;
    this.#earn(gained);
    return gained;
  }

  recomputeStats() {
    const stats = {
      click: this.rules.base_click,
      click_from_production: 0,
      global: 1,
      rest_rate: this.rules.rest_rate,
      kingfisher_interval: 1,
      kingfisher_stay: 1,
      kingfisher_feathers: 0,
    };
    for (const upgrade of this.upgrades) if (upgrade.purchased) upgrade.applyTo(stats);
    this.stats = stats;
  }

  toSave() {
    return {
      version: SAVE_VERSION,
      seeds: this.seeds,
      feathers: this.feathers,
      seedsEarned: this.seedsEarned,
      clicks: this.clicks,
      birds: Object.fromEntries(this.birds.map((bird) => [bird.id, bird.owned])),
      upgrades: this.upgrades.filter((upgrade) => upgrade.purchased).map((upgrade) => upgrade.id),
    };
  }

  /** Restores a save, ignoring anything malformed or no longer in the game. */
  load(save) {
    this.seeds = amount(save.seeds);
    this.feathers = amount(save.feathers);
    this.seedsEarned = amount(save.seedsEarned);
    this.clicks = amount(save.clicks);
    for (const bird of this.birds) bird.owned = Math.floor(amount(save.birds?.[bird.id]));
    const bought = new Set(Array.isArray(save.upgrades) ? save.upgrades : []);
    for (const upgrade of this.upgrades) upgrade.purchased = bought.has(upgrade.id);
    this.recomputeStats();
  }

  #earn(seeds) {
    this.seeds += seeds;
    this.seedsEarned += seeds;
  }
}

const amount = (value) => (Number.isFinite(value) && value > 0 ? value : 0);
