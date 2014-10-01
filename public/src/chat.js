
var user_num = Math.round(Math.random() * 100000);
my_username = "User-" + user_num;
my_messages = {};
my_current_room = "";

var socket = io();
socket.emit("new user", my_username);

socket.on('name changed', function(new_name) {
  my_username = new_name;
  //$("input#username").val(new_name);
});

socket.on('name taken', function(old_name, new_name) {
  var message = "Name '" + new_name + "' already taken.";
  addMessage(message);
  $("input#username").val(old_name);
  $("input#username").focus();
});

socket.on('chat message', function(msg) {
  addMessage(msg);
});

socket.on('update user list', function(usernames) {
  $("ul#online-users").empty();
  for (var i in usernames) {
    var new_list_item = makeUsernameListItem(usernames[i]);
    $('ul#online-users').append(new_list_item);
  }
});

socket.on('invite to game', function(invite_id, inviter, options) {
  var output = inviter + " has invited you to a game.";
  addMessage(output);

  var join = confirm(inviter + " has invited you to a game! Join?");
  if (join) {
    socket.emit("accept game invite", invite_id);
    console.log("joining game...");
  } else {
    var message = "You have declined the game invite from " + inviter +
      ".";
    addMessage(message);
    socket.emit("decline game invite", invite_id);
  }
});

socket.on('decline invite', function(username) {
  var output = username + " has declined your game invite.";
  addMessage(output);
  console.log(output);
});

socket.on('new game', function(game_name, options) {
  // @TODO Do something with game_name
  clearMessages();
  var message = "Joined " + game_name + ".";
  addMessage(message);
  console.log(message);

  Game.start('online', options);
});

socket.on('joined room', function(room_name) {
  my_current_room = room_name;
  clearMessages();
  var message = "You have joined " + room_name + ".";
  addMessage(message);
  console.log(message);
});

$(document).ready(function() {
  $("#username").val(my_username);

  $('form.message').submit(function(e) {
    var text = $('#m').val();
    if (text) {
      socket.emit('chat message', text);
      $('#m').val('');

    }
    $("#m").focus();
    return false;
  });

  $('form.change-name').submit(function() {
    var old_username = my_username;
    var new_username = $('#username').val();
    if (new_username == old_username) {
      addMessage("Name (" + new_username + ") is the same!");
      $("input#username").focus();
      return false;
    }
    socket.emit('change name', old_username, new_username);

    $("#m").focus();
    return false;
  });

});

function addMessage(message) {
  if (my_messages[my_current_room] === undefined) {
    my_messages[my_current_room] = [];
  }
  my_messages[my_current_room].push(message);

  var new_list_item = $('<li>').text(message);
  new_list_item.click(function() {
  });
  $('#messages').append($('<li>').text(message));
  $("#messages").scrollTop($('#messages').height());
}

function clearMessages(message) {
  $('#messages').empty();
  //$("#messages").scrollTop($('#messages').height());
}

function makeUsernameListItem(username) {
  var new_list_item = $('<li class="user" username="'+username+'">');
  new_list_item.text(username);
  new_list_item.click(function() {
    var target_username = $(this).attr("username");
    if (target_username == my_username) return false;
    var invite = confirm("Invite " + target_username + " to game?");
    if (invite) {
      socket.emit("invite to game", my_username, target_username, UI.getOptions());
      /*
      var text = "/invite " + target_username;
      $("#m").val(text);
      $("form.message").submit();
      */
      console.log("Waiting for invite response...");
    }
  });
  return new_list_item;
}

