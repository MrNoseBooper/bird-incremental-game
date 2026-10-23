import { birdImg } from '../pixel/birds.js';
import { iconUrl } from '../pixel/icons.js';
import { formatDuration, formatNumber, formatWords } from '../utils/format.js';

/** The card at the top of the cove: seeds, seeds per second, feathers and the day/night clock. */
export class Hud {
  constructor(game) {
    this.game = game;
    this.seeds = document.getElementById('seed-count');
    this.rate = document.getElementById('seed-rate');
    this.feathers = document.getElementById('feather-count');
    this.clockIcon = document.getElementById('clock-icon');
    this.clockLabel = document.getElementById('clock-label');
    this.clockTime = document.getElementById('clock-time');
    this.clockFill = document.getElementById('clock-fill');
    this.wasDay = null;
    document.getElementById('brand-logo').innerHTML = birdImg(game.kingfisher.def.plumage, 2);
  }

  update() {
    const { game } = this;
    const phase = game.cycle.at(game.clock());
    this.seeds.textContent = formatWords(game.seeds);
    this.rate.textContent = formatNumber(game.productionPerSecond(phase.isDay), 1);
    this.feathers.textContent = formatNumber(game.feathers);
    if (phase.isDay !== this.wasDay) {
      this.wasDay = phase.isDay;
      this.clockIcon.src = iconUrl(phase.isDay ? 'sun' : 'moon');
      this.clockLabel.textContent = phase.isDay ? 'Day' : 'Night';
    }
    this.clockTime.textContent = formatDuration(phase.remaining);
    this.clockFill.style.width = `${phase.progress * 100}%`;
    document.title = `${formatNumber(game.seeds)} seeds · Kingfisher Cove`;
  }
}
