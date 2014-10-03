var Options = require("../public/src/options");
var MapCreator = require("../public/src/map_creator");
var Utility = require("../public/src/utility");

var Game = function(io) {

  this.io = io;

  this.num_players = 2;

  this.create = function(game_name, options, first_player, second_player, observers, chat_callback) {
    this.game_name = game_name;
    this.chat_callback = chat_callback;
    var settings = {};
    var default_settings = new Options().getDefaultOptions();
    Utility.loadDataIntoObject(default_settings, settings);
    //Utility.loadDataIntoObject(options, settings);

    this.game_data = new MapCreator().buildNewMap(settings);

    this.io.to(first_player.id).emit("new game", this.game_name, this.game_data, 0, options);
    this.io.to(second_player.id).emit("new game", this.game_name, this.game_data, 1, options);
    this.players = {
      0: first_player,
      1: second_player,
    };
    this.observers = observers;


  };

  this.nextTurn = function(socket, turn_data, turn_count) {
    socket.to(this.game_name).broadcast.emit("next turn", turn_data, turn_count + 0.5);
  };

  this.endGame = function() {
    io.to(this.game_name).emit("game over");
    this.chat_callback(this.players, this.observers);
  };

}

module.exports = Game;

