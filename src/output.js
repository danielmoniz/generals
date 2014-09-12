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
    var report = $('<div class="report"></div>')
      .css("padding-bottom", "7px")
    ;
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

  printUnit: function(unit) {
    var unit_id = unit.getId();
    var info = [];
    var general_info = Pretty.Unit.generalInfo(unit);
    var update = unit.quantity;
    if (unit.quantity <= 0) {
      update = 'Dead!'
    }
    var num_units = "Quantity: " + update;
    var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
    var in_battle = "Supply remaining: " + unit.supply_remaining;
    this.push(general_info);
    this.push(num_units);
    this.push(supply_remaining);
    if (unit.battle) this.push("(In battle)");
    this.print(true, unit_id);
  },

  printBattle: function(battle) {
    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report")
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
    var new_battle_phase = $('<div/>', {
      text: "New battle phase (turn " + battle.num_turns + "): -------------",
    });
    report.append(new_battle_phase);

    var units = battle.units_in_combat();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var general_info = Pretty.Unit.generalInfo(unit);
      var update = Pretty.Unit.status(unit.quantity);
      var num_units = "Quantity: " + update;
      var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
      var unit_div = this.createDiv("unit report")
        .attr("unit_id", unit.getId())
        .click(Pretty.Unit.selectSelf)
        ;
      unit_div.append(this.createDiv("unit-item", general_info));
      unit_div.append(this.createDiv("unit-item", num_units));
      unit_div.append(this.createDiv("unit-item", supply_remaining));
      report.append(unit_div);
    }
    var end_battle_phase = "END OF BATTLE PHASE -------------";
    report.append(this.createDiv(false, end_battle_phase));
    if (battle.finished) report.append(this.createDiv(false, "Battle finished!"));
    return this;
  },

  printBattleStart: function(battle) {
    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report")
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
    var new_battle = $('<div/>', {
      text: "New battle: -------------",
    });
    report.append(new_battle);

    var units = battle.attackers.concat(battle.defenders);
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var side = {};
      side[battle.attacker.side] = "Attacker";
      side[(battle.attacker.side + 1) % 2] = "Defender";
      var general_info = Pretty.Unit.generalInfoStartingBattle(unit);
      var unit_div = this.createDiv("unit report")
        .attr("unit_id", unit.getId())
        .click(Pretty.Unit.selectSelf)
        ;
      unit_div.append(this.createDiv("unit-item", general_info));
      report.append(unit_div);
    }
    return this;
  },

  printBattleJoin: function(battle, unit) {
    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report")
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);

    var side = {};
    side[battle.atttacking_side] = "Attacker";
    side[(battle.attacking_side + 1) % 2] = "Defender";
    var general_info = Pretty.Unit.joinBattleMessage(unit.side, unit.type, unit.battle_side);
    var unit_div = this.createDiv("unit report")
      .attr("unit_id", unit.getId())
      .click(Pretty.Unit.selectSelf)
      ;
    unit_div.append(this.createDiv("unit-item", general_info));
    report.append(unit_div);

    return this;
  },

  printRetreat: function(unit, num_losses) {

    var info_panel = $(this.main_element_id);
    var report = this.createDiv("report")
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
  
    var general_info = Pretty.Unit.retreatMessage(unit.side, unit.type, num_losses);
    var unit_div = this.createDiv("unit report")
      .attr("unit_id", unit.getId())
      .click(Pretty.Unit.selectSelf)
      ;
    unit_div.append(this.createDiv("unit-item", general_info));
    report.append(unit_div);

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

  clear: function() {
    $(this.main_element_id).empty();
    return this;
  },

  reportAttrition: function(unit, units_lost) {
    this.push(unit.report());
    this.push("Not supplied!");
    if (units_lost) this.pushLast(" {0} units lost.".format(units_lost));
    this.print(true);
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

