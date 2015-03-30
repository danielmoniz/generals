
var Supply = {

  getEnemySupplyBlockers: function(side) {
    var supply_blockers = [];
    var enemy_units = Units.getEnemyUnits(side);
    for (var i=0; i<enemy_units.length; i++) {
      if (enemy_units[i].getActive() >= Game.min_troops_for_supply_cut) {
        supply_blockers.push(enemy_units[i]);
      }

      // Uncomment below line for supply overlay
      //Crafty.e('NoSupply').at(unit.at().x, unit.at().y);
    }

    return supply_blockers;
  },

  makeEntitiesUnreachable: function(grid, entities) {
    for (var i in entities) {
      var entity = entities[i];
      grid[entity.at().x][entity.at().y].weight = 0;
    }
  },

  getCitySupplyArea: function(side, use_all_enemies) {
    var points = [];
    var owned_settlements = this.getOwnedSettlements(side);

    var units = Units.getUnitsBySide(side);
    if (use_all_enemies) {
      var enemy_units = units.enemy;
    } else {
      var enemy_units = Units.getVisibleEnemyUnits(side);
    }

    var enemy_units = enemy_units.filter(function(unit) {
      return !unit.battle;
    });

    var battles = Entity.get('Battle', 'flush first');
    var barriers = this.getBattleBarriers(battles, side);

    var target = { x: -1, y: -1 };
    var current_location = { x: -1, y: -1 };
    var friendly_unit = units.friendly[0];
    var stop_points = friendly_unit.getStopPoints(target, current_location, use_all_enemies);

    for (var i in owned_settlements) {
      var graph = new Graph(Game.terrain_difficulty_with_roads);
      var supply_blockers = this.getEnemySupplyBlockers(side);
      supply_blockers = supply_blockers.concat(Entity.getNonDestroyed('Fire'));
      this.makeEntitiesUnreachable(graph.grid, enemy_units);

      var settlement = owned_settlements[i];

      var skip_settlement = false;
      var can_supply_self = true;
      for (var j in enemy_units) {
        var enemy_unit = enemy_units[j];
        if (enemy_unit.isAtLocation(settlement.at())) {
          skip_settlement = true;
          if (!enemy_unit.battle || enemy_unit.battle_side == 'defender') {
            can_supply_self = false;
            break;
          }
        }
      }
      if (can_supply_self) points.push(settlement.at());
      if (skip_settlement) continue;

      var start = graph.grid[settlement.at().x][settlement.at().y];

      var reachable_points = Game.pathfind.findReachablePoints(graph, start, settlement.supply_range, stop_points, 1, barriers);
      points = points.concat(reachable_points);
    }

    var spacial_points = Utility.getSpacialArrayFromList(points);
    return spacial_points;
  },

  getBattleBarriers: function(battles, side) {
    var barriers = [];
    for (var i in battles) {
      var battle = battles[i];
      var retreat_constraints = battle.getRetreatConstraints(battle.at());
      var battle_side = battle.getBattleSideFromPlayer(side);
      var spaces = retreat_constraints.getAdjacentBlockedSpaces(battle_side, Game.map_grid);
      for (var j in spaces) {
        var barrier_out = { start: battle.at(), blocked: spaces[j] };
        barriers.push(barrier_out);
        var barrier_in = { start: spaces[j], blocked: battle.at() };
        barriers.push(barrier_in);
      }
    }

    return barriers;
  },

  getOwnedSettlements: function(side) {
    var settlements = Entity.get('Settlement');
    var owned_settlements = settlements.filter(function(settlement) {
      return !settlement.ruined && settlement.owner == side;
    });
    return owned_settlements;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Supply;
} else {
  window.Supply = Supply;
}

