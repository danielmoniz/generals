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
    this.requires('Actor, Targetable')
      .bind("MouseUp", function() {
        this.report();
      })
      ;
    this.z = 10;
    this.bind("NextTurn", this.nextTurn);
    this.attr({ 
      battle: false, 
      side: 0, 
      movement: 8, 
    });
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
    console.log("Player " + this.side + "'s " + this.type + ": " + update);
    if (this.quantity <= 0) {
      this.destroy();
      return false;
    }
    return true;
  },
  sufferAttrition: function() {
    this.quantity = Math.floor(this.quantity * 0.9);
  },
  isEnemyPresent: function() {
    var present_units = this.get_present_units();
    if (present_units.length < 1) return false;
    for (var j=0; j<present_units.length; j++) {
      if (present_units[j].side != this.side) {
        return true;
      }
    }
    return false;
  },

  isBattlePresent: function() {
    var battles = Crafty('Battle').get();
    for (var i=0; i < battles.length; i++) {
      var battle = battles[i];
      var battle_exists = false;
      if (battles[i].together(this)) {
        return true;
      }
    }
  },

  prepareMove: function(target_x, target_y) {
    console.log("Moving!");
    start = Game.terrain_graph.grid[this.getX()][this.getY()];
    end = Game.terrain_graph.grid[target_x][target_y];
    var path = Game.pathfind.search(Game.terrain_graph, start, end);
    if (!path) {
      console.log("Target impossible to reach!");
      return false;
    }
    console.log("path:");
    console.log(path);
    var total_cost = totalCost(path);
    console.log(total_cost);
    partial_path = getPartialPath(path, this.movement);
    if (!partial_path) {
      console.log("Cannot move to first square! Movement value too low.");
      return false;
    }
    function makeMovementPath(x, y, remaining) {
      var turn_colours = ['yellow', 'green', 'orange', 'red'];
      remaining = remaining % turn_colours.length;
      var movement_path = Crafty.e('MovementPath');
      movement_path.at(x, y)
      movement_path.color(turn_colours[remaining - 1])
      movement_path.remaining(remaining);
    }
    makeMovementPath(this.getX(), this.getY(), 1);
    var turns_required = 1;
    var path_remaining = Game.pathfind.search(Game.terrain_graph, start, end);
    console.log("path_remaining.length");
    console.log(path_remaining.length);
    while (path_remaining.length > 0) {
      var next_partial_path = getPartialPath(path_remaining, this.movement);
      for (var i=0; i<next_partial_path.length; i++) {
        makeMovementPath(path_remaining[i].x, path_remaining[i].y, turns_required);
      }
      turns_required += 1;
      path_remaining = path_remaining.slice(next_partial_path.length, path_remaining.length - 1);
      console.log("path_remaining.length");
      console.log(path_remaining.length);
    }
    turn_move_result = partial_path[partial_path.length - 1];
    console.log(partial_path);
    console.log(partial_path[partial_path.length - 1]);

    this.at(turn_move_result.x, turn_move_result.y);

    this.moved();
  },

  moved: function() {
    // detect combat
    var present_units = this.get_present_units();
    var enemy_present = this.isEnemyPresent();
    if (enemy_present) {
      if (this.isBattlePresent()) {
        this.joinBattle();
      } else {
        this.startBattle();
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

  startBattle: function() {
    var battle = Crafty.e('Battle').at(this.getX(), this.getY());
    battle.start(this);
  },
  joinBattle: function() {
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
    this.z = 5;
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
    this.requires('Clickable')
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
            console.log("Not already there!");
            Game.selected.prepareMove(this.at().x, this.at().y);
            //Game.selected.at(this.at().x, this.at().y);
            //Game.selected.moved();
            //Game.deselect();
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
      } else if (e.mouseButton == Crafty.mouseButtons.LEFT) {
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
      .attr({ type: "Tree", terrain: 2, build_over: 3 })
      //.attr({ terrain: 1, "laser": "test" })
      ;
  },
});

// Grass is just green, passable terrain
Crafty.c('Grass', {
  init: function() {
    this.requires('Terrain, Passable')
      .attr({ type: "Grass", terrain: 1, build_over: 1 })
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
  },
});

// Grass is just green, passable terrain
Crafty.c('Road', {
  init: function() {
    this.requires('Color, Terrain, Passable')
      .color('rgb(128, 128, 128)')
      //.attr({ type: "Road", terrain: 0.5, build_over: 0.01 })
      .attr({ type: "Road", terrain: 0.5, build_over: 0.01 })
      ;
  },
});

// Grass is just green, passable terrain
Crafty.c('Bridge', {
  init: function() {
    this.requires('Color, Terrain, Passable')
      .color('rgb(192, 192, 192)')
      .attr({ type: "Bridge", terrain: 0.5, build_over: 0.02 })
      ;
  },
});
Crafty.c('Water', {
  init: function() {
    this.requires('Color, Terrain, Impassable')
      .color('#0080FF')
      .attr({ type: "Water", terrain: 0, build_over: 8 })
      ;
  }
});

// A village is a tile on the grid that the PC must visit in order to win the
// game
Crafty.c('Village', {
  init: function() {
    this.requires('spr_village, Terrain, Passable')
      .attr({ type: "Water", terrain: 2, build_over: 0.01 })
      ;
  },

  collect: function() {
    this.destroy();
    Crafty.trigger('VillageVisited', this);
  },
});

Crafty.c('Cavalry', {
  init: function() {
    this.requires('Unit, Collision, Targetable, Movable')
      //.attr({ quantity: Math.floor(Math.random() * 1000), name: 'Cavalry', })
      .attr({
        quantity: 3000 + 2000*Math.round(Math.random() * 2),
        type: 'Cavalry',
        //side: 1,
      })
      ;
  },

  pick_side: function() {
    if (this.side == 0) {
      this.addComponent('spr_cavalry_blue');
    } else {
      this.addComponent('spr_cavalry');
    }
  },
});

Crafty.c('Battle', {
  init: function() {
    this.requires('Actor, Collision, Targetable, spr_battle, Clickable')
      .bind("NextTurn", this.resolve)
      .attr({ type: "Battle" })
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
    console.log("Attacker: " + attacker);
    var units_in_combat = this.units_in_combat();
    for (var i=0; i < units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      unit.notify_of_battle();
    }
  },

  resolve: function() {
    console.log("New battle phase: -------------");
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var units = this.attacker.get_present_units();
    attackers = [this.attacker];
    defenders = [];
    for (var i=0; i < units.length; i++) {
      if (units[i].side == this.attacker.side) {
        attackers.push(units[i]);
      } else {
        defenders.push(units[i]);
      }
    }
    var units_in_combat = this.units_in_combat();

    var attackers_quantity = 0;
    for (var i=0; i<attackers.length; i++) {
      attackers_quantity += attackers[i].quantity;
    }
    var attacker_ratios = [];
    for (var i=0; i<attackers.length; i++) {
      attacker_ratios[i] = attackers[i].quantity / attackers_quantity;
    }
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
    var defender_losses = defender_random_factor * attackers_quantity * TROOP_LOSS * (1/terrain_mod * 1/defender_morale_factor * attacker_morale_factor);

    //attacker.kill(Math.ceil(attacker_losses));
    for (var i=0; i<attackers.length; i++) {
      attackers[i].kill(Math.ceil(attacker_losses * attacker_ratios[i]));
    }
    for (var i=0; i<defenders.length; i++) {
      defenders[i].kill(Math.ceil(defender_losses * defender_ratios[i]));
    }

    attackers_alive = false;
    for (var i=0; i<attackers.length; i++) {
      attackers_alive = attackers[i].report();
      if (attackers_alive) break;
    }
    defenders_alive = false;
    for (var i=0; i<defenders.length; i++) {
      defenders_alive = defenders[i].report();
      if (defenders_alive) break;
    }

    if (!attackers_alive || !defenders_alive) {
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

Crafty.c('MovementPath', {
  init: function(turns_left) {
    this.requires('Actor, Color')
      .color('red')
      .bind("NextTurn", this.nextTurn)
      ;
    this.z = 8;
    this.turns_left = 1;
    return this;
  },
  remaining: function(turns_left) {
    this.turns_left = turns_left;
  },
  nextTurn: function() {
    this.turns_left -= 1;
    if (this.turns_left <= 0) this.destroy();
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
    this.z = 100;
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

