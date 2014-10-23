
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

  leftClick: function(object, selected) {
    console.log("arguments");
    console.log(arguments);
    if (!selected || selected != object) {
      Game.select(object);
    } else {
      Game.deselect();
    }
  },

  rightClick: function() {
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

