
if (typeof require !== 'undefined') {
  Utility = require("./utility");
  Random = require("./random");
}

var Weather = function(climate) {
  this.wind_dir = [0, 0];
  this.rain = 0;

  this.chance_of_wind = climate.chance_of_wind;
  this.prob_wind_changes = climate.chance_of_wind_change;
  this.prob_rain_stops = climate.chance_rain_stops;
  this.chance_of_rain = climate.chance_of_rain;

  this.nextDay = function() {
    this.updateWind();
    this.updateRain();

    this.updateDisplay();
  }

  this.updateDisplay = function() {
    var wind_str = this.getDirectionFromWindCoord(this.wind_dir);
    Output.updateWeather(wind_str, this.rain);
  };

  this.updateRain = function() {
    if (this.rain == 0) {
      var random = Random.random();
      if (random < this.chance_of_rain) {
        this.rain = 1;
      }
    } else {
      if (Random.random() < this.prob_rain_stops) {
        this.rain = 0;
      }
    }
  };

  this.updateWind = function() {
    var is_wind = this.wind_dir[0] == 0 && this.wind_dir[1] == 0;
    if (is_wind) {
      if (Random.random() < this.prob_wind_changes) {
        this.wind_dir = [0, 0]; // reset wind to no wind
      }
    } else {
      if (Random.random() < this.chance_of_wind) {
        this.wind_dir = this.getRandomWindDir();
      }
    }

  };

  this.getRandomWindDir = function() {
    var directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    var random = Math.floor(Random.random() * 4)
    var new_wind = directions[random];
    return new_wind;
  };

  this.getDirectionFromWindCoord = function(wind_coord) {
    var map = {
      '-1': {
        0: 'left',
      },
      0: {
        '-1': 'up',
        0: 'none',
        1: 'down',
      },
      1: {
        0: 'right',
      },
    };
    var direction_str = map[wind_coord[0]][wind_coord[1]];

    if (direction_str === undefined) throw new Error('BadParam', 'wind_coord must be a cardinal coordinate.');
    return direction_str;
  };

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Weather;
} else {
  window.Weather = Weather;
}

