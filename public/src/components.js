// The Grid component allows an element to be located on a grid of tiles
Crafty.c('Grid', {
  init: function() {
    this.attr({
      w: Game.map_grid.tile.width,
      h: Game.map_grid.tile.height,
    })
  },

  // Locate this entity at the given position on the grid
  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: (this.y - Game.board_title.height) / Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) + Game.board_title.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },

  together: function(grid_object, ignore_self) {
    if (ignore_self === undefined) ignore_self = true;
    if (grid_object.at().x == this.at().x && grid_object.at().y == this.at().y) {
      if (grid_object !== this) {
        return true;
      }
    }
    return false;
  },

  getX: function() {
    var at = this.at();
    return at.x;
  },
  getY: function() {
    var at = this.at();
    return at.y;
  },
});

// An "Actor" is an entity that is drawn in 2D on canvas
Crafty.c('Actor', {
  init: function() {
    this.requires('2D, DOM, Grid');
  },
});

Crafty.c("TitleBar", {
  init: function() {
    this.requires("2D, Canvas, Text");
    this.attr({
      //w: 60,
      h: Game.board_title.height,
    });
    this.textColor('#FFFFFF');
    this.textFont({size: '17px', });
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) - Game.y_offset;
      var new_y = y * Game.map_grid.tile.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },
});

Crafty.c("VictoryBar", {
  init: function() {
    this.requires("2D, Canvas, HTML");
    this.attr({
      //w: 60,
      h: Game.board_title.height,
    });
    //this.textColor('#FFFFFF');
    //this.textFont({size: '17px', });
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) - Game.y_offset;
      var new_y = y * Game.map_grid.tile.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },
});


Crafty.c('Clickable', {
  init: function() {
    this.requires('Mouse, Actor')
      // NOTE: 'Click' does not work with right clicking!
      .bind('MouseUp', function(e) { 
        if (e.mouseButton == Crafty.mouseButtons.LEFT) {
          if (!Game.selected || Game.selected != this) {
            Game.select(this);
          } else {
            Game.deselect();
          }
        }
      })
    ;
  },
});

// A Selected item should display that it is selected.
Crafty.c('Selected', {
  init: function() {
    this.requires('Clickable, Color')
      .color('purple')
    ;
    this.z = 55;
  },
});

Crafty.c('Movable', {
  init: function() {
    this.requires('Clickable')
      .bind('MouseUp', function(e) {
        if (Game.selected && e.mouseButton == Crafty.mouseButtons.RIGHT) {
        }
      })
    ;
  },
});

Crafty.c('Receivable', {
  init: function() {
    this.requires('Clickable')
      .bind('MouseUp', function(e) {
        if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected && Game.selected.has("Movable")) {
          if (Game.turn == Game.selected.side) {
            if (e.shiftKey) {
              Game.selected.prepareMove(this.at().x, this.at().y, false, true);
            } else {
              if (Game.selected.together(this)) {
                console.log("Already there!");
                Game.selected.prepareMove(this.at().x, this.at().y);
              } else {
                Game.selected.prepareMove(this.at().x, this.at().y);
                //Game.selected.at(this.at().x, this.at().y);
                //Game.selected.moved();
                //Game.deselect();
              }
            }
          } else {
            // @TODO Print out "not your turn" somewhere visible
            console.log("Not your turn!");
          }
        }
      })
    ;
  }
});

Crafty.c('Targetable', {
  init: function() {
    this.requires('Collision, Receivable')
      ;
  },
});

