if (typeof require !== 'undefined') {
  Utility = require("./utility");
  Pathing = require("./pathing")
}

var MapCreator = function() {

  this.Game = {};

  this.height_map = [];
  this.occupied = [];
  this.terrain_type = [];
  this.map_grid = {};
  var Game = Game;
  this.options = Game;

  this.buildNewMap = function(options) {
    this.Game.height_map = this.generateHeightMap(options, options.location);
    this.buildEmptyGameData(options);
    this.addWater(options, options.location);

    var village_locations = this.addVillages(options, 6);
    this.addFarms(options, village_locations);
    this.addTrees(options, options.location);
    this.addGrass(options);

    /*
    buildTerrainFromLoad();
    buildTerrainData();

    addSupplyRoads(1);
    addRoadsBetweenVillages(village_locations);
    //addSupplyRoads(1, 1);
    buildTerrainFromLoad();

    if (Game.options && Game.options.fog_of_war) {
      shadowHeightMap(Game.location);
      LineOfSight.clearFog();
    }

    addPlayers();

    addRoadGraphics();
    colourHeightMap(Game.location);
    colourWater();
    divideMap(3);

    Victory.reset();
    Game.select(Crafty('Unit').get(0));
    */

   var map_data = {};
   map_data.terrain_type = this.Game.terrain_type;
   map_data.height_map = this.Game.height_map;
   return map_data;
  };

  this.buildEmptyGameData = function(options) {
    this.Game.occupied = this.buildOccupied(options);
    this.Game.terrain_type = [];
    for (var x=0; x < options.map_grid.width; x++) {
      this.Game.terrain_type[x] = [];
    }
  };

  this.buildOccupied = function(options) {
    var occupied = [];
    for (var x = 0; x < options.map_grid.width; x++) {
      occupied[x] = [];
      for (var y = 0; y < options.map_grid.height; y++) {
        occupied[x][y] = false;
      }
    }
    return occupied;
  };

  this.generateHeightMap = function(options, location_map) {
    var size = location_map.height_map.size;
    options.noise.seed(Math.random());
    var noise = options.noise[location_map.height_map.noise]
    var height_map = [];
    for (var x = 0; x < options.map_grid.width; x++) {
      height_map[x] = [];
      for (var y = 0; y < options.map_grid.height; y++) {
        var value = noise(x / options.map_grid.width / size, y / options.map_grid.height / size);
        height_map[x][y] =  Math.abs(value);
      }
    }
    return height_map;
  };

  this.addWater = function(options, location_map) {
    var water_level = location_map.water.water_level;
    for (var x = 0; x < options.map_grid.width; x++) {
      for (var y = 0; y < options.map_grid.height; y++) {
        var height = this.Game.height_map[x][y];
        if (height >= 1 - water_level) {
          var water_obj = Terrain.create("Water");
          water_obj.height = this.Game.height_map[x][y];
          this.Game.terrain_type[x][y] = water_obj;
          this.Game.occupied[x][y] = true;
        }
      }
    }
  };

  this.addVillagesToSection = function(options, estimated_villages, min_x, max_x) {
    var villages = [];
    var village_locations = [];
    while (villages.length < estimated_villages) {
      for (var x = min_x; x < max_x; x++) {
        for (var y = 0; y < options.map_grid.height; y++) {
          var at_edge = x == 0 || x == options.map_grid.width - 1 || y == 0 || y == options.map_grid.height - 1;
          if (at_edge) continue;
          var num_tiles = options.map_grid.width * options.map_grid.height;
          var probability = estimated_villages / num_tiles;
          var value = Math.random();

          if (value >= 1 - probability && !this.Game.occupied[x][y]) {
            var color = Math.ceil(this.Game.height_map[x][y] * 255);

            this.Game.occupied[x][y] = true;
            village_locations.push({ x: x, y: y });
            var village_obj = Terrain.create("Village");
            village_obj.height = this.Game.height_map[x][y];
            village_obj.side = this.getMapSide(options, x);
            this.Game.terrain_type[x][y] = village_obj;
            villages.push(village_obj);

            if (villages.length >= 1 + estimated_villages) return village_locations;
            if (villages.length >= 1 + estimated_villages) return villages;
          }
        }
      }
    }
    return village_locations;
    return villages;
  };

  this.addVillages = function(options, estimated_villages) {
    //generateRandomEntities('Village', 'random', 
    // Place entity randomly on the map using noise
    var villages = [];
    for (var i=0; i<3; i++) {
      var min_x = i * (options.map_grid.width / 3);
      var max_x = (i + 1) * (options.map_grid.width / 3);
      var new_villages = this.addVillagesToSection(options, estimated_villages / 3, min_x, max_x);

      villages = villages.concat(new_villages);
    }

    return villages;
  };

  this.getMapSide = function(options, x) {
    var map_third = options.map_grid.width / 3;
    if (x < map_third) {
      return 0;
    } else if (x < 2 * map_third) {
      return undefined;
    } else {
      return 1;
    }
  };

  this.addFarms = function(options, village_locations) {

    for (var i in village_locations) {
      var village = village_locations[i];
      var center = village;
      // get first circle around village
      // @TODO Get this data from to-to-added options var
      var max_distance = 2;
      var factor = 0.80;
      for (var x = center.x - max_distance; x <= center.x + max_distance; x++) {
        if (x < 0 || x > options.map_grid.width - 1) continue;
        for (var y = center.y - max_distance; y <= center.y + max_distance; y++) {
          if (y < 0 || y > options.map_grid.height - 1) continue;
          if (x == center.x && y == center.y) continue;
          var distance = Utility.getDistance(center, { x: x, y: y });
          //var probability = Math.pow(factor, distance + 1);
          var probability = Math.pow(factor, Math.pow(distance, distance));
          if (!this.Game.occupied[x][y] && Math.random() < probability) {

            this.Game.occupied[x][y] = true;
            var farm_obj = Terrain.create("Farm");
            farm_obj.side = this.getMapSide(options, x);
            this.Game.terrain_type[x][y] = farm_obj;
          }
        }
      }
    }
  };

  this.addTrees = function(options, location_map) {
    var trees = location_map.trees;
    this.generateRandomEntities(options, 'Tree', options.noise[trees.noise], trees.size, trees.freq, true);
  };

  this.addGrass = function(options) {
    // MUST GO LAST - fill everything else with grass
    for (var x = 0; x < options.map_grid.width; x++) {
      for (var y = 0; y < options.map_grid.height; y++) {
        if (!this.Game.occupied[x][y]) {
          /*
          var grass = Crafty.e('Grass');
          grass.at(x, y);
          grass.setHeight();
          */

          var grass_obj = Terrain.create("Grass");
          grass_obj.height = this.Game.height_map[x][y];
          this.Game.terrain_type[x][y] = grass_obj;
        }
      }
    }
  };

  // Creates a road on the map given a shortest-path solution.
  this.createRoad = function(path, including_end, is_supply_route_road) {
    var road = [];
    var end = path.length - 1;
    if (including_end) end = path.length;
    for (var i = 0; i < end; i++) {
      var x = path[i].x;
      var y = path[i].y;
      //var terrain = Game.terrain[x][y];
      var terrain_type = this.Game.terrain_type[x][y];

      var entity_obj = {};

      //if (terrain.has("Village")) {
      if (terrain_type == "Village" || terrain_type.type == "Village") {
        //road.push(terrain);
        continue;
      }
      if (terrain_type == "Water" || terrain_type.type == "Water") {
      //if (terrain.has("Water")) {
        /*
        terrain.destroy();
        var entity = Crafty.e('Bridge');
        entity.at(path[i].x, path[i].y);
        Game.terrain[x][y] = entity;
        road.push(entity);
        */

        entity_obj.type = "Bridge";
      } else {
        var is_supply_route = false;
        /*
        if (terrain_type.is_supply_route) {
          var is_supply_route = true;
        }
        if (terrain.has('Road') && terrain.is_supply_route) {
          var is_supply_route = true;
        }
        */
        terrain.destroy();
        var entity = Crafty.e('Road');
        entity.at(path[i].x, path[i].y);
        //if (is_supply_route || (is_supply_route_road && i == end - 1)) {
        if (is_supply_route_road && i == end - 1) {
          //entity.is_supply_route = true;
          entity_obj.is_supply_route = true;
        }
        Game.terrain[x][y] = entity;
        road.push(entity);

        entity_obj.type = "Road";
      }
      entity_obj = Terrain.create(entity_obj.type, entity_obj);
      console.log("entity_obj");
      console.log(entity_obj);
      road.push({ x: x, y: y});
      this.Game.terrain_type[x][y] = entity_obj;
    }
    buildTerrainData();
    return road;
  };

  this.addRoadsBetweenVillages = function(options, village_locations) {
    if (village_locations.length >= 2) {
      for (var a = 0; a < village_locations.length; a++) {
        var start_village = village_locations[a];
        var closest = undefined;
        var least_cost = undefined;
        for (var b = a; b < village_locations.length; b++) {
          if (a == b) continue;
          var end_location = village_locations[b];
          var start = this.Game.terrain_build_graph.grid[start_village.x][start_village.y];
          var end = this.Game.terrain_build_graph.grid[end_location.x][end_location.y];
          var result = options.pathfind.search(Game.terrain_build_graph, start, end);
          var total_cost = Pathing.totalCost(result);
          if (least_cost === undefined || total_cost < least_cost) {
            closest = result;
            least_cost = total_cost;
          }
        }
        // @TODO Figure out why the last call is always undefined
        if (closest === undefined) continue;
        createRoad(closest);
      }
    }
  };

  this.addSupplyRoads = function(options, max_roads, offset) { // <-- requires refactor
    // Entities are placed left to right, so the first will be on the left.
    if (max_roads === undefined) max_roads = 1;
    if (offset === undefined) offset = 0;
    max_roads += offset;
    var villages = Crafty('Village').get();

    function addSupplyRoad(villages, left_or_right) {
      var grid = Game.terrain_build_graph.grid;
      if (left_or_right === undefined) return false;
      if (left_or_right == "left") {
        var start_village = villages[0];
      } else {
        var start_village = villages[villages.length - 1];
      }
      if (start_village == undefined) return false;
      // cannot have supply village on end of map
      if (start_village.at().x == 0) return false;
      if (start_village.at().x == Game.map_grid.width - 1) return false;

      var start = grid[start_village.at().x][start_village.at().y];
      var best_route = undefined;
      var best_cost = undefined;
      for (var j=0; j < Game.map_grid.height; j+=1) {
        if (left_or_right == 'left') {
          var end = grid[0][j];
        } else {
          var end = grid[Game.map_grid.width - 1][j];
        }
        var path = Game.pathfind.search(Game.terrain_build_graph, start, end);
        var cost = Pathing.totalCost(path);
        if (best_route === undefined || cost < best_cost) {
          best_route = path;
          best_cost = cost;
        }
      }

      return createRoad(best_route, true, true);
    }

    // @TODO Save the supply end point locations, but nothing else
    for (var i = 0 + offset; i < max_roads; i++) {
      var new_supply_road = addSupplyRoad(villages, 'left');
      Game.player_supply_roads[0].push(new_supply_road);
    }
    var left_supply_route = Game.player_supply_roads[0][0][Game.player_supply_roads[0][0].length - 1];
    Game.supply_route[0] = left_supply_route.at();

    for (var i = villages.length - 1 - offset; i > villages.length - 1 - max_roads; i--) {
      var new_supply_road = addSupplyRoad(villages, 'right');
      Game.player_supply_roads[1].push(new_supply_road);
    }
    var right_supply_route = Game.player_supply_roads[1][0][Game.player_supply_roads[1][0].length - 1];
    Game.supply_route[1] = right_supply_route.at();


    var left = Game.supply_route[0];
    var right = Game.supply_route[1];
  };


  this.createNewUnit = function(type, side, location, name, quantity) {
  };

  this.createUnitFromFaction = function(faction_name, faction, side, location, index) {
  };

  this.addPlayers = function() {
  };

  /*
   * entity_name: eg. 'Water' or 'Tree'
   * noise: the noise function object to be used. Eg. Game.noise.perlin2
   * size: relative; larger number means larger lakes
   * frequency: // relative, between 0 and 1; larger number means more lakes.
   * occupied: the array to update when entities are placed
   */
  this.generateRandomEntities = function(options, entity_name, noise, size, frequency, update_occupied) {
    // Place entity randomly on the map using noise
    options.noise.seed(Math.random());
    for (var x = 0; x < options.map_grid.width; x++) {
      for (var y = 0; y < options.map_grid.height; y++) {
        // Allows for somewhat hacky reuse of the function for pure randomness.
        if (noise == 'random') {
          var num_tiles = options.map_grid.width * options.map_grid.height;
          var frequency = size / num_tiles;
          var noise_value = Math.random();
        } else {
          var value = noise(x / options.map_grid.width / size, y / options.map_grid.height / size);
          var noise_value = Math.abs(value);
        }
        
        if (noise_value >= 1 - frequency && !this.Game.occupied[x][y]) {
          var entity_obj = Terrain.create(entity_name);
          entity_obj.height = this.Game.height_map[x][y];
          this.Game.terrain_type[x][y] = entity_obj;
          if (update_occupied) {
            this.Game.occupied[x][y] = true;
          }
        }
      }
    }
  };

  this.updateBuildDifficultyData = function(options, terrain_types) {
    // update/create build difficulty Graph for pathfinding purposes
    var terrain_list = this.Game.terrain_type;
    var terrain_build_difficulty = [];

    for (var x = 0; x < options.map_grid.width; x++) {
      terrain_build_difficulty[x] = [];

      for (var y = 0; y < options.map_grid.height; y++) {
        var terrain = terrain_list[x][y];
        terrain_build_difficulty[x][y] = terrain_list[i].build_over;
      }
    }

    this.Game.terrain_build_difficulty = terrain_build_difficulty;

    Game.terrain_build_graph = new options.graph_ftn(terrain_build_difficulty);
  };

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = MapCreator;
} else {
  this.MapCreator = MapCreator;
}
