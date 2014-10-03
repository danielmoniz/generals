
var GameListener = function(io) {

  io.on('connection', function(socket) {

    socket.on('disconnect', function() {
    });

    socket.on("new user", function(username, old_username) {
    });

    socket.on('next turn', function(turn_data, turn_count) {
      socket.game.nextTurn(socket, turn_data, turn_count);
    });

    socket.on('game over', function(turn_data, turn_count) {
      socket.game.endGame();
    });

  });
}

module.exports = GameListener;

