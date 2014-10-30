
var assert = require("assert");

var Weather = require("../public/src/weather");
var Random = require("../public/src/weather");

describe('Weather', function() {

  function testWindDir(weather, x, y) {
    assert.equal(weather.wind_dir[0], x);
    assert.equal(weather.wind_dir[1], y);
  }

  function setNewWindDir(weather, x, y) {
    weather.getRandomWindDir = function() {
      return [x, y];
    };
    return weather.getRandomWindDir;
  }

  describe('#new Weather()', function() {

    it('should start wind_dir at neutral', function() {
      var weather = new Weather();
      testWindDir(weather, 0, 0);
    });

  });

  describe('#updateWind()', function() {

    beforeEach(function() {
    });

    afterEach(function() {
    });

    it('should update wind_dir the same value if new direction is [0, 0]', function() {
      var weather = new Weather();
      setNewWindDir(weather, 0, 0);

      weather.updateWind();
      testWindDir(weather, 0, 0);
    });

    /*
    it('should correctly add new modifying wind directions', function() {
      var weather = new Weather();

      setNewWindDir(weather, 1, 0);
      weather.updateWind();
      testWindDir(weather, 1, 0);

      setNewWindDir(weather, 0, 1);
      weather.updateWind();
      testWindDir(weather, 1, 1);

      setNewWindDir(weather, -1, 0);
      weather.updateWind();
      testWindDir(weather, 0, 1);

      setNewWindDir(weather, -1, 0);
      weather.updateWind();
      testWindDir(weather, -1, 1);
    });

    it('should not add past 1 or -1 for any coordinate', function() {
      var weather = new Weather();

      setNewWindDir(weather, 2, 0);
      weather.updateWind();
      testWindDir(weather, 1, 0);

      setNewWindDir(weather, 0, 2);
      weather.updateWind();
      testWindDir(weather, 1, 1);

      setNewWindDir(weather, -3, -3);
      weather.updateWind();
      testWindDir(weather, -1, -1);

      setNewWindDir(weather, 0, 3);
      weather.updateWind();
      testWindDir(weather, -1, 1);

    });
    */

  });

});
