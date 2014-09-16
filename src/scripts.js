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
});

function deselectButtons() {
  $("input#load-button").blur();
  $("input#load-map-button").blur();
}
