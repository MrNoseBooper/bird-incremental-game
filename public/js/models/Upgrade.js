/** Applies stat effects ({ stat, op: 'mul' | 'add', value }) to a stats object, in place. */
export function applyEffects(stats, effects) {
  for (const { stat, op, value } of effects) {
    stats[stat] = op === 'mul' ? (stats[stat] ?? 1) * value : (stats[stat] ?? 0) + value;
  }
}

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
    applyEffects(stats, this.effects);
  }
}
