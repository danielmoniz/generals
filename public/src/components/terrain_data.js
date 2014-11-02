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

    "Water": {
      move_difficulty: 0, 
      build_over: 8,
      defense_bonus: 0,
      colour: { r: 0, g: 128, b: 255 },
    },

    "Grass": {
      move_difficulty: 1, 
      build_over: 1,
      defense_bonus: 1,
      provides_supply: 2000,
    },

    "Tree": {
      move_difficulty: 2,
      build_over: 3,
      defense_bonus: 1.05,
      flammable: true,
      provides_supply: 2000,
    },

    "Farm": {
      build_over: 1,
      move_difficulty: 1.2,
      defense_bonus: 1,
      alpha: 0.6,
      supply_to_steal: 6000,
      colour: { r: 196, g: 196, b: 0 },
      flammable: true,
      provides_supply: 8000,
    },

    "City": {
      move_difficulty: 0.9,
      build_over: 0.01,
      defense_bonus: 1.55,
      supply: 1,
      population: 9000,
      max_supply_multiplier: 3,
      supply_steal_factor: 3,
    },

    "Road": {
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

  this.setUpEntityData(terrain_data, stats);

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = TerrainData;
} else {
  window.TerrainData = TerrainData;
}

