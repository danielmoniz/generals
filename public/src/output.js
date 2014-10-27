Output = {
  element_id: "#info-panel",
  main_element_id: "#info-panel",
  units_panel: "#units-panel",
  other_units_panel: "#other-units-panel",
  unit_count_panel: "#unit-count-panel",
  terrain_panel: "#terrain-panel",
  message_element_id: "#message-bar",
  alerts_element_id: "#alerts-panel",
  alerts_container_element_id: "#alerts-container",
  will_bar_element_id_blue: "div.will.bar.blue",
  will_bar_element_id_white: "div.will.bar.white",
  next_turn_button_id: "#next-turn",
  victory_container_id: "#will-container",
  tool_bar_id: "#tool-bar",
  battles_id: "#battles",
  battles_container_id: "#battles_container",

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
      terrain: this.terrain_panel,
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

    this.makeReport([unit_div]);
  },

  printBattleStart: function(battle) {
    var title = "New battle: {0}".format(this.getBattleStatus(battle));

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

  printBattleOld: function(battle) {
    var title = "New battle phase (round {0}): {1}".format(battle.num_turns, this.getBattleStatus(battle));
    var divs = [];

    var units = battle.unitsInCombat();
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

  printBattles: function() {
    var battles = Crafty("Battle").get();
    for (var i in battles) {
      this.printBattle(battles[i]);
    }
  },

  printBattle: function(battle) {
    $(this.battles_id).css('display', 'inline-block');
    //var status = this.getBattleStatus(battle);
    var total_troops = battle.getTotalTroops();
    var attacker_active = total_troops[battle.attacking_side].active;
    var attacker_injured = total_troops[battle.attacking_side].injured;
    var attacker_total = total_troops[battle.attacking_side].total;
    var defender_active = total_troops[battle.defending_side].active;
    var defender_injured = total_troops[battle.defending_side].injured;
    var defender_total = total_troops[battle.defending_side].total;

    //var num_turns = battle.num_turns;
    var attacker_name = Pretty.Player.name(battle.attacking_side);
    var defender_name = Pretty.Player.name(battle.defending_side);

    var battle_div = this.createDiv('battle battle_container');

    // TITLE DIV CONTENTS
    var title_div = this.createDiv('title');
    var attacker_div = this.createDiv('attacker container panel');
    attacker_div.append(this.createDiv('', attacker_name));
    attacker_div.append(this.createDiv('', attacker_active));

    var defender_div = this.createDiv('defender container panel');
    defender_div.append(this.createDiv('', defender_name));
    defender_div.append(this.createDiv('', defender_active));

    var battle_icon_div = this.createDiv('square');
    battle_icon_div.attr("battle_id", battle.getId());
    battle_icon_div.addClass("battle");

    title_div.append(attacker_div);
    title_div.append(battle_icon_div);
    title_div.append(defender_div);

    battle_div.append(title_div);


    // STATS DIV CONTENTS
    var stats_div = this.createDiv('stats');

    var attacker_types_div = this.createDiv('attacker types panel');
    var attacker_ranks_div = this.createDiv('attacker ranks panel');
    var defender_types_div = this.createDiv('defender types panel');
    var defender_ranks_div = this.createDiv('defender ranks panel');
    var total_stats_div = this.createDiv('total-stats-display panel');

    stats_div.append(attacker_types_div);
    stats_div.append(attacker_ranks_div);
    stats_div.append(total_stats_div);
    stats_div.append(defender_ranks_div);
    stats_div.append(defender_types_div);

    var units = battle.unitsInCombat();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];

      var img = this.createIconImage(unit);
      var unit_type_div = this.createUnitDiv(unit.getId(), 'icon');
      if (battle.new_units.indexOf(unit) > -1) unit_type_div.addClass('new');
      unit_type_div.append(img);

      var rank_div = this.createUnitDiv(unit.getId(), 'icon rank_{0}'.format(unit.rank));

      if (unit.side == battle.attacking_side) {
        attacker_types_div.append(unit_type_div);
        attacker_ranks_div.append(rank_div);
      } else {
        defender_types_div.append(unit_type_div);
        defender_ranks_div.append(rank_div);
      }
    }

    battle_div.append(stats_div);

    var conclusion = undefined;
    if (battle.finished) conclusion = "Battle finished!";

    $(this.battles_container_id).append(battle_div);

    // add visual bar indicators after in order properly to get height()

    var max_height = Math.max(attacker_types_div.height(), defender_types_div.height());
    //var total_troops = battle.getTotalTroops();

    if (attacker_total > defender_total) {
      var attacker_height = max_height;
      var defender_height = defender_total / attacker_total * max_height;
    } else {
      var defender_height = max_height;
      var attacker_height = attacker_total / defender_total * max_height;
    }

    var attacker_active_height = attacker_active / attacker_total * attacker_height;
    var attacker_injured_height = attacker_injured / attacker_total * attacker_height;
    var defender_active_height = defender_active / defender_total * defender_height;
    var defender_injured_height = defender_injured / defender_total * defender_height;

    var space_div = this.createDiv('panel').css('width', '7px');

    var attacker_bar_div = this.createDiv('attacker panel bar_container');
    var active_bar = this.createDiv('active bar').css('height', '{0}px'.format(attacker_active_height));
    var injured_bar = this.createDiv('injured bar').css('height', '{0}px'.format(attacker_injured_height));
    attacker_bar_div.append(active_bar).append(injured_bar);

    var defender_bar_div = this.createDiv('defender panel bar_container');
    var active_bar = this.createDiv('active bar').css('height', '{0}px'.format(defender_active_height));
    var injured_bar = this.createDiv('injured bar').css('height', '{0}px'.format(defender_injured_height));
    defender_bar_div.append(active_bar).append(injured_bar);

    total_stats_div.append(space_div).append(attacker_bar_div).append(defender_bar_div);

    battle.resetNewUnits();

    return this;
  },

  getBattleStatus: function(battle, type) {
    var total_troops = battle.getTotalTroops();
    if (type == "injured") {
      var first_player_status = "{0}/{1}".format(total_troops[0].active, total_troops[0].total);
      var second_player_status = "{0}/{1}".format(total_troops[1].active, total_troops[1].total);
    } else if (type == "total") {
      var first_player_status = "{0}".format(total_troops[0].total);
      var second_player_status = "{0}".format(total_troops[1].total);
    } else {
      var first_player_status = "{0}".format(total_troops[0].active);
      var second_player_status = "{0}".format(total_troops[1].active);
    }
    var status = "{0} - {1}".format(first_player_status, second_player_status);
    return status;
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
    var name = Pretty.Unit.name(unit);
    var status = Pretty.Unit.status(unit.getActive(), unit.injured);
    var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
    var supply_status = 'supplied';
    if (!unit.is_supplied) supply_status = 'unsupplied';

    var unit_div = this.createUnitDiv(unit.getId(), classes);
    unit_div.attr("rank", unit.rank);

    var first_row = this.createDiv();
    var img = this.createIconImage(unit);
    var img_div = this.createDiv('unit-item');
    img_div.append(img);
    first_row.append(img_div);

    var main_info_div = this.createDiv('unit-item');
    var name_div = this.createDiv('', name);
    var status_div = this.createDiv("status", status);
    if (unit.getActive() < Game.min_troops_for_supply_cut) {
      status_div.addClass("small");
    }
    main_info_div.append(name_div).append(status_div);
    first_row.append(main_info_div);

    var second_row = this.createDiv();
    var rank_div = this.createDiv('square rank_{0}'.format(unit.rank));
    second_row.append(rank_div);
    var supply_div = this.createDiv("unit-item square supply {0}".format(supply_status), supply_remaining);
    second_row.append(supply_div);

    var battle_div = this.createDiv('square');
    if (unit.battle) {
      var battle = unit.isBattlePresent();
      battle_div.attr("battle_id", battle.getId());
      battle_div.addClass("battle");
    }
    second_row.append(battle_div);

    unit_div.append(first_row).append(second_row);

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

  clearCounts: function() {
    $(this.unit_count_panel).empty();
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
    $(this.battles_id).hide();
    $(this.battles_id).hide();
    $(this.battles_container_id).empty();
    $(this.unit_count_panel).empty();
    return this;
  },

  printTerrain: function(terrain) {
    $(this.terrain_panel).empty();
    var output = [];
    if (terrain.name !== undefined) output.push(terrain.name);
    output.push(terrain.type);
    if (terrain.has('Impassable')) output.push("(Impassable)");
    if (terrain.has("Farm")) {
      if (terrain.pillaged) {
        output[output.length -1] += " (pillaged)";
      }
    }
    if (terrain.has("City")) {
      if (terrain.supply_remaining > 0) {
        output.push("Supply: {0}".format(terrain.supply_remaining));
      } else {
        output.push("Sacked!");
      }
    }

    var output_html = "";
    for (var i in output) {
      output_html += output[i] + "<br />";
    }
    $(this.terrain_panel).append(output_html);
  },

  reportAttrition: function(unit, units_lost) {
    var unsupplied = Pretty.Unit.unsupplied(units_lost);
    var unit_div = this.createStandardUnitDiv(unit);
    unit_div.append(this.createDiv("unit-item", unsupplied));
    this.makeReport([unit_div], false, false, "inline");

    return this;
  },

  printUnitsPresent: function(unit, other_units) {
    $(this.other_units_panel).empty();

    var units = other_units;
    if (unit.side != Game.player) {
      var units = other_units.concat([unit]);
    }
    // sort units by rank for visual consistency
    units.sort(function(a, b) {
      return a.rank - b.rank;
    });
    for (var i in units) {
      var unit_div = this.createStandardUnitDiv(units[i]);
      $(this.other_units_panel).append(unit_div);
    }

    this.selectUnits([unit]);
    this.colocateEnemy(other_units);
    return this;
  },

  printTotalUnitsPresent: function(selected_unit, other_units) {
    $(this.unit_count_panel).empty();

    var total = { active: 0, injured: 0, total: 0, };
    var all_units = other_units.concat([selected_unit]);
    for (var i in all_units) {
      var unit = all_units[i];
      if (unit.side != selected_unit.side) continue;
      total['active'] += unit.getActive();
      total['injured'] += unit.quantity - unit.getActive();
      total['total'] += unit.quantity;
    }

    var title = Pretty.Unit.unitsPresentTitle(total.active, total.injured, total.total);
    $(this.unit_count_panel).append("{0}<br />".format(Pretty.Unit.unitsPresentTitle()));
    $(this.unit_count_panel).append(Pretty.Unit.unitsPresent(total.active, total.injured, total.total));
  },

  updateStatusBar: function() {
    var turn_count = "Turn {0}".format(Pretty.TurnCount.pretty());
    var player = undefined;
    var next_player_turn = Pretty.Turn.nextPlayerTurn();
    var player_name = Pretty.Player.name(next_player_turn);

    if (Pretty.Turn.isPlayerTurn()) {
      player = "{0}".format(player_name);
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

  setVictoryBar: function(id, start_tile) {
    this.victory_container_id = "#" + id;
    // I have idea why I have to fudge the math here, but it seems to work
    var width = ((Game.map_grid.width + 0.35) - start_tile) * Game.map_grid.tile.width - 1;
    width = Math.floor(width);
    if (width % 2 == 0) width -= 1;
    $(this.victory_container_id).width("{0}px".format(width));
    return width;
  },

  resetVictoryBar: function() {
    if (Game.title_bar) {
      var will = "(Blue) 100% - 100% (White)";
      Game.title_bar.willpower.text(will);
    }
    return this;
  },

  setToolBar: function() {
    var width = Game.map_grid.width * Game.map_grid.tile.width;
    $(this.tool_bar_id).width("{0}px".format(width));
    $(this.tool_bar_id).show();
  },

  setBattlePanel: function() {
    $(this.battles_id).css("margin-top", Game.board_title.height);
  },

  message: function(message) {
    $(this.message_element_id).text(message);
    return this;
  },

  clearMessage: function() {
    $(this.message_element_id).empty();
    return this;
  },

  updateNextTurnButton: function(text) {
    var text = "Start Turn";
    if (Game.type == Game.types.ONLINE) {
      if (Game.turn == Game.player && Game.turn % 1 == 0) {
        text = "Done!";
      } else if (Game.player == 0 && Game.turn % 1 == 0.5) {
        text = "Begin Game";
      } else {
        text = "Waiting for opponent...";
      }
    } else {
      if (Game.turn % 1 == 0) {
        text = "Next Turn";
      }
    }
    $(this.next_turn_button_id).val(text);
  },

  updateRetreatBlocks: function() {
    var retreat_blocks = Crafty('RetreatBlock').get();
    for (var i in retreat_blocks) {
      retreat_blocks[i].destroy();
    }

    if (Game.turn % 1 != 0) return false;

    var units = Unit.getUnitsBySide(Game.player).friendly;
    var battles = {};
    for (var i in units) {
      var battle = units[i].isBattlePresent();
      if (battle) {
        battles[battle[0]] = units[i].battle_side;
      }
    }

    for (var key in battles) {
      var battle = Crafty(parseInt(key));
      var side = battles[key];
      var retreat_constraints = battle.retreat_constraints[side];
      this.createRetreatBlocksForBattle(retreat_constraints);
    }
  },

  createRetreatBlocksForBattle: function(retreat_constraints) {
    var spaces = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ];

    for (var i in spaces) {
      var blocked = !retreat_constraints.area[spaces[i].x][spaces[i].y];
      if (blocked) {
        var real_location = retreat_constraints.convertToActual(spaces[i]);
        var block = Crafty.e('RetreatBlock');
        block.at(real_location.x, real_location.y);
        var cardinal_direction = retreat_constraints.relativeToCardinalDirection(spaces[i]);
        block.setSide('enemy', cardinal_direction);
      }
    }
  },

  generatePlayableFactions: function() {
    var options = $("div#faction_selection");

    var playable_factions = [];
    for (var name in Factions) {
      var faction = Factions[name];
      if (!faction.disabled) {
        playable_factions.push(name);
      }
    }

    for (var i=0; i<2; i++) { // assumes at least 2 playable factions
      var option_set = this.createDiv('option_set');
      if (i == 0) {
        option_set.text('Faction (first player)');
      } else if (i == 1){
        option_set.text('Faction (second player)');
      }
      for (var j in playable_factions) {
        var faction_name = playable_factions[j];
        var faction = Factions[faction_name];
        var option_div = this.createDiv('option');

        var radio_button = $('<input/>', {
          id: 'player_{0}_faction_selector_{1}'.format(i, faction_name),
          type: 'radio',
          name: 'factions_{0}'.format(i),
          value: faction_name,
        });
        var label = $('<label/>'.format(), {
          text: faction.name,
        });
        label.attr('for', radio_button.attr('id'));
        if (j == i) radio_button.attr('checked', 'checked');

        option_div.append(radio_button);
        option_div.append(label);
        option_set.append(option_div);
      }

      options.append(option_set);
    }
  },

  generateInstructions: function() {
    this.addTitle('About the Game');
    this.addInstruction('general_intro');
    this.addInstructionList('strategic_elements');
    this.addInstruction('goal');
    this.addInstruction('map');
    this.addInstruction('how_to_win');
    this.addInstruction('morale_general');

    this.addTitle('How to Play');
    this.addSubTitle('The Basics');
    this.addInstruction('general_instructions');
    this.addInstruction('how_to_start_combat');
    this.addSubTitle('Morale');
    this.addInstruction('morale_general');
    this.addInstruction('morale');
    this.addSubTitle('Combat');
    this.addInstruction('combat_general');
    this.addInstruction('casualties');
    this.addSubTitle('Injured troops');
    this.addInstruction('injured_display');
    this.addInstruction('injured_troops');
    this.addInstruction('healing');
    this.addSubTitle('Supply');
    this.addInstruction('supply_general');
    this.addInstruction('supply_routes');
    this.addInstruction('unsupplied');
    this.addInstruction('supplied');
    this.addInstruction('other_factors');
    this.addSubTitle('Retreating');
    this.addInstruction('retreat_general');
    this.addInstruction('retreat_constraints');
    this.addSubTitle('Terrain Types');
    this.addInstruction('terrain_types_intro');
    this.addInstructionList('terrain_types');
    this.addSubTitle('Army/Unit Types');
    this.addInstruction('unit_composition');

    this.addTitle('Game Modes');
    this.addInstructionList('game_modes');
    this.addInstruction('hotseat');
    this.addInstruction('online');

    this.addTitle('Tips');
    this.addInstruction('selection');
    this.addInstruction('two_armies_better_than_one');
    this.addInstruction('retreat_movement_bonus');
    this.addInstruction('');
    this.addInstruction('');
    this.addInstruction('');
    this.addInstruction('');
  },

  createInstructionBlock: function(text, type) {
    if (!type) type = "p";
    var block = $("<{0} />".format(type));
    block.text(text);
    return block;
  },

  addTitle: function(text) {
    var block = this.createInstructionBlock(text, 'h2');
    $("#instructions").append(block);
  },

  addSubTitle: function(text) {
    var block = this.createInstructionBlock(text, 'h3');
    $("#instructions").append(block);
  },

  addInstruction: function(name, type) {
    var text = Instructions[name];
    var block = this.createInstructionBlock(text, type);
    $("#instructions").append(block);
  },

  addInstructionList: function(name) {
    var list = Instructions[name];
    var block = this.createInstructionBlock('', 'ul');
    $("#instructions").append(block);
    for (var i in list) {
      var list_item = this.createInstructionBlock(list[i], 'li');
      block.append(list_item);
    }
  },

  getVictoryHtml: function(winning_player_num) {
    var basic_message = Pretty.Victory.getWinnerMessage(winning_player_num);
    var basic_message_div = this.createDiv('victory title', basic_message);
    var descriptive_message = Pretty.Victory.getDescriptiveMessage(winning_player_num);
    var descriptive_message_div = this.createDiv('victory outcome', descriptive_message);
    var faction_win_message = Pretty.Victory.getFactionWinMessage(winning_player_num);
    if (faction_win_message) {
      var faction_win_message_div = this.createDiv('victory message', faction_win_message);
    }
    var faction_loss_message = Pretty.Victory.getFactionLossMessage(winning_player_num);
    if (faction_loss_message) {
      var faction_loss_message_div = this.createDiv('victory message', faction_loss_message);
    }

    var container = this.createDiv();
    container.append(basic_message_div);
    container.append(descriptive_message_div);
    container.append(faction_win_message_div);
    container.append(faction_loss_message_div);
    return container.html();
  },

  updateUnitsPanel: function() {
    if (Game.type == Game.types.HOTSEAT) {
      var side = Game.turn;
    } else {
      var side = Game.player;
    }
    $(this.units_panel).empty();
    $(this.other_units_panel).empty();

    var units = Unit.getFriendlyUnits(side);
    for (var i in units) {
      var unit = units[i];
      var unit_div = this.createStandardUnitDiv(unit);
      var actions_div = this.getActionsChoicesDiv(unit);
      unit_div.append(actions_div);

      $(this.units_panel).append(unit_div);
    }

  },

  selectUnits: function(units) {
    var battles = [];
    for (var i in units) {
      var unit = units[i];
      var unit_div = this.getUnitDiv(unit);
      unit_div.addClass('selected');

      if (unit.battle) {
        var battle = unit.isBattlePresent();
        if (battles.indexOf(battle) == -1 ) {
          battles.push(battle);
        }
      }
    }

    this.selectBattles(battles);
  },

  selectBattles: function(battles) {
    for (var i in battles) {
      var battle = battles[i];
      var battle_div = this.getBattleDiv(battle);
      battle_div.addClass('selected');
    }
  },

  colocate: function(units, type) {
    if (type === undefined) type = 'colocated';
    for (var i in units) {
      var unit = units[i];
      var unit_div = this.getUnitDiv(unit);
      unit_div.addClass(type);
    }
  },

  colocateEnemy: function(units) {
    this.colocate(units, 'colocatedEnemy');
  },

  getUnitDiv: function(unit) {
    var unit_div = $("div.unit[unit_id='{0}']".format(unit.getId()));
    return unit_div;
  },

  getBattleDiv: function(battle) {
    var battle_div = $("div.battle[battle_id='{0}']".format(battle.getId()));
    var battle_container = battle_div.parents('.battle');
    return battle_container;
  },


  /*
  updateUnitDisplays: function() {
    var unit_divs = $("div.unit");
    var that = this;
    unit_divs.each(function() {
      that.updateUnitDisplay($(this));

      //that.updateActionsDiv($(this));
      //that.updateSupply($(this));
    });
  },
  */

  updateUnitDisplay: function(unit) {
    var unit_div = this.getUnitDiv(unit);

    var actions_div = unit_div.find("div.actions");
    actions_div.remove();
    var new_actions_div = this.getActionsChoicesDiv(unit);
    unit_div.append(new_actions_div);

    var supply_div = unit_div.find("div.supply");
    var unit = Crafty(parseInt(unit_div.attr("unit_id")));
    var supply = Pretty.Unit.supply(unit.supply_remaining);
    supply_div.text(supply);
  },

  getActionsChoicesDiv: function(unit) {
    var actions_div = this.createDiv("actions");
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
          Action.perform('unit action', unit, action);
          return false;
      });
      action_div.append(action_button);
      actions_div.append(action_div);
    }

    return actions_div;
  },

  clearUnitsPanelSelect: function() {
    var selected_units = $(this.units_panel).find(".selected");
    selected_units.removeClass("selected");
    this.clearColocatedUnits();
  },

  clearBattlesPanelSelect: function() {
    var selected_battles = $(this.battles_container_id).find(".selected");
    selected_battles.removeClass("selected");
  },

  clearColocatedUnits: function() {
    $(".colocated").removeClass("colocated");
  },

  clearNewUnitsInBattle: function() {
    $(".battle .unit.new").removeClass("new");
  },

  notYourMove: function() {
    var next_player_turn = Pretty.Turn.nextPlayerTurn();
    var player_name = Pretty.Player.name(next_player_turn);
    var message = "";
    if (Pretty.Turn.isPlayerTurn()) {
      message = "{0} move!".format(player_name);
    } else {
      message = "{0} turn is next!".format(player_name);
    }
    Output.message(message);
  },

}

