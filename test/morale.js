
var assert = require("assert");

var Dissent = require("../public/src/dissent");

describe('Dissent', function() {

  function createUnit() {
    var unit = {};
    unit.happy = true;
    unit.dissent = 0;
    unit.dissent_degrade_factor = 1;
    unit.dissent_improve_factor = 1;
    unit.degradeDissent = function(degradation) {
    };
    unit.improveDissent = function(degradation) {
    };
    unit.reasons = [];
    unit.addDissentChangeReason = function(reason) {
    };
    return unit;
  }


  describe('#badReason()', function() {

    it('should error when provided any reason', function() {

      assert.throws(function() {
        Dissent.badReason();
      });

    });

  });

  describe('#calculateDissentFactor()', function() {

    beforeEach(function() {
      Game = {};
      Game.dissent_factor = 0.5;
    });

    afterEach(function() {
      delete Game;
    });

    it('should error when given NaN', function() {

      var dissent = NaN;
      assert.throws(function() {
        var dissent_factor = Dissent.calculateDissentFactor(dissent);
      });

      var dissent = undefined;
      assert.throws(function() {
        var dissent_factor = Dissent.calculateDissentFactor(dissent);
      });

      var dissent = 'test';
      assert.throws(function() {
        var dissent_factor = Dissent.calculateDissentFactor(dissent);
      });

      var dissent = {};
      assert.throws(function() {
        var dissent_factor = Dissent.calculateDissentFactor(dissent);
      });

    });

    it('should return 1 when given 0', function() {

      var dissent = 0;
      var dissent_factor = Dissent.calculateDissentFactor(dissent);
      assert.equal(dissent_factor, 1);

    });

    it('should match a power function', function() {
      Game.dissent_factor = 0.5; // test value

      for (var i=0; i<20; i++) {
        var dissent = Math.random() * 2;
        var dissent_factor = Dissent.calculateDissentFactor(dissent);
        var result = Math.pow(Game.dissent_factor, dissent);
        assert.equal(dissent_factor, result);
      }

      delete Game;
    });

  });

  describe('#calculateDissentPercentage()', function() {

    var oldCalculateDissentFactor = Dissent.calculateDissentFactor;
    var dissent_points_param = '3';

    beforeEach(function() {
      Dissent.calculateDissentFactor = function(dissent_points) {
        assert.equal(dissent_points, dissent_points_param);
        return 0.5;
      };
    });

    afterEach(function() {
      Dissent.calculateDissentFactor = oldCalculateDissentFactor;
    });

    it('should calculate a percentage given a fraction', function() {

      var percentage = Dissent.calculateDissentPercentage(dissent_points_param);
      assert.equal(percentage, 50);

    });

  });

  describe('#getStatus()', function() {

    var oldLevels = Dissent.levels;

    beforeEach(function() {
      Dissent.levels = {};
      for (var i=0; i<10; i++) {
        Dissent.levels[i] = i;
      }
    });

    afterEach(function() {
      Dissent.levels = oldLevels;
    });

    it('should error when given a negative number', function() {
      assert.throws(function() {
        var status = Dissent.getStatus(-1);
      });
    });

    it('should error when given a non-number', function() {
      assert.throws(function() {
        var status = Dissent.getStatus('test');
      });

      assert.throws(function() {
        var status = Dissent.getStatus(undefined);
      });
    });

    it('should round down to find nearest level', function() {
      var status = Dissent.getStatus(0.5);
      assert.equal(status, 0);

      var status = Dissent.getStatus(2.9);
      assert.equal(status, 2);

      var status = Dissent.getStatus(3.1);
      assert.equal(status, 3);
    });

    it('should round down to maximum level if given a large input', function() {
      var status = Dissent.getStatus(100);
      assert.equal(status, Object.keys(Dissent.levels).length - 1);
    });

  });

  describe('#degrade()', function() {

    var oldDissent = Dissent.levels;
    var oldValues = Dissent.values;
    var DISSENT_VALUE = 3;
    var DISSENT_VALUE_2 = 2;

    beforeEach(function() {
      Game = {};
      Game.dissent = true;
      Dissent.values = {
        degrade: {
          'test_reason': DISSENT_VALUE,
          'test_reason_2': DISSENT_VALUE_2,
        },
      };
    });

    afterEach(function() {
      delete Game;
      Dissent.values = oldValues;
    });

    it('should error when given an empty or undefined unit', function() {
      assert.throws(function() {
        var degradation = Dissent.degrade(undefined);
      });
      assert.throws(function() {
        var degradation = Dissent.degrade(false);
      });
    });

    it('should error if provided reason has no value or is undefined', function() {
      var unit = createUnit();
      unit.degradeDissent = function() {
        throw new Error('degradeDissent() Should not be called');
      };
      var reason = 'bad_reason';
      assert.throws(function() {
        var degradation = Dissent.degrade(unit, reason);
      });

      var reason = undefined;
      assert.throws(function() {
        var degradation = Dissent.degrade(unit, reason);
      });
    });

    it('should return 0 and leave dissent unchanged when Game.dissent is falsy', function() {
      Game.dissent = false;
      var unit = createUnit();
      unit.degradeDissent = function() {
        throw new Error('degradeDissent() Should not be called');
      };
      var degradation = Dissent.degrade(unit, 'test_reason');
      assert.equal(degradation, 0);
      delete Game.dissent;
    });

    it('should update unit dissent based on reason value and unit stats', function() {
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE);

      testUnit(createUnit(), 'test_reason_2', DISSENT_VALUE_2);

      var unit = createUnit();
      unit.dissent_degrade_factor = 1.5;
      testUnit(unit, 'test_reason', unit.dissent_degrade_factor * DISSENT_VALUE);

      // use same unit in order to test unit.dissent addition
      unit.dissent_degrade_factor = 1.2;
      testUnit(unit, 'test_reason_2', unit.dissent_degrade_factor * DISSENT_VALUE_2);

      var quantity = 2;
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE);
    });

    it('should update dissent based on quantity', function() {
      var quantity = undefined; // acts as quantity = 1
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE, quantity);

      var quantity = 1;
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE, quantity);

      var quantity = 50;
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE, quantity);

      var quantity = 0;
      testUnit(createUnit(), 'test_reason', 0, quantity);
    });

    function testUnit(unit, reason, dissent, quantity) {
      var previous_unit_dissent = unit.dissent;
      var degradation = Dissent.degrade(unit, reason, quantity);
      var new_dissent = dissent * quantity;
      if (quantity === undefined) new_dissent = dissent;
      assert.equal(degradation, new_dissent);
      return unit;
    }

  });

  describe('#improve()', function() {

    var oldDissent = Dissent.levels;
    var oldValues = Dissent.values;
    var DISSENT_VALUE = 3;
    var DISSENT_VALUE_2 = 2;

    beforeEach(function() {
      Game = {};
      Game.dissent = true;
      Dissent.values = {
        improve: {
          'test_reason': DISSENT_VALUE,
          'test_reason_2': DISSENT_VALUE_2,
        },
      };
    });

    afterEach(function() {
      delete Game;
      Dissent.values = oldValues;
    });

    it('should error when given an empty or undefined unit', function() {
      assert.throws(function() {
        var improvement = Dissent.improve(undefined);
      });
      assert.throws(function() {
        var improvement = Dissent.improve(false);
      });
    });

    it('should error if provided reason has no value or is undefined', function() {
      var unit = createUnit();
      unit.improveDissent = function() {
        throw new Error('improveDissent() Should not be called');
      };
      var reason = 'bad_reason';
      assert.throws(function() {
        var improvement = Dissent.improve(unit, reason);
      });

      var reason = undefined;
      assert.throws(function() {
        var improvement = Dissent.improve(unit, reason);
      });
    });

    it('should return 0 and leave dissent unchanged when Game.dissent is falsy', function() {
      Game.dissent = false;
      var unit = createUnit();
      unit.improveDissent = function() {
        throw new Error('improveDissent() Should not be called');
      };
      var improvement = Dissent.improve(unit, 'test_reason');
      assert.equal(improvement, 0);
      delete Game.dissent;
    });

    it('should update unit dissent based on reason value and unit stats', function() {
      testUnit(createUnit(), 'test_reason', DISSENT_VALUE);

      testUnit(createUnit(), 'test_reason_2', DISSENT_VALUE_2);

      var unit = createUnit();
      unit.dissent_improve_factor = 1.5;
      testUnit(unit, 'test_reason', unit.dissent_improve_factor * DISSENT_VALUE);

      // use same unit in order to test unit.dissent addition
      unit.dissent_improve_factor = 1.2;
      testUnit(unit, 'test_reason_2', unit.dissent_improve_factor * DISSENT_VALUE_2);

      testUnit(createUnit(), 'test_reason', DISSENT_VALUE);
    });

    function testUnit(unit, reason, dissent) {
      var previous_unit_dissent = unit.dissent;
      var improvement = Dissent.improve(unit, reason);
      assert.equal(improvement, -1 * dissent);
      return unit;
    }

  });

});
