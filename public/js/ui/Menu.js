import { formatNumber } from '../utils/format.js';

const OPTIONS = `
  <h2>Options</h2>
  <p>Your cove saves automatically every 15 seconds and whenever you leave the page.</p>
  <button type="button" class="px-button danger" data-action="reset">Reset save</button>`;

/** Stats and Options, opened from the bar above the aviary and shown over it, like Cookie Clicker's menus. */
export class Menu {
  constructor(game, { onReset }) {
    this.game = game;
    this.panel = document.getElementById('menu-panel');
    this.content = document.getElementById('menu-content');
    this.buttons = [...document.querySelectorAll('[data-menu]')];
    this.open = null;
    for (const button of this.buttons) button.addEventListener('click', () => this.#toggle(button.dataset.menu));
    document.getElementById('menu-close').addEventListener('click', () => this.#toggle(null));
    this.content.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="reset"]')) onReset();
    });
  }

  update() {
    if (this.open !== 'stats') return;
    const { game } = this;
    const rows = [
      ['Seeds in the cove', formatNumber(game.seeds)],
      ['Seeds gathered, all time', formatNumber(game.seedsEarned)],
      ['Seeds per second right now', formatNumber(game.productionPerSecond(), 1)],
      ['Seeds per sunflower shake', formatNumber(game.clickPower(), 1)],
      ['Sunflower shakes', formatNumber(game.clicks)],
      ['Birds in the aviary', formatNumber(game.birds.reduce((sum, bird) => sum + bird.owned, 0))],
      ['Species attracted', `${game.birds.filter((bird) => bird.owned > 0).length} of ${game.birds.length}`],
      ['Upgrades bought', `${game.upgrades.filter((upgrade) => upgrade.purchased).length} of ${game.upgrades.length}`],
      ['Feathers', formatNumber(game.feathers)],
    ];
    this.content.innerHTML = `<h2>Stats</h2>
      <dl class="stats">${rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('')}</dl>`;
  }

  #toggle(name) {
    this.open = this.open === name ? null : name;
    this.panel.hidden = !this.open;
    for (const button of this.buttons) button.setAttribute('aria-pressed', String(button.dataset.menu === this.open));
    if (this.open === 'options') this.content.innerHTML = OPTIONS;
    this.update();
  }
}
