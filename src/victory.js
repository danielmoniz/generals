Victory = {
  checkVictoryConditions: function() {
    var units = Crafty('Unit').get();
    console.log(units);
    var first_player_units = [];
    var second_player_units = [];
    for (var i=0; i<units.length; i++) {
      if (units[i].side == 0) {
        first_player_units.push(units[i]);
      } else {
        second_player_units.push(units[i]);
      }
    }
    if (first_player_units.length == 0 || second_player_units.length == 0) {
      return true;
    }
    return false;
  },
}
