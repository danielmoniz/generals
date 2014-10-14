
var GameListener = function(io) {

  io.on('connection', function(socket) {

    socket.on('disconnect', function() {
    });

    socket.on("start game", function(options) {
      if (socket.game) {
        socket.game.startGame(options);
      } else {
        // @TODO Do smething here - alert user game is over.
      }
    });

    socket.on("new map", function(options) {
      socket.game.startGame(options);
    });

    socket.on('next turn', function(turn_data, turn_count) {
      socket.game.nextTurn(socket, turn_data, turn_count);
    });

    socket.on('surrender', function() {
      console.log("received surrender");
      socket.game.surrender(socket);
    });

    socket.on('game over', function(winners, losers, type) {
      //socket.game.endGame(winners, losers, type);
    });

    socket.on('leave game', function(room_name) {
      //socket.game.endGame(winners, losers, type);
      socket.game.killGame();
      //chat.joinRoom(socket, chat.main_room, 'make active');
    })

  });
}

module.exports = GameListener;

