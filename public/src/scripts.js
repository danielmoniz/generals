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

  $("#next-turn").click(function() {
    Game.nextTurn();
    return false;
  });

  $("#tool-bar").width("{0}px".format(Game.map_grid.width * Game.map_grid.tile.width));

  // TEST ONLY
  $("#start-hotseat-button").click();
  //$("#start-email-button").click();

});

UI = {
  startGame: function() {
    $("#menu").hide();
    $("#menu-toggle-button").show();
    // @TODO Fix below code! Want to dynamically set width of victory bar.
    //$("#will-container").width(35 * Game.map_grid.tile.width);
  },

  deselectButtons: function() {
    $("input#load-button").blur();
    $("input#load-map-button").blur();
  },

  nextTurn: function(e) {
    if (e.key == Crafty.keys.SPACE) {
      $("#next-turn").click();
    } else {
      //console.log(e);
    }
    return false;
  },

  pillage: function(e) {
    if (e.key == 80) {
      $(".pillage").click();
    } else {
    }
    return false;
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
