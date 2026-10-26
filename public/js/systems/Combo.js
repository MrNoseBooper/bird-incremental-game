/** Shakes in quick succession build a combo; pausing longer than the window breaks it. */
export class Combo {
  constructor() {
    this.count = 0;
    this.lastAt = -Infinity;
    this.best = 0;
  }

  hit(now, windowSeconds) {
    this.count = this.current(now, windowSeconds) + 1;
    this.lastAt = now;
    this.best = Math.max(this.best, this.count);
  }

  current(now, windowSeconds) {
    return now - this.lastAt <= windowSeconds * 1000 ? this.count : 0;
  }
}
