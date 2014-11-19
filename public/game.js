
Game = {
  types: {
    HOTSEAT: "hotseat",
    EMAIL: "email",
    ONLINE: "online",
  },

  graph_ftn: Graph,
  pathfind: astar,
  noise: noise,

  terrain: undefined,
  terrain_type: undefined,
  terrain_supply: undefined,
  terrain_build_difficulty: undefined,
  terrain_graph: undefined,
  terrain_build_graph: undefined,
  terrain_supply_graph: undefined,

  height_map: undefined,
  occupied: undefined,
  // The total width of the game screen. Since our grid takes up the entire
  // screen this is just the width of a tile times the width of the grid
  width: function() {
    return this.map_grid.width * this.map_grid.tile.width;
  },

  height: function() {
    return this.map_grid.height * this.map_grid.tile.height;
  },

  // @TODO generate on load()
  player_selected: [],
  selected: undefined,

  select: function(clickable_object) {
    Action.perform('select', clickable_object);
  },

  deselect: function() {
    Crafty.trigger("DimPaths");
    Output.clearCounts();
    Output.clearUnitsPanelSelect();
    Output.clearBattlesPanelSelect();
    Output.clearEnemyUnitsPanel();

    for (var i in this.visible_possible_moves) {
      this.visible_possible_moves[i].visible = false;
    }

    //Output.clearMessage();
    if (this.selected) {
      delete this.selected;
      this.select_highlight.destroy();
    }
  },
  clearPlayerSelected: function(side) {
    if (side === undefined) side = this.turn;
    delete this.player_selected[side];
  },

  // @TODO generate on load() - currently relying on pathfinding to replicate
  player_supply_roads: [[], []],

  supply_route: [],

  turns_played_locally: 0,

  visible_possible_moves: [],

  nextTurn: function() {

    // Do nothing if game should be over. Let Victory screen render.
    if (this.player_winner !== undefined) return false;

    if (Game.type == Game.types.EMAIL) {
      if (Game.turns_played_locally >= 1) {
        return;
      }
    }

    Output.clearAll();
    this.updateTurnCount(this.turn_count + 0.5);
    this.turns_played_locally += 0.5;

    Output.updateNextTurnButton(this.turn);

    var victory = Victory.checkVictoryConditions();
    Output.updateVictoryBar();
    if (victory !== false) {
      console.log("there is at least one loser");
      this.end(victory);
      GameActions.endGame(victory);
      return false;
    }

    if (this.type == this.types.HOTSEAT) {
      this.player = undefined;
      if (this.turn % 1 == 0) {
        this.player = this.turn;
      }
    }

    if (this.turn % 2 == 0) {
      console.log("next day:");
      this.weather.nextDay();
    }
    console.log("spread fire:");
    Crafty.trigger("SpreadFire");
    console.log("-----------------");
    this.map_creator.updateMovementDifficultyData(this, this, this.terrain);

    // line of sight must update before unit turns for proper pathfinding
    LineOfSight.handleLineOfSight(Game.fog_of_war, this.player);

    // ------------------------------------
    Crafty.trigger("NextTurn");
    Crafty.trigger("StartBattles");
    Crafty.trigger("ResolveBattles");
    Crafty.trigger("EndBattles");
    // ------------------------------------

    this.map_creator.updateMovementDifficultyData(this, this, this.terrain);
    if (this.player !== undefined) this.updatePossibleUnitMoves();

    var victory = Victory.checkVictoryConditions();
    Output.updateVictoryBar();

    UI.gameInProgress();
    Output.updateStatusBar();

    if (this.type == this.types.HOTSEAT) {
      Output.printBattles();
    }

    if (this.type == this.types.HOTSEAT) {
      this.deselect();
    }

    Output.updateUnitsPanel();
    Output.updateUnitInfoPanel();
    if (this.turn % 1 == 0) Output.printLosses();

    if (this.type == this.types.HOTSEAT) {
      this.determineSelection();
    } else {
      this.determineSelectionOnline();
    }

    Output.updateRetreatBlocks();
  },

  end: function(winner) {
    this.player_winner = winner;
    Crafty.scene('Victory');
  },

  lose: function() {
    this.end(1 - Game.player);
  },

  updateTurnCount: function(turn_count) {
    if (turn_count == 'reset') {
      Game.turn = 1.5;
      Game.turn_count = -0.5;
      return;
    }
    this.turn_count = turn_count;
    this.turn = turn_count % 2;
  },

  nextTurnOnline: function() {
    //if (this.turn == this.player || Math.abs(Game.player - 0.5) % 2 == Game.turn % 2) {
    if (this.turn == this.player) {
      var moves = this.saveOnline();
      if (socket !== undefined) {
        this.sendMovesCallback(moves);
      }
      this.nextTurn();
      this.nextTurn();

    } else if ((Game.player + 2 - 0.5) % 2 == Game.turn % 2) {
      this.nextTurn();
    } else {
      return false;
    }
    Output.printBattles();
  },

  updateOnlineGame: function(moves, turn_count) {
    if (this.turn_count < 0) {
      this.updateTurnCount(turn_count - 1);
      this.nextTurn();
    }

    this.loadOnline(moves);
    this.nextTurn();
    // Go right to the next player's turn - skip in-between' turn
    this.nextTurn();

    Output.printBattles();
  },

  updatePossibleUnitMoves: function() {
    var units = Entity.get('Unit');
    var moves = {};
    var avoid = {};
    for (var i in units) {
      var unit = units[i];
      var start_location = unit.at();

      for (var x=0; x < Game.map_grid.width; x++) {
        for (var y=0; y < Game.map_grid.height; y++) {
          var target = { x: x, y: y };
          if (Utility.getDistance(unit.at(), target) > 1.5 * unit.movement) continue;
          var start = Game.terrain_graph.grid[unit.at().x][unit.at().y];
          var end = Game.terrain_graph.grid[x][y];
          var path = Game.pathfind.search(Game.terrain_graph, start, end);
          if (!path) continue;

          var stop_points = unit.getStopPoints(target, start_location);
          var partial_path = Pathing.getPartialPath(path, unit.movement, stop_points);
          for (var p in partial_path) {
            var node = partial_path[p];
            if (moves[node.x] === undefined) moves[node.x] = [];
            moves[node.x].push(node.y);
            if (unit.possible_moves_data[node.x] && unit.possible_moves_data[node.x].indexOf && unit.possible_moves_data[node.x].indexOf(node.y) > -1) continue;
            unit.possible_moves.push(Game.possible_moves[node.x][node.y]);
            if (unit.possible_moves_data[node.x] === undefined) {
              unit.possible_moves_data[node.x] = [];
            }
            unit.possible_moves_data[node.x].push(node.y);
          }
        }
      }
    }
  },

  determineSelection: function() {
    if (this.turn % 1 != 0) {
      return false;
    }
    var units = Unit.getFriendlyUnits(this.player);
    var selected = Game.player_selected;
    if (!selected) {
      this.select(units[0]);
      return units[0];
    }
    var item = selected[this.player];

    if (item && item.side == this.player) {
      Game.select(item);
      return item;
    } else if (!this.selected) {
      if (units.length == 0) return false;
      Game.select(units[0]);
      return units[0];
    }
  },

  determineSelectionOnline: function() {
    if (this.selected && (this.selected.side == this.player || this.selected.side === undefined)) {
      this.select(this.selected);
    } else {
      if (this.player_selected && this.player_selected[this.player]) {
        this.select(this.player_selected[this.player]);
      } else { // select first unit on your team
        var units = Unit.getFriendlyUnits(this.player);
        this.select(units[0]);
      }
    }
  },

  // initialize and start our game
  start: function(game_type, options, map, sendMovesCallback, random_seed) {
    Crafty.timer.FPS(0);
    if (!Game.options) Game.options = {};
    var options_obj = new Options();
    options_obj.setOptions(options, this);
    for (var key in map) {
      var value = map[key];
      Game[key] = value;
    }

    if (game_type === undefined) game_type = Game.types.HOTSEAT;
    Game.type = game_type;
    if (Game.turn_count == undefined) this.updateTurnCount('reset');

    var load_game = Game.load_game;
    Game.load_game = load_game;

    this.sendMovesCallback = sendMovesCallback;
    if (random_seed !== undefined) Random.setSeed(random_seed);

    this.reset();
    if (Game.played_already) {
      Crafty.scene('Game');
    } else {
      this.initCrafty();
      Crafty.scene('Loading');
    }
    UI.startGame();
    UI.gameStarted();
    Output.updateStatusBar();
    Output.updateVictoryBar(true);
    Output.updateNextTurnButton(this.turn);

    if (this.type == this.types.ONLINE) {
      var message = "Review the map and your opponent";
      if (this.player == 0) {
        var start_game_text = $(Output.next_turn_button_id).val();
        message += ". Press {0} when you are ready!".format(start_game_text);
      } else {
        message += " while you wait for your opponent.".format();
      }
      Output.message(message);
    }

    Output.updateUnitsPanel();
    Output.updateUnitInfoPanel();

  },

  reset: function() {
    this.load_map = false;
    this.updateTurnCount('reset');
    this.selected = undefined;
    this.player_selected = [];
    // Is this needed?
    this.player_supply_roads = [[], []];
    this.weather = new Weather();

    this.resetStatusVisuals(true);
    Output.clearAll();

    delete this.player_winner;
  },

  initCrafty: function() {
    Crafty.init(Game.width(), Game.height() + Game.board_title.height, "stage");
  },

  resetStatusVisuals: function(hard_reset) {
    Output.updateStatusBar();
    Output.updateVictoryBar(hard_reset);
  },

  saveOnline: function() {
    var data = {};

    var this_turn = this.turn;
    var units = Unit.getFriendlyUnits(this_turn);
    for (var i in units) {
      var unit = units[i];
      var unit_turn = {
        actions: unit.performed_actions,
        move_target_path_list: unit.move_target_path_list,
      };
      data[unit.id] = unit_turn;
    }

    return data;
  },

  loadOnline: function(data) {
    var previous_turn = Game.turn - 0.5 % 2;
    var current_turn = Game.turn;
    // get unit actions and movement paths
    console.log('------------------------------');
    console.log('loading data from online');
    console.log("data");
    console.log(data);
    for (var id in data) {
      var unit_data = data[id];
      var unit = Unit.getUnitById(id, current_turn);
      unit.move_target_path_list = unit_data.move_target_path_list;
      for (var i in unit_data.actions) {
        var action = unit_data.actions[i];
        Action.perform('unit action', unit, action);
      }
    }
  },

  /*
   * For now, output JSON as text so that it can be loaded manually.
   */
  save: function() {
    var saved_game = {
      location: this.location,
      factions: this.factions,
      victory: Victory,
      type: this.type,

      options: this.options,

      map_grid: this.map_grid,
      //terrain_type: this.terrain_type,
      height_map: this.height_map,
      occupied: this.occupied,

      player_name_selected: [],
      //selected_name: this.selected.name,

      player_colour: this.player_colour,

      supply_route: this.supply_route,

      turn: this.turn,
      turn_count: this.turn_count,

      FIRST_PLAYER: this.FIRST_PLAYER,
      AFTER_FIRST_PLAYER: this.AFTER_FIRST_PLAYER,
      SECOND_PLAYER: this.SECOND_PLAYER,
      AFTER_SECOND_PLAYER: this.AFTER_SECOND_PLAYER,

      battle_death_rate: this.battle_death_rate,
      attrition_rate: this.attrition_rate,
      attrition_death_rate: this.attrition_death_rate,
      city_healing_rate: this.city_healing_rate,

      units: [],
      battles: [],
    };

    // build more items into saved_game
    if (this.selected && this.selected.name) saved_game.selected_name = this.selected.name;
    saved_game.player_name_selected = [];
    if (this.player_selected[0] && this.player_selected[0].name) {
      saved_game.player_name_selected[0] = this.player_selected[0].name;
    }
    if (this.player_selected[1] && this.player_selected[1].name) {
      saved_game.player_name_selected[1] = this.player_selected[1].name;
    }

    // save units
    var units = Crafty('Unit').get();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      saved_game.units.push(unit.stats);
    }

    var battles = Crafty('Battle').get();
    for (var i=0; i<battles.length; i++) {
      var battle = battles[i];
      var new_battle = {};
      new_battle.num_turns = battle.num_turns;
      new_battle.location = battle.at();
      new_battle.attacker_name = battle.attacker.name;
      new_battle.attacking_side = battle.attacking_side;

      saved_game.battles.push(new_battle);
    }

    // handle all terrain data
    saved_game.terrain_type = [];
    var terrain = Crafty('Terrain').get();
    for (var i in terrain) {
      var x = terrain[i].at().x;
      var y = terrain[i].at().y;
      if (saved_game.terrain_type[x] === undefined) {
        saved_game.terrain_type[x] = [];
      }
      saved_game.terrain_type[x][y] = terrain[i].stats;
    }

    var json_output = JSON.stringify(saved_game);
    var textarea_id = "load-input";
    document.getElementById(textarea_id).value = json_output;
    //Utility.copyToClipboard(json_output);
  },

  loadMap: function(map_data) {

    Output.clearAll();
    Game.reset();

    var map_data = JSON.parse(map_data);

    this.turns_played_locally = 0;
    Victory.reset();

    this.options = UI.getOptions();
    this.location = map_data.location;
    this.map_grid = map_data.map_grid;
    this.terrain_type = map_data.terrain_type;
    this.height_map = map_data.height_map;

    this.supply_route = map_data.supply_route;

    this.load_map = true;
    this.load_game = false;
    Crafty.scene('Loading');

    var textarea_id = "load-input";
    document.getElementById(textarea_id).value = "";
    UI.deselectButtons();
  },

  load: function(map_data) {

    Output.clearAll();
    Game.reset();

    var map_data = JSON.parse(map_data);

    this.turns_played_locally = 0;
    Victory.set(map_data.victory);

    this.location = map_data.location;
    this.factions = map_data.factions;
    this.options =  map_data.options;
    this.type = map_data.type;

    this.map_grid = map_data.map_grid;
    this.terrain_type = map_data.terrain_type;
    this.height_map = map_data.height_map;
    this.occupied = map_data.occupied;

    this.player_name_selected = map_data.player_name_selected;
    this.player_colour = map_data.player_colour;

    this.supply_route = map_data.supply_route;

    this.turn = map_data.turn;
    this.turn_count = map_data.turn_count;

    this.units = map_data.units;
    this.battles = map_data.battles;

    this.load_game = true;
    this.load_map = false;
    if (!Crafty.stage) {
      this.initCrafty();
    }
    Crafty.scene('Loading');

    var textarea_id = "load-input";
    document.getElementById(textarea_id).value = "";
    UI.startGame();
    UI.deselectButtons();
  },
}

$text_css = { 'font-size': '100px', 'font-family': 'Arial', 'color': 'white', 'text-align': 'center' }
