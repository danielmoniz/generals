LineOfSight = {
  max_sight: 16,

  applyToAll: function() {
    console.log("applying line of sight to all tiles...");
    var fake_grass = Crafty('FakeGrass').get();
    for (var i=0; i<fake_grass.length; i++) {
      var amount = 5;
      fake_grass[i].brightenColour(amount, amount, amount);
    }
  },

  unapply: function() {
    var fake_grass = Crafty('FakeGrass').get();
    for (var i=0; i<fake_grass.length; i++) {
      var amount = 1;
      fake_grass[i].resetColour();
    }
  },

  enemyInvisible: function(side) {
    var units = Crafty('Unit').get();
    for (var i=0; i<units.length; i++) {
      if (units[i].side != side) {
        units[i].visible = false;
      } else {
        units[i].visible = true;
      }
    }
  },

  allVisible: function() {
    var units = Crafty('Unit').get();
    for (var i=0; i<units.length; i++) {
      units[i].visible = true;
    }
  },

  getEnemyUnitsInSight: function(side) {
    var units = Crafty('Unit').get();
    var enemy_units = [];
    var friendly_units = [];
    var units_in_sight = [];
    for (var i=0; i<units.length; i++) {
      if (units[i].side == side) {
        friendly_units.push(units[i]);
      } else {
        enemy_units.push(units[i]);
      }
    }

    for (var i=0; i<enemy_units.length; i++) {
      var in_sight = false;
      var enemy = enemy_units[i];
      for (var j=0; j<friendly_units.length; j++) {
        var friend = friendly_units[j];
        var distance = Utility.getDistance(friend.at(), enemy.at());
        if (distance < this.max_sight) {
          in_sight = true;
          break;
        }
      }
      if (in_sight) {
        units_in_sight.push(enemy);
      }
    }
    //var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, end);
    return units_in_sight;
  },

}
