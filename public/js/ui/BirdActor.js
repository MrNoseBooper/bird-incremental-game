// How often a bird picks each activity when it finishes one. Owls (front view) look around instead of pecking.
const SIDE_HABITS = [['idle', 20], ['walk', 30], ['hop', 16], ['peck', 26], ['fly', 8]];
const FRONT_HABITS = [['idle', 40], ['walk', 30], ['peck', 20], ['fly', 10]];
const ARRIVAL_HEIGHT = 22; // art pixels above the ground where a newly bought bird flies in

/**
 * One bird in an aviary strip: it idles, walks, hops, pecks, flies to new spots and sleeps when its
 * species is resting. Pure logic in art pixels and seconds; Aviary draws whatever `pose` says.
 */
export class BirdActor {
  constructor({ minX, maxX, x, front = false, arriving = false, still = false, random = Math.random }) {
    Object.assign(this, { minX, maxX, front, still, random });
    this.dir = random() < 0.5 ? -1 : 1;
    this.lift = 0;
    this.blinkIn = 1 + random() * 4;
    if (arriving) {
      this.x = this.dir > 0 ? minX - 24 : maxX + 24;
      this.#flyTo(x, ARRIVAL_HEIGHT);
    } else {
      this.x = x;
      this.#enter('idle');
    }
  }

  get airborne() {
    return this.state === 'fly' || this.state === 'hop';
  }

  update(dt, awake) {
    this.time += dt;
    this.blinkIn -= dt;
    if (this.blinkIn < -0.15) this.blinkIn = 2 + this.random() * 4;
    if (!awake && !this.airborne && this.state !== 'sleep') this.#enter('sleep');
    if (awake && this.state === 'sleep') this.#enter('idle');

    if (this.state === 'walk') this.#walk(dt);
    else if (this.state === 'hop') this.#hop();
    else if (this.state === 'fly') this.#fly();
    else if (this.time >= this.duration) this.#next();
  }

  /** What to draw: which animation, which frame of it, where, and which way the bird faces. */
  get pose() {
    const t = this.time;
    const frames = {
      walk: ['walk', Math.floor(t * 8) % 2],
      hop: ['hop', this.inAir ? 1 : 0],
      peck: ['peck', Math.floor(t * 7) % 2],
      fly: ['fly', Math.floor(t * 12) % 4],
      sleep: ['sleep', Math.floor(t * 0.8) % 2],
      idle: this.blinkIn < 0 ? ['blink', 0] : ['idle', Math.floor(t * 1.6) % 2],
    };
    const [animation, frame] = frames[this.state];
    return { animation, frame, x: this.x, lift: this.lift, flip: this.dir < 0 };
  }

  #enter(state) {
    this.state = state;
    this.time = 0;
    this.lift = 0;
    this.inAir = false;
    // Hops and flights end themselves; sleep lasts until the species wakes.
    this.duration = { idle: 1 + this.random() * 2, walk: 1 + this.random() * 1.5, peck: 0.8 + this.random() }[state] ?? Infinity;
    if (state === 'walk' && this.random() < 0.5) this.dir = -this.dir;
    if (state === 'hop') {
      this.hopFrom = this.x;
      if (this.x + this.dir * 12 > this.maxX || this.x + this.dir * 12 < this.minX) this.dir = -this.dir;
    }
  }

  #next() {
    const habits = this.front ? FRONT_HABITS : SIDE_HABITS;
    let roll = this.random() * habits.reduce((sum, [, weight]) => sum + weight, 0);
    const [state] = this.still ? ['idle'] : habits.find(([, weight]) => (roll -= weight) < 0);
    if (state !== 'fly') return this.#enter(state);
    // Fly to a spot between a third and two thirds of the strip away.
    const span = this.maxX - this.minX;
    this.#flyTo(this.minX + ((this.x - this.minX + span / 3 + (this.random() * span) / 3) % span), 0);
  }

  #walk(dt) {
    this.x += this.dir * (this.front ? 5 : 9) * dt;
    if (this.x < this.minX || this.x > this.maxX) {
      this.x = Math.min(this.maxX, Math.max(this.minX, this.x));
      this.dir = -this.dir;
    }
    if (this.time >= this.duration) this.#next();
  }

  /** Crouch, spring forward in an arc, land; sometimes hop again. */
  #hop() {
    const t = this.time;
    this.inAir = t >= 0.1 && t < 0.38;
    if (this.inAir) {
      const p = (t - 0.1) / 0.28;
      this.lift = Math.sin(Math.PI * p) * 5;
      this.x = Math.min(this.maxX, Math.max(this.minX, this.hopFrom + this.dir * 9 * p));
    } else {
      this.lift = 0;
    }
    if (t >= 0.46) this.#enter(this.random() < 0.35 ? 'hop' : 'idle');
  }

  #flyTo(x, startLift) {
    this.#enter('fly');
    this.fromX = this.x;
    this.toX = Math.min(this.maxX, Math.max(this.minX, x));
    this.startLift = startLift;
    this.flightTime = Math.max(0.8, Math.abs(this.toX - this.fromX) / 40);
    this.dir = this.toX >= this.fromX ? 1 : -1;
  }

  /** Flap along an arc to the target, then land. */
  #fly() {
    const p = Math.min(1, this.time / this.flightTime);
    this.x = this.fromX + (this.toX - this.fromX) * p;
    this.lift = this.startLift * (1 - p) + Math.sin(Math.PI * p) * 10;
    if (p >= 1) this.#enter('idle');
  }
}
