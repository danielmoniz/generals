
if (typeof require !== 'undefined') {
  Utility = require("./utility");
  GUI = require("./gui");
}

/*
 * This class should provide every available user action.
 * This is in order to ensure certain tasks are always performed before/after
 * each user action, as well as to monitor/limit the possible available user
 * actions.
 */
var Action = {

  /*
   * Maps the action to a function and passes on all relevant arguments.
   * Eg. action = 'clock spot here' -> func = this.clickSpotHere
   */
  perform: function(action) {
    var all_args = [].slice.call(arguments);
    var args_to_pass = all_args.slice(1);

    if (action != action.toLowerCase()) {
      throw new Error('BadActionName', 'Action names must be all lowercase letters.');
    }

    this.action = action;
    var action_words = action.split('_');
    var function_name = "";
    for (var i in action_words) {
      if (i == 0) {
        function_name += action_words[i].toLowerCase();
      } else {
        function_name += Utility.capitalizeFirstLetter(action_words[i]);
      }
    }

    var func = this[function_name];
    if (func !== undefined) {
      this.preAction();
      func.apply(this, args_to_pass);
      this.postAction();
    } else {
      throw new Error('ActionDoesNotExist', 'Relevant action function does not exist for {0}'.format(function_name));
    }
  },

  /*
   * Perform certain tasks before every user action.
   */
  preAction: function() {
    if (typeof Output !== 'undefined') Output.clearMessage();
  },

  /*
   * Perform certain tasks after every user action.
   * Eg. the scene should always be redrawn after actions.
   */
  postAction: function() {
    Crafty.trigger('RenderScene');
  },

  // Action functions ----------------------------

  toggleOption: function(option) {
    Game[option] = !Game[option];
  },

  toggleEnemySightLines: function(name) {
    this.toggleOption(name);
    LineOfSight.handleSightOutlines();
  },

  toggleAllySightLines: function(name) {
    this.toggleOption(name);
    LineOfSight.handleSightOutlines();
  },

  toggleShowUnits: function(name) {
    this.toggleOption(name);
    var visible_points = LineOfSight.points_in_sight[Game.player];
    LineOfSight.unitLineOfSight(visible_points, Game.player);
  },

  toggleEnemyMovement: function(name) {
    this.toggleOption(name);
    EnemyMoves.displayEnemyMoves(Game.player, Game.turn);
  },

  toggleCitySupplyRanges: function(name) {
    this.toggleOption(name);
    GUI.displayCitySupplyRanges(Game.player);
  },

  leftClick: function(entity, selected) {
    if (!selected) {
      Game.select(entity);
    } else {
      if (entity != selected) {
        Game.select(entity);
        return;
      }

      // disallow click-cycling if target is unseen
      var side = Game.player;
      var visible_points = LineOfSight.getPointsInSight(side);
      if (!visible_points[entity.at().x] || !visible_points[entity.at().x][entity.at().y]) {
        return;
      }

      // cycle through present units if need be
      var units = Units.getPresentUnits(entity.at());
      if (units.length == 0) {
        if (entity == selected) Game.deselect();
        else Game.select(entity);
        return;
      }

      var index = units.indexOf(entity);
      index = (index + 1) % (units.length);
      var next_unit = units[index];
      if (next_unit === undefined) {
        Game.deselect();
      } else {
        Game.select(next_unit);
      }
    }

  },

  rightClick: function(entity, e, double_hold) {
    if (Game.player !== undefined && Game.player == Game.selected.side) {
      if (entity.double_right_mouse_went_down_here && double_hold) {
        Game.selected.prepareMove(entity.at().x, entity.at().y, false, 'queue move', 'use last');

      } else if (entity.right_mouse_went_down_here) {
        if (e.shiftKey) {
          Game.selected.prepareMove(entity.at().x, entity.at().y, false, true);
        } else {
          Game.selected.prepareMove(entity.at().x, entity.at().y);
        }
      }
    } else {
      Output.notYourMove();
    }

    entity.resetRightMouseDown();
  },

  unitAction: function(unit, action) {
    unit.turn_action = action;
    var local_terrain = unit.getLocalTerrain();

    if (action == "pillage" || action == "sack") {
      unit.pillage();
      Victory.updateWillToFight();
      Output.updateVictoryBar();

    } else if (action == "capture") {
      unit.captureTerrain();

    } else if (action == "start_fire") {
      local_terrain.ignite(unit);

      // update unit possible moves/paths if they conflict with the fire
      var units = Units.getFriendlyUnits(unit.side);
      var here = unit.at();
      for (var i in units) {
        units[i].updatePossibleMoves();

        var move_path = units[i].move_target_path;
        var target = units[i].move_target;
        if (target && here.x == target.x && here.y == target.y) {
          units[i].deleteMoveTargetPath();
        } else if (Utility.isPointInList(here, units[i].move_target_path)) {
          units[i].prepareMove(target.x, target.y);
        }
      }

    } else if (action == "siege") {
      unit.siege();
    } else {
      throw new Error('InvalidAction');
    }

    unit.actionPerformed(action);
    if (local_terrain.spot) local_terrain.spot(unit.side);

    GUI.displayCitySupplyRanges(Game.player);
    LineOfSight.handleSightOutlines(Game.player);

    Game.flushCaches(); // run after unit actions for an up-to-date cache

    var formatted_action = {
      action: action,
      unit_id: unit.id,
    };
    if (Game.turn_actions[Game.turn_count] === undefined) {
      Game.turn_actions[Game.turn_count] = [];
    }
    Game.turn_actions[Game.turn_count].push(formatted_action);

    unit.performed_actions.push(action);

    Crafty.trigger("UpdateActionChoices", unit.at());
    Output.updateUnitDisplay(unit);
    Output.updateUnitInfo(unit);
    Game.select(unit);
  },

  select: function(clickable_object) {
    if (clickable_object === undefined) return;

    if (Game.selected) {
      var old_select = Game.selected;
      Game.deselect();
    }
    Game.selected = clickable_object;
    if (Game.selected.side == Game.turn) Game.player_selected[Game.turn] = clickable_object;
    Game.select_highlight = Entity.create('Selected');
    if (!Game.selected.at) return;
    var spot = Game.selected.at();
    Game.select_highlight.at(spot.x, spot.y);

    if (Game.selected.select) {
      Game.selected.select();
      if (Game.selected.has('Unit')) {
        Game.selected.pushToTop();
      }
    } else {
      throw "NotImplementedError: select() for {0}".format(Game.selected.type);
    }
  },

  nextTurn: function() {
    if (Game.type == Game.types.ONLINE) {
      Game.nextTurnOnline()
    } else if (Game.type == Game.types.HOTSEAT) {
      Game.nextTurn();
    } else {
      throw new Error(
        'NotImplementedError',
        'Game type {0} has no nextTurn function.'.format(Game.type));
    }
  },

  testAction: function(test1, test2, test3) {
    console.log("test1");
    console.log(test1);
    console.log("test2");
    console.log(test2);
    console.log("test3");
    console.log(test3);
  },

  /*
   * @debug
   * This function is used for determining which tiles need to be re-rendered.
   */
  debugTerrain: function() {
    var entities = Entity.get("Terrain");
    var total = 0;
    for (var i in entities) {
      var entity = entities[i];
      if (entity._changed) {
        if (entity.type == 'Water') {
          total += 1;
        }
      }
    }
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Action;
} else {
  window.Action = Action;
}

