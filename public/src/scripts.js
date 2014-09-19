$(document).ready(function() {
  $("#load-button").click(function() {
    Game.load($("textarea#load-input").val());
    $("#game-container").show();
    $("#options").hide();
    $("#front-page").hide();
  });
  $("#load-map-button").click(function() {
    Game.loadMap($("textarea#load-input").val());
  });
  $("#save-button").click(function() {
    Game.save();
  });
  $("#start-hotseat-button").click(function() {
    var options = {};
    var options_form = document.getElementById("options");
    for (var i=0; i<options_form.elements.length; i++) {
      var e = options_form.elements[i];
      if (e.type == "checkbox") options[e.name] = e.checked;
    }
    Game.start(Game.types.HOTSEAT, UI.getOptions());
  });
  $("#start-email-button").click(function() {
    Game.start(Game.types.EMAIL, UI.getOptions());
  });
  $("#menu-toggle-button").click(function() {
    $("#menu").toggle();
  });
  $("input.start").click(function() {
    $("#game-container").toggle();
    $("#front-page").toggle();
    $("input.start").toggle();
    $("#options").toggle();
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
  },

getOptions: function() {
  var options = {};
  var options_form = document.getElementById("options");
  for (var i=0; i<options_form.elements.length; i++) {
    var e = options_form.elements[i];
    if (e.type == "checkbox") options[e.name] = e.checked;
  }
  return options;
},
}
