
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
    'unsupplied': 0.05,

    //'full_movement': 0.05,
    //'siege': 0.4,
    //'injury_attrition': 0.02,
  },

  levels: {
    0: 'High spirits',
    1: 'Discontent',
    2: 'Demoralized',
    3: 'Devastated',
    4: 'Mutinous',
    5: '[should disband!]',
  },

  getStatus: function(morale_points) {
    var status_level = Math.floor(morale_points);
    status_level = Math.min(status_level, Object.keys(this.levels).length - 1);
    return this.levels[status_level];
  },

  calculateMoraleFactor: function(morale_points) {
    var morale_factor = Math.pow(Game.morale_factor, morale_points);
    return morale_factor;
  },

  calculateMoralePercentage: function(morale_points) {
    var actual_percentage = this.calculateMoraleFactor(morale_points) * 100;
    return Utility.roundTo2Decimals(actual_percentage);
  },

  improve: function(unit) {
    var old_morale = unit.morale;
    unit.morale -= unit.morale_improvement;
    unit.morale = Math.max(unit.best_morale, unit.morale);
    if (unit.morale < old_morale) {
      console.log('improving morale for {0} by {1}'.format(unit.name, unit.morale_improvement));
    }
    return unit.morale;
  },

  degrade: function(unit, reason) {
    if (this.values[reason] === undefined) return 0;
    var degradation = this.values[reason] * unit.morale_degrade_factor;
    unit.happy = false;
    unit.morale += degradation;
    unit.addMoraleDropReason(this.reasons[reason]);
    console.log('degrading morale for {0} by {1} due to: {2}'.format(unit.name, degradation, reason));
    return degradation;
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
    return unit.morale;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Morale;
} else {
  window.Morale = Morale;
}

