
var GameListener = function(io) {

  io.on('connection', function(socket) {

    socket.on('disconnect', function() {
    });

    socket.on("new user", function(username, old_username) {
    });

    socket.on('next turn', function(turn_data) {
      socket.game.nextTurn(turn_data);
    })

  });
}

module.exports = GameListener;

