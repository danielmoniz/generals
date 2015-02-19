Output = {
  element_id: "#info-panel",
  main_element_id: "#info-panel",
  units_panel: "#units-panel",
  other_units_panel: "#other-units-panel",
  unit_count_panel: "#unit-count-panel",
  units_info_panel: "#units-info-panel",
  terrain_panel: "#terrain-panel",
  message_element_id: "#message-bar",
  alerts_element_id: "#alerts-panel",
  alerts_container_element_id: "#alerts-container",
  will_bar_element_id_blue: "div.will.bar.blue",
  will_bar_element_id_white: "div.will.bar.white",
  next_turn_button_id: "#next-turn",
  victory_container_id: "#will-container",
  tool_bar_id: "#tool-bar",
  side_info_panel: "#side-info-panel",
  battles_id: "#battles",
  battles_container_id: "#battles_container",
  weather_id: "#weather-panel",
  wind_id: ".wind-arrow",
  weather_conditions_id: "#weather-conditions",

  buffer: [],

  reset: function() {
    this.element_id = this.main_element_id;
    return this;
  },

  clearCounts: function() {
    $(this.unit_count_panel).empty();
  },

  clearAll: function() {
    $(this.main_element_id).empty();
    $(this.alerts_element_id).empty();
    $(this.alerts_container_element_id).hide();
    $(this.message_element_id).empty();
    $(this.battles_id).hide();
    $(this.battles_container_id).empty();
    $(this.unit_count_panel).empty();
    return this;
  },

  clearMessage: function() {
    $(this.message_element_id).empty();
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

  createWeatherPanel: function(wind) {
    $(this.weather_id).empty();
    var weather = this.createDiv("weather sunny");
    weather.attr('id', this.weather_conditions_id.slice(1));

    var wind = this.createDiv("wind-arrow");
    wind.attr('direction', 'none');
    weather.append(wind);
    $(this.weather_id).append(weather);
  },

  updateWeather: function(wind, rain) {
    if (wind === undefined) wind = 'none';
    var wind_div = $(this.wind_id);
    wind_div.attr('direction', wind);

    if (rain) {
      $('#weather-conditions').removeClass('sunny').addClass('rainy');
    } else {
      $('#weather-conditions').removeClass('rainy').addClass('sunny');
    }
  },

  printBattles: function(finished_battles) {
    $(this.battles_id).css('display', 'inline-block');

    var battles = Crafty("Battle").get();
    var battles_data = [];
    for (var i in battles) {
      battles_data.push(
        { id: battles[i].getId(), object: battles[i], type: 'battle' }
      );
    }

    for (var i in finished_battles) {
      battles_data.push(
        { id: finished_battles[i].id, object: finished_battles[i], type: 'finished battle' }
      );
    }

    battles_data.sort(function(a, b) {
      return a.id - b.id;
    });

    for (var i in battles_data) {
      var battle = battles_data[i];
      if (battle.type == 'battle') {
        this.printBattle(battle.object);
      } else if (battle.type == 'finished battle') {
        this.printFinishedBattle(battle.object);
      }
    }

    Game.finished_battles = [];

    this.updateRetreatBlocks();
  },

  printFinishedBattle: function(battle_info) {
    var battle_div = this.createDiv('battle battle_finished');
    var winning_faction = Pretty.Player.name(battle_info.winning_side);
    var winner_text = 'The {0} won!'.format(winning_faction);
    var winner = this.createDiv('winner', winner_text);
    battle_div.append(winner);

    for (var j in battle_info.unit_updates) {
      var update_div = this.buildUnitUpdate(battle_info.unit_updates[j]);
      battle_div.append(update_div);
    }

    /*
    id: battle.getId(),
    unit_updates: battle.unit_updates,
    location: battle.at(),
    attacking_side: battle.attacking_side,
    defending_side: battle.defending_side,
    winning_side: battle.winning_side,
    */

    $(this.battles_container_id).append(battle_div);
  },

  printBattle: function(battle) {
    $(this.battles_id).css('display', 'inline-block');

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

    var battle_div = this.createBattleContainerDiv(battle.getId(), 'battle battle_container');

    // TITLE DIV CONTENTS
    var title_div = this.createDiv('title');
    var attacker_div = this.createDiv('attacker title container panel');
    attacker_div.append(this.createDiv('faction_name', attacker_name));
    attacker_div.append(this.createDiv('troops', attacker_active));
    if (battle.casualties[Battle.ATTACKER]) {
      attacker_div.append(this.createDiv('popout casualties', '-' + battle.casualties[Battle.ATTACKER]));
    }

    var defender_div = this.createDiv('defender title container panel');
    defender_div.append(this.createDiv('faction_name', defender_name));
    defender_div.append(this.createDiv('troops', defender_active));
    if (battle.casualties[Battle.DEFENDER]) {
      defender_div.append(this.createDiv('popout casualties', '-' + battle.casualties[Battle.DEFENDER]));
    }

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

    var units = battle.attackers.concat(battle.defenders);
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

    for (var i in battle.unit_updates) {
      var div = this.buildUnitUpdate(battle.unit_updates[i]);
      battle_div.append(div);
    }

    battle.printed();

    return this;
  },

  buildUnitUpdate: function(update) {
    var update_text = Pretty.Battle.getUnitUpdateText(update);
    var div = this.createDiv('unit_update', update_text);
    return div;
  },

  printLosses: function() {
    clearTimeout(window.casualties_timeout);
    $(".casualties").show();
    window.casualties_timeout = setTimeout(function() {
      $(".casualties").hide();
    }, 1500);
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
    var that = this;
    var unit_div = this.createDiv(classes);
    unit_div
      .attr("unit_id", unit_id)
      //.click(this.selectSelf())
      .single_double_click(function(event) {
        $('body').click(); // close all popouts
        this.selectSelf = that.selectSelf();
        this.selectSelf(event);
        if (window.unit_panel_active) {
          that.showUnitInfoPanel($(this).attr('unit_id'));
          //event.stopPropagation();
        }
      }, function(event) {
        that.showUnitInfoPanel($(this).attr('unit_id'));
        event.stopPropagation();
      })
      ;

    return unit_div;
  },

  createStandardUnitDiv: function(unit, classes) {
    var name = Pretty.Unit.name(unit);
    var status = Pretty.Unit.status(unit.getActive(), unit.injured);
    var supply_remaining = Pretty.Unit.supplied_turns(unit.supply_remaining, unit.quantity);
    //var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
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
    var name_div = this.createDiv('unit-name', name);
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

    var third_row = this.createDiv();

    if (Game.dissent) {
      var morale_div = this.createDiv('unit-morale');
      var morale_bar_container = this.createDiv('bar_container');
      var morale_bar = this.createDiv('morale bar');

      this.updateMoraleBar(unit, morale_bar);

      morale_div.append(morale_bar_container);
      morale_bar_container.append(morale_bar);

      third_row.append(morale_div);
    }

    unit_div.append(first_row).append(second_row).append(third_row);

    return unit_div;
  },

  updateMoraleBar: function(unit, morale_bar) {
    if (!morale_bar) {
      var unit_div = this.getUnitDiv(unit);
      morale_bar = unit_div.find("div.morale.bar");
    }
    morale_bar.removeClass('add_marker');
    var morale_percent = Pretty.Morale.moralePercentage(unit.dissent);
    if (morale_percent != 0 && morale_percent != 99) {
      morale_bar.addClass('add_marker');
    }
    morale_bar.css('width', '{0}%'.format(morale_percent));
  },

  createBattleContainerDiv: function(battle_id, classes) {
    if (classes) {
      classes = "battle battle_container {0}".format(classes);
    } else {
      classes = "battle battle_container";
    }
    var battle_div = this.createDiv(classes)
      .attr("battle_id", battle_id)
      .click(this.selectSelf("battle"))
      ;
    return battle_div;
  },

  selectSelf: function(type) {
    if (!type) type = "unit";
    var type_id = "{0}_id".format(type);
    var func = function(event) {
      console.log("{0} clicked!".format(Utility.capitalizeFirstLetter(type)));
      var entity_id = parseInt($(this).attr(type_id));
      var entity = Crafty(entity_id);
      Game.select(entity);
      event.stopPropagation();
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

  printTerrain: function(terrain) {
    $(this.terrain_panel).empty();
    var output = [];
    if (terrain.name !== undefined) output.push(terrain.name);
    if (terrain.type != 'City' || terrain.name === undefined) {
      output.push(terrain.type);
    }

    var x = terrain.getX();
    var y = terrain.getY();
    if (Game.roads[x][y]) {
      output.push('(Road)');
    }

    if (terrain.has('Impassable')) output.push("(Impassable)");
    if (terrain.on_fire) {
      output.push('(burning!)');
    } else if (terrain.burned) {
      output.push('(ruined)');
    } else if (terrain.pillaged) {
      output.push("(pillaged)");
    }
    if (terrain.provides_supply) {
      output.push("Supports: {0}".format(terrain.provides_supply));
    }
    if (terrain.base_type == "Settlement") {
      output.push("Pop. {0}".format(terrain.population));
      if (terrain.supply_remaining > 0) {
        var supply = terrain.supply_remaining;
        output.push("Supply: {0}".format(supply));
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

  printUnitsPresent: function(unit, enemy_units) {
    //$(this.other_units_panel).find(".unit").hide();
    var units = enemy_units;
    if (unit.side != Game.player) {
      var units = enemy_units.concat([unit]);
    }

    for (var i in units) {
      var unit_div = $(this.other_units_panel).find("[unit_id={0}]".format(units[i].getId()));
      unit_div.show();
    }

    this.selectUnits([unit]);
    this.colocateEnemy(enemy_units);
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

  buildUnitInfo: function(unit, unit_info_panel) {
    var div = this.createDiv("", unit.type);
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}".format('Attack', unit.combat_ability));
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}".format('Defence', unit.defensive_ability));
    unit_info_panel.append(div);

    if (unit.movement == unit.max_movement) {
      var div = this.createDiv("", "{0}: {1}".format('Speed', unit.movement));
    } else {
      var div = this.createDiv("", "{0}: {1} (max. {2})".format('Speed', unit.movement, unit.max_movement));
    }
    unit_info_panel.append(div);

    var div = this.createDiv("", "{0}: {1}".format('Sight radius', unit.max_sight));
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}".format('Pillage ability', unit.pillage_ability * Game.supply_steal_factor));
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}".format('Supply usage per turn', unit.supply_usage));
    unit_info_panel.append(div);

    var div = this.createDiv("", "{0}".format('----------------'));
    unit_info_panel.append(div);

    var div = this.createDiv("", "{0}".format(unit.name));
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}/{2}".format('Supply', unit.supply_remaining, unit.max_supply));
    unit_info_panel.append(div);
    var div = this.createDiv("", "{0}: {1}%".format('Army health', Math.round(unit.getActive() / unit.quantity * 100)));
    unit_info_panel.append(div);

    // MORALE -----------
    if (Game.dissent) {
      /*
      // Testing code
      var div = this.createDiv("", "{0}: {1}".format('Dissent', Utility.roundTo2Decimals(unit.dissent)));
      unit_info_panel.append(div);
      var div = this.createDiv("", "{0}: {1}%".format('Morale (functional)', Pretty.Morale.moralePercentage(unit.dissent)));
      unit_info_panel.append(div);
      */
      var morale_improvement = Pretty.Morale.getImprovementText(unit.dissent, unit.dissent_reasons);
      var text = "{0}: {1}{2}".format('Mood', Morale.getStatus(unit.dissent), morale_improvement);
      unit_info_panel.append(this.createDiv("", text));
    }
  },

  updateUnitInfo: function(unit) {
    var unit_info_panel = $("div.unit-info-panel[unit_id={0}]".format(unit.getId()));
    unit_info_panel.empty();
    this.buildUnitInfo(unit, unit_info_panel);
    return unit_info_panel;
  },

  updateUnitInfoPanel: function() {
    window.unit_panel_active = false;
    $(this.units_info_panel).empty();
    var units = Units.getAllUnits();
    if (units[0] === undefined) return;

    for (var i in units) {
      var unit = units[i];
      var unit_info_panel = this.createDiv('unit-info-panel');
      unit_info_panel.attr('unit_id', unit.getId());
      $(this.units_info_panel).append(unit_info_panel);

      this.buildUnitInfo(unit, unit_info_panel);

      //var div = this.createDiv("", "{0}".format(unit.name));
      //unit_info_panel.append(div);

    }
  },

  showUnitInfoPanel: function(unit_id) {
    if (unit_id === undefined) throw new Error('NoUnitId');
    $('.unit-info-panel').hide();
    var unit = Crafty(parseInt(unit_id));
    if (unit === undefined) return;

    var unit_info_panel = $('.unit-info-panel[unit_id={0}]'.format(unit_id));
    $(unit_info_panel).toggle();
    window.unit_panel_active = true;
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

  setSideInfoPanel: function() {
    $(this.side_info_panel).css("margin-top", Game.board_title.height);
  },

  message: function(message) {
    $(this.message_element_id).text(message);
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
      Entity.destroy(retreat_blocks[i]);
    }

    if (Game.turn % 1 != 0) return false;

    var units = Units.getUnitsBySide(Game.player).friendly;
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
      var retreat_constraints = battle.getRetreatConstraints();
      if (retreat_constraints instanceof RetreatConstraints) {
        retreat_constraints = [[retreat_constraints]];
      }
      for (var i in retreat_constraints) {
        for (var j in retreat_constraints[i]) {
          var battle_side = battle.getBattleSideFromPlayer(Game.player);
          this.createRetreatBlocksForBattle(battle_side, retreat_constraints[i][j]);
        }
      }
    }
  },

  createRetreatBlocksForBattle: function(side, retreat_constraints) {
    var spaces = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ];
    //var spaces = retreat_constraints.getAdjacentBlockedSpaces(side, Game.map_grid);

    for (var i in spaces) {
      var blocked = !retreat_constraints.area[side][spaces[i].x][spaces[i].y];
      if (blocked) {
        var real_location = retreat_constraints.convertToActual(spaces[i]);
        var block = Entity.create('RetreatBlock');
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

    var units = Units.getFriendlyUnits(side);
    for (var i in units) {
      var unit = units[i];
      var unit_div = this.createStandardUnitDiv(unit);
      if (Game.turn == Game.player) {
        var actions_div = this.getActionsChoicesDiv(unit);
      }
      unit_div.append(actions_div);

      $(this.units_panel).append(unit_div);
    }

    var enemy_units = Units.getEnemyUnits(side);
    for (var i in enemy_units) {
      var unit = enemy_units[i];
      var unit_div = this.createStandardUnitDiv(unit);
      if (Game.turn == Game.player) {
        var actions_div = this.getActionsChoicesDiv(unit);
      }
      unit_div.append(actions_div);
      unit_div.hide();

      $(this.other_units_panel).append(unit_div);
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
      if (battle_div) battle_div.addClass('selected');
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
    if (battle === undefined) return false;
    var battle_div = $("div.battle[battle_id='{0}']".format(battle.getId()));
    var battle_container = battle_div.parents('.battle');
    return battle_container;
  },

  updateUnitDisplay: function(unit) {
    var unit_div = this.getUnitDiv(unit);

    var actions_div = unit_div.find("div.actions");
    actions_div.remove();
    var new_actions_div = this.getActionsChoicesDiv(unit);
    unit_div.append(new_actions_div);

    var supply_div = unit_div.find("div.supply");
    var supply = unit.supply_remaining;
    var supply_remaining = Pretty.Unit.supplied_turns(supply, unit.quantity);
    //var supply_remaining = Pretty.Unit.supply(unit.supply_remaining);
    supply_div.text(supply_remaining);

    this.updateMoraleBar(unit);
  },

  getActionsChoicesDiv: function(unit) {
    var actions_div = this.createDiv("actions");
    var action_choices = unit.getActionChoices();
    for (var i in action_choices) {
      var action = action_choices[i];
      var action_button = document.createElement('input');
      action_button.type = "button";
      var action_name = Utility.capitalizeFirstLetter(action.split('_').join(' '));
      action_button.value = action_name;
      action_button = $(action_button);

      var that = this;
      var action_div = this.createDiv("action")
      .val(action)
      .addClass(action)
      .click(function() {
          // get unit_id from parent
          var unit_id = parseInt($(this).closest(".unit").attr("unit_id"));
          var unit = Crafty(unit_id);
          var action = $(this).val();
          Action.perform('unit_action', unit, action);
          if (window.unit_panel_active) {
            that.showUnitInfoPanel(unit_id);
          }
          event.stopPropagation();
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

  clearEnemyUnitsPanel: function() {
    $(this.other_units_panel).find(".unit").hide();
    $(this.other_units_panel).find(".unit").removeClass('selected').removeClass('colocated');
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

