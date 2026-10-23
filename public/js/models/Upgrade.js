/** A one-time purchase that changes the game's stats. */
export class Upgrade {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.description = def.description;
    this.icon = def.icon;
    this.currency = def.currency;
    this.cost = def.cost;
    this.effects = def.effects;
    this.requires = def.requires;
    this.purchased = false;
  }

  isUnlocked(game) {
    return this.requires.every((req) => game.progress(req.stat) >= req.at_least);
  }

  applyTo(stats) {
    for (const { stat, op, value } of this.effects) {
      stats[stat] = op === 'mul' ? (stats[stat] ?? 1) * value : (stats[stat] ?? 0) + value;
    }
  }
}
