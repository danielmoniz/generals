
var ChatListener = function(io) {

  var Chat = require("./chat");
  var chat = new Chat(io);
  chat.main_room = "main";

  io.on('connection', function(socket) {

    console.log("new connection");
    socket.emit("get new user");

    socket.on('disconnect', function() {
      socket.broadcast.emit('chat message', socket.username + ' has left the chat');

      if (chat.rooms[socket.active_room] !== undefined) {
        chat.leaveRoom(socket.active_room, socket);
        chat.leaveRoom(socket.username, socket);
      }
      chat.removeUser(socket);
    });

    socket.on("new user", function(username, room_name, game_id, game_name, player_num) {
      chat.newUser(socket, username, room_name, game_id, game_name, player_num);
    });

    socket.on("change name", function(old_name, new_name) {
      chat.changeName(socket, old_name, new_name);
    });

    socket.on('chat message', function(message) {
      chat.sendMessage(socket, message, socket.username);
    });

    socket.on('join game', function(inviter, invitee) {
      chat.joinGame(inviter, invitee);
    })

    socket.on('register player', function(game_id, player_num, username) {
    });

    socket.on('invite to game', function(inviter_name, invitee_name) {
      chat.invite(inviter_name, invitee_name);
    })

    socket.on("accept game invite", function(invite_id) {
      chat.acceptGameInvite(invite_id);
    });

    socket.on("decline game invite", function(invite_id) {
      chat.declineGameInvite(invite_id);
    });

  });
};

module.exports = ChatListener;

