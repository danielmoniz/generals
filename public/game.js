
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
    if (this.selected) this.deselect();
    this.selected = clickable_object;
    if (this.selected.side == this.turn) this.player_selected[this.turn] = clickable_object;
    this.select_highlight = Crafty.e('Selected');
    if (!this.selected.at) return;
    var spot = this.selected.at();
    this.select_highlight.at(spot.x, spot.y);
    if (this.selected.select) {
      this.selected.select();
    } else {
      throw "NotImplementedError: select() for {0}".format(this.selected.type);
    }
  },

  deselect: function() {
    Crafty.trigger("DimPaths");
    Output.clearMain();
    Output.clearUnitsPanelSelect();
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

  nextTurn: function() {

    // Do nothing if game should be over. Let Victory screen render.
    if (this.player_winner !== undefined) return false;
    UI.gameInProgress();

    if (Game.type == Game.types.EMAIL) {
      if (Game.turns_played_locally >= 1) {
        return;
      }
    }

    Output.clearAll();
    this.updateTurnCount(this.turn_count + 0.5);
    this.turns_played_locally += 0.5;

    Output.updateStatusBar();
    Output.updateNextTurnButton(this.turn);

    var victory = Victory.checkVictoryConditions();
    Output.updateVictoryBar();
    if (victory !== false) {
      console.log("there is at least one loser");
      this.player_winner = victory;
      Crafty.scene('Victory');
      return false;
    }
    Crafty.trigger("NextTurn");

    this.deselect();
    this.determineSelection();
    if (Game.fog_of_war) {
      // Should really be using strategy pattern here
      if (Game.type == Game.types.ONLINE) {
        LineOfSight.handleLineOfSight(this.player);
      } else {
        LineOfSight.handleLineOfSight(this.turn);
      }
    }

    if (this.type == this.types.HOTSEAT) {
      if (this.turn % 1 == 0) {
        this.player = this.turn;
      }
    }

    Output.updateRetreatBlocks();
    Output.updateUnitsPanel();

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
      // @TODO Send moves online to update the game for everyone
      if (socket !== undefined) {
        socket.emit("next turn", moves, this.turn_count);
        //this.sendMovesCallback(moves);
      }
      this.nextTurn();

    } else if ((Game.player + 2 - 0.5) % 2 == Game.turn % 2) {
      this.nextTurn();
    }
  },

  updateOnlineGame: function(moves, turn_count) {
    this.updateTurnCount(turn_count - 1);
    this.nextTurn();

    this.loadOnline(moves);
    this.nextTurn();
    // Go right to the next player's turn - skip in-between' turn
    this.nextTurn();
  },

  determineSelection: function() {
    if (this.turn % 1 != 0) {
      return false;
    }
    var units = Unit.getFriendlyUnits(this.turn);
    var selected = Game.player_selected;
    if (!selected) {
      this.select(units[0]);
      return units[0];
    }
    var item = selected[this.turn];
    var item = this.player_selected[this.turn];

    if (item && item.side == this.turn) {
      Game.select(item);
      return item;
    } else if (!this.selected) {
      if (units.length == 0) return false;
      Game.select(units[0]);
      return units[0];
    }
  },

  // initialize and start our game
  start: function(game_type, options, map, sendMovesCallback) {
    if (!Game.options) Game.options = {};
    default_settings = new Options().getDefaultOptions();
    for (var key in default_settings) {
      var value = default_settings[key];
      Game[key] = value;
    }
    for (var key in options) {
      var value = options[key];
      Game[key] = value;
    }
    for (var key in map) {
      var value = map[key];
      Game[key] = value;
    }

    if (game_type === undefined) game_type = Game.types.HOTSEAT;
    Game.type = game_type;
    if (Game.turn_count == undefined) this.updateTurnCount('reset');
    //Game.type = Game.types['EMAIL'];
    var load_game = Game.load_game;
    Game.load_game = load_game;

    //Crafty.background('rgb(87, 109, 20)');

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

  },

  reset: function() {
    this.load_map = false;
    this.updateTurnCount('reset');
    this.selected = undefined;
    this.player_selected = [];
    // Is this needed?
    this.player_supply_roads = [[], []];

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
        unit.performAction(action);
      }
      //unit.nextTurn(Game.turn);
    }
    
    // perform actions and movements (use nextTurn on units)
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
