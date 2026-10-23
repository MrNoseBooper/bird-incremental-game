import { mix } from '../pixel/color.js';
import { birdSprites, tinyFlyerFrames } from '../pixel/birds.js';
import { iconImg } from '../pixel/icons.js';
import { branchSprite, cloudSprites, coveBackdrop, moonSprite, sunFrames } from '../pixel/scenery.js';
import { SUNFLOWER, rayFrames, sunflowerFrames } from '../pixel/sunflower.js';
import { formatNumber } from '../utils/format.js';
import { ParticleField } from './ParticleField.js';
import { toast } from './toast.js';

const SCALE = 4; // screen pixels per art pixel
const RIVER = 0.86; // where the water starts, as a fraction of the cove's height
const MAX_ORBITING = 14; // one tidy ring; more just hides the sunflower
const PRESS_MS = 90;
const RIVER_DAY = ['#4fb3e0', '#3d9fd3', '#2f8ac2', '#2575ae'];
const RIVER_NIGHT = ['#21406f', '#1b365f', '#162d52', '#112446'];
const REDUCED_MOTION = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) ** 2;

/** The cove (left panel), drawn as one pixel-art scene; the sunflower and Kingfisher are buttons laid over it. */
export class Scene {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('scene');
    this.canvas = document.getElementById('cove-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sunflowerButton = document.getElementById('sunflower');
    this.kingfisherButton = document.getElementById('kingfisher');
    this.featherCounter = document.getElementById('feather-pill');
    this.particles = new ParticleField();
    this.orbitBird = game.birds[0]; // the first bird circles the sunflower, like Cookie Clicker's cursors
    this.art = {
      flower: sunflowerFrames(),
      flowerNight: sunflowerFrames(true),
      rays: rayFrames(32),
      shine: rayFrames(18, { beams: 12, color: '#b8f6ff', steps: 8 }),
      sun: sunFrames(),
      moon: moonSprite(),
      clouds: cloudSprites(),
      branch: branchSprite(),
      kingfisher: birdSprites(game.kingfisher.def.plumage),
      orbiter: tinyFlyerFrames(this.orbitBird.plumage),
    };
    this.kingfisher = { state: 'away', time: 0 };
    this.night = game.isDay() ? 0 : 1;
    this.orbitTurn = 0;
    this.pressedAt = -Infinity;
    this.nextSparkle = 0;

    this.sunflowerButton.addEventListener('click', (event) => this.#shakeSunflower(event));
    this.kingfisherButton.addEventListener('click', () => this.#catchKingfisher());
    game.addEventListener('kingfisherarrive', () => {
      this.kingfisher = { state: 'arriving', time: 0 };
      this.kingfisherButton.hidden = false;
      toast(`${iconImg('sparkle')} A <b>Kingfisher</b> has landed by the river! Click it before it flies off.`);
    });
    game.addEventListener('kingfisherleave', () => {
      this.kingfisher = { state: 'leaving', time: 0 };
      this.kingfisherButton.hidden = true;
      toast('The Kingfisher flew off downstream. Keep an eye on the river.');
    });
    game.addEventListener('phasechange', () => {
      toast(game.isDay()
        ? `${iconImg('sun')} Dawn: day birds wake up and night birds settle down.`
        : `${iconImg('moon')} Dusk: night birds wake up and day birds settle down.`);
    });

    this.#layout();
    new ResizeObserver(() => this.#layout()).observe(this.root);
  }

  /** Slow-changing state for the page's styles. */
  update() {
    document.body.classList.toggle('is-night', !this.game.isDay());
  }

  /** Every frame: repaint the whole cove. */
  animate(now, dt) {
    const { ctx, game } = this;
    const { width, height, river } = this.size;
    const phase = game.cycle.at(game.clock());
    const t = now / 1000;
    this.night += ((phase.isDay ? 0 : 1) - this.night) * Math.min(1, dt / 2.5);

    ctx.drawImage(coveBackdrop(width, height, false), 0, 0);
    if (this.night > 0.01) {
      ctx.globalAlpha = this.night;
      ctx.drawImage(coveBackdrop(width, height, true), 0, 0);
      ctx.globalAlpha = 1;
    }
    this.#drawStars(t);
    this.#drawSkyBodies(phase, t);
    this.#drawClouds(t);
    this.particles.drawFireflies(ctx, now, this.night, width, river);
    this.particles.update(dt, { width, river, rainPerSecond: rainRate(game.productionPerSecond(phase.isDay)) });
    this.particles.draw(ctx, 'back');
    this.#drawSunflower(now, t);
    this.#drawOrbit(dt, t);
    ctx.drawImage(this.art.branch, width - this.art.branch.width + 3, river - 6);
    this.#drawKingfisher(now, dt);
    this.#drawRiver(t);
    this.particles.draw(ctx, 'front');
  }

  #layout() {
    const width = Math.ceil(this.root.clientWidth / SCALE);
    const height = Math.ceil(this.root.clientHeight / SCALE);
    Object.assign(this.canvas, { width, height });
    Object.assign(this.canvas.style, { width: `${width * SCALE}px`, height: `${height * SCALE}px` });
    const river = Math.round(height * RIVER);
    const flowerX = Math.round(width / 2 - SUNFLOWER.width / 2);
    const flowerY = river + 6 - SUNFLOWER.height;
    this.size = { width, height, river, flowerX, flowerY, headX: flowerX + SUNFLOWER.headX, headY: flowerY + SUNFLOWER.headY };
    this.perch = { x: width - 14, y: river - 5 }; // the Kingfisher's feet on the branch
    this.stars = Array.from({ length: Math.round((width * height) / 160) }, () => ({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height * 0.55),
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.4,
      big: Math.random() < 0.12,
    }));
    const reach = SUNFLOWER.reach;
    Object.assign(this.sunflowerButton.style, {
      left: `${(this.size.headX - reach) * SCALE}px`,
      top: `${(this.size.headY - reach) * SCALE}px`,
      width: `${reach * 2 * SCALE}px`,
      height: `${reach * 2 * SCALE}px`,
    });
  }

  #drawStars(t) {
    if (this.night < 0.05) return;
    const { ctx } = this;
    for (const star of this.stars) {
      const twinkle = Math.sin(t * star.speed + star.phase);
      if (twinkle < -0.4) continue;
      ctx.globalAlpha = this.night * (twinkle > 0.6 ? 1 : 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, 1, 1);
      if (star.big && twinkle > 0.6) {
        ctx.fillStyle = '#b8c8ff';
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillRect(star.x + dx, star.y + dy, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** The sun (or moon) arcs across the sky as the day (or night) goes by. */
  #drawSkyBodies(phase, t) {
    const { ctx } = this;
    const { width, height } = this.size;
    const arc = (progress) => [
      Math.round((0.1 + 0.8 * progress) * width),
      Math.round((0.42 - Math.sin(progress * Math.PI) * 0.16) * height),
    ];
    if (this.night < 0.99) {
      const [x, y] = arc(phase.isDay ? phase.progress : 1);
      const sun = this.art.sun[Math.floor(t * 1.5) % 2];
      ctx.globalAlpha = 1 - this.night;
      ctx.drawImage(sun, x - (sun.width >> 1), y - (sun.height >> 1));
    }
    if (this.night > 0.01) {
      const [x, y] = arc(phase.isDay ? 0 : phase.progress);
      ctx.globalAlpha = this.night;
      ctx.drawImage(this.art.moon, x - (this.art.moon.width >> 1), y - (this.art.moon.height >> 1));
    }
    ctx.globalAlpha = 1;
  }

  #drawClouds(t) {
    const { ctx } = this;
    const { width, height } = this.size;
    ctx.globalAlpha = 1 - this.night * 0.85;
    this.art.clouds.forEach((cloud, i) => {
      const speed = REDUCED_MOTION ? 0 : [2.2, 1.4, 3][i];
      const span = width + cloud.width * 2;
      const x = Math.round(((t * speed + i * 57) % span) - cloud.width);
      ctx.drawImage(cloud, x, Math.round(height * [0.27, 0.36, 0.46][i]));
    });
    ctx.globalAlpha = 1;
  }

  #drawSunflower(now, t) {
    const { ctx } = this;
    const { flowerX, flowerY, headX, headY } = this.size;
    const rays = this.art.rays[REDUCED_MOTION ? 0 : Math.floor(t * 6) % this.art.rays.length];
    ctx.globalAlpha = 0.55 * (1 - this.night * 0.6);
    ctx.drawImage(rays, headX - rays.width / 2, headY - rays.height / 2);
    ctx.globalAlpha = 1;
    const pressed = now - this.pressedAt < PRESS_MS;
    const frame = (set) => (pressed ? set.press : set.sway[REDUCED_MOTION ? 2 : Math.floor(t * 4) % set.sway.length]);
    ctx.drawImage(frame(this.art.flower), flowerX, flowerY);
    if (this.night > 0.01) {
      ctx.globalAlpha = this.night;
      ctx.drawImage(frame(this.art.flowerNight), flowerX, flowerY);
      ctx.globalAlpha = 1;
    }
  }

  /** Rings of tiny flapping birds circling the sunflower; at night they slow down and glide. */
  #drawOrbit(dt, t) {
    const count = Math.min(this.orbitBird.owned, MAX_ORBITING);
    if (!count) return;
    const { ctx } = this;
    if (!REDUCED_MOTION) this.orbitTurn += dt * 0.35 * (1 - this.night * 0.8);
    const frames = this.art.orbiter;
    ctx.globalAlpha = 1 - this.night * 0.4;
    const radius = SUNFLOWER.reach + 7;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.orbitTurn;
      const x = this.size.headX + Math.cos(angle) * radius;
      const y = this.size.headY + Math.sin(angle) * radius * 0.85;
      const flap = this.night > 0.5 || REDUCED_MOTION ? 1 : Math.floor(t * 10 + i * 1.7) % frames.length;
      const facingRight = -Math.sin(angle) > 0;
      ctx.drawImage(facingRight ? frames[flap].right : frames[flap].left, Math.round(x - 5), Math.round(y - 4));
    }
    ctx.globalAlpha = 1;
  }

  /** The Kingfisher flies in, perches with a golden-cookie shine, then dives (if caught) or flies away. */
  #drawKingfisher(now, dt) {
    const { ctx } = this;
    const bird = this.kingfisher;
    const art = this.art.kingfisher;
    const { width, river } = this.size;
    const { perch } = this;
    bird.time += dt;
    let [x, y, frame, facingLeft] = [perch.x, perch.y, null, true];
    if (bird.state === 'away') return;
    if (bird.state === 'arriving') {
      const p = Math.min(1, bird.time / 1);
      x = lerp(width + 24, perch.x, easeOut(p));
      y = lerp(perch.y - 40, perch.y, p) - Math.sin(Math.PI * p) * 6;
      frame = art.frames.fly[Math.floor(bird.time * 12) % 4];
      if (p >= 1) Object.assign(bird, { state: 'perched', time: 0 });
    } else if (bird.state === 'perched') {
      const shine = this.art.shine[Math.floor(now / 90) % this.art.shine.length];
      ctx.drawImage(shine, Math.round(x - shine.width / 2), Math.round(y - 9 - shine.height / 2));
      frame = bird.time % 3.2 > 3.05 ? art.frames.blink[0] : art.frames.idle[Math.floor(bird.time * 1.6) % 2];
      if (now > this.nextSparkle) {
        this.nextSparkle = now + 140;
        this.particles.burst(x - 14 + Math.random() * 28, y - 20 + Math.random() * 18, 'sparkle', 1, { speed: 5, gravity: -8, life: 0.8 });
      }
    } else if (bird.state === 'diving') {
      const p = Math.min(1, bird.time / 0.45);
      x = perch.x - p * 10;
      y = perch.y + p * 16 - Math.sin(Math.PI * p) * 5;
      frame = art.frames.dive[0];
      if (p >= 1) {
        this.particles.burst(x, river, 'drop', 20, { speed: 75, spread: 1.4, life: 1, gravity: 200 });
        bird.state = 'away';
        return;
      }
    } else if (bird.state === 'leaving') {
      const p = Math.min(1, bird.time / 1);
      x = lerp(perch.x, width + 24, p);
      y = lerp(perch.y, -24, p * p);
      frame = art.frames.fly[Math.floor(bird.time * 12) % 4];
      facingLeft = false;
      if (p >= 1) {
        bird.state = 'away';
        return;
      }
    }
    const anchorX = facingLeft ? art.width - art.anchorX : art.anchorX;
    const left = Math.round(x - anchorX);
    const top = Math.round(y - art.anchorY);
    ctx.drawImage(facingLeft ? frame.left : frame.right, left, top);
    if (!this.kingfisherButton.hidden) {
      Object.assign(this.kingfisherButton.style, {
        left: `${(left + 4) * SCALE}px`,
        top: `${(top + 4) * SCALE}px`,
        width: `${(art.width - 8) * SCALE}px`,
        height: `${(art.anchorY - 3) * SCALE}px`,
      });
    }
  }

  #drawRiver(t) {
    const { ctx } = this;
    const { width, height, river } = this.size;
    const depth = height - river;
    for (let y = 0; y < depth; y++) {
      const band = Math.min(3, Math.floor((y / depth) * 4));
      ctx.fillStyle = mix(RIVER_DAY[band], RIVER_NIGHT[band], this.night);
      ctx.fillRect(0, river + y, width, 1);
    }
    ctx.fillStyle = mix('#a6e3ff', '#4f6fa8', this.night);
    ctx.fillRect(0, river, width, 1);
    ctx.fillStyle = `rgb(255 255 255 / ${0.55 - this.night * 0.3})`;
    [6, -9, 4].forEach((speed, lane) => {
      const offset = REDUCED_MOTION ? 0 : (t * speed) % 16;
      for (let x = -16; x < width + 16; x += 16) ctx.fillRect(Math.round(x + offset + lane * 5), river + 3 + lane * 4, 4 - lane, 1);
    });
  }

  #shakeSunflower(event) {
    const gained = this.game.click();
    this.pressedAt = performance.now();
    const box = this.canvas.getBoundingClientRect();
    const fromKeyboard = event.detail === 0; // Enter/Space: no pointer position
    const x = fromKeyboard ? this.size.headX : (event.clientX - box.left) / SCALE;
    const y = fromKeyboard ? this.size.headY : (event.clientY - box.top) / SCALE;
    this.particles.burst(x, y, 'seed', 8, { speed: 70, gravity: 220 });
    this.particles.burst(x, y, 'petal', 4, { speed: 55, gravity: 160, life: 1.1 });
    this.#floater(`+${formatNumber(gained)}`, x * SCALE + (Math.random() - 0.5) * 24, y * SCALE);
  }

  #catchKingfisher() {
    const feathers = this.game.catchKingfisher();
    if (!feathers) return;
    const box = this.kingfisherButton.getBoundingClientRect();
    this.kingfisher = { state: 'diving', time: 0 };
    this.kingfisherButton.hidden = true;
    this.particles.burst(this.perch.x, this.perch.y - 10, 'sparkle', 12, { speed: 40, gravity: 20 });
    this.particles.burst(this.perch.x, this.perch.y - 10, 'feather', 4, { speed: 30, gravity: 30, life: 1.6 });
    this.#flyFeathers(box, feathers);
    const plural = feathers === 1 ? '' : 's';
    toast(`${iconImg('fish')} Splash! The Kingfisher left you ${feathers} feather${plural}.<small>${this.game.kingfisher.def.fact}</small>`);
  }

  /** Feathers fly from the Kingfisher into the counter, which pops when they land. */
  #flyFeathers(from, count) {
    const to = this.featherCounter.getBoundingClientRect();
    const [startX, startY] = [from.left + from.width / 2, from.top + from.height / 3];
    const [endX, endY] = [to.left + 16, to.top + to.height / 2];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const el = document.createElement('span');
      el.className = 'flying-feather';
      el.innerHTML = iconImg('feather', 3);
      document.body.append(el);
      el.animate([
        { transform: `translate(${startX}px, ${startY}px) scale(0.5)`, opacity: 0 },
        { transform: `translate(${startX - 40}px, ${startY - 90}px) scale(1.2)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${endX}px, ${endY}px) scale(0.7)`, opacity: 1 },
      ], { duration: 1100, delay: i * 130, easing: 'ease-in-out', fill: 'both' }).finished.then(() => {
        el.remove();
        this.featherCounter.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260 });
      });
    }
  }

  #floater(text, x, y) {
    const el = document.createElement('span');
    el.className = 'floater';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.addEventListener('animationend', () => el.remove());
    this.root.append(el);
  }
}

/** Seeds raining in the background: more as income grows (log scale, capped). */
function rainRate(seedsPerSecond) {
  return seedsPerSecond > 0 ? Math.min(20, 1 + Math.log10(seedsPerSecond + 1) * 2) : 0;
}
