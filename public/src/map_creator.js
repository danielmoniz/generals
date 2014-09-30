if (typeof require !== 'undefined') {
  Utility = require("./utility");
  Pathing = require("./pathing")
}

var MapCreator = function() {

  this.Game = {};

  this.Game.player_supply_roads = [[], []];
  this.Game.supply_route = [];

  this.height_map = [];
  this.occupied = [];
  this.terrain_type = [];
  this.map_grid = {};
  this.options = Game;

  this.buildNewMap = function(options) {
    this.Game.height_map = this.generateHeightMap(options, options.location);
    this.buildEmptyGameData(options, this.Game);
    this.addWater(options, this.Game, options.location);

    var village_locations = this.addVillages(options, this.Game, 6);
    this.addFarms(options, this.Game, village_locations);
    this.addTrees(options, this.Game, options.location);
    this.addGrass(options, this.Game);

    //this.updateBuildDifficultyData(options, this.Game.terrain_type);
    this.buildTerrainData(options, this.Game, this.Game.terrain_type);
    this.addSupplyRoads(options, this.Game, village_locations, 1);
    this.addRoadsBetweenVillages(options, this.Game, village_locations);

    this.Game.starting_units = this.addStartingUnits(options, this.Game);
    /*

    if (Game.options && Game.options.fog_of_war) {
      shadowHeightMap(Game.location);
      LineOfSight.clearFog();
    }
    */

   var map_data = {};
   map_data.terrain_type = this.Game.terrain_type;
   map_data.height_map = this.Game.height_map;
   map_data.player_supply_roads = this.Game.player_supply_roads;
   map_data.supply_route = this.Game.supply_route;

   return this.Game;
  };

  this.buildEmptyGameData = function(options, game) {
    game.occupied = this.buildOccupied(options);
    game.terrain_type = [];
    game.terrain = [];
    for (var x=0; x < options.map_grid.width; x++) {
      game.terrain_type[x] = [];
      game.terrain[x] = [];
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

  this.addWater = function(options, game, location_map) {
    var water_level = location_map.water.water_level;
    for (var x = 0; x < options.map_grid.width; x++) {
      for (var y = 0; y < options.map_grid.height; y++) {
        var height = game.height_map[x][y];
        if (height >= 1 - water_level) {
          var data = { height: game.height_map[x][y] };
          var water_obj = new Terrain("Water").add(data).stats;
          game.terrain_type[x][y] = water_obj;
          game.occupied[x][y] = true;
        }
      }
    }
  };

  this.addVillagesToSection = function(options, game_object, estimated_villages, min_x, max_x) {
    var village_locations = [];
    while (village_locations.length < estimated_villages) {
      for (var x = min_x; x < max_x; x++) {
        for (var y = 0; y < options.map_grid.height; y++) {
          var at_edge = x == 0 || x == options.map_grid.width - 1 || y == 0 || y == options.map_grid.height - 1;
          if (at_edge) continue;
          var num_tiles = options.map_grid.width * options.map_grid.height;
          var probability = estimated_villages / num_tiles;
          var value = Math.random();

          if (value >= 1 - probability && !game_object.occupied[x][y]) {
            var color = Math.ceil(game_object.height_map[x][y] * 255);

            game_object.occupied[x][y] = true;
            village_locations.push({ x: x, y: y });
            var stats = {
              height: game_object.height_map[x][y], 
              side: this.getMapSide(options, x)
            };
            var village_obj = new Terrain("Village").add(stats).stats;
            game_object.terrain_type[x][y] = village_obj;

            if (village_locations.length >= 1 + estimated_villages) return village_locations;
          }
        }
      }
    }
    return village_locations;
  };

  this.addVillages = function(options, game_object, estimated_villages) {
    //generateRandomEntities('Village', 'random', 
    // Place entity randomly on the map using noise
    var villages = [];
    // @TODO Ensure both sides have a map side/third equal in size
    for (var i=0; i<3; i++) {
      var width = Math.floor(options.map_grid.width / 3);
      var min_x = i * width;
      var max_x = (i + 1) * width;
      var new_villages = this.addVillagesToSection(options, game_object, estimated_villages / 3, min_x, max_x);

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

  this.addFarms = function(options, game_object, village_locations) {

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
          if (!game_object.occupied[x][y] && Math.random() < probability) {

            game_object.occupied[x][y] = true;
            //var data = { side: this.getMapSide(options, x) };
            var data = { side: this.getMapSide(options, x )};
            var farm_obj = new Terrain("Farm").add(data).stats;
            //farm_obj.side = this.getMapSide(options, x);
            game_object.terrain_type[x][y] = farm_obj;
          }
        }
      }
    }
  };

  this.addTrees = function(options, game_object, location_map) {
    var trees = location_map.trees;
    this.generateRandomEntities(options, game_object, 'Tree', options.noise[trees.noise], trees.size, trees.freq, true);
  };

  this.addGrass = function(options, game_object) {
    // MUST GO LAST - fill everything else with grass
    for (var x = 0; x < options.map_grid.width; x++) {
      for (var y = 0; y < options.map_grid.height; y++) {
        if (!game_object.occupied[x][y]) {
          /*
          var grass = Crafty.e('Grass');
          grass.at(x, y);
          grass.setHeight();
          */

          var stats = { height: game_object.height_map[x][y] };
          var grass_obj = new Terrain("Grass").add(stats).stats;
          game_object.terrain_type[x][y] = grass_obj;
        }
      }
    }
  };

  // Creates a road on the map given a shortest-path solution.
  this.createRoad = function(options, path, including_end, is_supply_route_road) {
    var road = [];
    var end = path.length - 1;
    if (including_end) end = path.length;
    for (var i = 0; i < end; i++) {
      var x = path[i].x;
      var y = path[i].y;
      //var terrain = Game.terrain[x][y];
      var terrain_type = this.Game.terrain_type[x][y];

      var entity_obj = {};

      if (terrain_type == "Village" || terrain_type.type == "Village") {
        road.push({ x: x, y: y});
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
        /*
        terrain.destroy();
        var entity = Crafty.e('Road');
        entity.at(path[i].x, path[i].y);
        */
        //if (is_supply_route || (is_supply_route_road && i == end - 1)) 
        if (is_supply_route_road && i == end - 1) {
          //entity.is_supply_route = true;
          entity_obj.is_supply_route = true;
        }
        //this.Game.terrain[x][y] = entity;
        //road.push(entity_obj);

        entity_obj.type = "Road";
      }
      entity_obj = new Terrain(entity_obj.type).add(entity_obj).stats;
      road.push({ x: x, y: y});
      this.Game.terrain_type[x][y] = entity_obj;
    }
    this.buildTerrainData(options, this.Game, this.Game.terrain_type);
    return road;
  };

  this.addSupplyRoad = function(options, village_locations, left_or_right) {
    var grid = this.Game.terrain_build_graph.grid;
    if (left_or_right === undefined) return false;
    if (left_or_right == "left") {
      var start_village = village_locations[0];
      for (var i in village_locations) {
        if (village_locations[i].x < start_village.x) {
          start_village = village_locations[i];
        }
      }
    } else {
      var start_village = village_locations[village_locations.length - 1];
      for (var i in village_locations) {
        if (village_locations[i].x > start_village.x) {
          start_village = village_locations[i];
        }
      }
    }
    if (start_village == undefined) return false;
    // cannot have supply village on end of map
    if (start_village.x == 0) return false;
    if (start_village.x == options.map_grid.width - 1) return false;

    var start = grid[start_village.x][start_village.y];
    var best_route = undefined;
    var best_cost = undefined;
    for (var j=0; j < options.map_grid.height; j+=1) {
      if (left_or_right == 'left') {
        var end = grid[0][j];
      } else {
        var end = grid[options.map_grid.width - 1][j];
      }
      var path = options.pathfind.search(this.Game.terrain_build_graph, start, end);
      var cost = Pathing.totalCost(path);
      if (best_route === undefined || cost < best_cost) {
        best_route = path;
        best_cost = cost;
      }
    }

    return this.createRoad(options, best_route, true, true);
  };


  this.addRoadsBetweenVillages = function(options, game_object, village_locations) {
    if (village_locations.length >= 2) {
      for (var a = 0; a < village_locations.length; a++) {
        var start_village = village_locations[a];
        var closest = undefined;
        var least_cost = undefined;
        for (var b = a; b < village_locations.length; b++) {
          if (a == b) continue;
          var end_location = village_locations[b];
          var start = game_object.terrain_build_graph.grid[start_village.x][start_village.y];
          var end = game_object.terrain_build_graph.grid[end_location.x][end_location.y];
          var result = options.pathfind.search(game_object.terrain_build_graph, start, end);
          var total_cost = Pathing.totalCost(result);
          if (least_cost === undefined || total_cost < least_cost) {
            closest = result;
            least_cost = total_cost;
          }
        }
        // @TODO Figure out why the last call is always undefined
        if (closest === undefined) continue;
        this.createRoad(options, closest);
      }
    }
  };

  this.addSupplyRoads = function(options, game_object, village_locations, max_roads, offset) { // <-- requires refactor
    // Entities are placed left to right, so the first will be on the left.
    if (max_roads === undefined) max_roads = 1;
    if (offset === undefined) offset = 0;
    max_roads += offset;

    // @TODO Save the supply end point locations, but nothing else
    for (var i = 0 + offset; i < max_roads; i++) {
      var new_supply_road = this.addSupplyRoad(options, village_locations, 'left');
      game_object.player_supply_roads[0].push(new_supply_road);
    }
    var left_supply_route = game_object.player_supply_roads[0][0][game_object.player_supply_roads[0][0].length - 1];
    game_object.supply_route[0] = left_supply_route;

    for (var i = village_locations.length - 1 - offset; i > village_locations.length - 1 - max_roads; i--) {
      var new_supply_road = this.addSupplyRoad(options, village_locations, 'right');
      game_object.player_supply_roads[1].push(new_supply_road);
    }
    var right_supply_route = game_object.player_supply_roads[1][0][game_object.player_supply_roads[1][0].length - 1];
    game_object.supply_route[1] = right_supply_route;


    var left = game_object.supply_route[0];
    var right = game_object.supply_route[1];
  };

  /*
   * entity_name: eg. 'Water' or 'Tree'
   * noise: the noise function object to be used. Eg. Game.noise.perlin2
   * size: relative; larger number means larger lakes
   * frequency: // relative, between 0 and 1; larger number means more lakes.
   * occupied: the array to update when entities are placed
   */
  this.generateRandomEntities = function(options, game_object, entity_name, noise, size, frequency, update_occupied) {
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
        
        if (noise_value >= 1 - frequency && !game_object.occupied[x][y]) {
          var stats = { height: game_object.height_map[x][y] };
          var entity_obj = new Terrain(entity_name).add(stats).stats;
          game_object.terrain_type[x][y] = entity_obj;
          if (update_occupied) {
            game_object.occupied[x][y] = true;
          }
        }
      }
    }
  };

  this.updateBuildDifficultyData = function(options, game_object, terrain_list) {
    // update/create build difficulty Graph for pathfinding purposes
    var terrain_build_difficulty = [];

    for (var x = 0; x < options.map_grid.width; x++) {
      terrain_build_difficulty[x] = [];

      for (var y = 0; y < options.map_grid.height; y++) {
        var terrain = terrain_list[x][y];
        terrain_build_difficulty[x][y] = terrain_list[x][y].build_over;
      }
    }

    game_object.terrain_build_difficulty = terrain_build_difficulty;
    game_object.terrain_build_graph = new options.graph_ftn(terrain_build_difficulty);
    return game_object.terrain_build_graph;
  };

  this.buildTerrainData = function(options, game_object, terrain_list) {
    // build Game.terrain Graph for pathfinding purposes
    var terrain_difficulty = [];
    var terrain_defense_bonus = [];
    var terrain_build_difficulty = [];
    var terrain_supply = [];

    for (var x = 0; x < terrain_list.length; x++) {
      terrain_defense_bonus[x] = [];
      terrain_difficulty[x] = [];
      terrain_build_difficulty[x] = [];
      terrain_supply[x] = [];

      for (var y = 0; y < terrain_list[x].length; y++) {
        terrain_difficulty[x][y] = terrain_list[x][y].move_difficulty;
        terrain_defense_bonus[x][y] = terrain_list[x][y].defense_bonus;
        terrain_build_difficulty[x][y] = terrain_list[x][y].build_over;
        var supply_value = terrain_list[x][y].supply ? 1 : 0;
        terrain_supply[x][y] = supply_value;
      }
    }

    //Game.terrain_type = terrain_type;
    game_object.terrain_difficulty = terrain_difficulty;
    game_object.terrain_defense_bonus = terrain_defense_bonus;
    game_object.terrain_build_difficulty = terrain_build_difficulty;
    game_object.terrain_supply = terrain_supply;

    // Uncomment below for Supply overlay
    /*
    var supply_objects = Crafty('Supply').get();
    for (var i=0; i<supply_objects.length; i++) {
      supply_objects[i].destroy();
    }

    for (var x=0; x<terrain_supply.length; x++) {
      for (var y=0; y<terrain_supply[x].length; y++) {
        if (terrain_supply[x][y]) {
          //Crafty.e("Supply").at(x, y);
        }
      }
    }
    */

    game_object.terrain_graph = new options.graph_ftn(terrain_difficulty);
    game_object.terrain_defense_bonus_graph = new options.graph_ftn(terrain_defense_bonus);
    game_object.terrain_build_graph = new options.graph_ftn(terrain_build_difficulty);
    game_object.terrain_supply_graph = new options.graph_ftn(terrain_supply);
  };

  this.createUnitFromFaction = function(faction_name, faction, side, location, index) {
    var unit_faction_data = {};
    Utility.loadDataIntoObject(faction.units[index], unit_faction_data);
    /*
    var name = faction.units[index].name;
    var quantity = faction.units[index].quantity;
    var type = faction.units[index].type;
    */
    var sprite = faction.sprites[unit_faction_data.type];
    if (sprite === undefined) {}

    var new_unit_data = this.createNewUnitData(unit_faction_data, side, location);
    if (sprite) new_unit_data.addComponent(sprite);
    return new_unit_data;
  };

  this.addStartingUnits = function(options, game_object) {

    this.getStartY = function(side, max_units_per_column) {
      var supply_road = game_object.player_supply_roads[side][0];
      var y = supply_road[supply_road.length - 1].y;
      var min_y = Math.max(y - Math.floor(max_units_per_column/2), 0);
      var max_y = Math.min(min_y, options.map_grid.height - max_units_per_column);
      return max_y;
    };

    this.addUnits = function(side, x_value) {
      var units = [];
      var faction = Factions[options.factions[side]];
      var units_left = faction.units.length;
      var current_index = 0;
      var column = 0;
      while (units_left > 0) {
        var max_units_per_column = 3;
        for (var i = 0; i<max_units_per_column; i++) {
          var y = this.getStartY(side, max_units_per_column);
          var spot = {x: x_value + column, y: y + i};
          var local_terrain = game_object.terrain_type[spot.x][spot.y].type;
          if (local_terrain == 'Water' || local_terrain.type == 'Water') {
          } else {
            var unit_obj = this.createUnitFromFaction(options.factions[side], faction, side, spot, current_index);
            units.push(unit_obj);
            units_left -= 1;
            current_index += 1;
            if (!units_left) break;
          }
        }
        if (x_value == 0) {
          column += 1;
        } else {
          column -= 1;
        }
      }

      return units;
    };

    //this.player = Crafty.e('PlayerCharacter')
    //this.player.at(0, 0);
    var units = [];
    units.push(this.addUnits(options.FIRST_PLAYER, 0));
    units.push(this.addUnits(options.SECOND_PLAYER, options.map_grid.width - 1));

    return units;
  };

  this.createNewUnitData = function(faction_data, side, location) {

    var unit_object = new UnitData(faction_data.type, faction_data);
    unit_object.add({ side: side });
    unit_object.setLocation(location);
    return unit_object;
  };

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = MapCreator;
} else {
  this.MapCreator = MapCreator;
}
