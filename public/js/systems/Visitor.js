/**
 * Schedules something that turns up now and then and leaves if nobody catches it in time:
 * the Kingfisher, or a golden seed. `interval` and `stay` name the stats that stretch its timings.
 */
export class Visitor {
  constructor(def, now, { interval, stay, random = Math.random }) {
    this.def = def;
    this.intervalStat = interval;
    this.stayStat = stay;
    this.random = random;
    this.leavesAt = null; // set while it's here
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
      this.leavesAt = now + this.def.stay_seconds * stats[this.stayStat] * 1000;
      return 'arrive';
    }
    return null;
  }

  /** True if there was something to catch. */
  catch(now, stats) {
    if (!this.isVisiting) return false;
    this.#scheduleNext(now, stats);
    return true;
  }

  #scheduleNext(now, stats) {
    const { min_interval_seconds: min, max_interval_seconds: max } = this.def;
    this.leavesAt = null;
    this.nextVisitAt = now + (min + (max - min) * this.random()) * stats[this.intervalStat] * 1000;
  }
}
