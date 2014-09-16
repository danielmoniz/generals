LineOfSight = {
  applyToAll: function() {
    console.log("applying line of sight to all tiles...");
    var fake_grass = Crafty('FakeGrass').get();
    for (var i=0; i<fake_grass.length; i++) {
      var amount = 5;
      fake_grass[i].brightenColour(amount, amount, amount);
    }
  },

  unapply: function() {
    fake_grass = Crafty('FakeGrass').get();
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

  isEnemyUnitWithinSight: function(side) {
    var units = Crafty('Unit').get();
    var enemy_units = [];
    var friendly_units = [];
    for (var i=0; i<units.length; i++) {
      if (units[i].side == side) {
        friendly_units.push(units[i]);
      } else {
        enemy_units.push(units[i]);
      }
    }
    //var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, end);
  },

}
