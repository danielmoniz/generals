$(document).ready(function() {
  // Handle key presses ------------------
  $(document).keypress(function(e) {
    var active_tag = document.activeElement.tagName.toLowerCase();
    var shift_num_keys = [33, 64, 35, 36, 37, 94, 38, 42, 40, 41];
    if (active_tag == 'body') {
      if (e.keyCode == 32) { // Space bar
        UI.nextTurn();
      } else if (e.keyCode == 80 || e.keyCode == 112) { // P or p
        UI.pillage();
      } else if (e.keyCode == 83 || e.keyCode == 115) { // S or s
        UI.sack();
      } else if (e.keyCode >= 49 && e.keyCode <= 58) { // S or s
        UI.selectUnit(e.keyCode - 48);
      } else if (shift_num_keys.indexOf(e.keyCode) > -1) { // S or s
        UI.selectAdditionalUnit(shift_num_keys.indexOf(e.keyCode) + 1);
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
    UI.prepareGame(UI.getGameType($(this)));
  });

  $("input.start-game").click(function() {
    UI.startGame();

    if (window.game_type == Game.types.ONLINE) {
      if (typeof socket === 'undefined') {
        throw new Error("NoSocketConnection", "Need to connect to server for online game.");
      }
      socket.emit("start game", UI.getOptions());
    } else {
      Game.start(window.game_type, UI.getOptions());
    }
    $(this).blur();

  });

  $("input#done-playing").click(function() {
    UI.endGame();
    $(this).blur();
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

  if (typeof socket === 'undefined') {
    $("#chat").hide();
  }

  Output.generateInstructions();

  // TEST ONLY
  //$("#start-hotseat-button").click();
  //$("#start-game").click();
  //$("#start-email-button").click();
  //$("#start-online-button").click();

});

UI = {
  prepareGame: function(game_type, player) {
    if (player === undefined || player == 0) {
      $("#options").show();
    } else {
      $("#options-waiting").show();
    }
    window.game_type = game_type;

    $("input.start").hide();
    //$("#front-page").hide();
  },

  startGame: function() {
    $("#menu").hide();
    $("#menu-toggle-button").show();
    $("#game-container").show();
    $("#front-page").hide();
    $("#options").hide();
    $("#options-waiting").hide();
    $("#starting-game").show();
    $("input#play-again").hide();
    // @TODO Fix below code! Want to dynamically set width of victory bar.
    //$("#will-container").width(35 * Game.map_grid.tile.width);
    $("ul").css("min-height", "75px");
  },

  gameStarted: function() {
    $("#starting-game").hide();
    $("input#new-map").show();
  },

  gameInProgress: function() {
    $("input#new-map").hide();
  },

  gameVictory: function() {
    $("input#play-again").show();
    if (typeof window.socket !== 'undefined') {
      $("input#done-playing").show();
    }
  },

  endGame: function() {
    $("#menu").show();
    $("#menu-toggle-button").hide();
    $("#game-container").hide();
    $("#tool-bar").hide();
    $("#front-page").show();
    $("#options").hide();
    $("#options-waiting").hide();
    $("#starting-game").hide();
    $("input.start").show();
    $("input#done-playing").hide();
    // @TODO Fix below code! Want to dynamically set width of victory bar.
    //$("#will-container").width(35 * Game.map_grid.tile.width);
    $("ul").css("min-height", "300px");

    Chat.leaveGame();
  },

  deselectButtons: function() {
    $("input#load-button").blur();
    $("input#load-map-button").blur();
  },

  nextTurn: function() {
    $("#next-turn").click();
  },

  pillage: function(e) {
    this.performAction("pillage");
  },

  sack: function(e) {
    this.performAction("sack");
  },

  performAction: function(action) {
    var buttons = $(".unit.selected .{0}".format(action));
    if (buttons.length > 1) {
      return false;
    }
    buttons.click();
    Output.updateUnitDisplays();
  },

  getOptions: function() {
    var options = {};
    var options_form = document.getElementById("options");
    var form_values = $(options_form).serializeArray()
    var factions = [];

    for (var i in form_values) {
      form_item = form_values[i];
      if (form_item.name.lastIndexOf("factions", 0) === 0) {
        factions.push(form_item.value);
      } else {
        options[form_item.name] = form_item.value;
      }
    }
    options.factions = factions;

    return options;
  },

  getGameType: function(item) {
    return item.attr("game_type");
  },

  selectUnit: function(rank) {
    var unit_divs = $("div.unit[rank={0}]".format(rank));
    if (unit_divs.length == 0) return false;

    var unit_id = parseInt(unit_divs.attr("unit_id"));
    var unit = Crafty(unit_id);
    Game.select(unit);
  },

  selectAdditionalUnit: function(rank) {
    var unit_divs = $("div.unit[rank={0}]".format(rank));
    if (unit_divs.length == 0) return false;

    var unit_id = parseInt(unit_divs.attr("unit_id"));
    var unit = Crafty(unit_id);
    Game.select(unit);
  },

}
