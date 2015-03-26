
var Supply = {

  getSupplyBlockers: function(side) {
    var supply_blockers = [];
    var enemy_units = Units.getEnemyUnits(side);
    for (var i=0; i<enemy_units.length; i++) {
      if (enemy_units[i].getActive() >= Game.min_troops_for_supply_cut) {
        supply_blockers.push(enemy_units[i]);
      }

      // Uncomment below line for supply overlay
      //Crafty.e('NoSupply').at(unit.at().x, unit.at().y);
    }

    supply_blockers = supply_blockers.concat(Entity.get('Fire'));
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
    var enemy_units_not_in_battle
    var visible_enemy_units_not_in_battle = enemy_units.filter(function(unit) {
      return !unit.battle;
    });
    var friendly_unit = units.friendly[0];
    var battles = Entity.get('Battle', 'flush first');

    var target = { x: -1, y: -1 };
    var current_location = { x: -1, y: -1 };
    var stop_points = friendly_unit.getStopPoints(target, current_location);

    for (var i in owned_settlements) {
      var graph = new Graph(Game.terrain_difficulty_with_roads);
      var supply_blockers = this.getSupplyBlockers(side);
      this.makeEntitiesUnreachable(graph.grid, visible_enemy_units_not_in_battle);

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

      var reachable_points = Game.pathfind.findReachablePoints(graph, start, settlement.supply_range, stop_points);
      points = points.concat(reachable_points);

      for (var j in battles) {
        var battle = battles[j];
        // @TODO Is this the right graph to use? May have to re-initialize
        if (this.isBattleSupplied(graph, battle, settlement.at(), side, settlement.supply_range)) {
          points.push(battle.at());
        }
      }
    }

    var spacial_points = Utility.getSpacialArrayFromList(points);
    return spacial_points;
  },

  /*
   * @TODO Needs update for future siege mechanics of battles on > 1 space.
   */
  isBattleSupplied: function(graph, battle, supply_end_point, side, range) {
    var retreat_constraints = battle.getRetreatConstraints(battle.at());
    var battle_side = battle.getBattleSideFromPlayer(side);

    var spaces = retreat_constraints.getAdjacentUnblockedSpaces(battle_side, Game.map_grid);

    for (var i in spaces) {
      var space = spaces[i];
      var local_terrain = Game.terrain[space.x][space.y];
      if (local_terrain.move_difficulty == 0) continue; // impassible
      // @TODO Handle supply endpoint being adjacent with more pathing
      if (space.x == supply_end_point.x && space.y == supply_end_point.y) return true;

      var start = graph.grid[space.x][space.y];
      var tile_difficulty = Game.terrain_difficulty_with_roads[space.x][space.y];
      var tile_difficulty = graph.grid[space.x][space.y].weight;
      var supply_range_per_turn = [range - tile_difficulty, 0];
      var supply_route = Game.pathfind.search(graph, start, supply_end_point, supply_range_per_turn);

      if (supply_route.length > 0) return true;
    }

    return false;
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

