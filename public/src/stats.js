
var Stats = {

  getLastSeenData: function(entity, side) {
    if (entity.getHideableStats) {
      return entity.getHideableStats(side);
    }
    return entity.getStats();
  },

};