Crafty.c('ChangeableColor', {
  init: function() {
    this.requires('Color');
  },

  resetColour: function() {
    this.color("rgb({0}, {1}, {2})".format(this.base_colour.r, this.base_colour.g, this.base_colour.b));
    this.colour = $.extend({}, this.base_colour);
  },

  setColour: function(red, green, blue) {
    this.base_colour = {r: red, g: green, b: blue, };
    this.colour = {r: red, g: green, b: blue, };
    this.color("rgb({0}, {1}, {2})".format(red, green, blue));
  },

  dimColour: function(red, green, blue) {
    var new_red = Math.min(255, Math.max(0, this.colour.r - red));
    var new_green = Math.min(255, Math.max(0, this.colour.g - green));
    var new_blue = Math.min(255, Math.max(0, this.colour.b - blue));
    this.color("rgb({0}, {1}, {2})".format(new_red, new_green, new_blue));
    this.colour = { r: new_red, g: new_green, b: new_blue, };
  },

  brightenColour: function(quantity) {
    this.dimColour(-quantity, -quantity, -quantity);
  },

});

// FakeGrass is just green colour (not terrain!)
Crafty.c('FakeGrass', {
  init: function() {
    this.requires('ChangeableColor, Actor')
      .color('rgb(87, 109, 20)')
      .attr({ 
        type: "FakeGrass", 
        colour: { r: 87, g: 109, b: 20 },
        base_colour: { r: 87, g: 109, b: 20 },
      })
      ;
    this.z = 1;
  },

});

Crafty.c("Shadow", {
  init: function() {
    this.requires('FakeGrass');
    this.z = 2;
    this.dim_value = 25;
    this.type = "Shadow";
  },
});

Crafty.c('MovementPath', {
  init: function(turns_left) {
    this.requires('Actor, ChangeableColor')
      .bind("NextTurn", this.nextTurn)
      ;
    this.z = 50;
    this.turns_left = 1;
    return this;
  },
  remaining: function(turns_left) {
    this.turns_left = turns_left;
  },
  nextTurn: function() {
    /*
    this.turns_left -= 1;
    if (this.turns_left <= 0) this.destroy();
    */
   this.destroy();
  },
});

Crafty.c("HighlightedMovementPath", {
  init: function() {
    this.requires('MovementPath');
    this.z = 51;
    this.brightness = 45;
    this.bind("DimPaths", this.dim)
    //this.dimColour(this.dim_value, this.dim_value, this.dim_value);
  },

  dim: function() {
    this.visible = false;
  },
});

/*
Crafty.c('SupplyBlock', {
  init: function(turns_left) {
    this.requires('Actor, Color')
      .color('black')
      .bind("NextTurn", this.destroy)
      .attr({
        supply: 0,
      })
      ;
    this.z = 60;
    this.turns_left = 1;
    return this;
  },
  //removeSupplyFromRoad
  remaining: function(turns_left) {
    this.turns_left = turns_left;
  },
  nextTurn: function() {
   this.turns_left -= 1;
   if (this.turns_left <= 0) this.clear();
  },
  clear: function() {
    this.destroy();
  },
});
*/

// TEST - for debugging purposes only!
Crafty.c('Supply', {
  init: function() {
    this.requires('Color, Actor')
      .color('pink')
      .attr({ 
        type: "Supply",
        //supply: 1,
      })
      ;
      this.z = 48;
  },
});

// TEST - for debugging purposes only!
Crafty.c('NoSupply', {
  init: function() {
    this.requires('Color, Actor')
      .color('brown')
      .attr({ 
        type: "NoSupply",
        //supply: 1,
      })
      ;
      this.z = 49;
  },
});

Crafty.c('PlayerCharacter', {
  init: function() {
    this.requires('Actor, Fourway, Collision, spr_player, Movable')
      .fourway(4)
      .stopOnSolids()
      .onHit('Village', this.visitVillage)
      ;
    this.z = 1000;
  },

  // Registers a stop-movement function to be called when this entity hits an
  // entity with the "Solid" component
  stopOnSolids: function() {
    this.onHit('Solid', this.stopMovement);

    return this;
  },

  // Stops the movement
  stopMovement: function() {
    this._speed = 0;
    if (this._movement) {
      this.x -= this._movement.x;
      this.y -= this._movement.y;
    }
  },

  // Respond to this player visiting a village
  visitVillage: function(data) {
    var village = data[0].obj;
    village.collect();
  },
});

