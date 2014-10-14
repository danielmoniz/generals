var Options = require("../public/src/options");
var MapCreator = require("../public/src/map_creator");
var Utility = require("../public/src/utility");

var Game = function(io) {

  this.io = io;

  this.num_players = 2;

  this.createEmpty = function(game_id, game_name, chat_callback, chat) {
    this.id = game_id;
    this.game_name = game_name;
    this.players = {};

    this.chat = chat;
    this.chat_callback = chat_callback;
  };

  this.create = function(game_name, players, observers, chat_callback, chat) {
    game_id = Math.round(Math.random() * 1000000000000);
    this.createEmpty(game_id, game_name, chat_callback, chat);

    this.observers = observers;
    for (var i in observers) {
      observers[i].game = this;
      observers[i].observing = true;
    }

    this.players = players;
    for (var i in players) {
      this.registerPlayer(players[i], i);
      this.io.to(players[i].id).emit("new game", this.game_name, parseInt(i));
    }
  };

  this.registerPlayer = function(socket, player_num) {
    this.players[player_num] = socket;
    socket.player_num = player_num;
    socket.game = this;
  };

  this.startGame = function(options) {
    this.options = options;

    var settings = {};
    var options_obj = new Options();
    options_obj.setOptions(options, settings);

    this.game_data = new MapCreator().buildNewMap(settings);

    this.io.to(this.players[0].id).emit("start game", this.id, this.game_name, this.game_data, 0, settings);
    this.io.to(this.players[1].id).emit("start game", this.id, this.game_name, this.game_data, 1, settings);
  };

  this.nextTurn = function(socket, turn_data, turn_count) {
    socket.to(this.game_name).broadcast.emit("next turn", turn_data, turn_count + 0.5);
  };

  this.endGame = function(winner_ids, loser_ids, type_of_win) {
    var winners = [];
    var winner_names = [];
    for (var i in winner_ids) {
      var player = this.players[winner_ids[i]];
      winners.push(player);
      winner_names.push(player.username);
    }
    var losers = [];
    var loser_names = [];
    for (var i in loser_ids) {
      var player = this.players[loser_ids[i]];
      losers.push(player);
      loser_names.push(player.username);
    }

    for (var i in winners) {
      winners[i].emit('game over', 'victory', winner_ids, loser_ids, type_of_win);
    }
    for (var i in losers) {
      losers[i].emit('game over', 'defeat', winner_ids, loser_ids, type_of_win);
    }
  };

  /*
   * Used when a game is to be annihilated, ie. impossible to restart.
   */
  this.killGame = function() {
    this.chat.endGame(this.players, this.observers);
  };

  this.surrender = function(socket) {
    var losers = [socket.player_num];
    var winners = [];
    for (var i in this.players) {
      var player = this.players[i];
      if (player.id != socket.id) {
        winners.push(player.player_num);
      }
    }

    this.endGame(winners, losers, 'surrender');
  };

}

module.exports = Game;

