
var Query = {

  getNonDestroyed: function(search, flush_first) {
    var entities = Entity.get(search, flush_first);
    var non_destroyed_entities = entities.filter(function(entity) {
      return !entity.destroyed;
    });
    return non_destroyed_entities;
  },

  getSpottedFires: function(side) {
    var fires = Entity.get('Fire');
    fires = fires.filter(function(fire) {
      return fire.spotted[side] !== undefined && fire.spotted[side].state == 'active';
    });
    return fires;
  },

  getNonDestroyedFiresInSight: function(side, flush_cache) {
    var fires = this.getNonDestroyed('Fire', flush_cache);
    return LineOfSight.getEntitiesInSight(fires, side);
  },

  getEnemySettlements: function(side) {
    if (side === undefined) return [];

    var settlements = Entity.get('Settlement');
    var enemy_settlements = settlements.filter(function(entity) {
      return !entity.ruined && entity.owner == 1 - side;
    });

    return enemy_settlements;
  },

  getSpottedEnemySettlements: function(side) {
    var settlements = Entity.get('Settlement');
    var spotted_enemy_settlements = settlements.filter(function(entity) {
      return entity.spotted[side].stats.owner == 1 - side;
    });
    return spotted_enemy_settlements;
  },

  getOwnedSettlements: function(side, settlements) {
    if (settlements === undefined) var settlements = Entity.get('Settlement');
    var owned_settlements = settlements.filter(function(settlement) {
      return !settlement.ruined && settlement.owner == side;
    });
    return owned_settlements;
  },

  getEnemyUnitsOutOfBattle: function(side) {
    var enemy_units = Units.getEnemyUnits(side);
    return this.getUnitsOutOfBattle(enemy_units);
  },

  getUnitsOutOfBattle: function(units) {
    var units = units.filter(function(unit) {
      return !unit.battle;
    });
    return units;
  },

  getVisibleEnemyUnitsOutOfBattle: function(side) {
    var enemy_units = Units.getVisibleEnemyUnits(side);
    return this.getUnitsOutOfBattle(enemy_units);
  },

};
