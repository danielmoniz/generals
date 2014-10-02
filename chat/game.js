var Options = require("../public/src/options");
var MapCreator = require("../public/src/map_creator");
var Utility = require("../public/src/utility");

var Game = function(io) {

  this.io = io;

  this.players = 2;

  this.create = function(game_name, new_options) {
    var options = {};
    var default_options = new Options().getDefaultOptions();
    Utility.loadDataIntoObject(default_options, options);
    //Utility.loadDataIntoObject(new_options, options);

    this.map = new MapCreator().buildNewMap(options);

    // @TODO Send game data here, instead of the options!
    this.io.to(game_name).emit("new game", game_name, this.map, new_options);

  }

  this.nextTurn = function(turn_data) {
  }

}

module.exports = Game;

