
var assert = require("assert");

var Pathing = require("../public/src/pathing");

describe('Pathing', function() {

  describe('#getPathList()', function() {

    it('should return an empty list if given an empty path list', function() {
      var path = [
      ];
      var path_list = Pathing.getPathList(path);
      assert.equal(path_list.length, 0);


      var path = [
        { x: 1, y: 2 },
      ];
    });

    it('should error if given a list including undefined', function() {
      var path = [
        { x: 1, y: 2 },
        undefined,
        { x: 2, y: 3 },
      ];
      assert.throws(function(error) {
        var path_list = Pathing.getPathList(path);
      });
    });

    it('should return list of undefined coordinates if nodes are other objects', function() {
      var path = [
        6,
        false,
        'test',
      ];
      var path_list = Pathing.getPathList(path);
      assert.equal(path_list[0].x, undefined);
      assert.equal(path_list[0].y, undefined);
      assert.equal(path_list[1].x, undefined);
      assert.equal(path_list[1].y, undefined);
      assert.equal(path_list[2].x, undefined);
      assert.equal(path_list[2].y, undefined);
    });

    it('should return list of undefined coordinates if x and y properties not present in nodes', function() {
      var path = [
        {},
        { x: 1 },
        { y: 2 },
      ];
      var path_list = Pathing.getPathList(path);
      assert.equal(path_list.length, 3);

      assert.equal(path_list[0].x, undefined);
      assert.equal(path_list[0].y, undefined);
      assert.equal(path_list[1].x, 1);
      assert.equal(path_list[1].y, undefined);
      assert.equal(path_list[2].x, undefined);
      assert.equal(path_list[2].y, 2);
    });

  });

  describe('#getPathFromPathList()', function() {

    it('should return undefined if given an empty or undefined path list', function() {
      var graph = { grid: [] };
      var path_list = [
      ];
      var path = Pathing.getPathFromPathList(graph, path_list);
      assert.equal(path, undefined);

      var path_list = undefined;
      var path = Pathing.getPathFromPathList(graph, path_list);
      assert.equal(path, undefined);
    });

    it('should throw error if graph does not contain a relevant coordinate', function() {
      var graph = { grid: [] };
      var path_list = [
        { x: 1, y: 2},
      ];
      assert.throws(function(error) {
        var path = Pathing.getPathFromPathList(graph, path_list);
      });
    });

    it('should return list with grid item given a path with coordinates', function() {
      var graph = { grid: {
        1: { 2: 'grid item' },
      } };
      var path_list = [
        { x: 1, y: 2},
      ];
      var path = Pathing.getPathFromPathList(graph, path_list);
      assert.equal(path.length, 1);
      assert.equal(path[0], 'grid item');
    });

    it('should return list with multiple grid items given a path with coordinates', function() {
      var graph = { grid: {
        1: { 2: 'grid item 1', 3: 'grid item 2' },
        2: { 3: 'grid item 3' },
        '-1': { 8: 'grid item 4' },
      } };
      var path_list = [
        { x: 1, y: 2},
        { x: 1, y: 3},
        { x: 2, y: 3},
        { x: -1, y: 8},
      ];
      var path = Pathing.getPathFromPathList(graph, path_list);
      assert.equal(path.length, 4);

      assert.equal(path[0], 'grid item 1');
      assert.equal(path[1], 'grid item 2');
      assert.equal(path[2], 'grid item 3');
      assert.equal(path[3], 'grid item 4');
    });

  });

});
