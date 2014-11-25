
var assert = require("assert");

Crafty = {};
Crafty.c = function() {
  return true;
};

Entity = {};
Entity.get = function(name) {
  return [];
};

var Unit = require("../public/src/components/unit");
//var Crafty = require("../public/crafty");
//var Game = require("../public/game");

describe('Unit', function() {

  beforeEach(function() {
    Game = {};

    Entity = {};
    Entity.get = function(name) {
      return [];
    };
  });

  describe('#flushCaches()', function() {

    it('should empty relevant cache objects', function() {
      Unit.units_by_side = { test: 'test' };
      Unit.visible_enemy_units = { test: 'test' };
      Unit.flushCaches();

      assert.equal(Unit.units_by_side.test, undefined);
      assert.equal(Unit.visible_enemy_units.test, undefined);
    });

  });

  describe('#getUnitsBySide()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Unit.getUnitsBySide();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Unit.getUnitsBySide('some side');
      });
    });

    it('should categorize all units as enemy if given a weird side value', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0 },
            { side: 1 },
            { side: undefined },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getUnitsBySide('myside');
      assert.equal(units.friendly.length, 0);
      assert.equal(units.enemy.length, 3);
    });
    
    it('should categorize units into friendly and enemy if given a valid side', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'side0unit' },
            { side: 1 },
            { side: 1 },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getUnitsBySide(0);
      assert.equal(units.friendly.length, 1);
      assert.equal(units.friendly[0].name, 'side0unit');
      assert.equal(units.enemy.length, 2);
    });

  });

  describe('#getFriendlyUnits()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Unit.getFriendlyUnits();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Unit.getFriendlyUnits('some side');
      });
    });

    it('should return an empty list if given a weird side value', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0 },
            { side: 1 },
            { side: undefined },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getFriendlyUnits('myside');
      assert.equal(units.length, 0);
    });
    
    it('should return friendly units if given a valid side', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'side0unit' },
            { side: 1 },
            { side: 1 },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getFriendlyUnits(0);
      assert.equal(units.length, 1);
      assert.equal(units[0].name, 'side0unit');
    });

  });

  describe('#getEnemyUnits()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Unit.getEnemyUnits();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Unit.getEnemyUnits('some side');
      });
    });

    it('should return all units if given a weird side value', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0 },
            { side: 1 },
            { side: undefined },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getEnemyUnits('myside');
      assert.equal(units.length, 3);
    });
    
    it('should return enemy units if given a valid side', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'side0unit' },
            { side: 1, name: 'side1unit0' },
            { side: 1, name: 'side1unit1' },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getEnemyUnits(0);
      assert.equal(units.length, 2);
      assert.equal(units[0].name, 'side1unit0');
      assert.equal(units[1].name, 'side1unit1');
    });

  });

  describe('#getAllUnits()', function() {

    it('should return all units', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0 },
            { side: 1 },
            { side: undefined },
          ];
          return units;
        }
        return [];
      };

      var units = Unit.getAllUnits();
      assert.equal(units.length, 3);
    });

    it('should return empty list if there are no units', function() {
      var units = Unit.getAllUnits();
      assert.equal(units.length, 0);
    });

  });

  describe('#getUnitById()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Unit.getUnitById();
      });
    });

    it('should return undefined if no units match that id', function() {
      var unit = Unit.getUnitById('non-existant id');
      assert.equal(unit, undefined);
    });

    it('should return only the first unit if two have the same id (should never happen)', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, id: 'id0', name: 'name0' },
            { side: 0, id: 'id0', name: 'name1' },
            { side: 1 },
            { side: undefined, id: 'id1' },
          ];
          return units;
        }
        return [];
      };

      var unit = Unit.getUnitById('id0');
      assert.equal(unit.name, 'name0');
    });

  });

});
