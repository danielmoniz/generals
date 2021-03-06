
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
    var present_units = [];
    var units = Entity.get('Unit');
    for (var i=0; i < units.length; i++) {
      if (units[i].isAtLocation(location)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
  },

  getPresentEnemyUnits: function(location, side) {
    var present_units = this.getPresentUnits(location);
    return this.getEnemyUnits(side, present_units);
  },

  getTotalTroops: function(units) {
    var total = {
      0: { active: 0, injured: 0, total: 0 },
      1: { active: 0, injured: 0, total: 0 },
    };
    for (var i in units) {
      var unit = units[i];
      total[unit.side]['active'] += unit.getActive();
      total[unit.side]['injured'] += unit.quantity - unit.getActive();
      total[unit.side]['total'] += unit.quantity;
    }
    return total;
  },

  countTroops: function(units, type) {
    var total = 0;
    for (var i in units) {
      var unit = units[i];
      if (type) total += unit[type];
      else total += unit.quantity;
    }
    return total;
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

  removeUnitFromList: function(unit_id, units) {
    for (var i=units.length - 1; i>=0; i--) {
      if (!units[i] || units[i].getId() == unit_id) {
        units.splice(i, 1);
      }
    }
  },

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Units;
} else {
  window.Units = Units;
}

