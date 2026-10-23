const ROTATE_MS = 9000;
const FIELD_NOTE_CHANCE = 0.3;

/** The headline strip above the aviary. Headlines unlock with progress; facts about your own birds mix in. */
export class NewsTicker {
  constructor(game, headlines) {
    this.game = game;
    this.headlines = headlines;
    this.el = document.getElementById('news');
    this.nextAt = 0;
    this.last = null;
  }

  update(now) {
    if (now < this.nextAt) return;
    this.nextAt = now + ROTATE_MS;
    this.last = this.#pick();
    this.el.textContent = this.last;
    this.el.animate(
      [{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' },
    );
  }

  #pick() {
    const { game } = this;
    const flock = game.birds.filter((bird) => bird.owned > 0);
    if (flock.length && Math.random() < FIELD_NOTE_CHANCE) {
      const bird = flock[Math.floor(Math.random() * flock.length)];
      return `Field notes: ${bird.name}. ${bird.fact}`;
    }
    const running = this.headlines
      .filter((headline) => headline.requires.every((req) => game.progress(req.stat) >= req.at_least))
      .map((headline) => `News: ${headline.text}`)
      .filter((text) => text !== this.last);
    return running[Math.floor(Math.random() * running.length)] ?? this.last;
  }
}
