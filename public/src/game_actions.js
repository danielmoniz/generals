
$(document).ready(function() {

  $("input#surrender").click(function() {
    var surrender = confirm("Are you sure you want to surrender?");
    if (surrender) {
      if (Game.type == Game.types.ONLINE) {
        socket.emit("surrender");
        console.log("Surrendering...");
      } else {
        Game.lose();
      }
    }
    // @TODO temporarily disable the surrender button
    $(this).blur();
  });

  $("input#done-playing").click(function() {
    UI.endGame();
    $(this).blur();
    socket.emit("leave game");
  });

});

GameActions = {

  endGame: function(winner) {
    // the winner reports the win
    if (Game.type == Game.types.ONLINE && winner == Game.player) {
      socket.emit("game over", [winner], [1 - winner], 'standard');
    }
  },

};
