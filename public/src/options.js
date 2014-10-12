if (typeof require !== 'undefined') {
  noise = require("../lib/perlin.js").noise;
  astar = require("../lib/astar.js");
  Graph = astar.Graph;
  astar = astar.astar;
  
  locations = require("../locations.js");

} else {
  window.astar = astar;
  window.Graph = Graph;
  window.noise = noise;
}

var Options = function() {

  this.getDefaultOptions = function() {
    var map_width = 40;
    var tile_size = 32;

    var tile = {
      width: tile_size,
      height: tile_size,
    };

    var options = {

      location: locations.test,
      factions: ["mongols", "mongols"],

      map_sizes: {
        small: {
          width: 25,
          height: 15,
          tile: tile,
        },
        large: {
          //width: Math.ceil(map_width),
          //height: Math.ceil(map_width),
          //height: Math.ceil(map_width * 3 / 4),
          //height: Math.ceil(map_width * 0.5625),
          width: 40,
          height: 23,
          tile: tile,
        },
      },

      board_title: {
        height: 24,
      },

      board_tool_bar: {
        height: 32,
      },

      player_colour: { 0: "Blue", 1: "White" },
      num_sections: 3,
      num_cities_total: 9,

      max_farm_distance: 2,
      farm_probability_factor: 0.8,

      // Move to constants file
      FIRST_PLAYER: 0,
      AFTER_FIRST_PLAYER: 0.5,
      SECOND_PLAYER: 1,
      AFTER_SECOND_PLAYER: 1.5,

      battle_death_rate: 1/5,
      attrition_rate: 1/10,
      attrition_death_rate: 1/3,
      healing_rate: 1/30,
      city_healing_rate: 15/100,
      min_troops_for_supply_cut: 500,

    }

    return options;
  };

  this.setOptions = function(options, game_object) {
    var default_settings = this.getDefaultOptions();
    for (var key in default_settings) {
      var value = default_settings[key];
      game_object[key] = value;
    }
    for (var key in options) {
      var value = options[key];
      game_object[key] = value;
    }

    this.setMapSize(game_object);
  };

  this.setMapSize = function(options) {
    options.map_grid = options.map_sizes[options.map_size];
  };

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Options;
} else {
  window.Options = Options;
}
