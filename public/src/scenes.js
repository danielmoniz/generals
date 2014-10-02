// Game scene
// ----------
// Runs the core of the gameplay loop
Crafty.scene('Game', function() {

  Game.resetStatusVisuals();

  function divideMap(num_parts) {
    if (num_parts === undefined) num_parts = 3;
    for (var i=0; i<num_parts - 1; i++) {
      var x = Math.floor((i + 1) * Game.map_grid.width / num_parts);
      for (var y=0; y<Game.map_grid.height; y++) {
        Crafty.e("Divider").at(x, y);
      }
    }
  }

  function addTitleBar() {
    var title = Crafty.e("TitleBar");
    title.at(0, 0)
      .text("GENERALS");

    var turn_counter = Crafty.e("TitleBar");
      turn_counter.at(4, 0);

    var turn_indicator = Crafty.e("TitleBar");
      turn_indicator.at(6, 0);

    var willpower = Crafty.e("TitleBar");
      willpower.at(11, 0);

    var victory_bar = Crafty.e("VictoryBar");
    victory_bar.at(19, 0);
    var victory_html = '\
	<div id="will-container">\
	  <div class="bar-container blue">\
	    <div class="will blue bar"></div>\
	  </div>\
	  <div class="bar-container white">\
	    <div class="will white bar"></div>\
	  </div>\
	</div>';
    victory_bar.replace(victory_html);

    Game.title_bar = {
      title: title,
      turn_counter: turn_counter,
      turn_indicator: turn_indicator,
      willpower: willpower,
      victory_bar: victory_bar,
    };

    Output.updateStatusBar();
    Output.updateVictoryBar();
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
      entity.changeColour('rgb(' + r + ', ' + g + ', ' + b + ')');
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
    colourHeightMap(location_map, "shadow height map");
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

  function buildTerrainFromData(terrain_data) {
    for (var x=0; x<terrain_data.length; x++) {
      for (var y=0; y<terrain_data[x].length; y++) {
        var terrain_datum = terrain_data[x][y];
        if (typeof terrain_datum == 'string') {
          var terrain = Crafty.e(terrain_datum);
        } else if (typeof terrain_datum == 'object') {
          var terrain_object = new TerrainData(terrain_datum.type, terrain_datum);
          var terrain = terrain_object.render();
        } else {
          throw "TerrainInvalid: Must be object or string.";
        }
        terrain.at(x, y);
        Game.terrain[x][y] = terrain;
      }
    }
  }

  function buildUnitsFromData(unit_data) {
    for (var side=0; side<2; side++) {
      for (var i=0; i<unit_data[side].length; i++) {
        var unit_stats = unit_data[side][i];
        var unit_object = new UnitData(unit_stats.type, unit_stats);
        var unit = unit_object.render();
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

  function loadPlayerSelections() {
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

  if (Game.type == Game.types.ONLINE) {
    startNewGame();
  } else if (Game.load_game) {
    buildTerrainFromData(Game.terrain_type);
    buildTerrainData();

    addSupplyRoads(1);
    addRoadsBetweenVillages();

    addRoadGraphics();
    colourHeightMap(Game.location);
    colourWater();

    if (Game.options && Game.options.fog_of_war) {
      shadowHeightMap(Game.location);
    }

    addUnitsFromLoad();
    addBattlesFromLoad();
    if (Game.options && Game.options.fog_of_war) {
      LineOfSight.handleLineOfSight(Game.turn);
    }
    Crafty.trigger("UpdateMovementPaths");

    loadPlayerSelections();
    Game.determineSelection();

  } else if (Game.load_map) {
    buildTerrainFromData(Game.terrain_type);
    buildTerrainData();

    addSupplyRoads(1);
    addRoadsBetweenVillages();

    addRoadGraphics();
    colourHeightMap(Game.location);
    colourWater();

    addPlayers();

    Victory.reset();
    Game.select(Crafty('Unit').get(0));

  } else { // eg. local hotseat play
    startNewGame();
  }

  function startNewGame() {

    var map_creator = new MapCreator();
    var options = new Options().getDefaultOptions();
    console.log("options");
    console.log(options);
    var game_data = map_creator.buildNewMap(options);
    Utility.loadDataIntoObject(game_data, Game);

    buildTerrainFromData(game_data.terrain_type);

    if (Game.options && Game.options.fog_of_war) {
      shadowHeightMap(Game.location);
      LineOfSight.clearFog();
    }

    addRoadGraphics();
    colourHeightMap(Game.location);
    colourWater();
    divideMap(3);

    buildUnitsFromData(game_data.starting_units);

    Victory.reset();
    Game.select(Crafty('Unit').get(0));
  }

  addTitleBar();

  function getShortestPath(graph, start, end) {
    return Game.pathfind.search(Game.terrain_build_graph, start, end);
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
  Crafty.load(['assets/16x16_generals.png', 'assets/infantry-mongol.png', 'assets/infantry-roman.png', 'assets/cavalry-mongol.png', 'assets/cavalry-roman.png', 'assets/Combat2.png', 'assets/road-dirt-32.png', 'assets/Forest-32.png'], function() {
    // Once the image is loaded...

    // Define the individual sprites in the image.
    // Each one (spr_tree, etc.) becomes a component.
    // These components names' are prefixed with "spr_" to remind us that they
    // simply cause the entity to be drawn with a certain sprite.
    Crafty.sprite(16, 'assets/16x16_generals.png', {
      //spr_tree: [0, 0],
      spr_bush: [1, 0],
      spr_village: [0, 1],
      spr_player: [1, 1],
    });
    Crafty.sprite(32, 'assets/Forest-32.png', {
      spr_tree: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/cavalry-blue-' + tile_width + '.png', {
      spr_cavalry_blue: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/cavalry-white-' + tile_width + '.png', {
      spr_cavalry: [0, 0],
      spr_cavalry_white: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/cavalry-mongol.png', {
      spr_cavalry_mongols: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/cavalry-roman.png', {
      spr_cavalry_romans: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/infantry-mongol.png', {
      spr_infantry_mongols: [0, 0],
    });
    Crafty.sprite(tile_width, 'assets/infantry-roman.png', {
      spr_infantry_romans: [0, 0],
    });
      /*
      */
    Crafty.sprite(32, 'assets/Combat2.png', {
      spr_battle: [0, 0],
    });
    Crafty.sprite(32, 'assets/road-dirt-32.png', {
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
