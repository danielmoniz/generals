Victory = {
  reset: function() {
    this.will_to_fight = [100, 100];
    this.troop_values = [undefined, undefined];
    this.ratio_to_win = 3; // need X times higher will than opponent to win
    this.setWillToFight();
  },
  
  checkVictoryConditions: function() {
    this.updateWillToFight();

    for (var i=0; i<2; i++) {
      var my_will = this.will_to_fight[i];
      var their_will = this.will_to_fight[(i + 1) % 2];
      if (my_will > their_will * this.ratio_to_win) {
        var text = "Player {0} wins!".format(i);
        this.victory_text = text;
        return "Player {0} wins!".format(i);
      }
      if (Math.round(my_will) == 0) {
        var text = "Player {0} loses!".format(i);
        this.victory_text = text;
        return "Player {0} loses!".format(i);
      }
    }
    return false;
  },

  updateWillToFight: function() {
    for (var i=0; i<2; i++) {
      var total_troops = this.getTotalTroops(i);
      this.will_to_fight[i] = total_troops * this.troop_values[i];
    }
    Output.updateVictoryBar();
  },

  getUnits: function(side) {
    var units = Crafty('Unit').get();
    units = units.filter(function(unit) {
      return unit.side == side;
    });
    return units;
  },

  getTotalTroops: function(side) {
    var units = this.getUnits(side);
    var total_troops = 0;
    for (var i=0; i<units.length; i++) {
      total_troops += units[i].getValue();
    }
    return total_troops;
  },

  setWillToFight: function() {
    for (var i=0; i<2; i++) {
      var units = this.getUnits(i);
      var total_troops = this.getTotalTroops(i);
      var troop_value = 100 / total_troops;
      this.troop_values[i] = troop_value;
    }
  },
}
