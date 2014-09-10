Output = {
  element_id: "#info-panel",
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

  print: function(is_unit) {
    console.log('called');
    //this.clear();
    this.report(this.buffer, is_unit);
    this.buffer = [];
    return this;
  },

  report: function(info, is_unit) {
    var info_panel = $(this.element_id);
    var report = $('<div class="report"></div>')
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
    if (is_unit) {
      report.addClass("unit");
      report.click(function() {
        console.log("Unit clicked!");
      });
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

  printBattle: function(battle) {
    var info_panel = $(this.element_id);

    var report = this.createDiv("report")
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
    var new_battle_phase = $('<div/>', {
      class: "test",
      text: "New battle phase (turn " + battle.num_turns + "): -------------",
    });
    report.append(new_battle_phase);

    var units = battle.units_in_combat();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      var general_info = "{0} (Player {1})".format(unit.type, unit.side);
      var update = this.Unit.status(unit.quantity);
      var num_units = "Quantity: " + update;
      var supply_remaining = this.Unit.supply(unit.supply_remaining);
      var unit_div = this.createDiv("unit report")
        .click(function() {
          console.log("Unit clicked!");
        })
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
    $(this.element_id).empty();
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

  printUnit: function(unit) {
    var info = [];
    var general_info = "{0} (Player {1})".format(unit.type, unit.side);
    var update = unit.quantity;
    if (unit.quantity <= 0) {
      update = 'Dead!'
    }
    var num_units = "Quantity: " + update;
    var supply_remaining = "Supply remaining: " + unit.supply_remaining;
    this.push(general_info);
    this.push(num_units);
    this.push(supply_remaining);
    this.print(true);
  },

  reportAttrition: function(unit, units_lost) {
    this.push(unit.report());
    this.push("Not supplied!");
    if (units_lost) this.pushLast(" {0} units lost.".format(units_lost));
    this.print(true);
  },
  Unit: {
    supply: function(supply_remaining) {
      return "Supply: {0}".format(supply_remaining);
    },
    status: function(quantity) {
      if (quantity <= 0) {
        update = 'Dead!'
        return update;
      }
      return quantity;
    },
  }
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}
