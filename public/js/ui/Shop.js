import { birdImg } from '../pixel/birds.js';
import { iconImg } from '../pixel/icons.js';
import { formatNumber } from '../utils/format.js';
import { Tooltip } from './Tooltip.js';

/** The store (right panel): upgrade tiles, the buy-amount toggle and the birds for sale. */
export class Shop {
  constructor(game) {
    this.game = game;
    this.amount = 1;
    this.upgradeGrid = document.getElementById('upgrade-grid');
    this.featherGrid = document.getElementById('feather-grid');
    this.birdList = document.getElementById('bird-list');
    this.amountButtons = [...document.querySelectorAll('[data-amount]')];
    this.renderedKeys = new Map(); // grid element -> ids of the tiles currently drawn in it
    this.tooltip = new Tooltip();

    this.birdList.innerHTML = game.birds
      .map((bird) => `<button type="button" class="store-item" data-bird="${bird.id}" data-tip></button>`)
      .join('');
    this.birdList.addEventListener('click', (event) => this.#buyBird(event.target.closest('[data-bird]')));
    for (const grid of [this.upgradeGrid, this.featherGrid]) {
      grid.addEventListener('click', (event) => this.#buyUpgrade(event.target.closest('[data-upgrade]')));
      this.tooltip.attach(grid, (tile) => this.#upgradeTip(tile));
    }
    this.tooltip.attach(this.birdList, (row) => this.#birdTip(row));
    for (const button of this.amountButtons) button.addEventListener('click', () => this.#setAmount(button));
  }

  update() {
    this.#updateBirds();
    this.#updateUpgrades();
    this.tooltip.refresh();
  }

  #setAmount(selected) {
    this.amount = Number(selected.dataset.amount);
    for (const button of this.amountButtons) button.setAttribute('aria-pressed', String(button === selected));
  }

  #buyBird(row) {
    if (!row || row.dataset.state !== 'revealed' || !this.game.buyBird(row.dataset.bird, this.amount)) return;
    row.animate([{ transform: 'translateY(2px)' }, { transform: 'none' }], { duration: 160, easing: 'steps(2)' });
    row.querySelector('.item-owned').animate(
      [{ transform: 'scale(1.5)', color: '#ffcd75' }, { transform: 'scale(1)' }],
      { duration: 360, easing: 'steps(4)' },
    );
  }

  #buyUpgrade(tile) {
    if (!tile || !this.game.buyUpgrade(tile.dataset.upgrade)) return;
    // The tile is redrawn on the next update; a copy of it pops where it was.
    const box = tile.getBoundingClientRect();
    const ghost = tile.cloneNode(true);
    ghost.classList.add('upgrade-ghost');
    Object.assign(ghost.style, { left: `${box.left}px`, top: `${box.top}px` });
    document.body.append(ghost);
    ghost.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6) translateY(-8px)', opacity: 0 }],
      { duration: 450, easing: 'steps(6)' },
    ).finished.then(() => ghost.remove());
    this.tooltip.hide();
  }

