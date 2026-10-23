import { birdSprites } from '../pixel/birds.js';
import { ROW_HEIGHT, habitatScene } from '../pixel/scenery.js';
import { BirdActor } from './BirdActor.js';

const SCALE = 3; // screen pixels per art pixel
const GROUND = ROW_HEIGHT - 5; // where birds stand, in art pixels from the top of their strip
const MAX_BIRDS = 10; // per strip; more would just be a crowd
const REDUCED_MOTION = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** The middle panel: a pixel-art habitat strip for every species you own, with its birds living in it. */
export class Aviary {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('aviary');
    this.canvas = document.getElementById('aviary-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.labels = document.getElementById('aviary-labels');
    this.rows = []; // { bird, actors, label, count, filled } in store order
    this.width = 0;
    this.night = game.isDay() ? 0 : 1;
    this.#resize(); // measure now: the first frame runs before ResizeObserver reports
    new ResizeObserver(() => this.#resize()).observe(this.el);
  }

  /** A few times a second: strips for newly owned species, and birds for newly bought ones. */
  update() {
    for (const bird of this.game.birds) {
      if (bird.owned === 0) continue;
      const row = this.rows.find((r) => r.bird === bird) ?? this.#addRow(bird);
      // Birds bought during play fly in; the flock already saved at page load is simply there.
      while (row.actors.length < Math.min(bird.owned, MAX_BIRDS)) row.actors.push(this.#actor(bird, row.filled));
      row.filled = true;
      row.count.textContent = `×${bird.owned}`;
      row.label.classList.toggle('resting', !bird.isAwake(this.game.isDay()));
    }
    this.el.classList.toggle('is-empty', this.rows.length === 0);
  }

  /** Every frame: move the birds and repaint the strips. */
  animate(now, dt) {
    const isDay = this.game.isDay();
    this.night += ((isDay ? 0 : 1) - this.night) * Math.min(1, dt / 2.5);
    const { ctx } = this;
    this.rows.forEach((row, i) => {
      const top = i * ROW_HEIGHT;
      const awake = row.bird.isAwake(isDay);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, top, this.width, ROW_HEIGHT);
      ctx.clip();
      ctx.drawImage(habitatScene(row.bird.habitat, this.width), 0, top);
      // Resting birds sit under the night shade; awake night birds are drawn over it, bright.
      if (awake) this.#shade(top);
      for (const actor of row.actors) actor.update(dt, awake);
      for (const actor of [...row.actors].sort((a, b) => a.lane - b.lane)) this.#draw(row.bird, actor, top);
      if (!awake) {
        this.#shade(top);
        this.#snores(row, top, now);
      }
      ctx.fillStyle = '#262b44';
      ctx.fillRect(0, top + ROW_HEIGHT - 2, this.width, 1);
      ctx.fillStyle = '#0d0e17';
      ctx.fillRect(0, top + ROW_HEIGHT - 1, this.width, 1);
      ctx.restore();
    });
  }

  #resize() {
    const width = Math.floor(this.el.clientWidth / SCALE);
    if (width === this.width || width <= 0) return;
    this.width = width;
    for (const row of this.rows) {
      for (const actor of row.actors) {
        actor.maxX = width - 10;
        actor.x = Math.min(actor.x, actor.maxX);
      }
    }
    this.#layout();
  }

  #layout() {
    this.canvas.width = this.width;
    this.canvas.height = this.rows.length * ROW_HEIGHT;
    this.canvas.style.width = `${this.width * SCALE}px`;
    this.canvas.style.height = `${this.rows.length * ROW_HEIGHT * SCALE}px`;
    this.rows.forEach((row, i) => {
      row.label.style.top = `${(i * ROW_HEIGHT + ROW_HEIGHT) * SCALE - 30}px`;
    });
  }

  #addRow(bird) {
    const label = document.createElement('span');
    label.className = 'habitat-label';
    label.innerHTML = `<b>${bird.name}</b> <span class="count"></span> <span class="where">${capitalize(bird.habitat)}</span>`;
    this.labels.append(label);
    const row = { bird, actors: [], label, count: label.querySelector('.count'), filled: false };
    this.rows.push(row);
    this.rows.sort((a, b) => this.game.birds.indexOf(a.bird) - this.game.birds.indexOf(b.bird));
    this.#layout();
    return row;
  }

  #actor(bird, arriving) {
    const actor = new BirdActor({
      minX: 10,
      maxX: this.width - 10,
      x: 10 + Math.random() * (this.width - 20),
      front: bird.plumage.pose === 'front',
      arriving,
      still: REDUCED_MOTION,
    });
    actor.lane = Math.floor(Math.random() * 3); // a little depth: back lanes stand slightly higher
    return actor;
  }

  #draw(bird, actor, top) {
    const sprites = birdSprites(bird.plumage);
    const { animation, frame, x, lift, flip } = actor.pose;
    const art = sprites.frames[animation][frame];
    const anchorX = flip ? sprites.width - sprites.anchorX : sprites.anchorX;
    const ground = top + GROUND - (2 - actor.lane) * 2;
    this.ctx.drawImage(flip ? art.left : art.right, Math.round(x - anchorX), Math.round(ground - sprites.anchorY - lift));
  }

  #shade(top) {
    if (this.night < 0.01) return;
    this.ctx.fillStyle = `rgb(16 20 56 / ${0.5 * this.night})`;
    this.ctx.fillRect(0, top, this.width, ROW_HEIGHT);
  }

  /** Little pixel z's drifting up from a few of the sleepers. */
  #snores(row, top, now) {
    const { ctx } = this;
    row.actors.forEach((actor, i) => {
      if (i % 3 || actor.state !== 'sleep') return;
      const cycle = (now / 1000 + i * 0.7) % 2.4;
      const x = Math.round(actor.x + 3 + cycle * 2);
      const y = Math.round(top + GROUND - 14 - cycle * 3);
      ctx.globalAlpha = Math.min(1, 2.4 - cycle);
      ctx.fillStyle = '#e8eeff';
      ctx.fillRect(x, y, 3, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
      ctx.fillRect(x, y + 2, 3, 1);
      ctx.globalAlpha = 1;
    });
  }
}

const capitalize = (word) => word[0].toUpperCase() + word.slice(1);
