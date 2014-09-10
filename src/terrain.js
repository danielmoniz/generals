
function buildTerrainData() {
  // build Game.terrain Graph for pathfinding purposes
  var terrain_list = Crafty("Terrain").get();
  var terrain = [];
  var terrain_difficulty = [];
  var terrain_build_difficulty = [];
  var terrain_supply = [];
  for (var x = 0; x < Game.map_grid.width; x++) {
    terrain[x] = [];
    terrain_difficulty[x] = [];
    terrain_build_difficulty[x] = [];
    terrain_supply[x] = [];
  }

  for (var i = 0; i < terrain_list.length; i++) {
    terrain[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i];
    terrain_difficulty[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i].terrain;
    terrain_build_difficulty[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i].build_over;
    supply_value = terrain_list[i].supply ? 1 : 0;
    terrain_supply[terrain_list[i].getX()][terrain_list[i].getY()] = supply_value;
  }

  Game.terrain = terrain;
  Game.terrain_difficulty = terrain_difficulty;
  Game.terrain_build_difficulty = terrain_build_difficulty;
  Game.terrain_supply = terrain_supply;

  Game.terrain_graph = new Game.graph_ftn(terrain_difficulty);
  // test!
  //if (Game.terrain_build_graph) return false;
  Game.terrain_build_graph = new Game.graph_ftn(terrain_build_difficulty);
  Game.terrain_supply_graph = new Game.graph_ftn(terrain_supply);
  /*
  console.log(terrain);
  console.log(terrain_build_difficulty);
  console.log(Game.terrain_build_graph);
  console.log("-----------------");
  */

  //console.log(Game.terrain_build_graph);
}

