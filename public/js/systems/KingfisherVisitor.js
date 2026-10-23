/** Schedules the Kingfisher's visits to the river and pays out feathers when you catch it. */
export class KingfisherVisitor {
  constructor(def, now, random = Math.random) {
    this.def = def;
    this.random = random;
    this.leavesAt = null; // set while the Kingfisher is perched
    this.nextVisitAt = now + def.first_visit_seconds * 1000;
  }

  get isVisiting() {
    return this.leavesAt !== null;
  }

  /** Advances the schedule. Returns 'arrive', 'leave' or null. */
  update(now, stats) {
    if (this.isVisiting && now >= this.leavesAt) {
      this.#scheduleNext(now, stats);
      return 'leave';
    }
    if (!this.isVisiting && now >= this.nextVisitAt) {
      this.leavesAt = now + this.def.stay_seconds * stats.kingfisher_stay * 1000;
      return 'arrive';
    }
    return null;
  }

  /** Returns the feathers earned, or 0 if there was nothing to catch. */
  catch(now, stats) {
    if (!this.isVisiting) return 0;
    this.#scheduleNext(now, stats);
    return this.def.feathers_per_catch + stats.kingfisher_feathers;
  }

  #scheduleNext(now, stats) {
    const { min_interval_seconds: min, max_interval_seconds: max } = this.def;
    this.leavesAt = null;
    this.nextVisitAt = now + (min + (max - min) * this.random()) * stats.kingfisher_interval * 1000;
  }
}
