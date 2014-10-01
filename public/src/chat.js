
$(document).ready(function() {
  $("#username").val(my_username);
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
      var text = "/invite " + target_username;
      $("#m").val(text);
      $("form.message").submit();
      console.log("Waiting for invite response...");
    }
  });
  return new_list_item;
}

