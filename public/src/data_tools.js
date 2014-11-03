
if (typeof require !== 'undefined') {
  Utility = require("./utility");
}

var DataTools = {

  /*
   * Creates a complete set of stats for a given entity type.
   */
  add: function(stats) {
    if (stats !== undefined) {
      Utility.loadDataIntoObject(stats, this.stats);
    }
    return this;
  },

  /*
   * Adds a component string to the item's component list, to be later rendered
   * via entity.addNewComponent().
   */
  addComponent: function(component) {
    if (this.stats.components === undefined) {
      this.stats.components = [];
    }
    this.stats.components.push(component);
  },

  setUpEntityData: function(entity_data, base_stats, stats) {
    var new_stats = {};
    if (base_stats.parent) {
      var parent_stats = entity_data[base_stats.parent];
      Utility.loadDataIntoObject(parent_stats, new_stats);
    }
    Utility.loadDataIntoObject(base_stats, new_stats);
    new_stats.type = this.type;
    this.stats = new_stats;

    if (typeof stats !== 'undefined') {
      this.add(stats);
    }
  },

  /*
   * Creates a Crafty object based on a COMPLETE set of stats.
   * Assumes that property .type exists.
   */
  render: function() {
    if (this.stats.parent == 'Unit') {
      var entity = Crafty.e('Unit');
    } else {
      var entity = Crafty.e(this.stats.type);
    }
    entity.addStats(this.stats);
    if (entity.setStats !== undefined) {
      entity.setStats(); // sets any dynamic stats that require this.stats
    }

    for (var i in this.stats.components) {
      entity.addComponent(this.stats.components[i]);
    }
    if (this.stats.location && this.stats.location.x !== undefined) {
      entity.at(this.stats.location.x, this.stats.location.y);
    }

    if (this.stats.type == 'City') {
      // create left and right city entities
      var city_left = Crafty.e('CitySide').pickSide('left');
      city_left.at(entity.at().x - 1, entity.at().y);
      var city_right = Crafty.e('CitySide').pickSide('right');
      city_right.at(entity.at().x + 1, entity.at().y);

      entity.addStat('city_sides', [city_left, city_right]);
    }

    return entity;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = DataTools;
} else {
  window.DataTools = DataTools;
}

