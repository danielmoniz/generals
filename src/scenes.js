// Game scene
// ----------
// Runs the core of the gameplay loop
Crafty.scene('Game', function() {

  // a 2D array to keep track of all occupied tiles
  this.occupied = new Array(Game.map_grid.width);
  for (var i = 0; i < Game.map_grid.width; i++) {
    this.occupied[i] = new Array(Game.map_grid.height);
    for (var y = 0; y < Game.map_grid.height; y++) {
      this.occupied[i][y] = false;
    }
  }

  /*
  // Place a tree at every edge square on our grid of tiles
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;

      if (at_edge) {
        // Place tree entities aroubd the border of the map
        Crafty.e('Tree').at(x, y);
        this.occupied[x][y] = true;
      } 
    }
  }
  */

  function buildEmptyGameData() {
    Game.height_map = generateHeightMap(Game.location);
    Game.occupied = buildOccupied();
  }

  function buildOccupied() {
    var occupied = [];
    for (var x = 0; x < Game.map_grid.width; x++) {
      occupied[x] = [];
      for (var y = 0; y < Game.map_grid.height; y++) {
        occupied[x][y] = false;
      }
    }
    return occupied;
  }

  function generateHeightMap(location_map) {
    var size = location_map.height_map.size;
    Game.noise.seed(Math.random());
    var noise = Game.noise[location_map.height_map.noise]
    var height_map = [];
    for (var x = 0; x < Game.map_grid.width; x++) {
      height_map[x] = [];
      for (var y = 0; y < Game.map_grid.height; y++) {
        var value = noise(x / Game.map_grid.width / size, y / Game.map_grid.height / size);
        height_map[x][y] =  Math.abs(value);
      }
    }
    return height_map;
  }

  function colourHeightMap(location_map) {
    var colour_scale_factor = 1/3;
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        var height = Math.ceil(Game.height_map[x][y] * 255 * colour_scale_factor);
        var ground = Crafty.e('FakeGrass').at(x, y);
        var r = Math.ceil(location_map.ground.r - height);
        var g = Math.ceil(location_map.ground.g - height);
        var b = Math.ceil(location_map.ground.b - height);
        var color_str = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        ground.color('rgb(' + r + ', ' + g + ', ' + b + ')');
        // Use below for grey-scale heightmap
        //ground.color('rgb(' + height + ', ' + height + ',' + height + ')')
        ;
      }
    }
  }

  function addWater(location_map) {
    var water_level = location_map.water.water_level;
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        var height = Game.height_map[x][y];
        if (height >= 1 - water_level) {
          Crafty.e('Water').at(x, y);
          Game.occupied[x][y] = true;
        }
        ;
      }
    }
  }

  function addVillages(estimated_villages) {
    //generateRandomEntities('Village', 'random', 
    // Place entity randomly on the map using noise
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        var num_tiles = Game.map_grid.width * Game.map_grid.height;
        var probability = estimated_villages / num_tiles;
        var value = Math.random();
        
        if (value >= 1 - probability && !Game.occupied[x][y]) {
          var color = Math.ceil(Game.height_map[x][y] * 255);
          Crafty.e('Village').at(x, y);
          Game.occupied[x][y] = true;
        }
      }
    }

  }

  function addTrees(location_map) {
    var trees = location_map.trees;
    generateRandomEntities('Tree', Game.noise[trees.noise], trees.size, trees.freq, true);
  }
  function addGrass() {
    // MUST GO LAST - fill everything else with grass
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        if (!Game.occupied[x][y]) {
          Crafty.e('Grass').at(x, y);
          ;
        }
      }
    }
  }

  function buildTerrainData() {
    // build Game.terrain Graph for pathfinding purposes
    var terrain_list = Crafty("Terrain").get();
    var terrain = [];
    var terrain_difficulty = [];
    var terrain_build_difficulty = [];
    for (var x = 0; x < Game.map_grid.width; x++) {
      terrain[x] = [];
      terrain_difficulty[x] = [];
      terrain_build_difficulty[x] = [];
    }

    for (var i = 0; i < terrain_list.length; i++) {
      terrain[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i];
      terrain_difficulty[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i].terrain;
      terrain_build_difficulty[terrain_list[i].getX()][terrain_list[i].getY()] = terrain_list[i].build_over;
    }

    Game.terrain = terrain;
    Game.terrain_difficulty = terrain_difficulty;
    Game.terrain_build_difficulty = terrain_build_difficulty;

    Game.terrain_graph = new Game.graph_ftn(terrain_difficulty);
    // test!
    //if (Game.terrain_build_graph) return false;
    Game.terrain_build_graph = new Game.graph_ftn(terrain_build_difficulty);
    /*
    console.log(terrain);
    console.log(terrain_build_difficulty);
    console.log(Game.terrain_build_graph);
    console.log("-----------------");
    */

    //console.log(Game.terrain_build_graph);
  }


  function addRoadsBetweenVillages() {
    var villages = Crafty("Village").get();
    if (villages.length >= 2) {
      for (a = 0; a < villages.length; a++) {
        var start_village = villages[a];
        var closest = undefined;
        var least_cost = undefined;
        for (b = a; b < villages.length; b++) {
          if (a == b) continue;
          var end_village = villages[b];
          var start = Game.terrain_build_graph.grid[start_village.getX()][start_village.getY()];
          var end = Game.terrain_build_graph.grid[end_village.getX()][end_village.getY()];
          var result = Game.pathfind.search(Game.terrain_build_graph, start, end);
          var total_cost = totalCost(result);
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
  }

  function addSupplyRoads(max_roads, offset) {
    // Entities are placed left to right, so the first will be on the left.
    if (max_roads === undefined) max_roads = 1;
    if (offset === undefined) offset = 0;
    max_roads += offset;
    var grid = Game.terrain_build_graph.grid;
    var villages = Crafty('Village').get();

    for (var i = 0 + offset; i < max_roads; i++) {
      var left_village = villages[i];
      if (left_village == undefined) continue;
      if (left_village.getX() == 0) continue;
      var start = grid[left_village.getX()][left_village.getY()];
      var best_route = undefined;
      var best_cost = undefined;
      for (var j=0; j < Game.map_grid.height; j+=2) {
        var end = grid[0][j];
        var path = Game.pathfind.search(Game.terrain_build_graph, start, end);
        /*
        console.log(start);
        */
        var cost = totalCost(path);
        if (best_route === undefined || cost < best_cost) {
          best_route = path;
          best_cost = cost;
        }
      }
      createRoad(best_route, true);
    }

    for (var i = villages.length - 1 - offset; i > villages.length - 1 - max_roads; i--) {
      var right_village = villages[i];
      if (right_village == undefined) continue;
      if (right_village.getX() == Game.map_grid.width - 1) continue;
      var start = grid[right_village.getX()][right_village.getY()];
      var best_route = undefined;
      var best_cost = undefined;
      for (var j=0; j < Game.map_grid.height; j+=2) {
        var end = grid[grid.length - 1][j];
        var path = Game.pathfind.search(Game.terrain_build_graph, start, end);
        //console.log(Game.pathfind.search);
        var cost = totalCost(path);
        if (best_route === undefined || cost < best_cost) {
          best_route = path;
          best_cost = cost;
        }
      }
      createRoad(best_route, true);
    }
  }

  function addPlayers() {
    // Player character, placed on the grid
    this.player = Crafty.e('PlayerCharacter').at(0, 0);
    for (var i=0; i<2; i++) {
      Crafty.e('Cavalry').at(1, 0+i)
        .attr({ side: Math.round(Math.random()), })
        .pick_side()
        ;
      //cavalry.z = 10
    }
    //this.occupied[this.player.at().x][this.player.at().y] = true;
  }

  buildEmptyGameData();
  colourHeightMap(Game.location);
  addWater(Game.location, this.occupied);
  estimated_villages = 7;
  addVillages(estimated_villages, this.occupied);
  addTrees(Game.location);
  addGrass();
  buildTerrainData();
  addSupplyRoads(1);
  // buildTerrainData not working on second run. Why not?
  // It also seems to act differently if run from createRoad().
  buildTerrainData();
  addRoadsBetweenVillages();
  buildTerrainData();
  //addSupplyRoads(1, 1);
  addPlayers();

  // Creates a road on the map given a shortest-path solution.
  function createRoad(result, including_end) {
    var end = result.length - 1;
    if (including_end) end = result.length;
    for (var i = 0; i < end; i++) {
      var x = result[i].x;
      var y = result[i].y;
      if (Game.terrain[x][y].has("Village")) continue;
      if (Game.terrain[x][y].has("Water")) {
        Game.terrain[x][y].destroy();
        Game.terrain[x][y] = Crafty.e('Bridge').at(result[i].x, result[i].y);
      } else {
        Game.terrain[x][y].destroy();
        Game.terrain[x][y] = Crafty.e('Road').at(result[i].x, result[i].y);
      }
    }
    //buildTerrainData();
  }

  function getShortestPath(graph, start, end) {
    return Game.pathfind.search(Game.terrain_build_graph, start, end);
  }

  /*
   * entity_name: eg. 'Water' or 'Tree'
   * noise: the noise function object to be used. Eg. Game.noise.perlin2
   * size: relative; larger number means larger lakes
   * frequency: // relative, between 0 and 1; larger number means more lakes.
   * occupied: the array to update when entities are placed
   */
  function generateRandomEntities(entity_name, noise, size, frequency, update_occupied) {
    // Place entity randomly on the map using noise
    Game.noise.seed(Math.random());
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        // Allows for somewhat hacky reuse of the function for pure randomness.
        if (noise == 'random') {
          var num_tiles = Game.map_grid.width * Game.map_grid.height;
          var frequency = size / num_tiles;
          var noise_value = Math.random();
        } else {
          var value = noise(x / Game.map_grid.width / size, y / Game.map_grid.height / size);
          var noise_value = Math.abs(value);
        }
        
        if (noise_value >= 1 - frequency && !Game.occupied[x][y]) {
          Crafty.e(entity_name).at(x, y);
          if (update_occupied) {
            Game.occupied[x][y] = true;
          }
        }
      }
    }
  }



  this.show_victory = this.bind('VillageVisited', function() {
    if (!Crafty('Village').length) {
      Crafty.scene('Victory');
    }
  });
}, function() {
  this.unbind('VillageVisited', this.show_victory);
});

