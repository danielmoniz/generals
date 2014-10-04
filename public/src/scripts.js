$(document).ready(function() {
  // Handle key presses ------------------
  $(document).keypress(function(e) {
    var active_tag = document.activeElement.tagName.toLowerCase();
    if (active_tag == 'body') {
      if (e.keyCode == 32) { // Space bar
        UI.nextTurn();
      } else if (e.keyCode == 80 || e.keyCode == 112) { // P or p
        UI.pillage();
      } else if (e.keyCode == 83 || e.keyCode == 115) { // S or s
        UI.sack();
      }
      return false;
    }
  });

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

  $("#menu-toggle-button").click(function() {
    $("#menu").toggle();
  });

  $("input.start").click(function() {
    UI.startGame();

    //var game_type = $(this).attr("game_type");
    Game.start(UI.getGameType($(this)), UI.getOptions());
  });

  $("#next-turn").click(function() {
    //if (Game.type == Game.types.ONLINE && Game.turn % 1 == 0) {
    if (Game.type == Game.types.ONLINE) {
      Game.nextTurnOnline()
    } else {
      Game.nextTurn();
    }

    $(this).blur();
    return false;
  });

  $("#tool-bar").width("{0}px".format(Game.map_grid.width * Game.map_grid.tile.width));

  // TEST ONLY
  //$("#start-hotseat-button").click();
  //$("#start-email-button").click();
  //$("#start-online-button").click();

});

UI = {
  startGame: function() {
    $("#menu").hide();
    $("#menu-toggle-button").show();
    $("#game-container").show();
    $("#front-page").hide();
    $("#options").hide();
    // @TODO Fix below code! Want to dynamically set width of victory bar.
    //$("#will-container").width(35 * Game.map_grid.tile.width);
  },

  deselectButtons: function() {
    $("input#load-button").blur();
    $("input#load-map-button").blur();
  },

  nextTurn: function() {
    $("#next-turn").click();
  },

  pillage: function(e) {
    $(".pillage").click();
  },

  sack: function(e) {
    $(".sack").click();
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

  getGameType: function(item) {
    return item.attr("game_type");
  },

}
