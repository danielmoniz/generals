
if (typeof require !== 'undefined') {
  Utility = require("./utility");
  Random = require("./random");
}

var Weather = function() {
  this.wind_dir = [0, 0];
  this.prob_wind_stays_neutral = .50;
  this.prob_wind_stays_directed = .85;

  this.nextDay = function() {
    this.updateWind();
  }

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

  this.updateWind = function() {

    if (this.wind_dir[0] == 0 && this.wind_dir[1] == 0) {
      if (Random.random() > this.prob_wind_stays_neutral) {
        this.wind_dir = this.getRandomWindDir();
      }
    } else {
      if (Random.random() > this.prob_wind_stays_directed) {
        this.wind_dir = [0, 0];
      }
    }

    /*
    // generate a random coordinate on or adjacent to [0, 0]
    var wind_dir = this.getRandomWindDir();

    var new_wind = [];
    for (var i in wind_dir) {
      new_wind[i] = this.wind_dir[i] + wind_dir[i];
    }

    // normalize values to prevent high wind values
    for (var i in new_wind) {
      if (new_wind[i] == 0) continue;
      new_wind[i] = new_wind[i] / Math.abs(new_wind[i]);
    }

    // ensure no diagonal wind direction
    //this.dirWithoutDiagonal(new_wind);

    this.wind_dir = new_wind;
    */
  }

  this.dirWithoutDiagonal = function(dir) {
    if (Math.abs(dir[0]) + Math.abs(dir[1]) >= 2) {
      var i = Math.floor(Random.random() * 2);
      dir[i] = 0;
    }
  }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Weather;
} else {
  window.Weather = Weather;
}

