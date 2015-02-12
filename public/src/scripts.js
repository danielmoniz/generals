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
      } else if (e.keyCode == 70 || e.keyCode == 102) { // F or f
        UI.startFire();
      } else if (e.keyCode == 71 || e.keyCode == 103) { // G or g
        UI.siege();
      } else if (e.keyCode >= 49 && e.keyCode <= 58) { // numeric key
        UI.selectUnit(e.keyCode - 48);
      } else if (shift_num_keys.indexOf(e.keyCode) > -1) { // shift + numeric key
        UI.selectAdditionalUnit(shift_num_keys.indexOf(e.keyCode) + 1);
      } else if (e.keyCode == 111) { // o
        $("input#overlays").click();
      }
      return false;
    }

  });

  jQuery.fn.single_double_click = function(single_click_callback, double_click_callback, timeout) {
    return this.each(function(){
      var clicks = 0, self = this;
      jQuery(this).click(function(event){
        clicks++;
        single_click_callback.call(self, event);
        if (clicks == 1) {
          setTimeout(function(){
            if(clicks == 1) {
              //single_click_callback.call(self, event);
            } else {
              //single_click_callback.call(self, event);
              double_click_callback.call(self, event);
            }
            clicks = 0;
          }, timeout || 300);
        }
      });
    });
  }

  $("body").click(function() {
    $('.unit-info-panel').hide();
    window.unit_panel_active = false;

    $('.overlays.popout').hide();
  });

  $("#units-info-panel").click(function(event) {
    event.stopPropagation();
  });

  $("input#overlays").click(function(event) {
    var popout = $('.overlays.popout');
    var visible = popout.is(':visible');
    $('body').click(); // close all popouts
    popout.hide();
    if (!visible) popout.show();
    $(this).blur();
    event.stopPropagation();
  });

  $('div#menus').click(function(event) {
    event.stopPropagation();
  });

  $("#battles").on('mouseenter', '.title .title', function() {
    $(this).find(".casualties").show();
  });

  $("#battles").on('mouseleave', '.title .title', function() {
    $(this).find(".casualties").hide();
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

  $("input.prepare-game").click(function() {
    UI.prepareGame(UI.getGameType($(this)));
    $(this).blur();
  });

  $("input#play-again").click(function() {
    UI.prepareGame(window.game_type, 0);
    console.log("Game.player");
    console.log(Game.player);
    $(this).blur();
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

  $("#next-turn").click(function() {
    Action.perform('next_turn');
    $(this).blur();
  });

  if (typeof socket === 'undefined') {
    $("#chat").hide();
  }

  Output.generatePlayableFactions();
  InstructionsBuilder.generateInstructions();

  // TEST ONLY -----------------
  //$("#start-hotseat-button").click();
  //$("input[name=map_size][value=tiny]").click();
  //$("input[name=factions_0][value=mongols]").click();
  //$("input[name=factions_1][value=aztecs]").click();
  //$('input[name=sight_outlines]').click();
  //$('input[name=fog_of_war]').click();
  //$("input[name=advanced_victory]").click();
  //$("#start-game").click();

  $('#test_button').click(function() {
    Crafty.trigger('RenderScene');
  });

});

UI = {
  prepareGame: function(game_type, player) {
    if (player === undefined || player == 0) {
      $("#options").show();
    } else {
      $("#options-waiting").show();
    }
    window.game_type = game_type;
    console.log("window.game_type");
    console.log(window.game_type);

    $("input.start").hide();
    $("input.prepare-game").hide();
    $("input#play-again").hide();

    $("#game-container").hide();
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
    $("#side-info-panel").show();
    $(".overlays.popout").hide();

    $("#game-container").show();
  },

  gameStarted: function() {
    $("#starting-game").hide();
    $("input#new-map").show();
  },

  gameInProgress: function() {
    $("input#new-map").hide();
    if (Game.player === undefined) {
      $("input#surrender").hide();
    } else {
      $("input#surrender").show();
    }
  },

  gameVictory: function() {
    $("input#play-again").show();
    $("input#surrender").hide();
    if (typeof window.socket !== 'undefined') {
      $("input#done-playing").show();
    }

    //$("#side-info-panel").hide();
  },

  endGame: function() {
    $("#menu").show();
    $("input.prepare-game").show();
    $("#menu-toggle-button").hide();
    $("#game-container").hide();
    $("#tool-bar").hide();
    $("#front-page").show();
    $("#options").hide();
    $("#options-waiting").hide();
    $("#starting-game").hide();
    $("input.start").show();
    $("input#done-playing").hide();
    $("input#surrender").hide();

    $("#game-container").hide();

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

  startFire: function() {
    this.performAction('start_fire');
  },

  siege: function() {
    this.performAction('siege');
  },

  performAction: function(action) {
    var buttons = $(".unit.selected .{0}".format(action));
    if (buttons.length > 1) {
      return false;
    }
    buttons.click();
  },

  getOptions: function() {
    var options = {};
    var options_form = document.getElementById("other_options");
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

    var checkboxes_form = document.getElementById("checkbox_options");
    var inputs = $(checkboxes_form).find('input');
    inputs.each(function() {
      options[this.name] = $(this).is(':checked');
    });

    return options;
  },

  getGameType: function(item) {
    return item.attr("game_type");
  },

  selectUnit: function(rank) {
    var unit_divs = $("#units-panel div.unit[rank={0}]".format(rank));
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
