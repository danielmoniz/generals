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
      // @TODO This value does not get added to terrain. Fix this!
      sight_impedance: 2,
    },

    "Water": {
      z: 80,
      move_difficulty: 0, 
      build_over: 500,
      defense_bonus: 0,
      colour: { r: 0, g: 128, b: 255 },
      sight_impedance: 1,
    },

    "Mountain": {
      z: 80,
      move_difficulty: 0, 
      build_over: 500,
      defense_bonus: 2,
      provides_supply: 250,
      colour: { r: 128, g: 128, b: 128 },
      sight_impedance: 8,
    },

    "Grass": {
      z: 80,
      move_difficulty: 1.25,
      build_over: 100,
      defense_bonus: 1,
      provides_supply: 1000,
      sight_impedance: 2,
    },

    "Tree": {
      z: 82,
      move_difficulty: 2.5,
      build_over: 300,
      defense_bonus: 1.05,
      flammable: true,
      provides_supply: 2000,
      sight_impedance: 5,
    },

    "Farm": {
      z: 80,
      build_over: 100,
      move_difficulty: 1.6,
      defense_bonus: 1,
      alpha: 0.6,
      supply_to_steal: 6000,
      colour: { r: 196, g: 196, b: 0 },
      flammable: true,
      provides_supply: 2000,
      sight_impedance: 2.4,
    },

    "Settlement": {
      z: 82,
      move_difficulty: 1,
      build_over: 1,
      supply: 1,
      max_supply_multiplier: 3,
      base_type: 'Settlement',
      capturable: true,
    },

    "City": {
      parent: 'Settlement',
      defense_bonus: {
        'ally': 1.55,
        'neutral': 1.4,
        'enemy': 1.25,
      },
      population: 9000,
      provides_supply: 4000,
      sight_impedance: 6,
      max_sight: 2.4,
      passive_capture: false,
      capture_time: 1,
      supply_range: 5,
      farms: [],
    },

    "Town": {
      parent: 'Settlement',
      defense_bonus: {
        'ally': 1.25,
        'neutral': 1.15,
        'enemy': 1.05,
      },
      population: 2500,
      provides_supply: 2000,
      sight_impedance: 3.5,
      passive_capture: false,
      capture_time: 1/2,
      supply_range: 1.6,
    },

    "Road": {
      z: 81,
      move_difficulty: 1,
      build_over: 1,
      defense_bonus: 1,
      is_supply_route: false,
      supply: 1,
    },

    "Bridge": {
      'parent': 'Road',
      move_difficulty: 1,
      build_over: 2 ,
      defense_bonus: 2,
      supply: 1,
      z: 81,
      colour: { r: 192, g: 192, b: 192 },
      sight_impedance: 2,
    },
  };

  this.setUpEntityData(terrain_data, terrain_data[type], stats);

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = TerrainData;
} else {
  window.TerrainData = TerrainData;
}

