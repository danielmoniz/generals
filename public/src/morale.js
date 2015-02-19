
var Morale = {

  reasons: {
    degrade: {
      fire: 'fire',
      retreat: 'retreat',
      battle: 'battle',
      supply_attrition: 'supply attrition',
      rain: 'rain',
      terrified: 'terrified',

      unsupplied: 'unsupplied',
      surrounded: 'surrounded',
    },

    improve: {
      win_battle: 'win battle',
      pillage: 'pillage',
      sack: 'sack',
      opponent_retreats: 'opponent retreats',
    },

    modifiers: {
      'unsupplied': 'unsupplied',
    },

  },

  values: {
    degrade: {
      'supply attrition': 5, // reduced based on % casualties
      'retreat': 4, // reduced based on % casualties
      'fire': 2, // reduced based on % casualties
      'battle': 1, // reduced based on % casualties
      'terrified': 0.3,
      'rain': 0.1,

      //'surrounded': 0.3,
      //'ally retreats': 0.1,
      //'unsupplied': 0.05,
      //'full_movement': 0.05,
      //'siege': 0.4,
      //'injury_attrition': 0.02,
    },

    improve: {
      'win battle': 0.5,
      'sack': 0.4,
      'pillage': 0.2,

      //'opponent retreats': 0.05,
    },

    modifiers: {
      'unsupplied': 1/2,
    },

  },

  /*
   * Improves an entity's dissent by one unit of improvement.
   */
  increment: function(unit, supplied) {
    if (!Game.dissent) return 0;
    var old_dissent = unit.dissent;
    var improvement = unit.dissent_improvement;
    if (!supplied) {
      var improvement = unit.dissent_improvement * this.values.modifiers.unsupplied;
    }
    unit.improveDissent(improvement);
    if (unit.dissent < old_dissent) {
      console.log('improving dissent for {0} by {1}'.format(unit.name, improvement));
    }
    return unit.dissent;
  },

  /*
   * Improves an entity's dissent given a reason for the improvement.
   */
  improve: function(unit, reason) {
    if (this.values.improve[reason] === undefined)  {
      this.badReason();
    }
    if (unit.dissent_improve_factor === undefined) {
      throw new Error(
        'BadParam',
        'unit must have dissent_improve_factor property to improve dissent');
    }
    var value = -1 * this.values.improve[reason] * unit.dissent_improve_factor;
    return this.changeDissent(unit, reason, value);
  },

  /*
   * Degrades an entity's dissent given a reason for the degradation.
   * 'quantity' is an optional variable representing something to be multiplied 
   * against the reason's value. Eg. % troops lost.
   */
  degrade: function(unit, reason, quantity) {
    if (this.values.degrade[reason] === undefined)  {
      this.badReason();
    }
    if (unit.dissent_degrade_factor === undefined) {
      throw new Error(
        'BadParam',
        'unit must have dissent_degrade_factor property to degrade dissent');
    }
    var value = this.values.degrade[reason] * unit.dissent_degrade_factor;
    return this.changeDissent(unit, reason, value, quantity);
  },

  /*
   * Should be called only through degrade() and improve()
   */
  changeDissent: function(unit, reason, reason_value, quantity) {
    if (!unit || unit.dissent_degrade_factor === undefined) {
      throw new Error('BadParam', 'unit must be specified');
    }
    if (reason_value === undefined) this.badReason(reason);
    if (!Game.dissent) return 0;
    if (quantity === undefined) quantity = 1;
    var change = reason_value * quantity;
    if (change > 0) {
      unit.degradeDissent(change, reason);
      console.log('degrading dissent for {0} by {1} due to: {2}'.format(unit.name, change, reason));
    } else {
      var positive_change = -1 * change;
      unit.improveDissent(positive_change, reason);
      console.log('improving dissent for {0} by {1} due to: {2}'.format(unit.name, positive_change, reason));
    }
    return change;
  },

  /*
   * unit; the unit taking casualties
   * reason: battle, fire, attrition, etc.
   * quantity: number of troops affected
   * total_active: total number of active troops prior to casualties
   */
  takeCasualties: function(unit, reason, quantity, total_active) {
    if (reason === undefined) throw new Error('BadParam', "'reason' must be defined.");
    var fraction_lost = quantity / total_active;
    var degradation = this.degrade(unit, reason, fraction_lost);
    return unit.dissent;
  },

  levels: {
    0: 'High spirits',
    1: 'Discontent',
    2: 'Demoralized',
    3: 'Devastated',
    4: 'Mutinous',
    5: '[should disband!]',
  },

  /*
   * Return a string representing the mood of an entity using its dissent.
   */
  getStatus: function(dissent_points) {
    if (isNaN(dissent_points) || dissent_points < 0) {
      throw new Error('BadParam', 'dissent_points needs to be a number > 0');
    }
    var status_level = Math.floor(dissent_points);
    status_level = Math.min(status_level, Object.keys(this.levels).length - 1);
    return this.levels[status_level];
  },

  /*
   * Return a fraction ( 0 <= fraction <= 1) given some number of dissent
   * points. Used to determine the effect of dissent gain/morale loss.
   */
  calculateDissentFactor: function(dissent_points) {
    if (isNaN(dissent_points)) {
      throw new Error('BadParam', 'dissent_points needs to be a number');
    }
    var dissent_factor = Math.pow(Game.dissent_factor, dissent_points);
    return dissent_factor;
  },

  /*
   * Calculate a percentage given a dissent factor fraction
   */
  calculateDissentPercentage: function(dissent_points) {
    var actual_percentage = this.calculateDissentFactor(dissent_points) * 100;
    return Utility.roundTo2Decimals(actual_percentage);
  },

  /*
   * Convenience method. Error and log the provided reason.
   */
  badReason: function(reason) {
    console.log("reason");
    console.log(reason);
    throw new Error('BadReason');
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Morale;
} else {
  window.Morale = Morale;
}

