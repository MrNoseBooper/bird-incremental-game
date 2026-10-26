import { formatNumber } from '../utils/format.js';

const SLOTS = 3;

/**
 * The field task board: three short goals at a time. A finished task pays out and a new one is dealt.
 * Tasks measure counters from the moment they were dealt, so they survive saving and reloading.
 */
export class TaskBoard {
  constructor(kinds, random = Math.random) {
    this.kinds = new Map(kinds.map((kind) => [kind.id, kind]));
    this.random = random;
    this.slots = []; // { kind, target, start, best }
    this.completed = 0;
  }

  fill(game) {
    while (this.slots.length < SLOTS) this.slots.push(this.#deal(game));
  }

  describe(task) {
    return this.kinds.get(task.kind).text.replace('{n}', formatNumber(task.target));
  }

  progressOf(task, game) {
    const kind = this.kinds.get(task.kind);
    return kind.peak ? task.best : game.progress(kind.counter) - task.start;
  }

  /** Checks every task; returns the finished ones with their rewards and deals replacements. */
  update(game) {
    const finished = [];
    this.slots.forEach((task, i) => {
      const kind = this.kinds.get(task.kind);
      if (kind.peak) task.best = Math.max(task.best, game.progress(kind.counter));
      if (this.progressOf(task, game) < task.target) return;
      this.completed += 1;
      finished.push({
        text: this.describe(task),
        seeds: Math.max(game.clickPower() * 20, game.averageProductionPerSecond() * kind.reward_seconds) * game.stats.task_reward,
        feathers: this.random() < kind.feather_chance ? 1 : 0,
      });
      this.slots[i] = this.#deal(game);
    });
    return finished;
  }

  /** Swaps a task the player doesn't fancy for one of a different kind. */
  reroll(i, game) {
    this.slots[i] = this.#deal(game);
  }

  toSave() {
    return { completed: this.completed, slots: this.slots };
  }

  /** Restores saved tasks, dropping any that no longer make sense, then tops the board up. */
  load(save, game) {
    this.completed = Math.floor(Number.isFinite(save?.completed) ? Math.max(0, save.completed) : 0);
    const valid = (task) => this.kinds.has(task?.kind) && task.target > 0 && Number.isFinite(task.start);
    this.slots = (Array.isArray(save?.slots) ? save.slots : []).filter(valid).slice(0, SLOTS)
      .map(({ kind, target, start, best }) => ({ kind, target, start, best: Number.isFinite(best) ? best : 0 }));
    this.fill(game);
  }

  #deal(game) {
    const taken = new Set(this.slots.map((task) => task.kind));
    const upgradesLeft = game.upgrades.some((upgrade) => !upgrade.purchased);
    let options = [...this.kinds.values()].filter((kind) => !taken.has(kind.id) && (kind.counter !== 'upgrades' || upgradesLeft));
    if (!options.length) options = [...this.kinds.values()];
    const kind = options[Math.floor(this.random() * options.length)];
    return { kind: kind.id, target: targetFor(kind, game, this.completed), start: game.progress(kind.counter), best: 0 };
  }
}

function targetFor(kind, game, completed) {
  if (kind.production_seconds) return roundUp(Math.max(kind.base, game.averageProductionPerSecond() * kind.production_seconds));
  return Math.max(1, Math.round(kind.base + kind.step * completed));
}

/** Rounds up to two significant figures, so targets read cleanly: 4,321 -> 4,400. */
function roundUp(value) {
  const unit = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1);
  return Math.ceil(value / unit) * unit;
}
