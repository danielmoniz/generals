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
    //this.buffer += text_array;
    //for (
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
    //this.clear();
    this.report(this.buffer, is_unit);
    this.buffer = [];
    return this;
  },
  report: function(info, is_unit) {
    console.log(is_unit);
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

  reportBattle: function(battle) {
    var info_panel = $(this.element_id);
    var report = $('<div class="report"></div>')
      .css("padding-bottom", "7px")
    ;
    info_panel.append(report);
    units = battle.attacker.get_present_units(false);
    for (var i=1; i<units.length; i++) {
      var item = $('<div class="report-item"></div>')
        .addClass("report-item")
        .addClass("unit")
        .append(units[i].getStatus())
        .click(function() {
          console.log("Unit clicked!");
        ;
      report.append(item);
      });
    }
    return this;
  },

  clear: function() {
    $(this.element_id).empty();
    return this;
  },
  printEntity: function(entity, is_unit) {
    console.log("entity.report:");
    console.log(entity.getStatus);
    if (entity.getStatus) {
      Output.add(entity.getStatus());
    } else {
      if (entity.type) Output.push(entity.type);
    }
    if (entity.has('Impassable')) Output.push("(Impassable)");
    Output.print(is_unit);
  },
  reportAttrition: function(unit, units_lost) {
    this.push(unit.report());
    this.push("Not supplied!");
    if (units_lost) this.pushLast(" {0} units lost.".format(units_lost));
    this.print(true);
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
