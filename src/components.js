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
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      this.attr({ x: x * Game.map_grid.tile.width, y: y * Game.map_grid.tile.height });
      return this;
    }
  },
  together: function(grid_object, ignore_self) {
    if (ignore_self === undefined) ignore_self = true;
    if (grid_object.getX() == this.getX() && grid_object.getY() == this.getY()) {
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
    this.requires('2D, Canvas, Grid');
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

// FakeGrass is just green colour (not terrain!)
Crafty.c('FakeGrass', {
  init: function() {
    this.requires('Color, Actor')
      .color('rgb(87, 109, 20)')
      .attr({ type: "FakeGrass", colour: { r: 87, g: 109, b: 20 } })
      ;
    this.z = 1;
  },
});

Crafty.c('MovementPath', {
  init: function(turns_left) {
    this.requires('Actor, Color')
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

