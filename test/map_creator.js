
var assert = require("assert");

var MapCreator = require("../public/src/map_creator");

describe('MapCreator', function() {

  /*
   * NOTE: All tests are currently based on sections of width 3.
   * This is because the code assumes the same, as the math gets complicated
   * with >= 3. 2 sections should probably work, but it will need a refactor.
   */
  describe('#getWidthOfSections()', function() {

    function buildOptions(map_width, num_sections) {
      var options = {
        map_grid: { width: map_width, },
        num_sections: num_sections,
      };
      return options;
    }

    it('should create equal widths when map is evenly divisible', function() {
      var map_creator = new MapCreator();
      var map_width = 12;
      var num_sections = 3;
      var options = buildOptions(map_width, num_sections);

      var widths = map_creator.getWidthOfSections(options);

      assert.equal(widths.length, 3);
      for (var i in widths) {
        assert.equal(widths[i], 4);
      }
    });

    it('should create larger middle section when there is one extra tile in width', function() {
      var map_creator = new MapCreator();
      var map_width = 13;
      var num_sections = 3;
      var options = buildOptions(map_width, num_sections);

      var widths = map_creator.getWidthOfSections(options);

      assert.equal(widths.length, 3);
      assert.equal(widths[0], 4);
      assert.equal(widths[1], 5);
      assert.equal(widths[2], 4);
    });

    it('should create larger middle section when there are two extra tiles in width', function() {
      var map_creator = new MapCreator();
      var map_width = 14;
      var num_sections = 3;
      var options = buildOptions(map_width, num_sections);

      var widths = map_creator.getWidthOfSections(options);

      assert.equal(widths.length, 3);
      assert.equal(widths[0], 5);
      assert.equal(widths[1], 4);
      assert.equal(widths[2], 5);
    });

  });

  /*
   * NOTE: All tests are currently based on sections of width 3.
   * This is because the code assumes the same, as the math gets complicated
   * with >= 3. 2 sections should probably work, but it will need a refactor.
   */
  describe('#getPositionOfSections()', function() {

    function buildOptions(section_widths) {
      var options = {
        section_widths: section_widths,
      };
      return options;
    }

    it('should add up section widths correctly when widths are equal', function() {
      var map_creator = new MapCreator();
      var options = buildOptions([4, 4, 4]);

      var positions = map_creator.getPositionOfSections(options);

      assert.equal(positions.length, 3);
      assert.equal(positions[0], 4);
      assert.equal(positions[1], 8);
      assert.equal(positions[2], 12);
    });

    it('should add up section widths correctly when middle width is larger', function() {
      var map_creator = new MapCreator();
      var options = buildOptions([4, 5, 4]);

      var positions = map_creator.getPositionOfSections(options);

      assert.equal(positions.length, 3);
      assert.equal(positions[0], 4);
      assert.equal(positions[1], 9);
      assert.equal(positions[2], 13);
    });

    it('should add up section widths correctly when middle width is smaller', function() {
      var map_creator = new MapCreator();
      var options = buildOptions([5, 4, 5]);

      var positions = map_creator.getPositionOfSections(options);

      assert.equal(positions.length, 3);
      assert.equal(positions[0], 5);
      assert.equal(positions[1], 9);
      assert.equal(positions[2], 14);
    });

  });

  describe('#getMapSide()', function() {

    function buildOptions(positions) {
      var options = {
        section_positions: positions,
      };
      return options;
    }

    function testGetMapSide(options, x, side) {
      var map_side = map_creator.getMapSide(options, x);
      assert.equal(map_side, side);
    }

    it('should return 0, undefined, or 1 for map with three sections', function() {
      var map_creator = new MapCreator();
      var positions = [2, 5, 7];
      var options = buildOptions(positions);

      var side = 0;
      var map_side = map_creator.getMapSide(options, 0);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 1);
      assert.equal(map_side, side);

      var side = undefined;
      var map_side = map_creator.getMapSide(options, 2);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 3);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 4);
      assert.equal(map_side, side);

      var side = 1;
      var map_side = map_creator.getMapSide(options, 5);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 6);
      assert.equal(map_side, side);

    });

    it('should return 0 or 1 for map with two sections', function() {
      var map_creator = new MapCreator();
      var positions = [3, 6];
      var options = buildOptions(positions);

      var side = 0; // boundary condition
      var map_side = map_creator.getMapSide(options, -1);
      assert.equal(map_side, side);

      var side = 0;
      var map_side = map_creator.getMapSide(options, 0);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 1);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 2);
      assert.equal(map_side, side);

      var side = 1;
      var map_side = map_creator.getMapSide(options, 3);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 4);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 5);
      assert.equal(map_side, side);

      var side = 1; // boundary condition
      var map_side = map_creator.getMapSide(options, 6);
      assert.equal(map_side, side);

    });

    it('should return 0, undefined, or 1 for map with four sections', function() {
      var map_creator = new MapCreator();
      var positions = [2, 4, 6, 8];
      var options = buildOptions(positions);

      var side = 0;
      var map_side = map_creator.getMapSide(options, 0);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 1);
      assert.equal(map_side, side);

      var side = undefined;
      var map_side = map_creator.getMapSide(options, 2);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 3);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 4);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 5);
      assert.equal(map_side, side);

      var side = 1;
      var map_side = map_creator.getMapSide(options, 6);
      assert.equal(map_side, side);
      var map_side = map_creator.getMapSide(options, 7);
      assert.equal(map_side, side);

    });

  });

});
