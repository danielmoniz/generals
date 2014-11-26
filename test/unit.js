
var assert = require("assert");

Crafty = {};
Crafty.c = function() {
  return true;
};

Entity = {};
Entity.get = function(name) {
  return [];
};

var Units = require("../public/src/components/unit");
//var Crafty = require("../public/crafty");
//var Game = require("../public/game");

describe('Units', function() {

  beforeEach(function() {
    Game = {};

    Entity = {};
    Entity.get = function(name) {
      return [];
    };
  });

  describe('#flushCaches()', function() {

    it('should empty relevant cache objects', function() {
      Units.units_by_side = { test: 'test' };
      Units.visible_enemy_units = { test: 'test' };
      Units.flushCaches();

      assert.equal(Units.units_by_side.test, undefined);
      assert.equal(Units.visible_enemy_units.test, undefined);
    });

  });

  describe('#getUnitsBySide()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Units.getUnitsBySide();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Units.getUnitsBySide('some side');
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

      var units = Units.getUnitsBySide('myside');
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

      var units = Units.getUnitsBySide(0);
      assert.equal(units.friendly.length, 1);
      assert.equal(units.friendly[0].name, 'side0unit');
      assert.equal(units.enemy.length, 2);
    });

  });

  describe('#getFriendlyUnits()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Units.getFriendlyUnits();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Units.getFriendlyUnits('some side');
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

      var units = Units.getFriendlyUnits('myside');
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

      var units = Units.getFriendlyUnits(0);
      assert.equal(units.length, 1);
      assert.equal(units[0].name, 'side0unit');
    });

  });

  describe('#getEnemyUnits()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Units.getEnemyUnits();
      });
    });

    it('should not error if no units are returned', function() {
      assert.doesNotThrow(function() {
        Units.getEnemyUnits('some side');
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

      var units = Units.getEnemyUnits('myside');
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

      var units = Units.getEnemyUnits(0);
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

      var units = Units.getAllUnits();
      assert.equal(units.length, 3);
    });

    it('should return empty list if there are no units', function() {
      var units = Units.getAllUnits();
      assert.equal(units.length, 0);
    });

  });

  describe('#getUnitById()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Units.getUnitById();
      });
    });

    it('should return undefined if no units match that id', function() {
      var unit = Units.getUnitById('non-existant id');
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

      var unit = Units.getUnitById('id0');
      assert.equal(unit.name, 'name0');
    });

  });

  describe('#getVisibleEnemyUnits()', function() {

    it('should error if no side parameter is provided', function() {
      assert.throws(function() {
        Units.getVisibleEnemyUnits();
      });
    });

    it('should return only visible enemy units', function() {
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'name0', visible: false, },
            { side: 0, name: 'name1' },
            { side: 0, name: 'name2', visible: true, },
            { side: 0, name: 'name3', visible: true, },
            { side: 1 },
            { side: undefined, id: 'id1' },
          ];
          return units;
        }
        return [];
      };

      var units = Units.getVisibleEnemyUnits(1);
      assert.equal(units.length, 2);
      assert.equal(units[0].name, 'name2');
      assert.equal(units[1].name, 'name3');
    });

    it('should not cache results if queried on different turns', function() {
      // first query
      Game.turn = 7;
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'name0', visible: false, },
            { side: 0, name: 'name1' },
            { side: 0, name: 'name2', visible: true, },
            { side: 0, name: 'name3', visible: true, },
            { side: 1 },
            { side: undefined, id: 'id1' },
          ];
          return units;
        }
        return [];
      };

      var units = Units.getVisibleEnemyUnits(1);
      assert.equal(units.length, 2);

      // second query
      Game.turn = 7.5;
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'name0', visible: false, },
            { side: 0, name: 'name1' },
            { side: 0, name: 'name2', visible: true, },
            { side: 1 },
            { side: undefined, id: 'id1' },
          ];
          return units;
        }
        return [];
      };

      var units = Units.getVisibleEnemyUnits(1);
      assert.equal(units.length, 1);
    });

    it('should cache results if queried on same turn', function() {
      // first query
      Game.turn = 7;
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'name2', visible: true, },
            { side: 0, name: 'name3', visible: true, },
          ];
          return units;
        }
        return [];
      };

      var units = Units.getVisibleEnemyUnits(1);
      assert.equal(units.length, 2);

      // second query
      Entity.get = function(name) {
        if (name == 'Unit') {
          var units = [
            { side: 0, name: 'name2', visible: true, },
          ];
          return units;
        }
        return [];
      };

      var units = Units.getVisibleEnemyUnits(1);
      assert.equal(units.length, 2); // unchanged value
    });

  });

});
