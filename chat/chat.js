var Utility = require('./utility');

var Game = require("./game");

var Chat = function(io) {
  this.io = io;

  this.invites = {};
  this.users = {};
  this.rooms = {};

  this.joinGame = function(inviter, invitee, options) {
    // @TODO Ensure user is still inviting the invitee
    if (inviter === undefined || invitee === undefined) {
      return false;
    }
    var room_name = "Game-" + Math.round(Math.random() * 100000);
    this.joinRoom(inviter, room_name, 'make active');
    this.joinRoom(invitee, room_name, 'make active');

    // @TODO Send game data here, instead of the options!
    this.io.to(room_name).emit("new game", room_name, options);

    var game = new Game(this.io);
    //inviter.game = game;
    //invitee.game = game;

    for (var i in arguments) {
      var player = arguments[i];
      player.game = game;
      if (i < game.players) {
        player.player_type = i;
      } else {
        player.player_type = 'observer';
      }
    }

    game.create();
  }

  this.joinRoom = function(socket, room, make_active, stay_in_room) {
    var old_room = socket.active_room;
    if (!stay_in_room && old_room !== undefined) {
      if (socket.rooms.length > 1) {
        this.leaveRoom(old_room, socket);
      }
    }
    socket.join(room);
    this.addToRoom(room, socket.username);
    if (make_active) {
      socket.active_room = room;
      this.updateUserList(room);
      this.clearMessages(socket.username);
    }
  };

  this.leaveRoom = function(room_name, socket) {
    socket.leave(room_name);
    this.rooms[room_name] = Utility.removeFromArray(this.rooms[room_name], socket.username);
    if (this.rooms[room_name] && this.rooms[room_name].length == 0) {
      delete this.rooms[room_name];
    }
    this.updateUserList(room_name);
  };

  this.updateUserList = function(room_name) {
    if (!room_name) return false;
    this.io.to(room_name).emit("update user list", this.rooms[room_name]);
  };

  this.clearMessages = function(room_name) {
    if (!room_name) return false;
    this.io.to(room_name).emit("joined room", room_name);
  };

  this.runCommand = function(text, socket) {
    var command = "/invite";
    if (text.slice(0, command.length) == command) {
      var data = text.split(" ");
      this.invite(socket, data[1]);
      return true;
    }
    return false;
  };

  this.sendMessage = function(socket, message) {
    if (message == '' || typeof message != 'string') return false;
    if (Utility.countItems(socket) == 0) return false;
    var text = socket.username + ": " + message;
    if (!this.runCommand(message, socket)) {
      this.io.to(socket.active_room).emit('chat message', text);
      console.log("to room " + socket.active_room + " only");
    }
  };

  this.changeName = function(socket, old_name, new_name) {
    // first determine if name is taken
    if (this.users[new_name] !== undefined) {
      socket.emit("name taken", old_name, new_name);
      return false;
    }

    this.users[new_name] = socket;
    var room = socket.active_room;
    if (old_name) {
      delete this.users[old_name];
      var index = this.rooms[room].indexOf(old_name);
      this.rooms[room][index] = new_name;
      this.leaveRoom(old_name, socket); // leave self-named room
    }
    socket.username = new_name;
    socket.join(new_name);
    this.addToRoom(new_name, new_name); // join self-named room

    // @TODO Delete invitations targeted at old name

    if (room) {
      this.updateUserList(room);
    }
    socket.emit('name changed', new_name);
  };

  this.invite = function(inviter_name, invitee_name, options) {
    var inviter = this.users[inviter_name];
    var invitee = this.users[invitee_name];
    var invite_id = Math.round(Math.random() * 100000);
    inviter.invite = invite_id;
    this.invites[invite_id] = [inviter, invitee, options];

    var inviter_message = "Waiting for response from " + invitee.username + " for game invite...";
    this.io.to(inviter.username).emit("chat message", inviter_message);

    this.io.to(invitee_name).emit("invite to game", invite_id, inviter.username, options);
  };

  this.acceptGameInvite = function(invite_id) {
    var invite = this.invites[invite_id];
    if (!invite) return false;
    var options = invite[2];
    this.joinGame(invite[0], invite[1], options);
  };

  this.declineGameInvite = function(invite_id) {
    var invite = this.invites[invite_id];
    if (!invite) return false;
    var inviter = invite[0];
    var invitee = invite[1];

    this.io.to(inviter.username).emit('decline invite', invitee.username);
    delete this.invites[invite_id];;
  };

  this.addToRoom = function(room, name) {
    if (!room || !name) return this.rooms;
    if (this.rooms[room] === undefined) {
      this.rooms[room] = [];
    }
    this.rooms[room].push(name);
    return this.rooms;
  };

}

module.exports = Chat;

