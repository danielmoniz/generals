Pretty = {

  Player: {
    name: function(player_side) {
      if (player_side === undefined) player_side = Game.turn;
      names = { 0: "Blue", 1: "White", };
      return names[player_side];
    },
  },

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
      var player = Pretty.Player.name(unit.side);
      var general_info = "{0} ({1})".format(unit.type, player);
      return general_info;
    },

    name: function(unit) {
      return unit.name;
    },

    generalInfoStartingBattle: function(unit) {
      var battle_side = Utility.capitalizeFirstLetter(unit.battle_side);
      var player = Pretty.Player.name(unit.side);
      var general_info = "{0}: {1}'s {2} with {3}".format(battle_side, player, unit.type, unit.quantity);
      return general_info;
    },

    joinBattleMessage: function(side, type, battle_side, active_troops) {
      var battle_side = Utility.capitalizeFirstLetter(battle_side);
      var player = Pretty.Player.name(side);
      var general_info = "{0}'s {1} joined battle as {2} with {3}".format(player, type, battle_side, active_troops);
      return general_info;
    },

    retreatMessage: function(side, type, num_losses) {
      var player = Pretty.Player.name(side);
      var general_info = "{0}'s {1} retreated with {2} losses!".format(player, type, num_losses);
      return general_info;
    },

    supply: function(supply_remaining) {
      return "Supply: {0}".format(supply_remaining);
    },

    unsupplied: function(troops_lost) {
      var unsupplied = "Not supplied!";
      if (troops_lost) unsupplied += " {0} troops lost.".format(troops_lost);
      return unsupplied;
    },

    unitsPresentTitle: function() {
      return "Other units present: --------------";
    },

    inBattle: function() {
      return "(In battle)";
    },

    status: function(active, injured) {
      if (active <= 0) {
        update = "Disbanded!";
        return update;
      }
      if (active <= 0 && injured <= 0) {
        update = 'Dead!'
        return update;
      }
      var status = active;
      if (injured && injured > 0) status += "/{0}".format(active + injured);
      return status;
    },

  },
}
