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
        //this.report();
      })
      /*
      .bind("MouseOver", function() {
        document.getElementById("info-panel").innerHTML='<object type="text/html" data="src/info.html"></object>';
      })
      .bind("MouseOut", function() {
        document.getElementById("info-panel").innerHTML='';
      })
      */
      ;
    this.z = 100;
    this.bind("NextTurn", this.nextTurn);
    this.max_supply = 3;
    this.attr({ 
      battle: false, 
      side: 0, 
      movement: 8, 
      supply_remaining: this.max_supply,
      alive: true,
    });
  },

  nextTurn: function() {
    if (Game.turn == this.side) {
      this.selectFirstUnit();
      this.handleAttrition();
      if (this.battle) {
        this.fight();
      }
    }
    if (Game.turn == (this.side + 0.5) % 2) {
      if (!this.battle && this.move_target_path) {
        this.move_toward_target();
      }
    }
    if (Game.turn == this.side) {
      if (this.move_target_path) {
        if (this.movement_path) destroyMovementPath(this.movement_path);
        this.movement_path = colourMovementPath(this.move_target_path, this.movement, this.at());
      }
    }
  },

  select: function() {
    this.report();
  },

  selectFirstUnit: function() {
    if (!Game.selected) {
      Game.select(this);
    }
  },

  move_toward_target: function() {
    var partial_path = getPartialPath(this.move_target_path, this.movement);
    // check for enemies that will be bumped into
    for (var i=0; i<partial_path.length; i++) {
      if (this.battle || this.stop) break;
      var next_move = partial_path[i];
      this.at(next_move.x, next_move.y);
      new_path = this.move_target_path.slice(1, this.move_target_path.length);
      this.move_target_path = new_path;
      if (new_path.length == 0) this.move_target_path = undefined;
      this.moved();
    }

  },
  fight: function() {
    // May not need this
  },

  report: function() {
    Output.printUnit(this);
    //var status = this.getStatus();
    //Output.add(this.getStatus()).print();
  },
  updateStatus: function() {
    if (this.quantity <= 0) {
      this.alive = false;
      //this.destroy();
    }
  },
  isAlive: function() {
    this.updateStatus();
    return this.alive;
  },

  getStatus: function() {
    this.updateStatus();
    var update = this.quantity;
    if (this.quantity <= 0) {
      update = 'Dead!'
    }
    var info = [];
    var general_info = "{0} (Player {1})".format(this.type, this.side);
    var num_units = "Quantity: " + update;
    var supply_remaining = "Supply remaining: " + this.supply_remaining;
    info.push(general_info);
    info.push(num_units);
    info.push(supply_remaining);

    if (this.quantity <= 0) {
      this.destroy();
      //return false;
    }
    return info;
  },

  handleAttrition: function() {
    if (this.detectAttrition()) {
      var units_lost = this.sufferAttrition();
      if (!this.battle) {
        Output.reportAttrition(this, units_lost);
      }
    } else {
      this.resupply();
    }
  },
  resupply: function() {
    this.supply_remaining = this.max_supply;
  },

  detectAttrition: function() {
    // detect possible lack of supply
    var terrain = Crafty('Terrain').get();
    var supply_end_points = terrain.filter(function(terrain) { return terrain.is_supply; });
    // @TODO: Allow for more than two supply endpoints
    var target = supply_end_points[this.side];
    if (!this.together(target)) {
      buildTerrainData(); // reset supply graph to remove old supply block info
      var start = Game.terrain_supply_graph.grid[this.getX()][this.getY()];
      var end = Game.terrain_supply_graph.grid[target.getX()][target.getY()];

      // detect enemies on path
      var units = Crafty('Unit').get();
      var enemy_units = [];
      // could use filter() here, but failed on first attempt
      for (var i=0; i<units.length; i++) {
        if (units[i].side != this.side) enemy_units.push(units[i]);
      }
      var supply_blocks = Crafty('SupplyBlock').get();
      for (var i=0; i<supply_blocks.length; i++) {
        block = supply_blocks[i];
        Game.terrain_supply_graph.grid[block.getX()][block.getY()].weight = 0;
      }
      for (var i=0; i<enemy_units.length; i++) {
        // add enemy units to Game supply graph
        var unit = enemy_units[i];
        weight = Game.terrain_supply_graph.grid[unit.getX()][unit.getY()].weight;
        if (weight != 0) {
          Game.terrain_supply_graph.grid[unit.getX()][unit.getY()].weight = 0;
        }
        local_terrain = Game.terrain[unit.getX()][unit.getY()];
        if (local_terrain.has('Transportation')) {
          // @TODO Re-add supply blocking as a decision later on
          //Crafty.e('SupplyBlock').at(unit.getX(), unit.getY());
        }
      }
      
      var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, end);
      //console.log(supply_route);
      if (supply_route.length == 0) return true;
    } else {
      console.log("Supplied because unit is on supply route end point!");
    }
    return false;
  },

  sufferAttrition: function() {
    this.supply_remaining -= 1;
    if (this.supply_remaining < 0) {
      var to_kill = Math.floor(this.quantity * 0.1);
      this.kill(to_kill);
      console.log("Attrition losses: " + to_kill);
      return to_kill;
    }
    return 0;
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
    partial_path = getPartialPath(path, this.movement);
    if (!partial_path) {
      console.log("Cannot move to first square! Movement value too low.");
      return false;
    }

    var path_remaining = Game.pathfind.search(Game.terrain_graph, start, end);
    if (this.movement_path) destroyMovementPath(this.movement_path);
    this.movement_path = colourMovementPath(path_remaining, this.movement, this.at());

    this.move_target_path = path;
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

  get_present_units: function(ignore_self) {
    present_units = [];
    units = Crafty('Unit').get();
    for (var i=0; i < units.length; i++) {
      if (units[i].together(this, ignore_self)) {
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
    return this.getStatus();
  },
  battle_finished: function() {
    this.battle = false;
    this.report();
  },
  kill: function(casualties) {
    this.quantity -= casualties;
    //this.report();
    this.updateStatus();
    if (!this.isAlive()) {
      this.destroy();
    }
  },
});

// Terrain is an entity that will be drawn on the map and will affect movement
Crafty.c('Terrain', {
  init: function() {
    this.requires('Actor, Clickable');
    this.z = 80;
  },
  select: function() {
    this.report();
  },
  report: function() {
    Output.printTerrain(this);
    /*
    var status = this.type;
    Output.push(status).print();
    */
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

// A Transportation object is one meant to carry people/items, eg. a road,
// bridge, etc.
Crafty.c('Transportation', {
  init: function() {
    this.requires('Terrain')
    ;
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
            if (Game.selected.together(this)) {
              console.log("Already there!");
              Game.selected.prepareMove(this.at().x, this.at().y);
            } else {
              Game.selected.prepareMove(this.at().x, this.at().y);
              //Game.selected.at(this.at().x, this.at().y);
              //Game.selected.moved();
              //Game.deselect();
            }
          } else {
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
      .bind('MouseUp', function(e) {
      if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected) {
        console.log('Terrain is impassable! Cannot move here.');
      } else if (e.mouseButton == Crafty.mouseButtons.LEFT) {
        //Game.select(this);
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
    this.z = 1;
  },
});

// Grass is just green, passable terrain
Crafty.c('Road', {
  init: function() {
    //this.requires('spr_road, Terrain, Passable')
    this.requires('Terrain, Passable, Transportation')
      //.color('rgb(128, 128, 128)')
      //.attr({ type: "Road", terrain: 0.5, build_over: 0.01 })
      .attr({
        type: "Road",
        terrain: 0.5,
        build_over: 0.01,
        is_supply: false,
        supply: 1,
      })
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

    // Ensure that supply roads properly lead off the map
    if (this.is_supply) {
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

    /*
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
    */
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
    var component = road_sprite_map[this.sprite_key];
    this.addComponent(component);
  },
});

// Grass is just green, passable terrain
Crafty.c('Bridge', {
  init: function() {
    this.requires('Color, Terrain, Passable, Transportation')
      .color('rgb(192, 192, 192)')
      .attr({ 
        type: "Bridge",
        terrain: 0.5, 
        build_over: 0.02 ,
        supply: 1,
      })
      ;
  },
});
Crafty.c('Water', {
  init: function() {
    this.requires('Color, Terrain, Impassable')
      //.color('#0080FF')
      .color('rgb(0, 128, 255)')
      .attr({ 
        type: "Water", 
        terrain: 0, 
        build_over: 8,
      })
      .attr({ type: "Water", colour: { r: 0, g: 128, b: 255 } })
      ;
    this.z = 52;
  }
});

// A village is a tile on the grid that the PC must visit in order to win the
// game
Crafty.c('Village', {
  init: function() {
    this.requires('spr_village, Terrain, Passable')
      .attr({ 
        type: "Town", 
        terrain: 1.5, 
        build_over: 0.01,
        supply: 1,
      })
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

  pick_side: function(side) {
    if (side !== undefined) this.side = side;
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
      .bind("NextTurn", this.nextTurn)
      .attr({ type: "Battle" })
      ;
      this.z = 200;
      this.num_turns = 0;
  },

  nextTurn: function() {
    if (Game.turn % 1 == 0) this.resolve();
  },

  units_in_combat: function() {
    var units_in_combat = [];
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      if (unit.together(this)) units_in_combat.push(unit);
    }
    return units_in_combat;
  },

  start: function(attacker) {
    this.attacker = attacker;
    var output = [];
    var battle_header = "New Battle: -------------";
    Output.push(battle_header);
    var attacker_info = "Attacker: Player " + attacker.side + "'s " + attacker.type + " with " + attacker.quantity;
    Output.push(attacker_info);
    var units_in_combat = this.units_in_combat();
    for (var i=0; i < units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      unit.notify_of_battle();
    }
    console.log(Output.buffer);
    Output.print();
  },

  resolve: function() {
    this.num_turns += 1;
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var units = this.attacker.get_present_units();
    var attackers = [this.attacker];
    var defenders = [];
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
      var attackers_alive = attackers[i].isAlive();
      var attacker_status = attackers[i].getStatus();
      //Output.add(attacker_status);
    }
    defenders_alive = false;
    for (var i=0; i<defenders.length; i++) {
      var defenders_alive = defenders[i].isAlive();
      var defender_status = defenders[i].getStatus();
      //Output.add(defenders_alive);
    }

    if (!attackers_alive || !defenders_alive) {
      //this.report();
      for (var i=0; i < units_in_combat.length; i++) {
        units_in_combat[i].battle_finished();
      }
      this.finished = true;
      this.destroy();
    }
    Output.printBattle(this);
  },

  report: function() {
    //var output = this.getStatus();
    //Output.push(output).print();
    Output.printBattle(this);
  },
  getStatus: function() {
    /*
    var output = [];
    var units_in_combat = this.units_in_combat();
    for (var i=0; i<units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      output.push(unit.getStatus());
    }
    var finished = "Battle report: finished!";
    if (this.finished) output.push(finished);
    return output;
    */
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
          Game.nextTurn();
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
  },
});

