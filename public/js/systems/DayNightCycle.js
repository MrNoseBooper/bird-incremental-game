/** Day and night alternate on a fixed loop driven by the wall clock, so nothing needs saving. */
export class DayNightCycle {
  constructor({ day_seconds, night_seconds }) {
    this.daySeconds = day_seconds;
    this.nightSeconds = night_seconds;
  }

  /** @returns {{ isDay: boolean, remaining: number, progress: number }} remaining is in seconds */
  at(nowMs) {
    const t = (nowMs / 1000) % (this.daySeconds + this.nightSeconds);
    const isDay = t < this.daySeconds;
    const length = isDay ? this.daySeconds : this.nightSeconds;
    const elapsed = isDay ? t : t - this.daySeconds;
    return { isDay, remaining: length - elapsed, progress: elapsed / length };
  }

  /** Average of a per-phase value over one full cycle. */
  average(dayValue, nightValue) {
    return (dayValue * this.daySeconds + nightValue * this.nightSeconds) / (this.daySeconds + this.nightSeconds);
  }
}
