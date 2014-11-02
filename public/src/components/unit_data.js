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
      max_supply_multiplier: 3,
      battle: false, 
      side: 0, 
      alive: true,
      quantity: 0,
      injured: 0,
      active: true,
      performed_actions: [],
      is_supplied: true,
      max_sight: 6,
      combat_ability: 1,
      movement: 4,
    },

    "Cavalry": {
      parent: 'Unit',
      type: 'Cavalry',
      movement: 8,
    },

    "Infantry": {
      parent: 'Unit',
      type: 'Infantry',
      movement: 4,
    },

    "Jaguar Warrior": {
      parent: 'Unit',
      type: 'Jaguar Warrior',
      movement: 5,
      combat_ability: 1.2,
    },

    "Scout": {
      parent: 'Unit',
      type: 'Jaguar Warrior',
      movement: 6,
      combat_ability: 0.5,
      max_sight: 9,
    },

  };

  this.setUpEntityData(unit_data, stats);

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = UnitData;
} else {
  window.UnitData = UnitData;
}

