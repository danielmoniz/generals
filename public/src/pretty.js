Pretty = {

  Player: {
    name: function(player_side) {
      if (player_side === undefined) player_side = Game.turn;
      var names = { 0: "Blue", 1: "White", };
      var first_player_name = Utility.capitalizeFirstLetter(Game.factions[0]);
      var second_player_name = Utility.capitalizeFirstLetter(Game.factions[1]);
      var names = { 0: first_player_name, 1: second_player_name };
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
      return "{0}".format(supply_remaining);
    },

    unsupplied: function(troops_lost) {
      var unsupplied = "Not supplied!";
      if (troops_lost) unsupplied += " {0} troops lost.".format(troops_lost);
      return unsupplied;
    },

    unitsPresentTitle: function(active, injured, total) {
      var text = "Total units present: {0}/{1}".format(active, total);
      if (injured == 0) var text = "Total units present: {0}".format(active);
      return text;
    },

    inBattle: function() {
      return "(In battle)";
    },

    status: function(active, injured) {
      if (active <= 0) {
        var update = "Disbanded!";
        return update;
      }
      if (active <= 0 && injured <= 0) {
        var update = 'Dead!'
        return update;
      }
      var status = active;
      if (injured && injured > 0) status += "/{0}".format(active + injured);
      return status;
    },

  },

  Victory: {

    getWinnerMessage: function(winning_player_num) {
      var message = "";
      if (winning_player_num === undefined) {
        text = "Both players lose!";
      } else {
        var winner_name = Pretty.Player.name(winning_player_num);
        var loser_name = Pretty.Player.name(1 - winning_player_num);
        if (Game.type == Game.types.ONLINE) {
          if (Game.player == winning_player_num) {
            message = "You win!";
          } else {
            message = "You lose!";
          }
        } else {
          message = "The {0} win!".format(winner_name);
        }
        return message;
      }
      return text;
    },

    getDescriptiveMessage: function(winning_player_num) {
      if (winning_player_num === undefined) {
        var first_player_name = Pretty.Player.name(0);
        var second_player_name = Pretty.Player.name(1);
        var text = "The {0} and the {1} have destroyed each other's will to wage war.".format(first_player_name, second_player_name);
      } else {
        var winner_name = Pretty.Player.name(winning_player_num);
        var loser_name = Pretty.Player.name(1 - winning_player_num);
        var text = "The {0} have defeated the {1}.".format(winner_name, loser_name);
      }
      return text;
    },

    getFactionWinMessage: function(winning_player_num) {
      if (winning_player_num === undefined) return false;
      var text = "";
      var winner_name = Pretty.Player.name(winning_player_num);
      var loser_name = Pretty.Player.name(1 - winning_player_num);
      var faction = Factions[Game.factions[winning_player_num]];
      if (faction.victory_message) {
        text = faction.victory_message.format(loser_name);
      }
      return text;
    },

    getFactionLossMessage: function(winning_player_num) {
      if (winning_player_num === undefined) return false;
      losing_player_num = 1 - winning_player_num;
      var text = "";
      var winner_name = Pretty.Player.name(1 - losing_player_num);
      var loser_name = Pretty.Player.name(losing_player_num);
      var faction = Factions[Game.factions[losing_player_num]];
      if (faction.loss_message) {
        text = faction.loss_message.format(winner_name);
      }
      return text;
    },
  },

}
