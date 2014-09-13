var map_width = 33;
var tile_size = 32;

Game = {
  location: locations.test,
  factions: [factions.mongols, factions.romans],

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
  
  graph_ftn: Graph,
  pathfind: astar,
  terrain: undefined,
  terrain_supply: undefined,
  terrain_build_difficulty: undefined,
  terrain_graph: undefined,
  terrain_build_graph: undefined,
  terrain_supply_graph: undefined,
  height_map: undefined,
  occupied: undefined,
  //grid_ftn: grid,
  noise: noise,
  // The total width of the game screen. Since our grid takes up the entire
  // screen this is just the width of a tile times the width of the grid
  width: function() {
    return this.map_grid.width * this.map_grid.tile.width;
  },

  height: function() {
    return this.map_grid.height * this.map_grid.tile.height;
  },

  player_selected: [],
  selected: undefined,
  select: function(clickable_object) {
    if (this.selected) this.deselect();
    this.selected = clickable_object;
    if (this.selected.side == this.turn) this.player_selected[this.turn] = clickable_object;
    this.select_highlight = Crafty.e('Selected');
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
  player_supply_roads: [[], []],

  turn: 0,
  turn_count: 0,

  FIRST_PLAYER: 0,
  AFTER_FIRST_PLAYER: 0.5,
  SECOND_PLAYER: 1,
  AFTER_SECOND_PLAYER: 1.5,

  battle_death_rate: 1/5,
  attrition_rate: 1/10,
  attrition_death_rate: 1/3,
  village_healing_rate: 15/100,

  nextTurn: function() {
    Output.clearAll();
    this.turn += 0.5;
    this.turn_count += 0.5;
    this.turn = this.turn % 2;
    Output.updateStatusBar();
    this.deselect();
    var victory = Victory.checkVictoryConditions();
    if (victory) Crafty.scene('Victory');
    Crafty.trigger("NextTurn");
  },

  // initialize and start our game
  start: function() {
    // start Crafty and set a background color so that we can see it's
    // working
    Crafty.init(Game.width(), Game.height(), "stage");
    Output.updateStatusBar();
    //Crafty.background('rgb(87, 109, 20)');

    // Simply start the "Loading" scene to get things going
    Crafty.scene('Loading');
    //document.getElementById('info-panel').innerHTML += '<div id="info-panel"></div>';
  },

  reset: function() {
    this.turn = 0;
    this.turn_count = 0;
    this.selected = undefined;
    this.player_selected = [];
    this.player_supply_roads = [[], []];
    Output.updateStatusBar();
  },
}

$text_css = { 'font-size': '100px', 'font-family': 'Arial', 'color': 'white', 'text-align': 'center' }
