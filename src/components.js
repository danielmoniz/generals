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
  together: function(grid_object) {
    if (grid_object.getX() == this.getX() && grid_object.getY() == this.getY() && grid_object !== this) {
      return true;
    }
    return false;
  },

  getX: function() {
    at = this.at();
    return at.x;
  },
  getY: function() {
    at = this.at();
    return at.y;
  },
});

// An "Actor" is an entity that is drawn in 2D on canvas
Crafty.c('Actor', {
  init: function() {
    this.requires('2D, Canvas, Grid');
  },
});

Crafty.c('Unit', {
  init: function() {
    this.requires('Actor, Collision')
      .bind("MouseUp", function() {
        this.report();
      })
      ;
    this.bind("NextTurn", this.nextTurn);
    this.attr({ battle: false, });
  },
  nextTurn: function() {
    console.log("New turn!");
    // test - will be more specific later
    //this.sufferAttrition();
    if (this.battle) {
      this.fight();
      this.report();
    }
  },
  fight: function() {
    // May nlot need this
  },
  report: function() {
    var update = this.quantity;
    if (this.quantity <= 0) {
      update = 'dead!'
    }
    console.log(this.name + ": " + update);
    if (this.quantity <= 0) {
      this.destroy();
      return false;
    }
    return true;
  },
  sufferAttrition: function() {
    this.quantity = Math.floor(this.quantity * 0.9);
  },
  moved: function() {
    // detect combat
    present_units = this.get_present_units();
    if (present_units.length >= 1) {
      // need to search for battle present
      var battles = Crafty('Battle').get();
      for (var i=0; i < battles.length; i++) {
        var battle = battles[i];
        var battle_exists = false;
        if (battles[i].together(this)) {
          battle_exists = true;
          this.join_battle();
        }
      }
      if (!battle_exists) {
        this.start_battle();
      }
    }
  },
  get_present_units: function() {
    present_units = [];
    units = Crafty('Unit').get();
    for (var i=0; i < units.length; i++) {
      if (units[i].together(this)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
  },
  start_battle: function() {
    var battle = Crafty.e('Battle').at(this.getX(), this.getY());
    battle.start(this);
  },
  join_battle: function() {
    this.battle = true;
  },
  notify_of_battle: function() {
    this.battle = true;
    this.report();
  },
  battle_finished: function() {
    this.battle = false;
    this.report();
  },
  kill: function(casualties) {
    this.quantity -= casualties;
    this.report();
    if (this.quantity <= 0) {
      this.destroy();
    }
  },
});

// Terrain is an entity that will be drawn on the map and will affect movement
Crafty.c('Terrain', {
  init: function() {
    this.requires('Actor');
  },
});

Crafty.c('Clickable', {
  init: function() {
    this.requires('Mouse')
      // NOTE: 'Click' does not work with right clicking!
      .bind('MouseUp', function(e) { 
        if (e.mouseButton == Crafty.mouseButtons.LEFT) {
          //console.log('Selected something Clickable!');
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
      //.color('red')
    ;
  },
});

Crafty.c('Movable', {
  init: function() {
    this.requires('Clickable')
      .bind('MouseUp', function(e) {
        if (Game.selected && e.mouseButton == Crafty.mouseButtons.RIGHT) {
          console.log('Right-clicked something Clickable!');
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
          if (Game.selected.together(this)) {
            console.log("Already there!");
          } else {
            Game.selected.at(this.at().x, this.at().y);
            Game.selected.moved();
            Game.deselect();
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

// Deals with terrain that can be moved onto.
Crafty.c('Passable', {
  init: function() {
    this.requires('Grid, Mouse, Terrain, Receivable')
    ;
  }
});

// Deals with terrain that can be moved onto.
Crafty.c('Impassable', {
  init: function() {
    this.requires('Grid, Mouse, Solid, Terrain')
      .bind('MouseDown', function(e) {
      console.log('Clicked Impassable entity!');
      if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected) {
        console.log('Terrain is impassable! Cannot move here.');
        console.log(this.at());
      } else if (e.mouseButton == Crafty.mouseButtons.LEFT) {
        console.log("Unselecting.");
        Game.deselect();
      }
    })
    ;
  }
});

// A Tree is just an actor with a certain color
Crafty.c('Tree', {
  init: function() {
    this.requires('spr_tree, Terrain, Passable')
      .attr({ terrain: 2, build_over: 3 })
      //.attr({ terrain: 1, "laser": "test" })
      ;
  },
});

// Grass is just green, passable terrain
Crafty.c('Grass', {
  init: function() {
    this.requires('Terrain, Passable')
      .attr({ terrain: 1, build_over: 1 })
      ;
  },
});

// FakeGrass is just green colour (not terrain!)
Crafty.c('FakeGrass', {
  init: function() {
    this.requires('Color, Actor')
      .color('rgb(87, 109, 20)')
      .attr({ colour: { r: 87, g: 109, b: 20 } })
      ;
  },
});

// Grass is just green, passable terrain
Crafty.c('Road', {
  init: function() {
    this.requires('Color, Terrain, Passable')
      .color('rgb(128, 128, 128)')
      .attr({ terrain: 0.5, build_over: 0.01 })
      ;
  },
});

// Grass is just green, passable terrain
Crafty.c('Bridge', {
  init: function() {
    this.requires('Color, Terrain, Passable')
      .color('rgb(192, 192, 192)')
      .attr({ terrain: 0.5, build_over: 0.02 })
      ;
  },
});
Crafty.c('Water', {
  init: function() {
    this.requires('Color, Terrain, Impassable')
      .color('#0080FF')
      .attr({ terrain: 0, build_over: 8 })
      ;
  }
});

// A village is a tile on the grid that the PC must visit in order to win the
// game
Crafty.c('Village', {
  init: function() {
    this.requires('spr_village, Terrain, Passable')
      .attr({ terrain: 2, build_over: 0.01 })
      ;
  },

  collect: function() {
    this.destroy();
    Crafty.trigger('VillageVisited', this);
  },
});

Crafty.c('Cavalry', {
  init: function() {
    this.requires('Unit, Collision, Targetable, spr_cavalry, Movable')
      //.attr({ quantity: Math.floor(Math.random() * 1000), name: 'Cavalry', })
      .attr({ quantity: 3000 + 2000*Math.round(Math.random() * 2), name: 'Cavalry', })
      ;
  },
});

Crafty.c('Battle', {
  init: function() {
    this.requires('Actor, Collision, Targetable, spr_battle, Clickable')
      .bind("NextTurn", this.resolve)
      ;
  },
  units_in_combat: function() {
    units_in_combat = [];
    for (var i=0; i<units.length; i++) {
      unit = units[i];
      if (unit.together(this)) units_in_combat.push(unit);
    }
    return units_in_combat;
  },
  start: function(attacker) {
    this.attacker = attacker;
    console.log("Battle: -------------");
    var units_in_combat = this.units_in_combat();
    for (var i=0; i < units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      unit.notify_of_battle();
    }
  },

  resolve: function() {
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var defenders = this.attacker.get_present_units();
    var units_in_combat = this.units_in_combat();

    var attacker = this.attacker;
    var attacker_quantity = this.attacker.quantity;
    var defenders_quantity = 0;
    for (var i=0; i<defenders.length; i++) {
      defenders_quantity += defenders[i].quantity;
    }
    var defender_ratios = [];
    for (var i=0; i<defenders.length; i++) {
      defender_ratios[i] = defenders[i].quantity / defenders_quantity;
    }

    var TROOP_LOSS = 0.1;
    var MORALE_FACTOR = 0.75;
    var terrain_mod = 1;
    var attacker_morale = 0;
    var defender_morale = 0;

    var attacker_morale_factor = Math.pow(MORALE_FACTOR, attacker_morale);
    var defender_morale_factor = Math.pow(MORALE_FACTOR, defender_morale);
    /*
    var attacker_random_factor = Math.random() * 0.2 + 0.9;
    var defender_random_factor = Math.random() * 0.2 + 0.9;
    */
    var attacker_random_factor = 1;
    var defender_random_factor = 1;

    var attacker_losses = attacker_random_factor * defenders_quantity * TROOP_LOSS * (terrain_mod * defender_morale_factor * 1/attacker_morale_factor);
    var defender_losses = defender_random_factor * attacker_quantity * TROOP_LOSS * (1/terrain_mod * 1/defender_morale_factor * attacker_morale_factor);

    attacker.kill(Math.ceil(attacker_losses));
    for (var i=0; i<defenders.length; i++) {
      defenders[i].kill(Math.ceil(defender_losses * defender_ratios[i]));
    }

    defenders_alive = false;
    for (var i=0; i<defenders.length; i++) {
      defenders_alive = defenders[i].report();
      if (defenders_alive) break;
    }
    //if (units_in_combat.length <= 1) {
    if (!attacker.report() || !defenders_alive) {
      this.report();
      for (var i=0; i < units_in_combat.length; i++) {
        units_in_combat[i].battle_finished();
      }
      this.destroy();
    }
  },
  report: function() {
    console.log("Battle report: finished!");
  },
});

Crafty.c('PlayerCharacter', {
  init: function() {
    this.requires('Actor, Fourway, Collision, spr_player, Movable')
      .fourway(4)
      .stopOnSolids()
      .onHit('Village', this.visitVillage)
      // TEMPORARY: This moves the turns forward. Need a better place to put
      // this.
      .bind('KeyDown', function(e) {
        if (e.key == Crafty.keys.SPACE) {
          Crafty.trigger("NextTurn");
        }
      })
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
    Crafty.trigger('NextTurn');
  },
});

