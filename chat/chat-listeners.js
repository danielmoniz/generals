
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
    });

    socket.on("new user", function(username, old_username) {
      chat.changeName(socket, old_username, username);
      chat.joinRoom(socket, chat.main_room, 'make active');
      socket.emit('chat message', "Welcome to the chat!");

      socket.broadcast.emit('chat message', username + ' has entered the chat');

      console.log("socket.id");
      console.log(socket.id);
      console.log("new username:");
      console.log(username);
    });

    socket.on("change name", function(old_name, new_name) {
      chat.changeName(socket, old_name, new_name);
    });

    socket.on('chat message', function(message) {
      chat.sendMessage(socket, message);
    });

    socket.on('join game', function(inviter, invitee) {
      chat.joinGame(inviter, invitee);
    })

    socket.on('invite to game', function(inviter_name, invitee_name, options) {
      chat.invite(inviter_name, invitee_name, options);
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

