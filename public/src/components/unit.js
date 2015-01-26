
var Unit = {
};

//console.log("Component.create");
//console.log(Component.create);
//Component.create('Unit', {
Crafty.c('Unit', {
  init: function() {
    this.requires('Actor, Targetable, Movable')
      .bind("UpdateMovementPaths", this.updateMovementPaths)
      .bind("NextTurn", this.nextTurn)
      .bind("UpdateActionChoices", this.updateActionChoices)
      .bind("StartBattles", this.startBattleIfNeeded)
      .bind("SiegeLifted", this.siegeLifted)
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
    this.addStat('morale', this.best_morale);
    this.addStat('max_movement', this.movement);
    this.possible_moves = [];
    this.possible_moves_data = {};
  },

  testTargetAndPath: function() {
    if (this.move_target_path === undefined) return;
    var path_end = this.move_target_path[this.move_target_path.length - 1];
    try {
      if (path_end.x != this.move_target.x || path_end.y != this.move_target.y) {
        console.log("---");
        console.log(this.name);
        console.log("this.move_target");
        console.log(this.move_target);
        console.log("this.move_target_path");
        console.log(this.move_target_path);
        throw new Error('BadTargetOrPath', 'Target and path no longer match.');
      }
    } catch (ex) {
      console.log("---");
      console.log(this.name);
      console.log("this.move_target");
      console.log(this.move_target);
      console.log("this.move_target_path");
      console.log(this.move_target_path);
      throw new Error('BadTargetOrPath', 'Target and path no longer match.');
    }
  },

  nextTurn: function(turn) {

    this.testTargetAndPath();

    if (turn === undefined) turn = Game.turn;
    // rebuild movement path for pathfinding from stored data

    var updated_move_target_path = Pathing.getPathFromPathList(this.move_target_path_list, this.at());
    this.updateMoveTargetPath(updated_move_target_path);

    this.testTargetAndPath();

    this.first_location = this.at();
    if (this.last_moves === undefined) this.last_moves = [];
    this.possible_moves = [];
    this.possible_moves_data = {};

    if (turn % 1 == 0) {
      // need visible enemy units for detecting stop points when moving
      this.visible_enemies = Units.getVisibleEnemyUnits(this.side);
    }

    this.testTargetAndPath();

    if (turn == (this.side + 0.5) % 2) {
      this.start_location = this.at();
      this.last_moves = [];
      if (this.battle && this.move_target_path) {
        this.retreat();
      } else if (!this.battle && this.move_target_path) {
        this.moveTowardTarget();
      }
    }

    this.testTargetAndPath();

    if (turn % 1 == 0.5) {
      delete this.visible_enemies;
    }

    this.updateMovementPaths();

    this.testTargetAndPath();

    if (turn == this.side) {
      if (Game.turn_count >= 2) this.handleAttrition();
      this.takeFireCasualties();

      this.updateMorale();
      this.reset(); // should happen after every other active effect!
    }
    this.updateStats(); // should happen last!

    this.testTargetAndPath();
  },

  updateMorale: function() {
    if (this.happy) {
    this.morale = 0;
    return;
      this.morale = Math.max(this.morale, this.best_morale);
    }
  },

  worsenMorale: function(amount) {
    if (amount === undefined) amount = 1;
    this.morale = 0;
    return;
    this.morale += amount;
    this.happy = false;
  },

  reset: function() {
    this.movement = this.max_movement;
    this.turn_action = "move";
    this.performed_actions = [];
    this.updateActionChoices();
    this.happy = true;
  },

  canSiege: function() {
    if (this.sieging || this.besieged) return false;

    var can_siege = false;
    var terrain;
    var adjacent_points = Utility.getPointsWithinDistance(this.at(), 1, Game.map_grid);
    for (var i in adjacent_points) {
      var point = adjacent_points[i];
      terrain = Game.terrain[point.x][point.y];
      if (terrain.has('City')) {
        var enemy_units = Units.getPresentEnemyUnits(terrain.at(), this.side);
        if (enemy_units.length > 0) {
          can_siege = true;
          break;
        }
      }
    }
    if (!can_siege) return false;

    var city_adjacent_tiles = Utility.getPointsWithinDistance(terrain.at(), 1, Game.map_grid);
    for (var i in city_adjacent_tiles) {
      var point = city_adjacent_tiles[i];
      var enemy_units = Units.getPresentEnemyUnits(point, this.side);
      if (enemy_units.length > 0) {
        return false;
      }
    }
    return true;
  },

  getActionChoices: function() {
    // @TODO This should probably also be filtering by this.side != Game.turn
    if (this.side != Game.player) return [];
    if (this.battle) return [];
    if (this.performed_actions.length > 0) return [];

    var actions = [];
    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (local_terrain.on_fire) return [];

    if (local_terrain.type == 'Farm' && !local_terrain.pillaged) {
      actions.push("pillage");
    }
    if (local_terrain.base_type == 'Settlement' && local_terrain.side != this.side && !local_terrain.sacked) {
      actions.push("sack");
    }
    if (Game.fire && local_terrain.flammable) {
      actions.push('start_fire');
    }

    if (this.canSiege()) actions.push('siege');

    return actions;
  },

  actionPerformed: function(action) {
    var new_movement = this.movement - this.max_movement / 2;
    this.movement = Math.max(new_movement, 0);
    this.possible_moves = [];
    this.possible_moves_data = {};
    this.updatePossibleMoves();
    this.updateMovementPaths();
  },

  updatePossibleMoves: function() {
    if (!Game.render_possible_moves) return;

    var moves = {};
    var movement = this.movement;
    if (this.battle && this.side == Game.turn) movement += 1;

    var graph = new Graph(Game.terrain_difficulty_with_roads);
    this.updateTerrainGraphWithRetreatBlocks(graph);

    var no_target = false;
    var all_enemies = false;
    if (this.side !== Game.player) all_enemies = 'all enemies';
    var stop_points = this.getStopPoints(no_target, this.at(), all_enemies);
    var start = graph.grid[this.at().x][this.at().y];

    var possible_moves = Game.pathfind.findReachablePoints(graph, start, movement, stop_points);

    // ensure that enemy units are highlighted if they can be attacked
    var enemy_units = LineOfSight.getEnemyUnitsInSight(this.side);
    for (var i in enemy_units) {
      var unit = enemy_units[i];
      var target = unit.at();
      if (target.x == this.at().x && target.y == this.at().y) continue;
      var end = graph.grid[target.x][target.y];
      var stop_points = this.getStopPoints(target, this.at(), all_enemies);

      var new_path = Game.pathfind.search(graph, start, end, movement, stop_points);
      // @TODO This feels hacky. Should update pathing library return path cost
      // data, eg. how many turns it takes to get to each tile
      var partial_path = Pathing.getPartialPath(new_path, movement, stop_points);
      if (!new_path || partial_path.length != new_path.length) {
        continue;
      }
      //if (!new_path || new_path[new_path.length - 1].turns > 0) continue;
      possible_moves.push({ x: unit.at().x, y: unit.at().y});
    }

    this.possible_moves = [];
    for (var i in possible_moves) {
      var node = possible_moves[i];
      this.possible_moves.push(Game.possible_moves[node.x][node.y]);
    }

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
      var amount = local_terrain.pillage(this, total_pillage_ability);
    } else if (local_terrain.has("Settlement") && !local_terrain.sacked) {
      var amount = local_terrain.pillage(this, total_pillage_ability);
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

  siege: function() {
    // if enemy unit adjacent and in city
    // @TODO Make more efficient. Look only at adjacent tiles
    var enemy_units = Units.getEnemyUnits(this.side);
    var siege;
    for (var i in enemy_units) {
      // @TODO Handle situation where multiple cities are adjacent
      var unit = enemy_units[i];
      var location = Game.terrain[unit.at().x][unit.at().y];
      if (Utility.getDistance(this.at(), unit.at()) <= 1 && location.has('Settlement')) {
        siege = Entity.create('Siege').at(location.at().x, location.at().y);
        siege.setAffectedRegion();
        siege.setInitiator(this.side);
        break;
      }
    }

    this.movement = 0;
    this.sieging = true;
    this.siege_id = siege.getId();
  },

  besiege: function(siege_id) {
    this.besieged = true;
    this.siege_id = siege_id;
  },

  siegeLifted: function(siege_id) {
    if (this.siege_id == siege_id) {
      this.sieging = false;
      this.siege_id = undefined;
      this.besieged = false;
      this.siege_id = undefined;
    }
  },

  addSupply: function(amount) {
    this.supply_remaining = Math.min(this.max_supply, this.supply_remaining + amount);
  },

  updateMovementPaths: function() {
    if (Game.player == this.side) {
      if (this.move_target_path) {
        if (this.movement_path && Game.turn == this.side) {
          Pathing.destroyMovementPath(this.movement_path);
          var movement = this.getMovementArray(this.movement);
          this.movement_path = this.colourMovementPath(this.move_target_path, movement, this.at());
        }
      }
    }
  },

  updateTerrainGraphWithRetreatBlocks: function(graph, target) {
    if (this.battle) {
      var battle = this.isBattlePresent();
      var retreat_constraints = battle.retreat_constraints[this.battle_side];
      if (!retreat_constraints.isMoveTargetValid(target)) {
        return false;
      }

      retreat_constraints.applyToArray(graph.grid, 'weight');
    }

    return graph;
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

    if (Game.render_possible_moves) {
      for (var i in this.possible_moves) {
        this.possible_moves[i].show();
        Game.visible_possible_moves.push(this.possible_moves[i]);
      }
    }
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
    if (this.together(target)) return true;
    var graph = new Graph(Game.terrain_supply);
    var start = graph.grid[this.at().x][this.at().y];
    var end = graph.grid[target.at().x][target.at().y];

    var enemy_units = Units.getEnemyUnits(this.side);

    var no_supply_objects = Entity.get('NoSupply');
    for (var i=0; i<no_supply_objects.length; i++) {
      no_supply_objects[i].destroy();
    }
    // @TODO remove this or comment out! Not using supply blocks yet.
    var supply_blocks = Entity.get('SupplyBlock');
    for (var i=0; i<supply_blocks.length; i++) {
      var block = supply_blocks[i];
      graph.grid[block.at().x][block.at().y].weight = 0;
      //Crafty.e('NoSupply').at(block.at().x, block.at().y);
      console.log("FOUND SUPPLY BLOCK! At {0}, {1}".format(block.at().x, block.at().y));
    }

    for (var i=0; i<enemy_units.length; i++) {
      // add enemy units to Game supply graph as blockers of supply lines
      var unit = enemy_units[i];
      if (unit.getActive() < Game.min_troops_for_supply_cut) continue;
      var weight = graph.grid[unit.at().x][unit.at().y].weight;
      graph.grid[unit.at().x][unit.at().y].weight = 0;
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
      var supply_route = Game.pathfind.search(graph, start, end);
      if (supply_route.length == 0) is_supplied = false;
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
      if (!local_terrain.supply && !Game.roads[space.x][space.y]) continue; // not a road/bridge/city
      var start = Game.terrain_supply_graph.grid[space.x][space.y];
      var supply_route = Game.pathfind.search(Game.terrain_supply_graph, start, supply_end_point);
      if (supply_route.length > 0) return true;
    }
    return false;
  },

  sufferAttrition: function() {
    var unsupplied = this.quantity;

    if (Game.live_off_land && !this.battle) {
      var local_terrain = Game.terrain[this.at().x][this.at().y];
      var is_correct_side = local_terrain.side === undefined || local_terrain.side == this.side;
      if (local_terrain.provides_supply && is_correct_side) {
        var supply = local_terrain.remaining_provided_supply;
        var supply_used = Math.min(this.quantity * this.supply_usage, supply);
        unsupplied = this.quantity - Math.ceil(supply_used / this.supply_usage);
        local_terrain.remaining_provided_supply -= supply_used;
      }
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

  getPresentUnits: function(ignore_self, location) {
    if (location === undefined) location = this.at();
    var present_units = [];
    var units = Entity.get('Unit');
    for (var i=0; i < units.length; i++) {
      //if (units[i].isAtLocation(location)) {
      if (units[i].together(this, ignore_self)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
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
    var entities = Entity.get(Utility.capitalizeFirstLetter(entity));
    for (var i=0; i < entities.length; i++) {
      var entity = entities[i];
      var entity_exists = false;
      if (entities[i].together(this)) {
        return entities[i];
      }
    }

    return false;
  },

  isBattlePresent: function() {
    return this.isEntityPresent('Battle');
  },

  isSiegePresent: function() {
    var sieges = Entity.get('Siege');
    for (var i in sieges) {
      var siege = sieges[i];
      if (Utility.getDistance(siege.at(), this.at()) <= 1) return true;
    }
    return false;
  },

  isCityPresent: function() {
    return this.isEntityPresent('City');
  },

  prepareMove: function(target_x, target_y, ignore_visuals, queue_move, use_last_move) {

    if (this.at().x == target_x && this.at().y == target_y) {
      delete this.move_target;
      this.updateMoveTargetPath('delete');
      Pathing.destroyMovementPath(this.movement_path);
      delete this.movement_path;
      return false;
    }

    // if double-hold-clicking, update current move to previous and start again
    if (queue_move && use_last_move) {
      this.updateMoveTargetPath(this.last_move_target_path);
      this.prepareMove(target_x, target_y, ignore_visuals, 'queue move', false);
    }

    var target = { x: target_x, y: target_y };

    var graph = new Graph(Game.terrain_difficulty_with_roads);

    if (!this.updateTerrainGraphWithRetreatBlocks(graph, target)) {
      return false;
    }

    this.move_target = target;

    if (queue_move && this.move_target_path) {
      var end_path = this.move_target_path[this.move_target_path.length - 1];
      var start = graph.grid[end_path.x][end_path.y];
    } else {
      var start = graph.grid[this.at().x][this.at().y];
    }
    var end = graph.grid[target_x][target_y];
    var stop_points = this.getStopPoints(end, start, false);

    var movement = this.getMovementArray(this.movement);

    var new_path = Game.pathfind.search(graph, start, end, movement, stop_points);

    if (!new_path) {
      Output.message("Target impossible to reach!");
      return false;
    }
    // @TODO The effect being caught here will likely cause the game to freeze
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

    // @TODO Return false here if the path does not exist or any reason

    // provide +1 movement for retreating in order to escape
    var movement = this.movement;
    if (this.battle) movement += 1;
    movement = this.getMovementArray(movement);
    if (this.movement_path) Pathing.destroyMovementPath(this.movement_path);

    if (!ignore_visuals) {
      this.movement_path = this.colourMovementPath(path, movement, this.at());
    }

    this.updateMoveTargetPath(path);

    // TEST OUTPUT
    this.testTargetAndPath();

  },

  getMovementArray: function(movement) {
    if (movement != this.max_movement) {
      movement = [movement, this.max_movement];
    }
    return movement;
  },

  colourMovementPath: function(path, this_movement, location) {
    var turns_required = 1;
    var movement_path = [];
    var target = { x: path[path.length - 1].x, y: path[path.length - 1].y };
    var start_location = this.first_location;

    var movement_square = Pathing.makeMovementPath(location.x, location.y, 1);
    var highlighted_square = Pathing.makeMovementPath(location.x, location.y, 1, true);
    movement_path.push([movement_square, highlighted_square]);
    while (path.length > 0) {
      var stop_points = this.getStopPoints(target, start_location, false);
      var movement_amount = this_movement;
      if (this_movement.length) movement_amount = this_movement[0];

      var next_partial_path = Pathing.getPartialPath(path, movement_amount, stop_points);

      // get stop points for both end target and end of this turn's final space
      var first_move_end_node = next_partial_path[next_partial_path.length - 1];
      var extra_stop_points = this.getStopPoints(first_move_end_node, start_location, false);
      stop_points = stop_points.concat(extra_stop_points);
      Utility.removeDuplicates(stop_points);
      var next_partial_path = Pathing.getPartialPath(path, movement_amount, stop_points);

      for (var i=0; i<next_partial_path.length; i++) {
        var movement_spot = Pathing.makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required);
        var highlighted_spot = Pathing.makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required, true);
        movement_path.push([movement_spot, highlighted_spot]);
      }
      turns_required += 1;
      path = path.slice(next_partial_path.length, path.length);
      start_location = next_partial_path[next_partial_path.length - 1];

      // update movement to latest value
      if (this_movement.length && this_movement.length > 1) {
        this_movement = this_movement.slice(1);
      }
    }
    return movement_path;
  },

  getStopPoints: function(target, current_location, all_enemies) {
    // @TODO Cache stop_points and use same set of points for all paths (for
    // the same side)
    if (!target) target = { x: -1, y: -1 };
    if (current_location === undefined) current_location = this.at();
    if (all_enemies === undefined) all_enemies = false;

    var stop_points = [];
    if (all_enemies) {
      var enemy_units = Units.getEnemyUnits(this.side);
    } else {
      var enemy_units = Units.getVisibleEnemyUnits(this.side);
    }
    var friendly_units = Units.getFriendlyUnits(this.side);

    for (var i in enemy_units) {
      // add visible enemies as stop points
      // if enemy is on target, ignore adjacent stop points
      // otherwise, add enemy adjacent regions as 'stop points'
      var enemy = enemy_units[i];
      var enemy_was_visible = false;
      for (var j in this.visible_enemies) {
        var visible_enemy = this.visible_enemies[j];
        if (enemy.getId() == this.visible_enemies[j].getId()) {
          var enemy_was_visible = true;
        }
      }

      if (enemy_was_visible) stop_points.push(enemy.at());
      if (enemy.isAtLocation(target) && enemy_was_visible) continue;
      // if enemy in battle, prevent adjacency blocking, but not regular unit blocking
      if (enemy.battle) continue;
      if (Utility.getDistance(current_location, enemy.at()) <= 1) {
        continue;
      }

      var adjacent_points = Utility.getAdjacentPoints(enemy.at(), Game.map_grid);
      var valid_adjacent_points = [];
      for (var j in adjacent_points) {
        var point = adjacent_points[j];
        // if there is a friendly unit on that location, ignore stop point
        var ignore = false;
        for (var k in friendly_units) {
          var friendly_unit = friendly_units[k];
          if (friendly_unit.isAtLocation(point)) {
            ignore = true;
            break;
          }
        }
        if (!ignore) valid_adjacent_points.push(point);
      }
      stop_points = stop_points.concat(valid_adjacent_points);
      // @TODO Ensure only new positions are added to stop_points
    }

    var fires = Entity.get('Fire');
    for (i in fires) {
      stop_points.push(fires[i].at());
    }

    // @TODO Take all_enemies (out of sight or not) into account.
    // This will not likely be necessary for now because each siege will be
    // visible by both sides for the foreseeable future.
    var sieges = Entity.get('Siege');
    for (var i in sieges) {
      var siege = sieges[i];
      if (siege.sieging_side == this.side) continue;
      stop_points.push(siege.at());
      for (var j in siege.affected_tiles) {
        var tile = siege.affected_tiles[j];
        stop_points.push(tile.at());
      }
    }

    Utility.removeDuplicates(stop_points);
    return stop_points;
  },

  retreat: function() {
    console.log("RETREAT HAS BEEN CALLED");
    var battle = this.isBattlePresent();
    var num_losses = battle.retreat(this);
    Output.printRetreat(this, num_losses);
    this.battle = false;
    this.moveTowardTarget('is_retreat');
  },

  moveTowardTarget: function(is_retreat) {
    if (is_retreat === undefined) is_retreat = false;
    var movement = this.movement;
    if (is_retreat) movement += 1;
    var partial_path = Pathing.getPartialPath(this.move_target_path, movement);

    var end_node = this.move_target_path[this.move_target_path.length - 1];

    var target = { x: end_node.x, y: end_node.y };
    if (this.move_target === undefined || target.x != this.move_target.x || target.y != this.move_target.y) {
      console.log("target");
      console.log(target);
      console.log("this.move_target");
      console.log(this.move_target);
      console.log("this.move_target_path");
      console.log(this.move_target_path);
      console.log("partial_path");
      console.log(partial_path);
      throw new Error('BadTarget', 'Target somehow became inaccurate while moving army.');
    }

    // get stop points for both end target and end of this turn's final space
    var stop_points = this.getStopPoints(target, this.first_location, 'all enemies');
    var first_move_end_node = partial_path[partial_path.length - 1];
    var extra_stop_points = this.getStopPoints(first_move_end_node, this.first_location, 'all enemies');
    stop_points = stop_points.concat(extra_stop_points);
    Utility.removeDuplicates(stop_points);

    // check for enemies that will be bumped into
    for (var i in partial_path) {
      this.last_location = this.at();
      var next_move = partial_path[i];
      this.at(next_move.x, next_move.y);
      this.last_moves.push({ x: next_move.x, y: next_move.y });
      var new_path = this.move_target_path.slice(1, this.move_target_path.length);
      this.updateMoveTargetPath(new_path);
      //if (new_path.length == 0) this.updateMoveTargetPath('delete');
      this.moved();
      if (this.battle) break;

      var end_movement = false;
      for (var j in stop_points) {
        if (this.isAtLocation(stop_points[j])) {
          end_movement = true;
          break;
        }
      }
      if (end_movement) break;
    }

    var sieges = Entity.get('Siege');
    for (var i in sieges) {
      var siege = sieges[i];
      if (Utility.getDistance(this.at(), siege.at()) <= 1) {
        if (siege.sieging_side == this.side) {
          this.sieging = true;
          this.siege_id = siege.getId();
        }
      }
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
        this.start_battle = true;
      }
    }
  },

  stop_unit: function() {
    Pathing.destroyMovementPath(this.movement_path);
    delete this.movement_path;
    this.updateMoveTargetPath('delete');
    delete this.move_target;
  },

  startBattleIfNeeded: function() {
    if (this.start_battle) {
      var battle = this.isBattlePresent();
      if (battle) {
        this.joinBattle(battle);
        this.start_battle = false;
        return;
      }
      this.startBattle();
      this.start_battle = false;
    }
  },

  startBattle: function() {
    this.battle = true;
    this.stop_unit();
    var battle = Entity.create('Battle').at(this.at().x, this.at().y);
    this.battle_side = Battle.ATTACKER;
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
    console.log('battle_finished called for {0}'.format(this.name));
    this.battle = false;
    delete this.battle_side;
    this.updateActionChoices();
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
    this.alive = false;
    var battle = this.isBattlePresent();
    if (battle) battle.unitDead(this);

    Entity.destroy(this);
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
    if (!new_path || new_path.length == 0) new_path = 'delete';
    //if (new_path === undefined) throw new Error('BadParam', 'new_path cannot be undefined.');
    if (this.move_target_path) {
      this.last_move_target_path = this.move_target_path.slice(0);
    }
    if (new_path == 'delete') {
      delete this.move_target_path;
      delete this.move_target_path_list;
      delete this.last_move_target_path;
      delete this.move_target;
      return;
    }
    this.move_target_path = new_path;
    this.move_target_path_list = Pathing.getPathList(this.move_target_path);
    var end_node = this.move_target_path[this.move_target_path.length - 1];
    this.move_target = { x: end_node.x, y: end_node.y };
    /*
    if (end_node === undefined) {
      delete this.move_target;
    } else {
      this.move_target = { x: end_node.x, y: end_node.y };
    }
    */
  },

  pick_side: function(side) {
    if (side !== undefined) this.side = side;
  },

});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Unit;
} else {
  window.Unit = Unit;
}

