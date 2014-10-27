
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

    var action_words = action.split(' ');
    var function_name = "";
    for (var i in action_words) {
      if (i == 0) {
        function_name += action_words[i];
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
  },

  /*
   * Perform certain tasks after every user action.
   * Eg. the scene should always be redrawn after actions.
   */
  postAction: function() {
    Crafty.trigger('RenderScene');
  },

  // Action functions ----------------------------

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
    }

    unit.performed_actions.push(action);
    Crafty.trigger("UpdateActionChoices", unit.at());
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

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Action;
} else {
  window.Action = Action;
}

