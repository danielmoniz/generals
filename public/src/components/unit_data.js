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
      best_dissent: 0,

      max_supply_multiplier: 3,
      max_sight: 6,
      combat_ability: 1,
      defensive_ability: 1,
      pursuit_ability: 1,
      retreat_ability: 1,
      //movement: 5,
      supply_usage: 1,
      pillage_ability: 1,
      dissent_improvement: 0.2,
      dissent_improve_factor: 1,
      dissent_degrade_factor: 1,
    },

    "Cavalry": {
      movement: 10,
      pursuit_ability: 2,
      retreat_ability: 2,
    },

    "Infantry": {
      movement: 5,
    },

    "Jaguar Warrior": {
      movement: 6,
      combat_ability: 1.2,
    },

    "Slave": {
      combat_ability: 0.6,
      best_dissent: 1,
    },

    "Scout": {
      movement: 6,
      combat_ability: 0.5,
      max_sight: 7,
      retreat_ability: 1.5,
    },

    "Raider": {
      movement: 6,
      combat_ability: 0.75,
      pillage_ability: 2,
      pursuit_ability: 1.4,
      retreat_ability: 1.4,
    },

    "Ranger": {
      movement: 6,
      combat_ability: 1,
      max_supply_multiplier: 5,
      retreat_ability: 1.5,
    },

    "Test": {
      max_supply_multiplier: 3,
      max_sight: 6,
      combat_ability: 1,
      movement: 5,
      supply_usage: 1,
      pillage_ability: 1,
      pursuit_ability: 1,
      retreat_ability: 1,
    },

    "Test2": {
      movement: 6,
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

