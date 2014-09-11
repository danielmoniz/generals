var map_width = 33;
var tile_size = 32;

Game = {
  location: locations.test,

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
    this.deselect();
    this.selected = clickable_object;
    this.player_selected[this.turn] = clickable_object;
    this.select_highlight = Crafty.e('Selected');
    var spot = this.selected.at();
    this.select_highlight.at(spot.x, spot.y);
    if (this.selected.select) {
      this.selected.select();
    } else {
      throw "NotImplementedError: select() for {0}".format(this.selected.type);
    }
    //Output.printEntity(this.selected, true);
  },
  deselect: function() {
    Output.clear();
    if (this.selected) {
      delete this.selected;
      this.select_highlight.destroy();
      //delete this.select_highlight;
    }
    delete this.player_selected[this.turn];
  },

  player_supply_roads: [[], []],

  turn: 0,
  turn_count: 0,

  first_player: 0,
  after_first_player: 0.5,
  second_player: 1,
  after_second_player: 1.5,

  nextTurn: function() {
    this.turn += 0.5;
    this.turn = this.turn % 2;
    console.log("NEXT TURN: Player " + this.turn + "--------------------");
    this.deselect();
    Crafty.trigger("NextTurn");
    this.turn_count += 1;
  },

  // initialize and start our game
  start: function() {
    // start Crafty and set a background color so that we can see it's
    // working
    Crafty.init(Game.width(), Game.height(), "stage");
    //Crafty.background('rgb(87, 109, 20)');

    // Simply start the "Loading" scene to get things going
    Crafty.scene('Loading');
    //document.getElementById('info-panel').innerHTML += '<div id="info-panel"></div>';
  },
}

$text_css = { 'font-size': '100px', 'font-family': 'Arial', 'color': 'white', 'text-align': 'center' }
