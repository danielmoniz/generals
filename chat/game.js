var Options = require("../public/src/options");
var MapCreator = require("../public/src/map_creator");
var Utility = require("../public/src/utility");

var Game = function(io) {

  this.io = io;

  this.players = 2;

  this.create = function(game_name, options, first_player, second_player, observers) {
    this.game_name = game_name;
    var settings = {};
    var default_settings = new Options().getDefaultOptions();
    Utility.loadDataIntoObject(default_settings, settings);
    //Utility.loadDataIntoObject(options, settings);

    this.game_data = new game_dataCreator().buildNewgame_data(settings);

    this.io.to(first_player.id).emit("new game", this.game_name, this.game_data, 0, options);
    this.io.to(second_player.id).emit("new game", this.game_name, this.game_data, 1, options);

  }

  this.nextTurn = function(turn_data, turn_count) {
    io.to(this.game_name).emit("next turn", turn_data, turn_count + 0.5);
  }

}

module.exports = Game;

