
var assert = require("assert");

var Utility = require("../public/src/utility");

describe('Utility', function() {

  describe('#getPointsWithinDistance()', function() {

    it('should throw error if distance is less than 0', function() {
      var start = { x: 15, y: 5 };
      var distance = -5;
      assert.throws(function() {
        var points = Utility.getPointsWithinDistance(start, distance);
      });
    });

    it('should return zero spaces if distance is 0', function() {
      var start = { x: 15, y: 5 };
      var distance = 0;
      var points = Utility.getPointsWithinDistance(start, distance);
      assert.equal(points.length, 0);
    });

    it('should return 4 spaces if distance is 1', function() {
      var start = { x: 15, y: 5 };
      var distance = 1;
      var points = Utility.getPointsWithinDistance(start, distance);
      assert.equal(points.length, 4);
    });

    it('should return 2 spaces if distance is 1, and corner and map_grid are specified', function() {
      var start = { x: 0, y: 0 };
      var distance = 1;
      var map_grid = { width: 10, height: 10 };
      var points = Utility.getPointsWithinDistance(start, distance, map_grid);
      assert.equal(points.length, 2);
    });

    it('should throw error if strings are passed as coordinate values', function() {
      var start = { x: 'james', y: 'doug' };
      var distance = 1;
      assert.throws(function() {
        var points = Utility.getPointsWithinDistance(start, distance);
      });
    });

    it('should return 24 spaces if distance is 3', function() {
      var start = { x: 15, y: 5 };
      var distance = 3;
      var points = Utility.getPointsWithinDistance(start, distance);
      assert.equal(points.length, 24);
      for (var i in points) {
        assert(Utility.getDistance(start, points[i]) <= 3);
      }
    });

  });

  describe('#getRingAtDistance()', function() {

    it('should throw error if distance is less than 0', function() {
      var start = { x: 15, y: 5 };
      var distance = -5;
      assert.throws(function() {
        var points = Utility.getRingAtDistance(start, distance);
      });
    });

    it('should return an empty list if distance is less than 1 (and > 0)', function() {
      var start = { x: 15, y: 5 };
      var distance = 0.99;
      var points = Utility.getRingAtDistance(start, distance);
      assert.equal(points.length, 0);

      var distance = 0;
      var points = Utility.getRingAtDistance(start, distance);
      assert.equal(points.length, 0);
    });

    it('should return adjacent points if distance is 1', function() {
      var start = { x: 15, y: 5 };
      var distance = 1;
      var points = Utility.getRingAtDistance(start, distance);

      assert.equal(points.length, 4);
      for (var i in points) {
        assert.equal(Utility.getDistance(start, points[i]), 1);
      }
    });

    it('should return ring of points of 1 < distance <= 2 if distance is 2', function() {
      var start = { x: 15, y: 5 };
      var distance = 2;
      var points = Utility.getRingAtDistance(start, distance);

      assert.equal(points.length, 8);
      for (var i in points) {
        var x_diff = Math.abs(points[i].x - start.x);
        var y_diff = Math.abs(points[i].y - start.y);
        assert.equal(x_diff + y_diff, distance);
      }
    });

    it('should return ring of points of 7 < distance <= 8 if distance is 8', function() {
      var start = { x: 15, y: 10 };
      var distance = 8;
      var points = Utility.getRingAtDistance(start, distance);

      assert.equal(points.length, 32);
      for (var i in points) {
        var x_diff = Math.abs(points[i].x - start.x);
        var y_diff = Math.abs(points[i].y - start.y);
        assert.equal(x_diff + y_diff, distance);
      }
    });

  });

  describe('#getLineBetweenPoints()', function() {

    it('should return empty list if end-points are the same', function() {
      var start = { x: 15, y: 5 };
      var end = { x: 15, y: 5 };
      var points = Utility.getLineBetweenPoints(start, end);

      assert.equal(points.length, 0);
    });

    it('should return empty list if end-points are adjacent', function() {
      var start = { x: 15, y: 5 };
      var end = { x: 15, y: 4 };
      var points = Utility.getLineBetweenPoints(start, end);

      assert.equal(points.length, 0);

      var start = { x: 15, y: 5 };
      var end = { x: 15, y: 6 };
      var points = Utility.getLineBetweenPoints(start, end);

      assert.equal(points.length, 0);

      var start = { x: 15, y: 5 };
      var end = { x: 14, y: 5 };
      var points = Utility.getLineBetweenPoints(start, end);

      assert.equal(points.length, 0);

      var start = { x: 15, y: 5 };
      var end = { x: 16, y: 5 };
      var points = Utility.getLineBetweenPoints(start, end);

      assert.equal(points.length, 0);
    });

    it('should return squares between the end-points if on same axis', function() {
      var start = { x: 15, y: 5 };
      var end = { x: 15, y: 10 };
      var points = Utility.getLineBetweenPoints(start, end);
      assert.equal(points.length, 4);
      // test first and last points only
      assert.equal(points[0].y, start.y + 1);
      assert.equal(points[points.length - 1].y, end.y - 1);

      var start = { x: 15, y: 5 };
      var end = { x: 25, y: 5 };
      var points = Utility.getLineBetweenPoints(start, end);
      assert.equal(points.length, 9);
      // test first and last points only
      assert.equal(points[0].x, start.x + 1);
      assert.equal(points[points.length - 1].x, end.x - 1);
    });

    it('should return squares between the end-points if on diagonal', function() {
      var start = { x: 15, y: 5 };
      var end = { x: 18, y: 8 };
      var points = Utility.getLineBetweenPoints(start, end);
      assert.equal(points.length, 2);
      // test first and last points only
      assert.equal(points[0].x, start.x + 1);
      assert.equal(points[0].y, start.y + 1);
      assert.equal(points[points.length - 1].x, end.x - 1);
      assert.equal(points[points.length - 1].y, end.y - 1);

      var start = { x: 15, y: 5 };
      var end = { x: 18, y: 2 };
      var points = Utility.getLineBetweenPoints(start, end);
      assert.equal(points.length, 2);
      // test first and last points only
      assert.equal(points[0].x, start.x + 1);
      assert.equal(points[0].y, start.y - 1);
      assert.equal(points[points.length - 1].x, end.x - 1);
      assert.equal(points[points.length - 1].y, end.y + 1);
    });

    it('should return squares between the end-points if on irregular diagonal', function() {
      var start = { x: 15, y: 5 };
      var end = { x: 19, y: 6 };
      var points = Utility.getLineBetweenPoints(start, end);
      assert.equal(points.length, 3);
      // test first and last points only
      assert.equal(points[0].x, start.x + 1);
      assert.equal(points[0].y, start.y); // 0.25 should be rounded down

      assert.equal(points[1].x, start.x + 2);
      assert.equal(points[1].y, start.y + 1); // 0.5 should be rounded up

      assert.equal(points[2].x, start.x + 3);
      assert.equal(points[2].y, start.y + 1); // 0.75 should be rounded up
    });

  });

  describe('#removeDuplicatePoints()', function() {

    it('should return empty list if input is empty', function() {
      var points = [
      ];
      Utility.removeDuplicatePoints(points);

      assert.equal(points.length, 0);
    });

    it('should return the same list if input has no duplicates', function() {
      var points = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      Utility.removeDuplicatePoints(points);

      assert.equal(points.length, 2);
    });

    it('should return smaller list if input has one duplicate', function() {
      var points = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];
      Utility.removeDuplicatePoints(points);

      assert.equal(points.length, 1);
    });

    it('should remove multiple duplicates of the same item', function() {
      var points = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      Utility.removeDuplicatePoints(points);

      assert.equal(points.length, 2);
    });

    it('should remove multiple duplicates of different items', function() {
      var points = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
      ];
      Utility.removeDuplicatePoints(points);

      assert.equal(points.length, 2);
    });

  });

  describe('#removeDuplicates()', function() {

    it('should not modify list if input is empty', function() {
      var list = [
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 0);
      assert.equal(Object.keys(duplicates).length, 0);
    });

    it('should not modify list if input has one item', function() {
      var list = [
        'unique',
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 1);
      assert.equal(Object.keys(duplicates).length, 0);
    });

    it('should not modify list if input has no duplicates', function() {
      var list = [
        'unique',
        'unique2',
        'unique3',
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 3);
      assert.equal(Object.keys(duplicates).length, 0);
    });

    it('should create smaller list if input has one duplicate', function() {
      var list = [
        'unique',
        'word',
        'word',
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 2);
      assert.equal(Object.keys(duplicates).length, 1);
      assert.equal(duplicates['word'], 1);
    });

    it('should remove multiple duplicates of the same word', function() {
      var list = [
        'unique',
        'word',
        'word',
        'word',
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 2);
      assert.equal(Object.keys(duplicates).length, 1);
      assert.equal(duplicates['word'], 2);
    });

    it('should remove multiple duplicates from different words', function() {
      var list = [
        'word1',
        'word2',
        'word1',
        'word2',
        'word1',
        'word2',
      ];
      var duplicates = Utility.removeDuplicates(list);

      assert.equal(list.length, 2);
      assert.equal(Object.keys(duplicates).length, 2);
      assert.equal(duplicates['word1'], 2);
      assert.equal(duplicates['word2'], 2);
    });

  });

});
