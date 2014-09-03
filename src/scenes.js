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

  // Place a tree at every edge square on our grid of tiles
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;

      if (at_edge) {
        // Place tree entities aroubd the border of the map
        Crafty.e('Tree').at(x, y);
        this.occupied[x][y] = true;
      } else if (Math.random() < 0.06 && !this.occupied[x][y]) {
        // Place tree entities randomly throughout the map.
        Crafty.e('Tree').at(x, y);
        this.occupied[x][y] = true;
      }
    }
  }

  // Generate up to five villages on the map in random locations
  var est_villages = 5;
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;
      if (!at_edge && Math.random() < est_villages / (Game.map_grid.width * Game.map_grid.height) && !this.occupied[x][y]) {
        Crafty.e('Village').at(x, y);
        this.occupied[x][y] = true;
      }
    }
  }

  // Place water randomly on the map
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;

      if (Math.random() < 0.04 && !this.occupied[x][y]) {
        Crafty.e('Water').at(x, y);
        this.occupied[x][y] = true;
      }
    }
  }

  // MUST GO LAST - fill everything else with grass
  for (var x = 0; x < Game.map_grid.width; x++) {
    for (var y = 0; y < Game.map_grid.height; y++) {
      if (!this.occupied[x][y]) {
        Crafty.e('Grass').at(x, y);
      }
    }
  }

  // Player character, placed on the grid
  this.player = Crafty.e('PlayerCharacter').at(5, 5);
  this.occupied[this.player.at().x][this.player.at().y] = true;

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
