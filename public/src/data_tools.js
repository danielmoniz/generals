
if (typeof require !== 'undefined') {
  Utility = require("./utility");
}

var DataTools = {

  /*
   * Creates a complete set of stats for a given entity type.
   */
  add: function(stats) {
    var combined_stats = this.stats;
    if (stats !== undefined) {
      //combined_stats = $.extend({}, this.stats, stats);
      Utility.loadDataIntoObject(combined_stats, this.stats);
      if (this.type == 'Cavalry') {
        console.log("combined_stats");
        console.log(combined_stats);
      }
    }
    this.stats = combined_stats;
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

  setUpEntityData: function(entity_data, stats) {
    var base_stats = entity_data[this.type];
    if (base_stats.parent) {
      var parent_stats = entity_data[base_stats.parent];
      base_stats = $.extend({}, parent_stats, base_stats);
    }
    base_stats.type = this.type;
    this.stats = base_stats;

    if (typeof stats !== 'undefined') {
      this.add(stats);
    }
  },

  /*
   * Creates a Crafty object based on a COMPLETE set of stats.
   * Assumes that .type exists.
   */
  render: function() {
    var entity = Crafty.e(this.stats.type);
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
    return entity;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = DataTools;
} else {
  window.DataTools = DataTools;
}

