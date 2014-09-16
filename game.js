var map_width = 33;
var tile_size = 32;

Game = {
  location: locations.test,
  factions: [factions.mongols, factions.romans],

  types: {
    HOTSEAT: "hotseat",
    EMAIL: "play by email",
    ONLINE: "online",
  },

  // this defines our grid's size and the size of each of its tiles
  map_grid: {
    width: Math.ceil(map_width),
    //height: Math.ceil(map_width),
    //height: Math.ceil(map_width * 3 / 4),
    height: Math.ceil(map_width * 0.5625),
    tile: {
      width: tile_size,
      height: tile_size,
    }
  },

  // @TODO generate on load()
  graph_ftn: Graph,
  pathfind: astar,
  noise: noise,

  // @TODO generate on load()
  terrain: undefined,
  terrain_type: undefined,
  terrain_supply: undefined,
  terrain_build_difficulty: undefined,
  terrain_graph: undefined,
  terrain_build_graph: undefined,
  terrain_supply_graph: undefined,

  height_map: undefined,
  occupied: undefined,
  //grid_ftn: grid,
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
    Output.clearMain();
    if (this.selected) {
      delete this.selected;
      this.select_highlight.destroy();
    }
  },
  clearPlayerSelected: function(side) {
    if (side === undefined) side = this.turn;
    delete this.player_selected[side];
  },

  player_colour: { 0: "Blue", 1: "White" },

  // @TODO generate on load()
  player_supply_roads: [[], []],

  supply_route: [],

  /*
  turn: 0,
  turn_count: 0,
  */
  turns_played_locally: 0.5,

  FIRST_PLAYER: 0,
  AFTER_FIRST_PLAYER: 0.5,
  SECOND_PLAYER: 1,
  AFTER_SECOND_PLAYER: 1.5,

  battle_death_rate: 1/5,
  attrition_rate: 1/10,
  attrition_death_rate: 1/3,
  village_healing_rate: 15/100,

  nextTurn: function() {
    if (Game.type == Game.types.EMAIL) {
      if (Game.turns_played_locally >= 1) {
        return;
      }
    }
    Output.clearAll();
    this.turn += 0.5;
    this.turn = this.turn % 2;
    this.turn_count += 0.5;
    this.turns_played_locally += 0.5;
    Output.updateStatusBar();
    this.deselect();
    var victory = Victory.checkVictoryConditions();
    Output.updateVictoryBar();
    if (victory) Crafty.scene('Victory');
    Crafty.trigger("NextTurn");
  },

  // initialize and start our game
  start: function() {
    if (Game.turn == undefined) Game.turn = 0;
    if (Game.turn_count == undefined) Game.turn_count = 0;
    //Game.type = Game.types['EMAIL'];
    Game.type = Game.types['HOTSEAT'];
    var load_world = Game.load_world;
    Game.load_world = load_world;
    // start Crafty and set a background color so that we can see it's
    // working
    Crafty.init(Game.width(), Game.height(), "stage");
    //Crafty.background('rgb(87, 109, 20)');

    // Simply start the "Loading" scene to get things going
    Crafty.scene('Loading');
    Output.updateStatusBar();
    Output.updateVictoryBar(true);
    //document.getElementById('info-panel').innerHTML += '<div id="info-panel"></div>';
  },

  reset: function() {
    this.load_map = false;
    this.turn = 0;
    this.turn_count = 0;
    this.selected = undefined;
    this.player_selected = [];
    this.player_supply_roads = [[], []];

    this.resetStatusVisuals(true);
  },

  resetStatusVisuals: function(hard_reset) {
    Output.updateStatusBar();
    Output.updateVictoryBar(hard_reset);
  },

  /*
   * For now, output JSON as text so that it can be loaded manually.
   */
  save: function() {
    var saved_game = {
      location: this.location,
      factions: this.factions,
      victory: Victory,

      map_grid: this.map_grid,
      terrain_type: this.terrain_type,
      //terrain_supply: this.terrain_supply,
      //terrain_build_difficulty: this.terrain_build_difficulty,
      //terrain_graph: this.terrain_graph,
      //terrain_build_graph: this.terrain_build_graph,
      //terrain_supply_graph: this.terrain_supply_graph,
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
      village_healing_rate: this.village_healing_rate,

      //units: [[], []],
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
      var new_unit = {};
      new_unit.type = unit.type;
      new_unit.side = unit.side;
      new_unit.name = unit.name;
      new_unit.quantity = unit.quantity;
      new_unit.injured = unit.injured;
      new_unit.location = unit.at();
      new_unit.battle = unit.battle;
      new_unit.injured = unit.injured;
      new_unit.alive = unit.alive;
      new_unit.active = unit.active;
      new_unit.supply_remaining = unit.supply_remaining;
      new_unit.battle_side = unit.battle_side;
      new_unit.move_target = unit.move_target;

      saved_game.units.push(new_unit);
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

    var json_output = JSON.stringify(saved_game);
    var textarea_id = "load-input";
    document.getElementById(textarea_id).value = json_output;
    //Utility.copyToClipboard(json_output);
  },

  loadMap: function(map_data) {

    Output.clearAll();
    Game.reset();

    var map_data = JSON.parse(map_data);
    delete this.selected;
    delete this.player_selected;

    this.turns_played_locally = 0;
    Victory.set(map_data.victory);

    this.location = map_data.location;
    this.factions = map_data.factions;
    this.map_grid = map_data.map_grid;
    this.terrain_type = map_data.terrain_type;
    this.height_map = map_data.height_map;
    this.occupied = map_data.occupied;

    this.player_name_selected = map_data.player_name_selected;

    this.player_colour = map_data.player_colour;

    this.supply_route = map_data.supply_route;

    this.turn = map_data.turn;
    this.turn_count = map_data.turn_count;

    this.FIRST_PLAYER = map_data.FIRST_PLAYER;
    this.AFTER_FIRST_PLAYER = map_data.AFTER_FIRST_PLAYER;
    this.SECOND_PLAYER = map_data.SECOND_PLAYER;
    this.AFTER_SECOND_PLAYER = map_data.AFTER_SECOND_PLAYER;

    this.battle_death_rate = map_data.battle_death_rate;
    this.attrition_rate = map_data.attrition_rate;
    this.attrition_death_rate = map_data.attrition_death_rate;
    this.village_healing_rate = map_data.village_healing_rate;

    this.units = map_data.units;
    this.battles = map_data.battles;

    this.load_world = true;
    Crafty.scene('Loading');

    var textarea_id = "load-input";
    document.getElementById(textarea_id).value = "";
    $("input#load-button").blur();
  },
}

$text_css = { 'font-size': '100px', 'font-family': 'Arial', 'color': 'white', 'text-align': 'center' }
