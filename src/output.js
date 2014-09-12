Output = {
  main_element_id: "#info-panel",
  turn_count_element_id: "#turn-count",
  player_element_id: "#player",
  buffer: [],
  push: function(info) {
    //for (var i=0; i<info.length; i++) {
      //this.buffer.push(info[i]);
      this.buffer.push(info);
    //}
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
      report.click(Pretty.Unit.selectSelf);
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

  printSingleUnit: function(unit) {
    var general_info = Pretty.Unit.generalInfo(unit);
    var status = Pretty.Unit.status(unit.quantity);
    var quantity = "Quantity: " + status;
    var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
    var unit_div = this.createUnitDiv(unit.getId(), "sub-report");
    unit_div.append(this.createDiv("unit-item", general_info));
    unit_div.append(this.createDiv("unit-item", quantity));
    unit_div.append(this.createDiv("unit-item", supply_remaining));
    if (unit.battle) unit_div.append(this.createDiv("unit-item", "(In battle)"));

    this.makeReport([unit_div]);
  },

  makeReport: function(divs, title, conclusion) {
    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report");
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
    return this;
  },

  printBattle: function(battle) {
    var title = "New battle phase (turn {0}): ---------------------------".format(battle.num_turns);
    var divs = [];

    var units = battle.units_in_combat();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var general_info = Pretty.Unit.generalInfo(unit);
      var update = Pretty.Unit.status(unit.quantity);
      var num_units = "Quantity: " + update;
      var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
      var unit_div = this.createUnitDiv(unit.getId(), "sub-report");
      unit_div.append(this.createDiv("unit-item", general_info));
      unit_div.append(this.createDiv("unit-item", num_units));
      unit_div.append(this.createDiv("unit-item", supply_remaining));
      divs.push(unit_div);
    }
    //var end_battle_phase = "END OF BATTLE PHASE -------------";
    var conclusion = undefined;
    if (battle.finished) conclusion = "Battle finished!";

    this.makeReport(divs, title, conclusion);
    return this;
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

  printBattleJoin: function(battle, unit) {
    var side = {};
    side[battle.atttacking_side] = "Attacker";
    side[(battle.attacking_side + 1) % 2] = "Defender";
    var general_info = Pretty.Unit.joinBattleMessage(unit.side, unit.type, unit.battle_side);
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
      .click(Pretty.Unit.selectSelf)
      ;
    return unit_div;
  },

  clear: function() {
    $(this.main_element_id).empty();
    return this;
  },

  printTerrain: function(terrain) {
    Output.push(terrain.type);
    if (terrain.has('Impassable')) Output.push("(Impassable)");
    Output.print();
  },

  reportAttrition: function(unit, units_lost) {
    this.push(unit.report());
    this.push("Not supplied!");
    if (units_lost) this.pushLast(" {0} units lost.".format(units_lost));
    this.print(true);
  },

  updateStatusBar: function() {
    var turn_bar = $(this.turn_count_element_id);
    var player_bar = $(this.player_element_id);
    var turn_count = "Turn {0}".format(Pretty.TurnCount.pretty());
    var player = undefined;
    var next_player_turn = Pretty.Turn.nextPlayerTurn();
    //var turn = Game.turn;
    //var player_colour = Game.player_colour[next_player_turn];
    var player_name = Pretty.Player.name(next_player_turn);

    if (Pretty.Turn.isPlayerTurn()) {
      player = "{0}'s move".format(player_name);
    } else {
      player = "{0} (up next)".format(player_name);
    }
    turn_bar.text(turn_count);
    player_bar.text(player);
  },

}

