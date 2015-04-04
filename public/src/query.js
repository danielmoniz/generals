
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

  getOwnedSettlements: function(side) {
    var settlements = Entity.get('Settlement');
    var owned_settlements = settlements.filter(function(settlement) {
      return !settlement.ruined && settlement.owner == side;
    });
    return owned_settlements;
  },

};
