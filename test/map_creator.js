
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

});
