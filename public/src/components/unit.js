
var Unit = {
  getUnitsBySide: function(side) {
    var units = Entity.get('Unit');
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

  getUnitById: function(id, side) {
    var units = this.getFriendlyUnits(side);
    for (var i in units) {
      if (units[i].id == id) {
        return units[i];
      }
    }
  },

}

//console.log("Component.create");
//console.log(Component.create);
//Component.create('Unit', {
Crafty.c('Unit', {
  init: function() {
    this.requires('Actor, Targetable')
      .bind("UpdateMovementPaths", this.updateMovementPaths)
      .bind("NextTurn", this.nextTurn)
      .bind("UpdateActionChoices", this.updateActionChoices)
      ;
    this.lastMoveTarget = undefined;
  },

  /*
   * Sets any dynamic stats for the unit that require this.stats to be set
   * properly.
   * Note: This MUST be called after a unit is created!
   */
  setStats: function() {
    this.addStat('max_supply', this.max_supply_multiplier * this.quantity);
    this.addStat('supply_remaining', this.max_supply);
  },

  nextTurn: function(turn) {
    // rebuild movement path for pathfinding from stored data
    this.move_target_path = Pathing.getPathFromPathList(this.move_target_path_list, this.at());

    if (turn === undefined) turn = Game.turn;
    if (turn == (this.side + 0.5) % 2) {
      if (this.battle && this.move_target_path) {
        this.retreat();
      } else if (!this.battle && this.move_target_path) {
        this.moveTowardTarget();
      }
    }

    this.updateMovementPaths();

    if (turn == this.side) {
      if (Game.turn_count >= 2) this.handleAttrition();
      this.takeFireCasualties();

      this.reset(); // should happen after every other active effect!
    }

    this.updateStats(); // should happen last!
  },

  reset: function() {
    this.turn_action = "move";
    this.performed_actions = [];
    this.updateActionChoices();
  },

  getActionChoices: function() {
    if (this.side != Game.player) return [];
    if (this.battle) return [];
    if (this.performed_actions.length > 0) return [];

    var actions = [];
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (local_terrain.on_fire) return [];

    if (local_terrain.type == 'Farm' && !local_terrain.pillaged) {
      actions.push("pillage");
    }
    if (local_terrain.type == 'City' && local_terrain.side != this.side && !local_terrain.sacked) {
      actions.push("sack");
    }
    if (local_terrain.flammable) {
      actions.push('start_fire');
    }
    return actions;
  },

  updateActionChoices: function(location) {
    if (location === undefined || this.isAtLocation(location)) {
      this.action_choices = this.getActionChoices();
    }
    Output.updateUnitDisplay(this);
  },

  pillage: function() {
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    var total_pillage_ability = this.pillage_ability * this.getActive();
    if (local_terrain.has('Farm')) {
      var amount = local_terrain.pillage(total_pillage_ability);
    } else if (local_terrain.has("City") && !local_terrain.sacked) {
      var amount = local_terrain.pillage(total_pillage_ability);
    } else {
      throw "CannotPillageEntity: {0} not valid type to be pillaged/sacked. At location: ({1}, {2})".format(local_terrain.type, local_terrain.at().x, local_terrain.at().y);
    }

    if (amount) {
      var old_supply = this.supply_remaining;
      this.addSupply(amount);
      var amount_pillaged = this.supply_remaining - old_supply;
      var message = "Pillaged {0} supply!".format(amount_pillaged);
      Output.message(message);
    }
  },

  addSupply: function(amount) {
    this.supply_remaining = Math.min(this.max_supply, this.supply_remaining + amount);
  },

  updateMovementPaths: function() {
    if (Game.player == this.side && Game.turn == this.side) {
      if (this.move_target_path) {
        if (this.movement_path) Pathing.destroyMovementPath(this.movement_path);
        this.movement_path = Pathing.colourMovementPath(this.move_target_path, this.movement, this.at());
      }
    }
  },

  customSelect: function() {
    Output.selectUnits([this]);

    if (this.movement_path) highlightPath(this.movement_path);

    var other_units_present = this.getPresentUnits(true);
    if (other_units_present.length > 0) {
      Output.colocate(other_units_present);

    }
    var enemy_units_present = [];
    for (var i in other_units_present) {
      var unit = other_units_present[i];
      if (unit.side != Game.player) {
        enemy_units_present.push(unit);
      }
    }
    Output.printUnitsPresent(this, enemy_units_present);
    Output.printTotalUnitsPresent(this, other_units_present);
  },

  getQuantity: function() {
    return this.quantity;
  },

  report: function() {
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

    var num_to_heal = Game.healing_rate * this.injured;
    this.heal(num_to_heal);

    var city = this.isCityPresent();
    if (city && !city.sacked && city.supply_remaining > 0 && !this.battle) {
      var num_to_heal = Game.city_healing_rate * this.injured;
      this.heal(num_to_heal);
    }
  },

  handleAttrition: function() {
    this.injuryAttrition();
    if (this.isSupplied()) {
      this.is_supplied = true;
      this.resupply();
    } else {
      this.is_supplied = false;
      var units_lost = this.sufferAttrition();
    }
  },

  takeFireCasualties: function() {
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (local_terrain.on_fire) {
      var fire_casualty_rate_injured = 0.95;
      var injured_to_kill = Math.ceil(fire_casualty_rate_injured * this.injured);
      this.kill(injured_to_kill, true);

      var fire_casualty_rate = 0.75;
      var casualties = Math.ceil(fire_casualty_rate * this.getActive());
      this.sufferCasualties(casualties);
    }
  },

  resupply: function(fill) {
    if (fill) {
      this.addSupply(this.max_supply);
    } else {
      this.addSupply(this.quantity);
    }
  },

  isSupplied: function(side) {
    if (side === undefined) side = this.side;

    /*
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (!local_terrain.supply) {
      return false;
    }
    */

    var is_supplied = true;
    // detect possible lack of supply
    // @TODO: Allow for more than two supply endpoints
    var target_location = Game.supply_route[side];
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
        if (unit.getActive() < Game.min_troops_for_supply_cut) continue;
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
      
      if (this.battle) {
        is_supplied = this.isSuppliedInBattle(end);
      } else {
        var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, end);
        if (supply_route.length == 0) is_supplied = false;
      }
    } else {
      // Supplied because unit is on supply route end point
    }
    /*
    if (!is_supplied && side == this.side) {
      return this.isSupplied(1 - this.side);
    }
    */
    return is_supplied;
  },

  isSuppliedInBattle: function(supply_end_point) {
    var battle = this.isBattlePresent();
    var retreat_constraints = battle.retreat_constraints[this.battle_side];
    var spaces = retreat_constraints.getAdjacentUnblockedSpaces(Game.map_grid);
    var route_cost = undefined;

    for (var i in spaces) {
      var space = spaces[i];
      var local_terrain = Game.terrain[space.x][space.y];
      if (local_terrain.move_difficulty == 0) continue; // impassible
      if (!local_terrain.supply) continue; // not a road/bridge/city
      var start = Game.terrain_supply_graph.grid[space.x][space.y];
      var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, supply_end_point);
      if (supply_route.length > 0) return true;
    }
    return false;
  },

  sufferAttrition: function() {
    var unsupplied = this.quantity;
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (local_terrain.provides_supply) {
      unsupplied = Math.max(0, this.quantity - local_terrain.provides_supply);
    }

    var supplied_units = Math.floor(this.supply_remaining / this.supply_usage);
    this.supply_remaining -= unsupplied;
    if (this.supply_remaining < 0) {
      var attrition_casualties = Math.max(0, (unsupplied - supplied_units)) * Game.attrition_rate;
      var to_kill = Math.floor(attrition_casualties * Game.attrition_death_rate);
      var to_injure = Math.floor(attrition_casualties * (1 - Game.attrition_death_rate));
      this.kill(to_kill);
      this.injure(to_injure);
      this.supply_remaining = Math.max(0, this.supply_remaining);

      if (!this.isAlive()) this.die();
      if (this.getActive() <= 0) this.disband();

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

  isCityPresent: function() {
    return this.isEntityPresent('City');
  },

  prepareMove: function(target_x, target_y, ignore_visuals, queue_move, use_last_move) {

    // if double-hold-clicking, update current move to previous and start again
    if (queue_move && use_last_move) {
      this.updateMoveTargetPath(this.last_move_target_path);
      this.prepareMove(target_x, target_y, ignore_visuals, 'queue move', false);
    }
    if (this.at().x == target_x && this.at().y == target_y) {
      delete this.move_target;
      this.updateMoveTargetPath('delete');
      Pathing.destroyMovementPath(this.movement_path);
      delete this.movement_path;
      return false;
    }

    var target = { x: target_x, y: target_y };
    buildTerrainData();
    if (this.battle) {
      var battle = this.isBattlePresent();
      var retreat_constraints = battle.retreat_constraints[this.battle_side];
      if (!retreat_constraints.isMoveTargetValid(target)) {
        return false;
      }

      retreat_constraints.applyToArray(Game.terrain_graph.grid, 'weight');
    }
    this.move_target = target;

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
      Output.message("Target impossible to reach!");
      return false;
    }
    var partial_path = Pathing.getPartialPath(new_path, this.movement);
    if (!partial_path) {
      Output.message("Cannot move to first square! Movement value too low.");
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
    if (this.movement_path) Pathing.destroyMovementPath(this.movement_path);

    if (!ignore_visuals) {
      this.movement_path = Pathing.colourMovementPath(path, movement, this.at());
    }

    this.updateMoveTargetPath(path);
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
    var partial_path = Pathing.getPartialPath(this.move_target_path, movement);

    // check for enemies that will be bumped into
    for (var i=0; i<partial_path.length; i++) {
      this.last_location = this.at();
      if (this.battle) break;
      var next_move = partial_path[i];
      this.at(next_move.x, next_move.y);
      var new_path = this.move_target_path.slice(1, this.move_target_path.length);
      this.updateMoveTargetPath(new_path);
      if (new_path.length == 0) this.updateMoveTargetPath(undefined);
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
    Pathing.destroyMovementPath(this.movement_path);
    delete this.movement_path;
    this.updateMoveTargetPath('delete');
    delete this.move_target;
  },
  startBattle: function() {
    this.battle = true;
    this.stop_unit();
    var battle = Crafty.e('Battle').at(this.at().x, this.at().y);
    var battle_data = new BattleData('Battle', this);
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
    if (isNaN(num_troops)) throw "NaN: num_troops in unit.kill()";
    if (num_troops === undefined) throw "undefined: num_troops in unit.kill()";
    if (injured === undefined) injured = false;
    var num_killed = Math.ceil(Math.min(this.quantity, num_troops));
    this.quantity -= num_killed;
    if (injured) this.injured -= num_killed;

    this.updateMaxSupply();
  },

  updateMaxSupply: function() {
    this.max_supply = this.getActive() * this.max_supply_multiplier;
    this.supply_remaining = Math.min(this.max_supply, this.supply_remaining);
  },

  injure: function(num_troops) {
    if (isNaN(num_troops)) throw "NaN: num_troops in unit.injure()";
    if (num_troops === undefined) throw "undefined: num_troops in unit.injure()";
    this.injured += Math.ceil(Math.min(this.quantity, num_troops));

    this.updateMaxSupply();
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

  toggleVisibility: function() {
    if (this.visible == false) {
      this.visible = true;
    } else {
      this.visible = false;
    }
  },

  getOppositeSide: function() {
    return (this.side + 1) % 2;
  },

  updateMoveTargetPath: function(new_path) {
    if (this.move_target_path) {
      this.last_move_target_path = this.move_target_path.slice(0);
    }
    if (new_path == 'delete') {
      delete this.move_target_path;
      delete this.move_target_path_list;
      delete this.last_move_target_path;
      return;
    }
    this.move_target_path = new_path;
    this.move_target_path_list = Pathing.getPathList(this.move_target_path);
  },

  pick_side: function(side) {
    if (side !== undefined) this.side = side;
  },

  /*
  pick_side: function(side) {
    if (side !== undefined) this.side = side;
    if (this.side == 0) {
      this.addComponent('spr_cavalry_blue');
    } else {
      this.addComponent('spr_cavalry');
    }
  },
  */

});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Unit;
} else {
  window.Unit = Unit;
}

