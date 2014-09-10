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
      if (!Game.player_selected[Game.turn]) {
        this.selectFirstUnit();
      } else {
        Game.select(Game.player_selected[Game.turn]);
      }
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

