if (typeof require !== 'undefined') {
  DataTools = require("../data_tools");
}

var TerrainData = function(type, stats) {
  this.type = type;

  this.add = DataTools.add;
  this.addComponent = DataTools.addComponent;
  this.render = DataTools.render;
  this.setUpEntityData = DataTools.setUpEntityData;

  var terrain_data = {

    // Can be used only indirectly, as a parent
    'Terrain': {
      z: 80,
    },

    "Water": {
      z: 80,
      move_difficulty: 0, 
      build_over: 5,
      defense_bonus: 0,
      colour: { r: 0, g: 128, b: 255 },
    },

    "Grass": {
      z: 80,
      move_difficulty: 1, 
      build_over: 1,
      defense_bonus: 1,
      provides_supply: 1000,
      remaining_provided_supply: 1000,
    },

    "Tree": {
      z: 82,
      move_difficulty: 2,
      build_over: 3,
      defense_bonus: 1.05,
      flammable: true,
      provides_supply: 2000,
      remaining_provided_supply: 2000,
    },

    "Farm": {
      z: 80,
      build_over: 1,
      move_difficulty: 1.2,
      defense_bonus: 1,
      alpha: 0.6,
      supply_to_steal: 6000,
      colour: { r: 196, g: 196, b: 0 },
      flammable: true,
      provides_supply: 4000,
      remaining_provided_supply: 4000,
    },

    "Settlement": {
      z: 82,
      move_difficulty: 0.9,
      build_over: 0.01,
      supply: 1,
      max_supply_multiplier: 3,
      base_type: 'Settlement',
    },

    "City": {
      parent: 'Settlement',
      defense_bonus: 1.55,
      population: 9000,
    },

    "Town": {
      parent: 'Settlement',
      defense_bonus: 1.25,
      population: 2500,
    },

    "Road": {
      z: 81,
      move_difficulty: 0.75,
      build_over: 0.01,
      defense_bonus: 1,
      is_supply_route: false,
      supply: 1,
    },

    "Bridge": {
      'parent': 'Road',
      move_difficulty: 1,
      build_over: 0.02 ,
      defense_bonus: 2,
      supply: 1,
      z: 81,
      colour: { r: 192, g: 192, b: 192 },
    },
  };

  this.setUpEntityData(terrain_data, terrain_data[type], stats);

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = TerrainData;
} else {
  window.TerrainData = TerrainData;
}

