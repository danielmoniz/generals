
var assert = require("assert");

var RetreatConstraints = require("../public/src/retreat_constraints");

describe('RetreatConstraints', function() {

  var relative_top = { x: 1, y: 0 };
  var relative_right = { x: 2, y: 1 };
  var relative_bottom = { x: 1, y: 2 };
  var relative_left = { x: 0, y: 1 };

  var top = { x: 10, y: 4 };
  var right = { x: 11, y: 5 };
  var bottom = { x: 10, y: 6 };
  var left = { x: 9, y: 5 };

  var point = { x: 10, y: 5 };

  describe('#setAdjacentSpaces()', function() {

    it('should initialize all adjacent spaces to 0 and corners to 1', function() {
      var retreat_constraints = new RetreatConstraints(point);
      var area = retreat_constraints.setAdjacentSpaces({ x: 0, y: 0 });
      assert.equal(area[0][1], 0);
      assert.equal(area[1][0], 0);
      assert.equal(area[1][2], 0);
      assert.equal(area[2][1], 0);

      testAreaCornersAndCentre(area);
    });

  });

  describe('#setAttacker()', function() {

    it('should set attacker constraints s.t they can only retreat to where they came', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setAttacker(top);
      var area = retreat_constraints.area;

      testTop(area, 1);
      testRight(area, 0);
      testBottom(area, 0);
      testLeft(area, 0);

      testAreaCornersAndCentre(area);
    });

  });

  describe('#setDefender()', function() {

    it('should set defender constraints s.t they can retreat everywhere except attacking direction', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setDefender(top);
      var area = retreat_constraints.area;

      testTop(area, 0);
      testRight(area, 1);
      testBottom(area, 1);
      testLeft(area, 1);

      testAreaCornersAndCentre(area);
    });

  });

  describe('#setSide()', function() {

    it('should correctly set the area array given attacker', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('attacker', left);
      var area = retreat_constraints.area;
      
      assert.equal(retreat_constraints.side, 'attacker');
      testLeft(area, 1);
      testTop(area, 0);
      testBottom(area, 0);
      testRight(area, 0);
    });

    it('should correctly set the area array given defender', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('defender', left);
      var area = retreat_constraints.area;
      
      assert.equal(retreat_constraints.side, 'defender');
      testLeft(area, 0);
      testTop(area, 1);
      testBottom(area, 1);
      testRight(area, 1);
    });

  });

  describe('#addUnit()', function() {

    it('should disallow attacker retreats when new defenders join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('attacker', bottom);
      var area = retreat_constraints.area;

      testBottom(area, 1);
      retreat_constraints.addUnit('defender', bottom);
      testBottom(area, 0);

      testLeft(area, 0);
      testTop(area, 0);
      testRight(area, 0);

    });

    it('should allow attacker retreats when new attackers join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('attacker', right);
      var area = retreat_constraints.area;

      testRight(area, 1);

      testLeft(area, 0);
      retreat_constraints.addUnit('attacker', left);
      testLeft(area, 1);

      testBottom(area, 0);
      retreat_constraints.addUnit('attacker', bottom);
      testBottom(area, 1);

      testTop(area, 0);
      retreat_constraints.addUnit('attacker', top);
      testTop(area, 1);
    });

    it('should update attacker retreats when new units join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('attacker', right);
      var area = retreat_constraints.area;

      testRight(area, 1);

      testLeft(area, 0);
      retreat_constraints.addUnit('defender', left);
      testLeft(area, 0);

      testRight(area, 1);
      retreat_constraints.addUnit('attacker', right);
      testRight(area, 1);

      testRight(area, 1);
      retreat_constraints.addUnit('defender', right);
      testRight(area, 0);

      testRight(area, 0);
      retreat_constraints.addUnit('attacker', right);
      testRight(area, 1);
    });

    it('should disallow defender retreats when new attackers join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('defender', top);
      var area = retreat_constraints.area;

      testTop(area, 0);
      retreat_constraints.addUnit('attacker', top);
      testTop(area, 0);

      testLeft(area, 1);
      testBottom(area, 1);
      testRight(area, 1);

      testRight(area, 1);
      retreat_constraints.addUnit('attacker', right);
      testRight(area, 0);

      testBottom(area, 1);
      retreat_constraints.addUnit('attacker', bottom);
      testBottom(area, 0);

      testLeft(area, 1);
      retreat_constraints.addUnit('attacker', left);
      testLeft(area, 0);

    });

    it('should allow defender retreats when new defenders join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('defender', right);
      var area = retreat_constraints.area;

      testRight(area, 0);
      testLeft(area, 1);
      testBottom(area, 1);
      testTop(area, 1);

      testRight(area, 0);
      retreat_constraints.addUnit('defender', right);
      testRight(area, 1);
    });

    it('should update defender retreat constraints when new units join', function() {
      var retreat_constraints = new RetreatConstraints(point);
      retreat_constraints.setSide('defender', right);
      var area = retreat_constraints.area;

      testRight(area, 0);
      retreat_constraints.addUnit('defender', right);
      testRight(area, 1);

      testRight(area, 1);
      retreat_constraints.addUnit('attacker', right);
      testRight(area, 0);

      testRight(area, 0);
      retreat_constraints.addUnit('defender', right);
      testRight(area, 1);

      testLeft(area, 1);
      retreat_constraints.addUnit('defender', left);
      testLeft(area, 1);

      testLeft(area, 1);
      retreat_constraints.addUnit('attacker', left);
      testLeft(area, 0);
    });

  });

  describe("#getArrayDirection()", function() {

    it('should return the correct relative direction when given an adjacent location', function() {
      var location = { x: 24, y: 20 };
      var retreat_constraints = new RetreatConstraints(location);

      var tile = { x: 24, y: 19 };
      var direction = retreat_constraints.getArrayDirection(tile);
      assert.equal(direction.x, 1);
      assert.equal(direction.y, 0);

      var tile = { x: 24, y: 21 };
      var direction = retreat_constraints.getArrayDirection(tile);
      assert.equal(direction.x, 1);
      assert.equal(direction.y, 2);

      var tile = { x: 23, y: 20 };
      var direction = retreat_constraints.getArrayDirection(tile);
      assert.equal(direction.x, 0);
      assert.equal(direction.y, 1);

      var tile = { x: 25, y: 20 };
      var direction = retreat_constraints.getArrayDirection(tile);
      assert.equal(direction.x, 2);
      assert.equal(direction.y, 1);
    });

    it('should throw an BadLocation error when given a location that is too far away', function() {
      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      //var direction_ftn = retreat_constraints.getArrayDirection;

      var tile = { x: 14, y: 6 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile);
      }, "BadDirection");

      var tile = { x: 14, y: 8 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile);
      }, "BadDirection");

      var tile = { x: 16, y: 6 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile);
      }, "BadDirection");

      var tile = { x: 16, y: 8 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile);
      }, "BadDirection");

      var tile = { x: 12, y: 65 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile);
      }, "BadDirection");
    });

    it('should throw an BadLocation error when given a location that is too far away', function() {
      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);

      var tile = undefined;
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });

      var tile = 0;
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });

      var tile = undefined;
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });

      var tile = false;
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });

      var tile = { x: false, y: 7 };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });

      var tile = { x: 8, y: undefined };
      assert.throws(function() {
        retreat_constraints.getArrayDirection(tile), "BadDirection"
      });
    });
  });

  describe('#applyToArray()', function() {

    it('should update parameter array in the correct place', function() {
      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 15, y: 6 };
      retreat_constraints.setSide('attacker', direction);
      var array = getArrayOfConstant();

      retreat_constraints.applyToArray(array);

      assert.equal(array[15][6], 1);
      assert.equal(array[15][8], 0);
      assert.equal(array[14][7], 0);
      assert.equal(array[16][7], 0);

      // reset to 1's for easy test of rest of array
      array[15][8] = 1;
      array[14][7] = 1;
      array[16][7] = 1;

      // ensure rest of array is 1's
      for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 20; y++) {
          assert.equal(array[x][y], 1);
        }
      }

    });

    it('should update parameter array and not error for edges', function() {
      var location = { x: 0, y: 0 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 1, y: 0 }; // right
      retreat_constraints.setSide('attacker', direction);
      var array = getArrayOfConstant();

      retreat_constraints.applyToArray(array);

      assert.equal(array[1][0], 1);
      assert.equal(array[0][1], 0);

      // reset to 1's for easy test of rest of array
      array[1][0] = 1;
      array[0][1] = 1;

      // ensure rest of array is 1's
      for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 20; y++) {
          assert.equal(array[x][y], 1);
        }
      }

    });

    it('should not update parameter when values are 0 (impassable)', function() {
      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 15, y: 6 };
      retreat_constraints.setSide('attacker', direction);
      var array = getArrayOfConstant(0);

      retreat_constraints.applyToArray(array);

      // ensure rest of array is 0's
      for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 20; y++) {
          assert.equal(array[x][y], 0);
        }
      }

    });

    it('should update property of parameter array', function() {
      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 15, y: 6 };
      retreat_constraints.setSide('attacker', direction);
      var array = getArrayOfConstant();

      var array = [];
      for (var x = 0; x < 20; x++) {
        array[x] = [];
        for (var y = 0; y < 20; y++) {
          array[x][y] = { weight: 1 };
        }
      }

      retreat_constraints.applyToArray(array, 'weight');

      assert.equal(array[15][6].weight, 1);
      assert.equal(array[15][8].weight, 0);
      assert.equal(array[14][7].weight, 0);
      assert.equal(array[16][7].weight, 0);

      // reset to 1's for easy test of rest of array
      array[15][8].weight = 1;
      array[14][7].weight = 1;
      array[16][7].weight = 1;

      // ensure rest of array is 1's
      for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 20; y++) {
          assert.equal(array[x][y].weight, 1);
        }
      }

    });
  });

  describe('#isMoveTargetValid', function() {

    it('should disallow moves with 0 and allow moves with 1', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 15, y: 6 };
      retreat_constraints.setSide('attacker', direction);

      var move_target = { x: 15, y: 6 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, true);

      var move_target = { x: 15, y: 8 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

      var move_target = { x: 14, y: 7 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

      var move_target = { x: 16, y: 7 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

    });
  });

  describe('#convertToActual', function() {

    it('should convert a relative location to an absolute map position', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var direction = { x: 15, y: 6 };
      retreat_constraints.setSide('attacker', direction);

      var move_target = { x: 15, y: 6 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, true);

      var move_target = { x: 15, y: 8 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

      var move_target = { x: 14, y: 7 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

      var move_target = { x: 16, y: 7 };
      var is_valid = retreat_constraints.isMoveTargetValid(move_target);
      assert.equal(is_valid, false);

    });
  });

  describe('#relativeToCardinalDirection()', function() {

    it('should return correct direction if given a valid relative position', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      var dir = retreat_constraints.relativeToCardinalDirection(relative_top);
      assert.equal(dir, 'top');

      var dir = retreat_constraints.relativeToCardinalDirection(relative_right);
      assert.equal(dir, 'right');

      var dir = retreat_constraints.relativeToCardinalDirection(relative_bottom);
      assert.equal(dir, 'bottom');

      var dir = retreat_constraints.relativeToCardinalDirection(relative_left);
      assert.equal(dir, 'left');

    });

    it('should throw error if given corner (invalid) location', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 0, y: 0 });
      }, 'BadDirection');

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 0, y: 2 });
      }, 'BadDirection');

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 2, y: 0 });
      }, 'BadDirection');

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 2, y: 2 });
      }, 'BadDirection');

    });

    it('should throw error if given distant (invalid) location', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 5, y: 10 });
      }, 'BadDirection');

      assert.throws(function() {
        retreat_constraints.relativeToCardinalDirection({ x: 15, y: 7 });
      }, 'BadDirection');

    });

  });

  describe('#getAdjacentUnblockedSpaces()', function() {

    it('should return all adjacent spaces when there are no retreat blocks', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      retreat_constraints.setSide('defender', { x: 14, y: 7 });
      retreat_constraints.addUnit('defender', { x: 14, y: 7 });
      var unblocked = retreat_constraints.getAdjacentUnblockedSpaces();

      assert.equal(unblocked.length, 4);
      /*
      for (var i in unblocked) {
        assert.equal(unblock
      }
      */

    });

    it('should return no adjacent spaces when there are 4 retreat blocks', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      retreat_constraints.setSide('attacker', { x: 14, y: 7 });
      retreat_constraints.addUnit('defender', { x: 14, y: 7 });
      var unblocked = retreat_constraints.getAdjacentUnblockedSpaces();

      assert.equal(unblocked.length, 0);

    });

    it('should return adjacent spaces when there are some retreat blocks', function() {

      var location = { x: 15, y: 7 };
      var retreat_constraints = new RetreatConstraints(location);
      retreat_constraints.setSide('attacker', { x: 14, y: 7 });
      retreat_constraints.addUnit('attacker', { x: 16, y: 7 });
      var unblocked = retreat_constraints.getAdjacentUnblockedSpaces();

      assert.equal(unblocked.length, 2);
      // @TODO These tests are brittle/subject to order. Find a better way!
      var space = unblocked[0];
      assert.equal(space.x, 14);
      assert.equal(space.y, 7);

      var space = unblocked[1];
      assert.equal(space.x, 16);
      assert.equal(space.y, 7);

    });

  });

  function testAreaPosition(area, x, y, value) {
    assert.equal(area[x][y], value); // top
  }

  function testTop(area, value) {
    testAreaPosition(area, 1, 0, value);
  }

  function testRight(area, value) {
    testAreaPosition(area, 2, 1, value);
  }

  function testBottom(area, value) {
    testAreaPosition(area, 1, 2, value);
  }

  function testLeft(area, value) {
    testAreaPosition(area, 0, 1, value);
  }

  function testAreaCornersAndCentre(area) {
    assert.equal(area[0][0], 1);
    assert.equal(area[0][2], 1);
    assert.equal(area[1][1], 1);
    assert.equal(area[2][0], 1);
    assert.equal(area[2][2], 1);
  }

  function getArrayOfConstant(value) {
    if (value === undefined) value = 1;
    var array = [];
    for (var x = 0; x < 20; x++) {
      array[x] = [];
      for (var y = 0; y < 20; y++) {
        array[x][y] = value;
      }
    }
    return array;
  }

});
