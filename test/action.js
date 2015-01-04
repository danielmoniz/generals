
var assert = require("assert");

var Action = require("../public/src/action");
var oldPreAction = Action.preAction;
var oldPostAction = Action.postAction;

describe('Action', function() {

  describe('#perform()', function() {

    beforeEach(function() {

      Crafty = {};
      Crafty.trigger = function(event) { return event };

      //Action.testAction = function() { return true; };
    });

    afterEach(function() {

      Action.preAction = oldPreAction;
      Action.postAction = oldPostAction;
      delete Action.temporaryTestAction;
    });

    it('should throw error when given a non-existant action', function() {
      var action = 'do_something_impossible';
      assert.throws(function() {
        Action.perform(action);
      }, 'ActionDoesNotExist');
    });

    it('should determine correct function to call based on action name', function() {
      var action = 'temporary_test_action';
      Action.temporaryTestAction = function() {
      };

      assert.doesNotThrow(function() {
        Action.perform(action);
      });
    });

    it('should throw error when given action name with capital letters', function() {
      var action = 'Temporary_test_action';
      Action.temporaryTestAction = function() {
      };

      assert.throws(function() {
        Action.perform(action);
      }, 'BadActionName');

      var action = 'temporary_test_acTion';
      Action.temporaryTestAction = function() {
      };

      assert.throws(function() {
        Action.perform(action);
      }, 'BadActionName');
    });

    it('should send all parameters except action to the action function', function() {
      var action = 'temporary_test_action';
      Action.temporaryTestAction = function() {
        if (arguments[0] !== 'arg0' || arguments[1] !== 'arg1') {
          throw new Error('NotPassingArguments');
        }
      };
      assert.doesNotThrow(function() {
        Action.perform(action, 'arg0', 'arg1');
      });
    });

    it('should call preAction before action and postAction afterward', function() {
      var action = 'temporary_test_action';
      preActionCalled = 0;
      postActionCalled = 0;
      Action.temporaryTestAction = function() {
      };
      Action.preAction = function() {
        preActionCalled += 1;
      };
      Action.postAction = function() {
        postActionCalled += 1;
      };

      Action.perform(action, 'arg0', 'arg1');
      assert.equal(preActionCalled, 1);
      assert.equal(postActionCalled, 1);
    });

    it('should trigger RenderScene event after action is called', function() {
      var action = 'temporary_test_action';
      Crafty = {};
      eventsTriggered = [];
      Crafty.trigger = function(event) {
        eventsTriggered.push(event);
      };
      Action.temporaryTestAction = function() {
        assert.equal(eventsTriggered.length, 0);
      };

      Action.perform(action);
      assert.equal(eventsTriggered.length, 1);
      assert.equal(eventsTriggered[0], 'RenderScene');
    });

  });

});