  #updateBirds() {
    const { birds } = this.game;
    let teaserShown = false;
    birds.forEach((bird, i) => {
      const row = this.birdList.children[i];
      // Owning a species reveals the next one; the bird after that shows as a silhouette.
      const revealed = i === 0 || bird.owned > 0 || birds[i - 1].owned > 0;
      const state = revealed ? 'revealed' : teaserShown ? 'hidden' : 'teaser';
      teaserShown ||= state === 'teaser';
      if (row.dataset.state !== state) {
        row.dataset.state = state;
        row.hidden = state === 'hidden';
        row.classList.toggle('teaser', state === 'teaser');
        row.innerHTML = itemHtml(bird, state === 'revealed');
      }
      const cost = this.game.birdCost(bird, this.amount);
      const affordable = revealed && this.game.seeds >= cost;
      row.classList.toggle('affordable', affordable);
      row.setAttribute('aria-disabled', String(!affordable));
      row.querySelector('.cost').textContent = formatNumber(cost);
      if (revealed) row.querySelector('.item-owned').textContent = bird.owned || '';
    });
  }

  #updateUpgrades() {
    const { game } = this;
    const available = game.upgrades
      .filter((upgrade) => upgrade.currency === 'seeds' && !upgrade.purchased && upgrade.isUnlocked(game))
      .sort((a, b) => a.cost - b.cost);
    this.#renderTiles(this.upgradeGrid, available);
    this.#renderTiles(this.featherGrid, game.upgrades.filter((upgrade) => upgrade.currency === 'feathers'));
  }

  #renderTiles(grid, upgrades) {
    const key = upgrades.map((upgrade) => `${upgrade.id}${upgrade.purchased ? '+' : ''}`).join();
    if (this.renderedKeys.get(grid) !== key) {
      this.renderedKeys.set(grid, key);
      grid.innerHTML = upgrades.map((upgrade) => tileHtml(upgrade, this.game)).join('');
    }
    for (const tile of grid.children) {
      const upgrade = this.game.upgrade(tile.dataset.upgrade);
      tile.classList.toggle('affordable', !upgrade.purchased && this.game.canAfford(upgrade));
    }
  }

  #birdTip(row) {
    const { birds, stats } = this.game;
    const i = birds.findIndex((bird) => bird.id === row.dataset.bird);
    const bird = birds[i];
    if (row.dataset.state !== 'revealed') {
      return `<div class="tip-title">???</div><p>Attract a ${birds[i - 1].name} and word will spread to this bird.</p>`;
    }
    const each = bird.ratePerBird(stats) * stats.global;
    const now = bird.production(stats, this.game.isDay()) * stats.global;
    const when = bird.activity === 'day' ? `${iconImg('sun', 1)} Day bird` : `${iconImg('moon', 1)} Night bird`;
    return `
      <div class="tip-head">
        ${birdImg(bird.plumage, 2)}
        <div><div class="tip-title">${bird.name}</div><div class="tip-latin">${bird.latin}</div></div>
        <span class="tag tag-${bird.activity}">${when}</span>
      </div>
      <p class="tip-fact">${bird.fact}</p>
      <ul class="tip-stats">
        <li>Each forages <b>${formatNumber(each, 1)}</b> seeds/s while awake, ${Math.round(stats.rest_rate * 100)}% of that while resting</li>
        <li>Your ${bird.owned} together: <b>${formatNumber(now, 1)}</b> seeds/s right now</li>
      </ul>
      <div class="tip-price">${iconImg('seed', 1)} ${formatNumber(this.game.birdCost(bird, this.amount))} for ${this.amount}</div>`;
  }

  #upgradeTip(tile) {
    const upgrade = this.game.upgrade(tile.dataset.upgrade);
    const price = upgrade.purchased
      ? '<span class="owned-mark">Owned</span>'
      : `${iconImg(upgrade.currency === 'seeds' ? 'seed' : 'feather', 1)} ${formatNumber(upgrade.cost)}`;
    return `<div class="tip-title">${upgrade.name}</div><p>${upgrade.description}</p><div class="tip-price">${price}</div>`;
  }
}

function itemHtml(bird, revealed) {
  return `
    <span class="item-icon">${birdImg(bird.plumage, 2)}</span>
    <span class="item-text">
      <span class="item-name">${revealed ? bird.name : '???'}</span>
      <span class="item-price">${iconImg('seed', 1)}<span class="cost"></span></span>
    </span>
    ${revealed ? '<span class="item-owned"></span>' : ''}`;
}

function tileHtml(upgrade, game) {
  const art = upgrade.icon.startsWith('bird:')
    ? birdImg(game.bird(upgrade.icon.slice('bird:'.length)).plumage, 2)
    : iconImg(upgrade.icon, 3);
  const state = upgrade.purchased ? ' purchased' : '';
  return `<button type="button" class="upgrade-tile${state}" data-upgrade="${upgrade.id}" data-tip aria-label="${upgrade.name}">${art}</button>`;
}
