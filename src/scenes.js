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

  /*
   * entity_name: eg. 'Water' or 'Tree'
   * noise: the noise function object to be used. Eg. Game.noise.perlin2
   * size: relative; larger number means larger lakes
   * frequency: // relative, between 0 and 1; larger number means more lakes.
   * occupied: the array to update when entities are placed
   */
  function generateEntities(entity_name, noise, size, frequency, occupied, update_occupied, colour_height) {
    // Place entity randomly on the map using noise
    Game.noise.seed(Math.random());
    height_map = [];
    for (var x = 0; x < Game.map_grid.width; x++) {
      height_map[x] = [];
      for (var y = 0; y < Game.map_grid.height; y++) {

        // Allows for somewhat hacky reuse of the function for pure randomness.
        if (noise == 'random') {
          num_tiles = Game.map_grid.width * Game.map_grid.height;
          frequency = size / num_tiles;
          noise_value = Math.random();
        } else {
          var value = noise(x / Game.map_grid.width / size, y / Game.map_grid.height / size);
          var noise_value = Math.abs(value);
          // Used for colour gradients; see below.
        }
        
        height_map[x][y] = noise_value;
        if (noise_value >= 1 - frequency && !occupied[x][y]) {
          if (colour_height && Game.height_map != undefined) {
            var color = Math.ceil(Game.height_map[x][y] * 255);
            Crafty.e(entity_name).at(x, y)
              //.color('rgb(' + color + ', ' + color + ',' + color + ')')
              ;
          } else {
            Crafty.e(entity_name).at(x, y)
          }
          // The commented code below gives the entities color gradient, instead
          // of always being one colour. This is useful when wanting to better
          // understand the generated noise.
            //.color('rgb(' + color + ', ' + color + ',' + color + ')');
            ;
          if (update_occupied) {
            occupied[x][y] = true;
          }
        }
      }
    }
    return height_map;
  }

  function colourHeightMap(occupied) {
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        if (!occupied[x][y]) {
          var height = Math.ceil(Game.height_map[x][y] * 255 / 3);
          grass = Crafty.e('FakeGrass').at(x, y);
          rand = Math.random() * 50;
          r = Math.ceil(grass.colour.r - height);
          g = Math.ceil(grass.colour.g - height);
          b = Math.ceil(grass.colour.b - height);
          color_str = 'rgb(' + r + ', ' + g + ', ' + b + ')';
          grass.color('rgb(' + r + ', ' + g + ', ' + b + ')');
          //grass.color('rgb(' + height + ', ' + height + ',' + height + ')')
          ;
        }
      }
    }
  }

  function generateLocationBasedEntities(location_map, occupied) {
    water = location_map.water;
    trees = location_map.trees;
    Game.height_map  = generateEntities('Water', Game.noise[water.noise], water.size, water.freq, occupied, true);
    colourHeightMap(occupied);
    generateEntities('Village', 'random', 5, undefined, occupied, true);
    generateEntities('Tree', Game.noise[trees.noise], trees.size, trees.freq, occupied, true, true);

  }

  generateLocationBasedEntities(Game.location, this.occupied);
  //generateEntities('Water', Game.noise.perlin2, 1/3, .55, this.occupied, true);
  //generateEntities('Tree', Game.noise.simplex2, 100, .45, this.occupied, true);

  // Generate up to five villages on the map in random locations
  var max_villages = 5;
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;
      if (!at_edge && Math.random() < max_villages / (Game.map_grid.width * Game.map_grid.height) && !this.occupied[x][y]) {
        /*
        Crafty.e('Village').at(x, y);
        this.occupied[x][y] = true;
        */
      }
    }
  }

  // MUST GO LAST - fill everything else with grass
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      if (!this.occupied[x][y]) {
        var height = Math.ceil(Game.height_map[x][y] * 255 / 4);
        grass = Crafty.e('Grass').at(x, y);
        rand = Math.random() * 50;
        r = Math.ceil(grass.colour.r - height);
        g = Math.ceil(grass.colour.g - height);
        b = Math.ceil(grass.colour.b - height);
        color_str = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        //grass.color('rgb(' + r + ', ' + g + ', ' + b + ')');
        //grass.color('rgb(' + height + ', ' + height + ',' + height + ')')
        ;
      }
    }
  }

  // build Game.terrain Graph for pathfinding purposes
  terrain_list = Crafty("Terrain").get();
  terrain = [];
  terrain_difficulty = [];
  terrain_build_difficulty = [];
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
  Game.terrain_build_graph = new Game.graph_ftn(terrain_build_difficulty);

  function totalCost(result) {
    total_cost = 0;
    for (i = 0; i < result.length; i++) {
      cost = result[i].getCost();
      total_cost += cost;
    }
    return total_cost;
  }

  function createRoad(result) {
    console.log(result);
    for (i = 0; i < result.length - 1; i++) {
      x = result[i].x;
      y = result[i].y;
      if (Game.terrain[x][y].has("Village")) {
      } else if (Game.terrain[x][y].has("Water")) {
        Game.terrain[x][y].destroy();
        road = Crafty.e('Bridge').at(result[i].x, result[i].y);
      } else {
        Game.terrain[x][y].destroy();
        road = Crafty.e('Road').at(result[i].x, result[i].y);
      }
      Game.terrain[x][y] = road;
    }
  }

  function getShortestPath(graph, start, end) {
    return Game.pathfind.search(Game.terrain_build_graph, start, end);
  }

  // Test roads with path finding
  villages = Crafty("Village").get();
  if (villages.length >= 2) {
    for (a = 0; a < villages.length; a++) {
      start_village = villages[a];
      closest = undefined;
      least_cost = undefined;
      for (b = a; b < villages.length; b++) {
        if (a == b) continue;
        end_village = villages[b];
        start = Game.terrain_build_graph.grid[start_village.getX()][start_village.getY()];
        end = Game.terrain_build_graph.grid[end_village.getX()][end_village.getY()];
        result = Game.pathfind.search(Game.terrain_build_graph, start, end);
        total_cost = totalCost(result);
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


  // Player character, placed on the grid
  this.player = Crafty.e('PlayerCharacter').at(5, 5);
  //this.occupied[this.player.at().x][this.player.at().y] = true;

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
  Crafty.load(['assets/16x16_forest_1.gif'], function() {
    // Once the image is loaded...

    // Define the individual sprites in the image.
    // Each one (spr_tree, etc.) becomes a component.
    // These components names' are prefixed with "spr_" to remind us that they
    // simply cause the entity to be drawn with a certain sprite.
    Crafty.sprite(16, 'assets/16x16_forest_1.gif', {
      spr_tree: [0, 0],
      spr_bush: [1, 0],
      spr_village: [0, 1],
      spr_player: [1, 1],
    });

    // Now that are sprites are ready to draw, start the game.
    Crafty.scene('Game');
  })
});
