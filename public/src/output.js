Output = {
  element_id: "#info-panel",
  main_element_id: "#info-panel",
  message_element_id: "#message-bar",
  alerts_element_id: "#alerts-panel",
  alerts_container_element_id: "#alerts-container",
  will_bar_element_id_blue: "div.will.bar.blue",
  will_bar_element_id_white: "div.will.bar.white",
  next_turn_button_id: "#next-turn",
  buffer: [],

  push: function(info) {
    //for (var i=0; i<info.length; i++) {
      //this.buffer.push(info[i]);
      this.buffer.push(info);
    //}
    return this;
  },
  reset: function() {
    this.element_id = this.main_element_id;
    return this;
  },

  usePanel: function(panel) {
    var panels = {
      main: this.main_element_id,
      alerts: this.alerts_element_id,
      turn_count: "#turn-count",
      player: "#player",
      message: this.message_element_id,
    };
    if (panels[panel] === undefined) {
      throw "BadPanelName: Panel name did not correspond to an existing panel.";
      return false;
    }
    this.element_id = panels[panel];
    $(this.element_id).show();
    if (panel == "alerts") $(this.alerts_container_element_id).show();

    return this;
  },

  add: function(text_array) {
    for (var i=0; i<text_array.length; i++) {
      this.push(text_array[i]);
    }
    return this;
  },
  pushLast: function(text) {
    this.buffer[this.buffer.length - 1] += text;
    return this;
  },

  print: function(is_unit, unit_id) {
    //this.clear();
    this.report(this.buffer, is_unit, unit_id);
    this.buffer = [];
    return this;
  },

  report: function(info, is_unit, unit_id) {
    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report");
    info_panel.append(report);
    if (is_unit) {
      report.addClass("unit");
      report.attr("unit_id", unit_id);
      report.click(this.selectSelf());
    }
    for (var i=0; i<info.length; i++) {
      var item = $('<div class="report-item"></div>')
        .addClass("report-item")
        .append(info[i])
        ;
      report.append(item);
    }
    return this;
  },

  makeReport: function(divs, title, conclusion, inline) {
    var info_panel = $(this.element_id);
    var classes = "";
    if (!inline) classes = "report";
    // ensure that alerts don't have the report class. Makes them horizontal.
    if (this.element_id == this.alerts_element_id) classes += " alert";
    var report = this.createDiv(classes);
    info_panel.append(report);

    if (title !== undefined) {
      var title_div = this.createDiv('title', title);
      report.append(title_div);
    }

    for (var i=0; i<divs.length; i++) {
      report.append(divs[i]);
    }

    if (conclusion !== undefined) {
      var conclusion_div = this.createDiv('conclusion', conclusion);
      report.append(conclusion_div);
    }
    this.reset();
    return this;
  },

  printSingleUnit: function(unit) {
    var unit_div = this.createStandardUnitDiv(unit, "sub-report");
    var supply_div = this.createDiv("unit-item", Pretty.Unit.supply(unit.supply_remaining));
    if (unit.supply_remaining >= unit.supply_max) {
      unit_div.append(supply_div);
    }
    if (unit.battle) {
      var battle = unit.isBattlePresent();
      unit_div.append(this.createBattleDiv(battle.getId(), Pretty.Unit.inBattle()));
    }

    if (unit.action_choices) {
      var actions_div = this.createDiv("actions unit-item");
      for (var i in unit.action_choices) {
        var action = unit.action_choices[i];
        var action_button = document.createElement('input');
        action_button.type = "button";
        action_button.value = Utility.capitalizeFirstLetter(action);
        action_button = $(action_button);

        var action_div = this.createDiv("action")
        .val(action)
        .addClass(action)
        .click(function() {
            // get unit_id from parent
            var unit_id = parseInt($(this).closest(".unit").attr("unit_id"));
            var unit = Crafty(unit_id);
            var action = $(this).val();
            unit.performAction(action);
            return false;
        });
        action_div.append(action_button);
        actions_div.append(action_div);
      }
      unit_div.append(actions_div);
    }

    this.makeReport([unit_div]);
  },

  printBattleStart: function(battle) {
    var title = "New battle: -------------";
    var divs = [];

    var units = battle.attackers.concat(battle.defenders);
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var side = {};
      side[battle.attacker.side] = "Attacker";
      side[(battle.attacker.side + 1) % 2] = "Defender";
      var general_info = Pretty.Unit.generalInfoStartingBattle(unit);
      var unit_div = this.createUnitDiv(unit.getId());
      unit_div.append(this.createDiv("unit-item", general_info));
      divs.push(unit_div);
    }
    this.makeReport(divs, title);
    return this;
  },

  printBattle: function(battle) {
    var title = "New battle phase (turn {0}): ---------------------------".format(battle.num_turns);
    var divs = [];

    var units = battle.units_in_combat();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var unit_div = this.createStandardUnitDiv(unit, "sub-report");
      divs.push(unit_div);
    }
    var conclusion = undefined;
    if (battle.finished) conclusion = "Battle finished!";

    this.makeReport(divs, title, conclusion);
    return this;
  },

  printBattleJoin: function(battle, unit) {
    var side = {};
    side[battle.atttacking_side] = "Attacker";
    side[(battle.attacking_side + 1) % 2] = "Defender";
    var general_info = Pretty.Unit.joinBattleMessage(unit.side, unit.type, unit.battle_side, unit.getActive());
    var unit_div = this.createUnitDiv(unit.getId(), "report");
    unit_div.append(this.createDiv("unit-item", general_info));
    this.makeReport([unit_div]);

    return this;
  },

  printRetreat: function(unit, num_losses) {
    var general_info = Pretty.Unit.retreatMessage(unit.side, unit.type, num_losses);
    var unit_div = this.createUnitDiv(unit.getId(), "report");
    unit_div.append(this.createDiv("unit-item", general_info));
    this.makeReport([unit_div]);

    return this;
  },

  createDiv: function(classes, text) {
    if (!classes) classes = "";
    if (!text) text = "";
    var div = $('<div/>', {
      class: classes,
      text: text,
    });
    return div;
  },

  createUnitDiv: function(unit_id, classes) {
    if (classes) {
      classes = "unit {0}".format(classes);
    } else {
      classes = "unit";
    }
    var unit_div = this.createDiv(classes)
      .attr("unit_id", unit_id)
      .click(this.selectSelf())
      ;
    return unit_div;
  },

  createStandardUnitDiv: function(unit, classes) {
    var general_info = Pretty.Unit.generalInfo(unit);
    var name = Pretty.Unit.name(unit);
    var status = Pretty.Unit.status(unit.getActive(), unit.injured);
    var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);

    var unit_div = this.createUnitDiv(unit.getId(), classes);
    var name_div = this.createDiv("unit-item");
    var img = this.createIconImage(unit);
    var img_div = this.createDiv("unit-item column", name);
    img_div.append(img);
    name_div.append(img_div);
    //unit_div.append(this.createDiv("unit-item", general_info));
    //name_div.append(this.createDiv("unit-item column", name));
    unit_div.append(name_div);
    unit_div.append(this.createDiv("unit-item", status));
    if (unit.supply_remaining < unit.max_supply) {
      unit_div.append(this.createDiv("unit-item", supply_remaining));
    }

    return unit_div;
  },

  createBattleDiv: function(battle_id, text, classes) {
    if (classes) {
      classes = "battle {0}".format(classes);
    } else {
      classes = "battle";
    }
    var battle_div = this.createDiv(classes, text)
      .attr("battle_id", battle_id)
      .click(this.selectSelf("battle"))
      ;
    return battle_div;
  },

  selectSelf: function(type) {
    if (!type) type = "unit";
    var type_id = "{0}_id".format(type);
    var func = function() {
      console.log("{0} clicked!".format(Utility.capitalizeFirstLetter(type)));
      var entity_id = parseInt($(this).attr(type_id));
      var unit = Crafty(entity_id);
      console.log("Unit battle value: {0}".format(unit.battle));
      Game.select(unit);
    }
    return func;
  },

  createIconImage: function(unit) {
    var img = $('<img/>', {
      src: unit.__image,
      class: "icon",
    });
    return img;
  },

  clearMain: function() {
    $(this.main_element_id).empty();
    return this;
  },

  clearAll: function() {
    $(this.main_element_id).empty();
    $(this.alerts_element_id).empty();
    $(this.alerts_container_element_id).hide();
    $(this.message_element_id).empty();
    return this;
  },

  printTerrain: function(terrain) {
    Output.push(terrain.type);
    if (terrain.has('Impassable')) Output.push("(Impassable)");
    if (terrain.has("Farm")) {
      if (terrain.pillaged) {
        Output.pushLast(" (pillaged)");
      }
    }
    if (terrain.has("Village")) {
      if (terrain.supply_remaining > 0) {
        Output.push("Supply: {0}".format(terrain.supply_remaining));
      } else {
        Output.push("Sacked!");
      }
    }
    Output.print();
  },

  reportAttrition: function(unit, units_lost) {
    var unsupplied = Pretty.Unit.unsupplied(units_lost);
    var unit_div = this.createStandardUnitDiv(unit);
    unit_div.append(this.createDiv("unit-item", unsupplied));
    this.makeReport([unit_div], false, false, "inline");

    return this;
  },

  printUnitsPresent: function(units) {
    var title = Pretty.Unit.unitsPresentTitle();
    var divs = [];

    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var unit_div = this.createStandardUnitDiv(unit, "sub-report");
      if (unit.battle) {
        var battle = unit.isBattlePresent();
        unit_div.append(this.createBattleDiv(battle.getId(), Pretty.Unit.inBattle()));
      }
      divs.push(unit_div);
    }

    this.makeReport(divs, title);
    return this;
  },

  updateStatusBar: function() {
    var turn_count = "Turn {0}".format(Pretty.TurnCount.pretty());
    var player = undefined;
    var next_player_turn = Pretty.Turn.nextPlayerTurn();
    var player_name = Pretty.Player.name(next_player_turn);

    if (Pretty.Turn.isPlayerTurn()) {
      player = "{0}'s move".format(player_name);
    } else {
      player = "{0} (up next)".format(player_name);
    }

    if (Game.title_bar) {
      Game.title_bar.turn_counter.text(turn_count);
      Game.title_bar.turn_indicator.text(player);
    }
    return this;
  },

  updateVictoryBar: function(hard_reset) {
    var will_bar = $(this.will_element_id);
    if (hard_reset) {
      return this.resetVictoryBar();
    }
    if (Victory.will_to_fight) {
      var p0_will = Victory.will_to_fight[0].toFixed(0);
      var p1_will = Victory.will_to_fight[1].toFixed(0);
      var will = "{0}% - {1}%".format(p0_will, p1_will);
      will_bar.text(will);
    } else {
      return this.resetVictoryBar();
    }
    var will_text = "(Blue) {0} (White)".format(will);

    $(this.will_bar_element_id_blue).width("{0}%".format(p0_will));
    $(this.will_bar_element_id_white).width("{0}%".format(p1_will));

    if (Game.title_bar) {
      Game.title_bar.willpower.text(will_text);
    }
  },

  resetVictoryBar: function() {
    if (Game.title_bar) {
      var will = "(Blue) 100% - 100% (White)";
      Game.title_bar.willpower.text(will);
    }
    return this;
  },

  message: function(message) {
    $(this.message_element_id).text(message);
    return this;
  },

  clearMessage: function() {
    $(this.message_element_id).empty();
    return this;
  },

  updateNextTurnButton: function(turn) {
    var text = "Start Turn";
    if (turn % 1 == 0) {
      text = "Next Turn";
    }
    $(this.next_turn_button_id).val(text);
  },

}

