var map_width = 24;
var tile_size = 32;

Game = {
  location: locations.test,

  // this defines our grid's size and the size of each of its tiles
  map_grid: {
    width: Math.ceil(map_width),
    //height: Math.ceil(map_width),
    height: Math.ceil(map_width * 3 / 4),
    tile: {
      width: tile_size,
      height: tile_size,
    }
  },
  graph_ftn: Graph,
  pathfind: astar,
  terrain: undefined,
  terrain_graph: undefined,
  terrain_build_graph: undefined,
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
  select: function(clickable_object) {
    this.deselect();
    this.selected = clickable_object;
    this.selected.addComponent("Selected");
  },
  deselect: function() {
    if (this.selected) {
      this.selected.removeComponent("Selected", false);
      delete this.selected;
    }
  },

  // initialize and start our game
  start: function() {
    // start Crafty and set a background color so that we can see it's
    // working
    Crafty.init(Game.width(), Game.height());
    //Crafty.background('rgb(87, 109, 20)');

    // Simply start the "Loading" scene to get things going
    Crafty.scene('Loading');
  },
}

$text_css = { 'font-size': '100px', 'font-family': 'Arial', 'color': 'white', 'text-align': 'center' }
