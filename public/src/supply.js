
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

  getCitySupplyArea: function(side) {
    var graph = new Graph(Game.terrain_difficulty_with_roads);
    var supply_blockers = Supply.getSupplyBlockers(side);
    Supply.makeEntitiesUnreachable(graph.grid, supply_blockers);

    var points = [];
    var cities = Entity.get('City');
    var owned_cities = cities.filter(function(city) {
      return !city.ruined && city.owner == side;
    });

    for (var i in owned_cities) {
      var city = owned_cities[i];
      var start = graph.grid[city.at().x][city.at().y];

      var supply_range_per_turn = [city.supply_range, 0];
      var reachable_points = Game.pathfind.findReachablePoints(graph, start, supply_range_per_turn);
      reachable_points.push(city.at());
      points = points.concat(reachable_points);
    }

    var spacial_points = Utility.getSpacialArrayFromList(points);
    return spacial_points;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Supply;
} else {
  window.Supply = Supply;
}

