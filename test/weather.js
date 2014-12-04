
var assert = require("assert");

var Weather = require("../public/src/weather");
Random = require("../public/src/weather");

describe('Weather', function() {

  beforeEach(function() {
    var climate = {
      chance_of_wind: 0.5,
      chance_of_wind_change: 0.5,
      chance_of_rain: 0.5,
      chance_rain_stops: 0.5,
    };
    this.weather = new Weather(climate);
  });

  function setRandom(number) {
    Random.random = function() {
      return number;
    };
  };

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
      testWindDir(this.weather, 0, 0);
    });

    it('should start rain at 0', function() {
      assert.equal(this.weather.rain, 0);
    });

  });

  describe('#updateWind()', function() {

    beforeEach(function() {
      Random.random = function() {
        return 0;
      };
    });

    afterEach(function() {
      Random = require("../public/src/weather");
    });

    it('should update wind direction to bounce between neutral and a direction', function() {
      var weather = this.weather;

      setNewWindDir(weather, 1, 0);
      weather.updateWind();
      testWindDir(weather, 1, 0);

      weather.updateWind();
      testWindDir(weather, 0, 0);

      setNewWindDir(weather, -1, 0);
      weather.updateWind();
      testWindDir(weather, -1, 0);

      weather.updateWind();
      testWindDir(weather, 0, 0);

      setNewWindDir(weather, 0, -1);
      weather.updateWind();
      testWindDir(weather, 0, -1);

      weather.updateWind();
      testWindDir(weather, 0, 0);

      setNewWindDir(weather, 0, 1);
      weather.updateWind();
      testWindDir(weather, 0, 1);

      weather.updateWind();
      testWindDir(weather, 0, 0);
    });

    it('should maintain wind direction given a high random value', function() {
      var weather = this.weather;

      setRandom(1);

      weather.updateWind();
      testWindDir(weather, 0, 0);

      setRandom(0);
      setNewWindDir(weather, 1, 0);
      weather.updateWind();
      testWindDir(weather, 1, 0);
    });

  });

  describe('#getRandomWindDir()', function() {

    function setRandom(number) {
      Random.random = function() {
        return number;
      };
    };

    function testWindDir(direction, x, y) {
      assert.equal(direction[0], x);
      assert.equal(direction[1], y);
    }

    afterEach(function() {
      Random = require("../public/src/weather");
    });

    it('should return a direction coordinate depending on random value', function() {
      var weather = this.weather;

      setRandom(0);
      var direction = weather.getRandomWindDir();
      testWindDir(direction, 0, 1); // down

      setRandom(0.25);
      var direction = weather.getRandomWindDir();
      testWindDir(direction, 0, -1); // up

      setRandom(0.5);
      var direction = weather.getRandomWindDir();
      testWindDir(direction, 1, 0); // right

      setRandom(0.75);
      var direction = weather.getRandomWindDir();
      testWindDir(direction, -1, 0); // left
    });

  });

  describe('#getDirectionFromWindCoord()', function() {

    function setRandom(number) {
      Random.random = function() {
        return number;
      };
    };

    function testWindDir(direction, x, y) {
      assert.equal(direction[0], x);
      assert.equal(direction[1], y);
    }

    afterEach(function() {
      Random = require("../public/src/weather");
    });

    it('should error input causes a result of undefined', function() {
      var weather = this.weather;
      var direction = [0, 'cheese'];
      assert.throws(function() {
        weather.getDirectionFromWindCoord(direction);
      });

    });

    it('should return a direction coordinate depending on random value', function() {
      var weather = this.weather;

      var direction = [0, 1];
      var name = weather.getDirectionFromWindCoord(direction);
      assert.equal(name, 'down');

      var direction = [0, -1];
      var name = weather.getDirectionFromWindCoord(direction);
      assert.equal(name, 'up');

      var direction = [-1, 0];
      var name = weather.getDirectionFromWindCoord(direction);
      assert.equal(name, 'left');

      var direction = [1, 0];
      var name = weather.getDirectionFromWindCoord(direction);
      assert.equal(name, 'right');

    });

  });

  describe('#updateRain()', function() {

    beforeEach(function() {
      Random.random = function() {
        return 0;
      };
    });

    afterEach(function() {
      Random = require("../public/src/weather");
    });

    it('should update rain to bounce between 0 and 1 given sufficiently low random value', function() {
      var weather = this.weather;
      setRandom(0);

      weather.updateRain();
      assert.equal(weather.rain, 1);

      weather.updateRain();
      assert.equal(weather.rain, 0);

    });

    it('should update rain to maintain current level given sufficiently high random value', function() {
      var weather = this.weather;

      setRandom(1);
      weather.updateRain();
      assert.equal(weather.rain, 0);

      setRandom(0);
      weather.updateRain();
      assert.equal(weather.rain, 1);

      setRandom(1);
      weather.updateRain();
      assert.equal(weather.rain, 1);
    });

  });

});
