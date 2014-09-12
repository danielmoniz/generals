Pretty = {
  Turn: {
    pretty: function(turn) {
      if (turn !== undefined) return turn + 1;
      return Game.turn + 1;
    },
    nextPlayerTurn: function(turn) {
      if (turn === undefined) turn = Game.turn;
      if (!this.isPlayerTurn(turn)) return (turn + 0.5) % 2;
      return turn;
    },
    isPlayerTurn: function(turn) {
      if (turn === undefined) turn = Game.turn;
      if (turn % 1 == 0) return true;
      return false;
    },
  },
  TurnCount: {
    pretty: function(count) {
      if (count) return Math.floor((count) / 2 + 1);
      return Math.floor((Game.turn_count) / 2 + 1);
    },
  },

  Unit: {
    generalInfo: function(unit) {
      var general_info = "{0} (Player {1})".format(unit.type, unit.side);
      return general_info;
    },
    generalInfoStartingBattle: function(unit) {
      var general_info = "{0} (Player {1})".format(unit.type, unit.side);
      battle_side = Utility.capitalizeFirstLetter(unit.battle_side);
      var general_info = "{0}: Player {1}'s {2} with {3}".format(battle_side, unit.side, unit.type, unit.quantity);
      return general_info;
    },

    generalInfoJoinBattle: function(side, type, battle_side) {
      var battle_side = Utility.capitalizeFirstLetter(battle_side);
      var general_info = "Player {0}'s {1} joined battle as {2}".format(side, type, battle_side);
      return general_info;
    },

    supply: function(supply_remaining) {
      return "Supply: {0}".format(supply_remaining);
    },
    status: function(quantity) {
      if (quantity <= 0) {
        update = 'Dead!'
        return update;
      }
      return quantity;
    },
    selectSelf: function() {
      console.log("Unit clicked!");
      var unit_id = parseInt($(this).attr("unit_id"));
      Game.select(Crafty(unit_id));
    },
  },
}
