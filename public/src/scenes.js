function nextTurn(e) {
  if (e.key == Crafty.keys.SPACE) {
    Game.nextTurn();
  } else {
    //console.log(e);
  }
}
// Game scene
// ----------
// Runs the core of the gameplay loop
Crafty.scene('Game', function() {
  this.unbind("KeyDown", nextTurn);
  this.bind('KeyDown', nextTurn);

  Game.resetStatusVisuals();

  function addTitleBar() {
    var title = Crafty.e("TitleBar");
    title.at(0, 0)
      .text("GENERALS");

    var turn_counter = Crafty.e("TitleBar");
      turn_counter.at(4, 0)
        .text("Turn 0");

    var turn_indicator = Crafty.e("TitleBar");
      turn_indicator.at(6, 0)
        .text("Blue (up next)");

    var willpower = Crafty.e("TitleBar");
      willpower.at(10, 0)
        .text("(Blue) 100% - 100% (White)");

    Game.title_bar = {
      title: title,
      turn_counter: turn_counter,
      turn_indicator: turn_indicator,
      willpower: willpower,
    };

    Output.updateStatusBar();
    Output.updateVictoryBar();
  }

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

  function colourWater(colour_scale_factor) {
    if (colour_scale_factor === undefined) var colour_scale_factor = 1/3;
    var water = Crafty('Water').get();
    for (var i = 0; i < water.length; i++) {
      var x = water[i].at().x;
      var y = water[i].at().y;
      var entity = water[i];
      var height = Math.ceil(Game.height_map[x][y] * 255 * colour_scale_factor);
      var r = Math.ceil(entity.colour.r - height);
      var g = Math.ceil(entity.colour.g - height);
      var b = Math.ceil(entity.colour.b - height);
      var color_str = 'rgb(' + r + ', ' + g + ', ' + b + ')';
      entity.color('rgb(' + r + ', ' + g + ', ' + b + ')');
      // Use below for grey-scale heightmap
      //ground.color('rgb(' + height + ', ' + height + ',' + height + ')')
      ;
    }
  }

  function colourHeightMap(location_map, shadow) {
    var colour_scale_factor = 1/3;
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        var height = Math.ceil(Game.height_map[x][y] * 255 * colour_scale_factor);
        if (shadow) {
          var ground = Crafty.e('Shadow');
        } else {
          var ground = Crafty.e('FakeGrass');
        }
        ground.at(x, y);
        var r = Math.ceil(location_map.ground.r - height);
        var g = Math.ceil(location_map.ground.g - height);
        var b = Math.ceil(location_map.ground.b - height);
        var color_str = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        ground.color('rgb(' + r + ', ' + g + ', ' + b + ')');
        ground.setColour(r, g, b);
        if (shadow) ground.dimColour(ground.dim_value, ground.dim_value, ground.dim_value);
        // Use below for grey-scale heightmap
        //ground.color('rgb(' + height + ', ' + height + ',' + height + ')')
        ;
      }
    }
  }

  function shadowHeightMap(location_map) {
    colourHeightMap(location_map, true);
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
      }
    }
  }

  function addVillages(estimated_villages) {
    //generateRandomEntities('Village', 'random', 
    // Place entity randomly on the map using noise
    for (var x = 0; x < Game.map_grid.width; x++) {
      for (var y = 0; y < Game.map_grid.height; y++) {
        var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;
        if (at_edge) continue;
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

  function addRoadsBetweenVillages() {
    var villages = Crafty("Village").get();
    if (villages.length >= 2) {
      for (var a = 0; a < villages.length; a++) {
        var start_village = villages[a];
        var closest = undefined;
        var least_cost = undefined;
        for (var b = a; b < villages.length; b++) {
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
        var cost = totalCost(path);
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
  }

  function createNewUnit(type, side, location, name, quantity) {
    var unit = Crafty.e(type);
    unit.at(location.x, location.y)
      .pick_side(side)
      ;
    unit.name = name;
    unit.quantity = quantity;
    return unit;
  }

  function createUnitFromFaction(faction, side, location, index) {
    var name = faction[index].name;
    var quantity = faction[index].quantity;
    var type = faction[index].unit;
    return createNewUnit(type, side, location, name, quantity);
  }

  function createUnitFromLoad(unit) {
    createNewUnit();
  }

  function addPlayers() {
    // Player character, placed on the grid
    function getStartY(side, max_units_per_column) {
      var supply_road = Game.player_supply_roads[side][0];
      var y = supply_road[supply_road.length - 1].at().y;
      var min_y = Math.max(y - Math.floor(max_units_per_column/2), 0);
      var max_y = Math.min(min_y, Game.map_grid.height - max_units_per_column);
      return max_y;
    }

    function addUnits(side, x_value) {
      var faction = Game.factions[side];
      var units_left = faction.length;
      var current_index = 0;
      var column = 0;
      while (units_left > 0) {
        var max_units_per_column = 3;
        for (var i = 0; i<max_units_per_column; i++) {
          var y = getStartY(side, max_units_per_column);
          var spot = {x: x_value + column, y: y + i};
          if (!Game.terrain[spot.x][spot.y].has('Water')) {
            createUnitFromFaction(faction, side, spot, current_index);
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
    }

    this.player = Crafty.e('PlayerCharacter')
    this.player.at(0, 0);
    addUnits(Game.FIRST_PLAYER, 0);
    addUnits(Game.SECOND_PLAYER, Game.map_grid.width - 1);
  }

  function addRoadGraphics() {
    var roads = Crafty('Road').get();
    for (var i=0; i<roads.length; i++) {
      roads[i].set_sprite();
    }

    // @TODO beautify roads - look for loops and remove useless pieces
    // Use the following to find string instances (in this example, 'is'):
    // count = (str.match(/is/g) || []).length;
    function isPartOfLoop(road) {

    }
  }

  function buildTerrainFromLoad() {
    for (var x=0; x<Game.map_grid.width; x++) {
      for (var y=0; y<Game.map_grid.height; y++) {
        var terrain_type = Game.terrain_type[x][y];
        var terrain = Crafty.e(terrain_type);
        terrain.at(x, y);
      }
    }
  }

  function addUnitsFromLoad() {
    this.player = Crafty.e('PlayerCharacter')
    this.player.at(0, 0);

    var units = Game.units;
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var new_unit = createNewUnit(unit.type, unit.side, unit.location, unit.name, unit.quantity);

      new_unit.battle = unit.battle;
      new_unit.injured = unit.injured;
      new_unit.alive = unit.alive;
      new_unit.active = unit.active;
      new_unit.supply_remaining = unit.supply_remaining;
      new_unit.battle_side = unit.battle_side;
      new_unit.battle_side = unit.battle_side;
      new_unit.move_target = unit.move_target;

      if (new_unit.move_target) {
        new_unit.prepareMove(new_unit.move_target.x, new_unit.move_target.y, true);
        if (Game.turn == new_unit.side) {
          //new_unit.prepareMove(new_unit.move_target.x, new_unit.move_target.y);
        }
      }
    }
  }

  function addBattlesFromLoad() {
    var battles = Game.battles;
    var units = Crafty('Unit').get();
    for (var i=0; i<battles.length; i++) {
      var battle = battles[i];
      var new_battle = Crafty.e('Battle');
      new_battle.attacking_side = battle.attacking_side;
      new_battle.at(battle.location.x, battle.location.y);
      if (battle.attacker_name) {
        var attacker = undefined;
        for (var j=0; j<units.length; j++) {
          if (units[j].name == battle.attacker_name) {
            new_battle.attacker = units[j];
            break;
          }
        }
      }
      new_battle.prepareBattle();
    }
  }

  function determinePlayerSelections() {
    var units = Crafty('Unit').get();
    Game.player_selected = [];
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      if (unit.name == Game.player_name_selected[0]) {
        Game.player_selected[0] = unit;
      } else if (unit.name == Game.player_name_selected[1]) {
        Game.player_selected[1] = unit;
      }
    }
  }

  if (Game.load_game) {
    buildTerrainFromLoad();
    buildTerrainData();

    addSupplyRoads(1);
    addRoadsBetweenVillages();
    addRoadGraphics();

    colourHeightMap(Game.location);
    shadowHeightMap(Game.location);
    colourWater();

    addUnitsFromLoad();
    addBattlesFromLoad();
    LineOfSight.handleLineOfSight(Game.turn);
    determinePlayerSelections();

  } else if (Game.load_map) {
    buildTerrainFromLoad();
    buildTerrainData();

    addSupplyRoads(1);
    addRoadsBetweenVillages();
    addRoadGraphics();

    colourHeightMap(Game.location);
    shadowHeightMap(Game.location);
    colourWater();

    addPlayers();

    Victory.reset();
    Game.select(Crafty('Unit').get(0));

  } else {
    buildEmptyGameData();
    addWater(Game.location, this.occupied);
    addVillages(12, this.occupied);
    addTrees(Game.location);
    addGrass();
    buildTerrainData();
    addSupplyRoads(1);
    addRoadsBetweenVillages();
    //addSupplyRoads(1, 1);
    addRoadGraphics();
    addPlayers();

    colourHeightMap(Game.location);
    shadowHeightMap(Game.location);
    colourWater();

    Victory.reset();
    Game.select(Crafty('Unit').get(0));
  }

  addTitleBar();


  // Creates a road on the map given a shortest-path solution.
  function createRoad(path, including_end, is_supply_road) {
    var road = [];
    var end = path.length - 1;
    if (including_end) end = path.length;
    for (var i = 0; i < end; i++) {
      var x = path[i].x;
      var y = path[i].y;
      var terrain = Game.terrain[x][y];
      if (terrain.has("Village")) {
        road.push(terrain);
        continue;
      }
      if (terrain.has("Water")) {
        terrain.destroy();
        var entity = Crafty.e('Bridge');
        entity.at(path[i].x, path[i].y);
        Game.terrain[x][y] = entity;
        road.push(entity);
      } else {
        var is_supply = false;
        if (terrain.has('Road') && terrain.is_supply) {
          var is_supply = true;
        }
        terrain.destroy();
        var entity = Crafty.e('Road');
        entity.at(path[i].x, path[i].y);
        if (is_supply || (is_supply_road && i == end - 1)) {
          entity.is_supply = true;
        }
        Game.terrain[x][y] = entity;
        road.push(entity);
      }
    }
    buildTerrainData();
    return road;
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
    .text(Victory.victory_text)
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
  Crafty.load(['assets/16x16_generals.png', 'assets/cavalry-blue-' + tile_width + '.png', 'assets/cavalry-white-' + tile_width + '.png', 'assets/swords-16.gif', 'assets/road-32.png'], function() {
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
    Crafty.sprite(32, 'assets/road-32.png', {
      spr_road: [0, 1],
      spr_road_horizontal: [0, 0],
      spr_road_vertical: [1, 0],
      spr_road_top_left: [2, 0],
      spr_road_top_right: [3, 0],
      spr_road_bottom_right: [4, 0],
      spr_road_bottom_left: [5, 0],
      spr_road_no_top: [0, 1],
      spr_road_no_right: [1, 1],
      spr_road_no_bottom: [2, 1],
      spr_road_no_left: [3, 1],
      spr_road_all: [0, 2],
    });

    // Now that are sprites are ready to draw, start the game.
    Crafty.scene('Game');
  })
});