// Victory scene
// ----------
// Tells the player when they've won and lets them start a new game
Crafty.scene('Victory', function() {
  Crafty.e('2D, DOM, Text')
    .attr({ x: 0, y: Game.height()/2 - 24, w: Game.width() })
    .css($text_css)
    .text('Victory! Press any key to start again.')
    ;

  // Watch for the player to press a key, then restart the game when a key is
  // pressed
  this.restart_game = this.bind('KeyDown', function() {
    Crafty.scene('Game');
  });
}, function() {
  // Remove our event binding from above so that we don't end up having
  // multiple redundant event watchers after multiple restarts of the game
  this.unbind('KeyDown', this.restart_game);
});

// Loading scene
// ----------
// Handles the loading of binary assets such as images and audio files
Crafty.scene('Loading', function() {
  // Draw some text for the player to see in case the file takes a noticeable
  // amount of time to load
  Crafty.e('2D, DOM, Text')
    .text('Loading...')
    .attr({ x: 0, y: Game.height()/2 - 24, w: Game.width() })
    .css($text_css)
    ;

  // Load our sprite map image
  
  var tile_width = Game.map_grid.tile.width;
  Crafty.load(['assets/16x16_generals.png', 'assets/cavalry-blue-' + tile_width + '.png', 'assets/cavalry-white-' + tile_width + '.png', 'assets/swords-16.gif'], function() {
    // Once the image is loaded...

    // Define the individual sprites in the image.
    // Each one (spr_tree, etc.) becomes a component.
    // These components names' are prefixed with "spr_" to remind us that they
    // simply cause the entity to be drawn with a certain sprite.
    Crafty.sprite(16, 'assets/16x16_generals.png', {
      spr_tree: [0, 0],
      spr_bush: [1, 0],
      spr_village: [0, 1],
      spr_player: [1, 1],
      /*
      spr_cavalry_blue: [1, 2],
      spr_cavalry: [2, 2],
      */
    });
    Crafty.sprite(tile_width, 'assets/cavalry-white-' + tile_width + '.png', {
      spr_cavalry: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/cavalry-blue-' + tile_width + '.png', {
      spr_cavalry_blue: [0, 0],
    });
      /*
      */
    Crafty.sprite(16, 'assets/swords-16.gif', {
      spr_battle: [0, 0],
    });

    // Now that are sprites are ready to draw, start the game.
    Crafty.scene('Game');
  })
});
