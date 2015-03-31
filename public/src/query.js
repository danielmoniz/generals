
var Query = {
  getNonDestroyedFiresInSight: function(side, flush_cache) {
    var fires = Entity.getNonDestroyed('Fire', flush_cache);
    var fires_in_sight = fires.filter(function(fire) {
      var points_in_sight = LineOfSight.getPointsInSight(side);
      try {
        return points_in_sight[fire.at().x][fire.at().y];
      } catch(error) {};
      return false;
    });

    return fires_in_sight;
  },
};
