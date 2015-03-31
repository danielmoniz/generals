
var Query = {

  getNonDestroyed: function(search, flush_first) {
    var entities = Entity.get(search, flush_first);
    var non_destroyed_entities = entities.filter(function(entity) {
      return !entity.destroyed;
    });
    return non_destroyed_entities;
  },

  getNonDestroyedFiresInSight: function(side, flush_cache) {
    var fires = this.getNonDestroyed('Fire', flush_cache);
    var fires_in_sight = fires.filter(function(fire) {
      var points_in_sight = LineOfSight.getPointsInSight(side);
      try {
        return points_in_sight[fire.at().x][fire.at().y];
      } catch(error) {};
      return false;
    });

    return fires_in_sight;
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
