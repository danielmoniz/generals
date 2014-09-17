Unit = {
  getUnitsBySide: function(side) {
    var units = Crafty('Unit').get();
    var friendly_units = [];
    var enemy_units = [];
    for (var i=0; i<units.length; i++) {
      if (units[i].side == side) {
        friendly_units.push(units[i]);
      } else {
        enemy_units.push(units[i]);
      }
    }
    return { friendly: friendly_units, enemy: enemy_units, };
  },

  getFriendlyUnits: function(side) {
    return this.getUnitsBySide(side).friendly;
  },

  getEnemyUnits: function(side) {
    return this.getUnitsBySide(side).enemy;
  },

}

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
      supply_remaining: this.max_supply,
      alive: true,
      injured: 0,
      active: true,
    });
  },

  nextTurn: function() {
    if (Game.turn == (this.side + 0.5) % 2) {
      if (this.battle && this.move_target_path) {
        this.retreat();
      } else if (!this.battle && this.move_target_path) {
        this.moveTowardTarget();
      }
    }

    if (Game.turn == this.side) {
      if (this.move_target_path) {
        if (this.movement_path) destroyMovementPath(this.movement_path);
        this.movement_path = colourMovementPath(this.move_target_path, this.movement, this.at());
      }
    }

    if (Game.turn == this.side) {
      if (Game.turn_count >= 2) this.handleAttrition();
      this.injuryAttrition();

      this.determineSelection();
    }
  },

  determineSelection: function() {
    var selected = Game.player_selected;
    if (!selected) {
      Game.select(this);
      return this;
    }
    var item = selected[Game.turn];
    var item = Game.player_selected[Game.turn];

    if (item && item.side == this.side) {
      Game.select(item);
      return item;
    } else if (!Game.selected) {
      Game.select(this);
      return this;
    }
  },

  select: function() {
    this.report();
    if (!this.battle) {
      var other_units_present = this.getPresentUnits(true);
      if (other_units_present.length == 0) return;
      Output.printUnitsPresent(other_units_present);
    }
  },

  getValue: function() {
    return this.quantity;
  },

  retreat: function() {
    console.log("RETREAT HAS BEEN CALLED");
    // awful things happen
    var battle = this.isBattlePresent();
    var num_losses = battle.retreat(this);
    Output.printRetreat(this, num_losses);
    this.battle = false;
    this.moveTowardTarget();
  },

  report: function() {
    Output.printSingleUnit(this);
  },
  updateStatus: function() {
    if (this.quantity <= 0) {
      this.alive = false;
    }
    if (this.quantity - this.injured <= 0) this.active = false;
  },
  isAlive: function() {
    this.updateStatus();
    return this.alive;
  },
  isActive: function() {
    this.updateStatus();
    return this.active;
  },

  injuryAttrition: function() {
    var succumb_rate = 1/20;
    var num_to_kill = this.injured * succumb_rate;
    this.kill(num_to_kill, true);

    var village = this.isVillagePresent();
    if (village && !this.battle) {
      var num_to_heal = Game.village_healing_rate * this.injured;
      this.heal(num_to_heal);
    }
  },

  handleAttrition: function() {
    if (this.detectAttrition()) {
      var units_lost = this.sufferAttrition();
      if (!this.battle) {
        Output.usePanel("alerts");
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
    // @TODO: Allow for more than two supply endpoints
    var target_location = Game.supply_route[this.side];
    var target = Game.terrain[target_location.x][target_location.y];
    if (!this.together(target)) {
      buildTerrainData(); // reset supply graph to remove old supply block info
      var start = Game.terrain_supply_graph.grid[this.at().x][this.at().y];
      var end = Game.terrain_supply_graph.grid[target.at().x][target.at().y];

      // detect enemies on path
      var units = Crafty('Unit').get();
      var enemy_units = [];
      // could use filter() here, but failed on first attempt
      for (var i=0; i<units.length; i++) {
        if (units[i].side != this.side) enemy_units.push(units[i]);
      }

      var no_supply_objects = Crafty('NoSupply').get();
      for (var i=0; i<no_supply_objects.length; i++) {
        no_supply_objects[i].destroy();
      }
      // @TODO remove this or comment out! Not using supply blocks yet.
      var supply_blocks = Crafty('SupplyBlock').get();
      for (var i=0; i<supply_blocks.length; i++) {
        var block = supply_blocks[i];
        Game.terrain_supply_graph.grid[block.at().x][block.at().y].weight = 0;
        //Crafty.e('NoSupply').at(block.at().x, block.at().y);
        console.log("FOUND SUPPLY BLOCK! At {0}, {1}".format(block.at().x, block.at().y));
      }

      for (var i=0; i<enemy_units.length; i++) {
        // add enemy units to Game supply graph as blockers of supply lines
        var unit = enemy_units[i];
        var weight = Game.terrain_supply_graph.grid[unit.at().x][unit.at().y].weight;
        Game.terrain_supply_graph.grid[unit.at().x][unit.at().y].weight = 0;
        // Uncomment below line for supply overlay
        //Crafty.e('NoSupply').at(unit.at().x, unit.at().y);

        var local_terrain = Game.terrain[unit.at().x][unit.at().y];
        if (local_terrain.has('Transportation')) {
          // @TODO Re-add supply blocking as a decision later on
          //Crafty.e('SupplyBlock').at(unit.at().x, unit.at().y);
        }
      }
      
      var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, end);
      if (supply_route.length == 0) return true;
    } else {
      // Supplied because unit is on supply route end point
    }
    return false;
  },

  sufferAttrition: function() {
    this.supply_remaining -= 1;
    if (this.supply_remaining < 0) {
      var attrition_casualties = this.quantity * Game.attrition_rate;
      var to_kill = Math.floor(attrition_casualties * Game.attrition_death_rate);
      var to_injure = Math.floor(attrition_casualties * (1 - Game.attrition_death_rate));
      this.kill(to_kill);
      this.injure(to_injure);
      return to_kill;
    }
    return 0;
  },

  isEnemyPresent: function() {
    var present_units = this.getPresentUnits();
    if (present_units.length < 1) return false;
    for (var j=0; j<present_units.length; j++) {
      if (present_units[j].side != this.side) {
        return true;
      }
    }
    return false;
  },

  isEntityPresent: function(entity) {
    var entities = Crafty(Utility.capitalizeFirstLetter(entity)).get();
    for (var i=0; i < entities.length; i++) {
      var entity = entities[i];
      var entity_exists = false;
      if (entities[i].together(this)) {
        return entities[i];
      }
    }
  },

  isBattlePresent: function() {
    return this.isEntityPresent('Battle');
  },

  isVillagePresent: function() {
    return this.isEntityPresent('Village');
  },

  prepareMove: function(target_x, target_y, ignore_viuals, queue_move) {
    this.move_target = { x: target_x, y: target_y };

    if (queue_move && this.move_target_path) {
      var end_path = this.move_target_path[this.move_target_path.length - 1];
      var start = Game.terrain_graph.grid[end_path.x][end_path.y];
      var end = Game.terrain_graph.grid[target_x][target_y];
    } else {
      var start = Game.terrain_graph.grid[this.at().x][this.at().y];
      var end = Game.terrain_graph.grid[target_x][target_y];
    }
    var new_path = Game.pathfind.search(Game.terrain_graph, start, end);
    if (!new_path) {
      console.log("Target impossible to reach!");
      return false;
    }
    var partial_path = getPartialPath(new_path, this.movement);
    if (!partial_path) {
      console.log("Cannot move to first square! Movement value too low.");
      return false;
    }

    if (queue_move && this.move_target_path) {
      var path = this.move_target_path.concat(new_path);
    } else {
      var path = new_path;
    }

    // provide +1 movement for retreating in order to escape
    var movement = this.movement;
    if (this.battle) movement += 1;
    //var path_remaining = Game.pathfind.search(Game.terrain_graph, start, end);
    if (this.movement_path) destroyMovementPath(this.movement_path);

    if (!ignore_viuals) {
      this.movement_path = colourMovementPath(path, movement, this.at());
    }

    this.move_target_path = path;
  },

  retreat: function() {
    console.log("RETREAT HAS BEEN CALLED");
    var battle = this.isBattlePresent();
    var num_losses = battle.retreat(this);
    Output.printRetreat(this, num_losses);
    this.battle = false;
    this.moveTowardTarget(true);
  },

  moveTowardTarget: function(is_retreat) {
    if (is_retreat === undefined) is_retreat = false;
    var movement = this.movement;
    if (is_retreat) movement += 1;
    var partial_path = getPartialPath(this.move_target_path, movement);
    // check for enemies that will be bumped into
    for (var i=0; i<partial_path.length; i++) {
      if (this.battle) break;
      var next_move = partial_path[i];
      this.at(next_move.x, next_move.y);
      var new_path = this.move_target_path.slice(1, this.move_target_path.length);
      this.move_target_path = new_path;
      if (new_path.length == 0) this.move_target_path = undefined;
      this.moved();
    }
  },


  moved: function() {
    // detect combat
    var present_units = this.getPresentUnits();
    var enemy_present = this.isEnemyPresent();
    if (enemy_present) {
      var battle = this.isBattlePresent();
      if (battle) {
        this.joinBattle(battle);
      } else {
        this.startBattle();
      }
    }
  },

  getPresentUnits: function(ignore_self) {
    var present_units = [];
    var units = Crafty('Unit').get();
    for (var i=0; i < units.length; i++) {
      if (units[i].together(this, ignore_self)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
  },

  stop_unit: function() {
    destroyMovementPath(this.movement_path);
    delete this.movement_path;
    delete this.move_target_path;
    delete this.move_target;
  },
  startBattle: function() {
    this.battle = true;
    this.stop_unit();
    var battle = Crafty.e('Battle').at(this.at().x, this.at().y);
    battle.start(this);
  },

  joinBattle: function(battle) {
    this.battle = true;
    this.stop_unit();
    battle.join(this);
  },
  notify_of_battle: function(battle_side) {
    this.battle_side = battle_side;
    this.battle = true;
    this.stop_unit();
  },
  battle_finished: function() {
    this.battle = false;
    delete this.battle_side;
    //this.report();
  },

  sufferCasualties: function(casualties) {
    var deaths = Math.round(casualties * Game.battle_death_rate);
    var injuries = Math.round(casualties * (1 - Game.battle_death_rate));
    this.kill(deaths);
    this.injure(injuries);
    this.updateStatus();

    if (!this.isAlive()) this.die();
    if (this.getActive() <= 0) this.disband();
  },

  kill: function(num_troops, injured) {
    if (injured === undefined) injured = false;
    var num_killed = Math.ceil(Math.min(this.quantity, num_troops));
    this.quantity -= num_killed;
    if (injured) this.injured -= num_killed;
  },

  injure: function(num_troops) {
    this.injured += Math.ceil(Math.min(this.quantity, num_troops));
  },

  heal: function(num_to_heal) {
    this.injure(-1 * num_to_heal);
  },

  getActive: function() {
    this.updateStatus();
    return this.quantity - this.injured;
  },

  die: function() {
    this.updateStatus();
    var selected = Game.player_selected[this.side];
    if (selected && selected.getId && selected.getId() == this.getId()) {
      Game.clearPlayerSelected(this.side);
    }
    var battle = this.isBattlePresent();
    if (battle) battle.unitDead(this);
    this.alive = false;
    this.destroy();
  },

  disband: function() {
    console.log("{0}'s army disbanded!".format(this.name));
    this.die();
  },

  is: function(unit) {
    return this.getId() == unit.getId();
  },

});

Crafty.c('Cavalry', {
  init: function() {
    this.requires('Unit, Collision, Targetable, Movable')
      //.attr({ quantity: Math.floor(Math.random() * 1000), name: 'Cavalry', })
      .attr({
        quantity: 0,
        injured: 0,
        name: "NAME ME",
        type: 'Cavalry',
        //side: 1,
        movement: 8, 
        max_sight: 10,
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

  getOppositeSide: function() {
    return (this.side + 1) % 2;
  },

  toggleVisibility: function() {
    if (this.visible == false) {
      this.visible = true;
    } else {
      this.visible = false;
    }
  },

});

