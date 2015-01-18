
var Units = {

  flushCaches: function() {
    this.units_by_side = {};
    this.visible_enemy_units = {};
  },

  getUnitsBySide: function(side, units) {
    if (side === undefined) throw new Error('MissingParam', 'Must specify a side.');

    if (units === undefined) units = Entity.get('Unit');
    var friendly_units = [];
    var enemy_units = [];
    for (var i=0; i<units.length; i++) {
      if (units[i].side == side) {
        friendly_units.push(units[i]);
      } else {
        enemy_units.push(units[i]);
      }
    }
    var units_by_side = {};
    units_by_side = {
      friendly: friendly_units,
      enemy: enemy_units,
      turn: Game.turn,
    };
    return units_by_side;
  },

  getFriendlyUnits: function(side, units) {
    return this.getUnitsBySide(side, units).friendly;
  },

  getEnemyUnits: function(side, units) {
    return this.getUnitsBySide(side, units).enemy;
  },

  getAllUnits: function() {
    return Entity.get('Unit');
  },

  getPresentUnits: function(location) {
    if (location === undefined) location = this.at();
    var present_units = [];
    var units = Entity.get('Unit');
    for (var i=0; i < units.length; i++) {
      if (units[i].isAtLocation(location)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
  },

  getUnitById: function(id) {
    if (id === undefined) throw new Error('MissingParam', 'Must supply an id.');
    var units = this.getAllUnits();
    for (var i in units) {
      if (units[i].id == id) {
        return units[i];
      }
    }
  },

  getVisibleEnemyUnits: function(side) {
    try {
      if (this.visible_enemy_units[side] !== undefined &&
          this.visible_enemy_units[side].turn == Game.turn) {
        return this.visible_enemy_units[side].units;
      }
    }
    catch (ex) {
      // continue into function and cache results
    }

    if (side === undefined) throw new Error('MissingParam', 'Must supply value for side.');
    var visible = LineOfSight.getEnemyUnitsInSight(side);
    if (this.visible_enemy_units === undefined) this.visible_enemy_units = {};
    this.visible_enemy_units[side] = {
      turn: Game.turn,
      units: visible,
    };
    return visible;
  },

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Units;
} else {
  window.Units = Units;
}

