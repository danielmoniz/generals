if (typeof require !== 'undefined') {
  noise = require("../lib/perlin.js").noise;
  astar = require("../lib/astar.js");
  Graph = astar.Graph;
  astar = astar.astar;
  
  locations = require("../locations.js");
  console.log("locations");
  console.log(locations);

} else {
  window.astar = astar;
  window.Graph = Graph;
  window.noise = noise;
}

var Options = function() {

  this.getDefaultOptions = function() {
    var map_width = 40;
    var tile_size = 32;

    var options = {

      location: locations.test,
      factions: ["mongols", "romans"],
      map_grid: {
        width: Math.ceil(map_width),
        //height: Math.ceil(map_width),
        //height: Math.ceil(map_width * 3 / 4),
        height: Math.ceil(map_width * 0.5625),
        tile: {
          width: tile_size,
          height: tile_size,
        }
      },
      player_colour: { 0: "Blue", 1: "White" },
      num_sections: 3,
      num_cities_total: 9,

      pathfind: astar,
      graph_ftn: Graph,
      noise: noise,

      // Move to constants file
      FIRST_PLAYER: 0,
      AFTER_FIRST_PLAYER: 0.5,
      SECOND_PLAYER: 1,
      AFTER_SECOND_PLAYER: 1.5,

    }

    return options;
  }

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Options;
} else {
  window.Options = Options;
}
