
if (typeof require !== 'undefined') {
  Utility = require("./utility");
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
      console.log("function_name");
      console.log(function_name);
      throw new Error('ActionDoesNotExist', 'Relevant action function does not exist for {0}'.format(function_name));
    }
  },

  /*
   * Perform certain tasks before every user action.
   */
  preAction: function() {
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
    LineOfSight.unitLineOfSight(Game.player);
  },

  toggleEnemyMovement: function(name) {
    this.toggleOption(name);
    EnemyMoves.displayEnemyMoves(Game.player, Game.turn);
  },

  leftClick: function(entity, selected) {
    if (!selected || selected != entity) {
      Game.select(entity);
    } else {
      Game.deselect();
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
    if (action == "pillage") {
      unit.pillage();
      Victory.updateWillToFight();
      Output.updateVictoryBar();
    } else if (action == "sack") {
      unit.pillage();
      Victory.updateWillToFight();
      Output.updateVictoryBar();
    } else if (action == "start_fire") {
      var local_terrain = Game.terrain[unit.at().x][unit.at().y];
      local_terrain.ignite();
    } else if (action == "siege") {
      unit.siege();
    } else {
      throw new Error('InvalidAction');
    }

    unit.actionPerformed(action);

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
    if (Game.selected) Game.deselect();
    Game.selected = clickable_object;
    if (Game.selected.side == Game.turn) Game.player_selected[Game.turn] = clickable_object;
    Game.select_highlight = Entity.create('Selected');
    if (!Game.selected.at) return;
    var spot = Game.selected.at();
    Game.select_highlight.at(spot.x, spot.y);

    if (Game.selected.select) {
      Game.selected.select();
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

