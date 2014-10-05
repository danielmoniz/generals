Victory = {
  reset: function() {
    this.will_to_fight = [100, 100];
    this.troop_values = [undefined, undefined];
    this.farm_values = [undefined, undefined];
    this.city_values = [undefined, undefined];
    this.ratio_to_win = 3; // need X times higher will than opponent to win
    this.setWillToFight();
  },

  set: function(victory_data) {
    this.will_to_fight = victory_data.will_to_fight;
    this.troop_values = victory_data.troop_values;
    this.farm_values = victory_data.farm_values;
    this.city_values = victory_data.city_values;

    this.ratio_to_win = victory_data.ratio_to_win;
  },
  
  checkVictoryConditions: function() {
    this.updateWillToFight();

    for (var i=0; i<2; i++) {
      var my_will = this.will_to_fight[i];
      var their_will = this.will_to_fight[(i + 1) % 2];
      if (my_will > their_will * this.ratio_to_win) {
        var text = "Player {0} wins!".format(i);
        this.victory_text = text;
        return "Player {0} wins!".format(i);
      }
      if (Math.round(my_will) == 0) {
        var text = "Player {0} loses!".format(i);
        this.victory_text = text;
        return "Player {0} loses!".format(i);
      }
    }
    return false;
  },

  updateWillToFight: function() {
    for (var i=0; i<2; i++) {
      var total_troops = this.getTotalTroops(i);
      var troop_factor = total_troops * this.troop_values[i];

      var farms = this.getFarms(i);
      var total_farms = farms.length;
      var total_unpillaged_farms = this.getUnpillagedFarms(i).length;
      var farm_factor = total_unpillaged_farms * this.farm_values[i];

      var cities = this.getCities(i);
      var total_cities = cities.length;
      var total_unpillaged_cities = this.getUnsackedCities(i).length;
      var city_factor = total_unpillaged_cities * this.city_values[i];

      this.will_to_fight[i] = 100 * troop_factor * farm_factor * city_factor;
    }
    Output.updateVictoryBar();
  },

  getUnits: function(side) {
    var units = Crafty('Unit').get();
    units = units.filter(function(unit) {
      return unit.side == side;
    });
    return units;
  },

  getTotalTroops: function(side) {
    var units = this.getUnits(side);
    var total_troops = 0;
    for (var i=0; i<units.length; i++) {
      total_troops += units[i].getQuantity();
    }
    return total_troops;
  },

  getFarms: function(side) {
    var farms = Crafty('Farm').get();
    var farms_in_sides = { 0: [], 1: [], undefined: [], };
    for (var i in farms) {
      farms_in_sides[farms[i].side].push(farms[i]);
    }
    return farms_in_sides[side];
  },

  getUnpillagedFarms: function(side) {
    var farms = this.getFarms(side);
    var unpillaged_farms = [];
    for (var i in farms) {
      if (!farms[i].pillaged) unpillaged_farms.push(farms[i]);
    }
    return unpillaged_farms;
  },

  getUnsackedCities: function(side) {
    var cities = this.getCities(side);
    var unsacked_cities = [];
    for (var i in cities) {
      if (!cities[i].sacked) unsacked_cities.push(cities[i]);
    }
    return unsacked_cities;
  },

  getCities: function(side) {
    var cities = Crafty('City').get();
    var cities_in_sides = { 0: [], 1: [], undefined: [], };
    for (var i in cities) {
      cities_in_sides[cities[i].side].push(cities[i]);
    }
    return cities_in_sides[side];
  },

  setWillToFight: function() {
    for (var i=0; i<2; i++) {
      var units = this.getUnits(i);
      var total_troops = this.getTotalTroops(i);
      var troop_value = 1 / total_troops;
      this.troop_values[i] = troop_value;

      var farms = this.getFarms(i);
      var farm_value = 1 / farms.length;
      this.farm_values[i] = farm_value;

      var cities = this.getCities(i);
      var city_value = 1 / cities.length;
      this.city_values[i] = city_value;
    }

  },

}
