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
    this.z = 100;
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
    start = Game.terrain_graph.grid[this.getX()][this.getY()];
    end = Game.terrain_graph.grid[target_x][target_y];
    var path = Game.pathfind.search(Game.terrain_graph, start, end);
    if (!path) {
      console.log("Target impossible to reach!");
      return false;
    }
    var total_cost = totalCost(path);
    partial_path = getPartialPath(path, this.movement);
    if (!partial_path) {
      console.log("Cannot move to first square! Movement value too low.");
      return false;
    }
    function makeMovementPath(x, y, remaining) {
      var turn_colours = ['yellow', 'green', 'orange', 'red'];
      remaining_color = remaining % turn_colours.length;
      var movement_path = Crafty.e('MovementPath');
      movement_path.at(x, y)
      movement_path.color(turn_colours[remaining_color - 1])
      movement_path.remaining(remaining);
    }

    makeMovementPath(this.getX(), this.getY(), 1);
    var turns_required = 1;
    var path_remaining = Game.pathfind.search(Game.terrain_graph, start, end);
    console.log("Path remaining at start:");
    console.log("start: " + path_remaining[0].x + ", " +  path_remaining[0].y);
    console.log("end: " + path_remaining[path_remaining.length - 1].x + ", " +  path_remaining[path_remaining.length - 1].y);
    console.log(path_remaining.length);
    var test_var = 1;
    while (path_remaining.length > 0 || test_var > 20) {
      var next_partial_path = getPartialPath(path_remaining, this.movement);
      console.log("Next partial path:");
      console.log(next_partial_path.length);
      console.log(next_partial_path[0].x, next_partial_path[0].y);
      for (var i=0; i<next_partial_path.length; i++) {
        makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required);
      }
      turns_required += 1;
      path_remaining = path_remaining.slice(next_partial_path.length, path_remaining.length);
      console.log("Path remaining:");
      console.log(path_remaining.length);
      //test_var += 1;
    }
    turn_move_result = partial_path[partial_path.length - 1];

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
    this.z = 80;
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
    //this.requires('spr_road, Terrain, Passable')
    this.requires('Terrain, Passable')
      //.color('rgb(128, 128, 128)')
      //.attr({ type: "Road", terrain: 0.5, build_over: 0.01 })
      .attr({ type: "Road", terrain: 0.5, build_over: 0.01 })
      ;
  },

  detect_type: function() {
    // look at adjacent road spaces and determine which component should be
    // added (ie. which sprite is required).
    function hasRoadConnection(tile) {
      var road_connections = ['Road', 'Bridge', 'Village'];
      for (var i=0; i<road_connections.length; i++) {
        if (tile.has(road_connections[i])) return true;
      }
      return false;
    }
    function getLeft(road) {
      if (road.getX() == 0) return false;
      var tile = Game.terrain[road.getX() - 1][road.getY()];
      return hasRoadConnection(tile);
    }
    function getRight(road) {
      if (road.getX() == Game.map_grid.width - 1) return false;
      var tile = Game.terrain[road.getX() + 1][road.getY()];
      return hasRoadConnection(tile);
    }
    function getUp(road) {
      if (road.getY() == 0) return false;
      var tile = Game.terrain[road.getX()][road.getY() - 1];
      return hasRoadConnection(tile);
    }
    function getDown(road) {
      if (road.getY() == Game.map_grid.height - 1) return false;
      var tile = Game.terrain[road.getX()][road.getY() + 1];
      return hasRoadConnection(tile);
    }
    this.sprite_key = "";
    function booleanToKey(bool_val) {
      var key = bool_val ? 'T' : 'F';
      return key;
    }
    var directions = [getUp, getRight, getDown, getLeft];
    var num_connections = 0;
    for (var i=0; i<directions.length; i++) {
      var connection = directions[i](this);
      this.sprite_key += booleanToKey(connection);
      if (connection) num_connections++;
    }

    // Ensure that roads on the edge of the mat are not dead ends
    if (num_connections == 1) {
      if (this.getX() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 3, 'T');
      } else if (this.getX() == Game.map_grid.width - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 1, 'T');
      } else if (this.getY() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 0, 'T');
      } else if (this.getY() == Game.map_grid.height - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 2, 'T');
      }
    }
    function modifyStringIndex(string, index, new_str) {
      return string.substr(0, index) + new_str + string.substr(index + new_str.length);
    }
  },

  set_sprite: function() {
    var road_sprite_map = {
      "TFFF": "spr_road_vertical",
      "TFTF": "spr_road_vertical",
      "FFTF": "spr_road_vertical",
      "FTFF": "spr_road_horizontal",
      "FFFT": "spr_road_horizontal",
      "FTFT": "spr_road_horizontal",
      "TTFF": "spr_road_top_right",
      "FTTF": "spr_road_bottom_right",
      "FFTT": "spr_road_bottom_left",
      "TFFT": "spr_road_top_left",
      // 3-way and 4-way pieces - not made yet!
      "FTTT": "spr_road_no_top",
      "TFTT": "spr_road_no_right",
      "TTFT": "spr_road_no_bottom",
      "TTTF": "spr_road_no_left",
      "TTTT": "spr_road_all",
    }
    this.detect_type();
    console.log("this.sprite_key:");
    console.log(this.sprite_key);
    var component = road_sprite_map[this.sprite_key];
    console.log(component);
    this.addComponent(component);
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
    this.z = 50;
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
    village = data[0].obj;
    village.collect();
    Crafty.trigger('NextTurn');
  },
});

