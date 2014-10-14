
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

      if (room_name) {
        chat.changeName(socket, undefined, username);
        chat.joinRoom(socket, room_name, 'make active');
        //socket.emit('chat message', "Welcome to the chat!");
      } else {
        chat.changeName(socket, undefined, username);
        chat.joinRoom(socket, chat.main_room, 'make active');
        socket.emit('chat message', "Welcome to the chat!");

        console.log("new username:");
        console.log(username);
      }

      // @TODO Move this code to chat.js or game.js
      if (game_id) {
        var game = chat.games[game_id];
        if (!game) {
          var Game = require("./game");
          var game = new Game(this.io);
          //var game_name = socket.active_room;
          game.createEmpty(game_id, game_name, chat.endGame);

          console.log("had to rebuild specific game.");
          console.log("Game name: {0}".format(game.game_name));
          console.log("Game id: {0}".format(game.id));
        }
        chat.games[game.id] = game;
        game.registerPlayer(socket, player_num);
      }

    });

    socket.on("change name", function(old_name, new_name) {
      chat.changeName(socket, old_name, new_name);
    });

    socket.on('chat message', function(message) {
      chat.sendMessage(socket, message, socket.username);
    });

    socket.on('leave game', function(room_name) {
      chat.joinRoom(socket, chat.main_room, 'make active');
    })

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

