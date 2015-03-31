
var Query = {
  getNonDestroyedFiresInSight: function(side) {
    var fires = Entity.getNonDestroyed('Fire');
    var fires_in_sight = fires.filter(function(fire) {
      var points_in_sight = LineOfSight.getPointsInSight(side);
      try {
        return points_in_sight[fire.at().x][fire.at().y];
      } catch(error) { console.log(error); };
      return false;
    });

    return fires_in_sight;
  },
};
