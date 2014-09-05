var width = 50;

Game = {
  location: locations.test,

  // this defines our grid's size and the size of each of its tiles
  map_grid: {
    width: Math.ceil(width),
    height: Math.ceil(width * 3 / 4),
    tile: {
      width: 16,
      height: 16,
    }
  },
  graph_ftn: Graph,
  pathfind: astar,
  terrain: undefined,
  height_map: undefined,
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
