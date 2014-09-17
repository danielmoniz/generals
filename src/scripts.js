$(document).ready(function() {
  $("#load-button").click(function() {
    Game.load($("textarea#load-input").val());
  });
  $("#load-map-button").click(function() {
    Game.loadMap($("textarea#load-input").val());
  });
  $("#save-button").click(function() {
    Game.save();
  });
  $("#start-hotseat-button").click(function() {
    Game.start(Game.types.HOTSEAT);
  });
  $("#start-email-button").click(function() {
    Game.start(Game.types.EMAIL);
  });
  $("#menu-toggle-button").click(function() {
    $("#menu").toggle();
  });
  $("input.start").click(function() {
    $("#game-container").toggle();
    $("#front-page").toggle();
    $("input.start").toggle();
  });

  // TEST ONLY
  //$("#start-hotseat-button").click();
  //$("#start-email-button").click();
});


UI = {
  startGame: function() {
    $("#menu").hide();
    $("#menu-toggle-button").show();
  },

  deselectButtons: function() {
    $("input#load-button").blur();
    $("input#load-map-button").blur();
  }
}
