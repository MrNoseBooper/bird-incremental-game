import { applyEffects } from '../models/Upgrade.js';

/** Timed boosts from golden seeds. Catching the same boost again restarts its timer instead of stacking it. */
export class Buffs {
  constructor() {
    this.active = [];
  }

  add(boon, now, lengthScale = 1) {
    const duration = boon.duration * lengthScale;
    this.active = this.active.filter((buff) => buff.id !== boon.id);
    this.active.push({ id: boon.id, name: boon.name, effects: boon.effects, duration, endsAt: now + duration * 1000 });
  }

  /** Drops boosts that have run out. True if any did, so stats need recomputing. */
  expire(now) {
    const before = this.active.length;
    this.active = this.active.filter((buff) => buff.endsAt > now);
    return this.active.length !== before;
  }

  applyTo(stats) {
    for (const buff of this.active) applyEffects(stats, buff.effects);
  }
}
