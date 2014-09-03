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
  }
});

// An "Actor" is an entity that is drawn in 2D on canvas
Crafty.c('Actor', {
  init: function() {
    this.requires('2D, Canvas, Grid');
  },
});

Crafty.c('Clickable', {
  init: function() {
    this.requires('Mouse')
      //.bind('Click', this.select);
      // NOTE: 'Click' does not work with right clicking!
      .bind('MouseUp', function(e) { 
        if (e.mouseButton == Crafty.mouseButtons.LEFT) {
          console.log('Left-clicked something Clickable!');
          if (!Game.selected || Game.selected != this) {
            Game.selected = this;
          } else {
            delete Game.selected;
          }
          //this.select();
        } else if (e.mouseButton == Crafty.mouseButtons.RIGHT) {
          console.log('Right-clicked something Clickable!');
        }
      })
    ;
  },

  select: function() {
    console.log("Selected item");
    this.unbind("Click", this.select);
    this.bind("Click", this.deselect);
  },
  deselect: function() {
    console.log("Deselected item");
    this.unbind("Click", this.deselect);
    //this.bind("Click", this.select);
  },
});

// Deals with terrain that can be moved onto.
Crafty.c('Passable', {
  init: function() {
    this.requires('Grid, Mouse')
      .bind('MouseDown', function(e) {
      console.log('Clicked Passable entity!');
      if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected) {
        console.log('Moving item!');
        console.log(this.at());
        console.log(Game.selected.at());
        //Game.selected.x = 30;
        Game.selected.at(this.at().x, this.at().y);
        console.log("New position:");
        console.log(Game.selected.at());
      }
      delete Game.selected;
    })
    ;
  }
});

// A Tree is just an actor with a certain color
Crafty.c('Tree', {
  init: function() {
    this.requires('Actor, spr_tree, Passable')
  },
});

// Grass is just green, passable terrain
Crafty.c('Grass', {
  init: function() {
    this.requires('Actor, Color, Passable')
      .color('rgb(87, 109, 20)')
      ;
  },
});

Crafty.c('PlayerCharacter', {
  init: function() {
    this.requires('Actor, Fourway, Collision, spr_player, Clickable')
      .fourway(4)
      .stopOnSolids()
      // Whenever the PC touches a village, respond to the event
      .onHit('Village', this.visitVillage)
      ;
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
    village = data[0].obj;
    village.collect();
  },
});

// A village is a tile on the grid that the PC must visit in order to win the
// game
Crafty.c('Village', {
  init: function() {
    this.requires('Actor, spr_village')
      ;
  },

  collect: function() {
    this.destroy();
    Crafty.trigger('VillageVisited', this);
  },
});
