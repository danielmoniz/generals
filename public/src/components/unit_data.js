if (typeof require !== 'undefined') {
  DataTools = require("../data_tools");
}

var UnitData = function(type, stats) {
  this.type = type;

  this.add = DataTools.add;
  this.addComponent = DataTools.addComponent;
  this.render = DataTools.render;
  this.setUpEntityData = DataTools.setUpEntityData;

  var unit_data = {

    "Unit": {
      z: 100,
      battle: false, 
      side: 0, 
      alive: true,
      quantity: 0,
      active: true,
      performed_actions: [],
      is_supplied: true,
      injured: 0,
      happy: true,
      best_morale: 0,

      max_supply_multiplier: 3,
      max_sight: 6,
      combat_ability: 1,
      defensive_ability: 1,
      movement: 4,
      supply_usage: 1,
      pillage_ability: 1,
    },

    "Cavalry": {
      movement: 8,
    },

    "Infantry": {
      movement: 4,
    },

    "Jaguar Warrior": {
      movement: 5,
      combat_ability: 1.2,
    },

    "Slave": {
      combat_ability: 0.6,
      best_morale: 1,
    },

    "Scout": {
      movement: 5,
      combat_ability: 0.5,
      max_sight: 7,
    },

    "Raider": {
      movement: 5,
      combat_ability: 0.75,
      pillage_ability: 2,
    },

    "Ranger": {
      movement: 5,
      combat_ability: 1,
      max_supply_multiplier: 5,
    },

    "Test": {
      max_supply_multiplier: 3,
      max_sight: 6,
      combat_ability: 1,
      movement: 4,
      supply_usage: 1,
      pillage_ability: 1,
    },

    "Test2": {
      movement: 5,
      combat_ability: 0.5,
      max_sight: 7,
    },

  };

  var base_stats = unit_data[type];
  base_stats.parent = 'Unit';
  this.setUpEntityData(unit_data, base_stats, stats);

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = UnitData;
} else {
  window.UnitData = UnitData;
}

