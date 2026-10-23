/** A species in your flock: its definition from the backend plus how many you own. */
export class Bird {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.latin = def.latin;
    this.fact = def.fact;
    this.plumage = def.plumage;
    this.activity = def.activity;
    this.habitat = def.habitat;
    this.baseCost = def.base_cost;
    this.baseProduction = def.base_production;
    this.owned = 0;
  }

  /** Price of the next `amount` birds; each costs `growth` times the one before (a geometric series). */
  cost(growth, amount = 1) {
    const next = this.baseCost * growth ** this.owned;
    return Math.ceil(next * (growth ** amount - 1) / (growth - 1));
  }

  isAwake(isDay) {
    return (this.activity === 'day') === isDay;
  }

  /** Seeds per second from one bird, before the global multiplier. */
  ratePerBird(stats, awake = true) {
    return this.baseProduction
      * (awake ? 1 : stats.rest_rate)
      * (stats[`bird:${this.id}`] ?? 1)
      * (stats[`activity:${this.activity}`] ?? 1);
  }

  production(stats, isDay) {
    return this.owned * this.ratePerBird(stats, this.isAwake(isDay));
  }
}
