
var Morale = {

  reasons: {
    fire: 'fire',
    retreat: 'retreat',
    battle: 'battle',
    supply_attrition: 'supply attrition',
    rain: 'rain',
    unsupplied: 'unsupplied',
  },

  values: {
    'fire': 1.5,
    'retreat': 1,
    'battle': 0.25,
    'supply_attrition': 0.5,
    'rain': 0.1,

    //'unsupplied': 0.05,
    //'full_movement': 0.05,
    //'siege': 0.4,
    //'injury_attrition': 0.02,
  },

  improve: function(unit) {
    if (!Game.morale) return 0;
    var old_dissent = unit.dissent;
    unit.dissent -= unit.dissent_improvement;
    unit.dissent = Math.max(unit.best_dissent, unit.dissent);
    if (unit.dissent < old_dissent) {
      console.log('improving dissent for {0} by {1}'.format(unit.name, unit.dissent_improvement));
    }
    return unit.dissent;
  },

  degrade: function(unit, reason) {
    if (!Game.morale) return 0;
    if (this.values[reason] === undefined) return 0;
    var degradation = this.values[reason] * unit.dissent_degrade_factor;
    unit.happy = false;
    unit.dissent += degradation;
    unit.addDissentDropReason(this.reasons[reason]);
    console.log('degrading dissent for {0} by {1} due to: {2}'.format(unit.name, degradation, reason));
    return degradation;
  },

  levels: {
    0: 'High spirits',
    1: 'Discontent',
    2: 'Demoralized',
    3: 'Devastated',
    4: 'Mutinous',
    5: '[should disband!]',
  },

  getStatus: function(dissent_points) {
    var status_level = Math.floor(dissent_points);
    status_level = Math.min(status_level, Object.keys(this.levels).length - 1);
    return this.levels[status_level];
  },

  calculateDissentFactor: function(dissent_points) {
    var dissent_factor = Math.pow(Game.dissent_factor, dissent_points);
    return dissent_factor;
  },

  calculateDissentPercentage: function(dissent_points) {
    var actual_percentage = this.calculateDissentFactor(dissent_points) * 100;
    return Utility.roundTo2Decimals(actual_percentage);
  },



  /*
   * unit; the unit taking casualties
   * type: dead, injured
   * quantity: number of troops affected
   * reason: battle, fire, attrition, etc.
   */
  takeCasualties: function(unit, type, quantity, reason) {
    if (reason === undefined) throw new Error('BadParam', "'reason' must be defined.");
    // @TODO Consider using quantity/percentage of units lost to damage morale
    // proportionally
    var degradation = this.degrade(unit, reason);
    return unit.dissent;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Morale;
} else {
  window.Morale = Morale;
}

