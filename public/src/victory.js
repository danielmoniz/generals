Victory = {

  reset: function() {
    // max_effect is the vitory score a player will be at if they have lost or
    // had compromised all of their relevant entity.
    // Eg. max_effect: [2, 3] for forests implies that losing all forests will
    // leave the player with 2/3 victory score, ie. 66.66%.
    // If there is no max_effect, losing all of that entity (eg. troops) means
    // a victory score of 0.
    this.factor_values = [
      { name: 'troop_values', getFunction: 'getTotalTroops', },
      { name: 'farm_values', getFunction: 'getUnpillagedFarms', },
      { name: 'city_values', getFunction: 'getUnsackedCities', },
      { name: 'town_values', getFunction: 'getUnsackedTowns', max_effect: [1, 2], },
      { name: 'forest_values', getFunction: 'getStandingForests', max_effect: [2, 3], },
      { name: 'time_values', getFunction: 'getTimeLeft' },
    ];

    this.will_to_fight = [100, 100];
    for (var i in this.factor_values) {
      this[this.factor_values[i].name] = [undefined, undefined];
    }

    this.aggression = [1, 1];
    this.time_left = [100, 100];

    this.ratio_to_win = 3; // need X times higher will than opponent to win
    this.setWillFactorValues();
  },

  set: function(victory_data) {
    this.will_to_fight = victory_data.will_to_fight;
    for (var i in this.factor_values) {
      this[this.factor_values[i].name] = victory_data[this.factor_values[i].name];
    }

    this.ratio_to_win = victory_data.ratio_to_win;
  },

  nextDay: function(side) {
    if (!Game.advanced_victory) return;

    for (var side=0; side<2; side++) {
      var faction = Factions[Game.factions[side]];
      console.log(faction);
      var goal = faction.goal;
      if (goal && goal.aggressive) {

        var new_aggression = this.aggression[side] - goal.aggressive.aggression_decrease;
        this.aggression[side] = Math.max(new_aggression, 1);
        this.time_left[side] -= goal.aggressive.turn_decrease / this.aggression[side];
        console.log("this.aggression[side]");
        console.log(this.aggression[side]);
        console.log("this.time_left[side]");
        console.log(this.time_left[side]);
      } else { // automatically drop Willpower if no goal specified
        this.time_left[side] -= 2;
      }
    }
  },
  
  checkVictoryConditions: function() {
    this.updateWillToFight();

    for (var i=0; i<2; i++) {
      var my_will = this.will_to_fight[i];
      var their_will = this.will_to_fight[(i + 1) % 2];
      if (my_will > their_will * this.ratio_to_win) {
        return i;
      } else if (Math.round(my_will) == 0 && Math.round(their_will) == 0) {
        return undefined;
      }
    }
    return false;
  },

  updateWillToFight: function() {
    for (var i=0; i<2; i++) {
      var will_to_fight = 100;
      for (var j in this.factor_values) {
        var info = this.factor_values[j];
        var total = this[info.getFunction](i);
        if (typeof total == 'object') total = total.length;
        var factor_value = this[info.name][i];
        var factor = total * factor_value;
        // handle cases where zero entities causes a factor value of Infinity
        if (factor_value == Infinity) {
          factor = 1;
        }

        if (isNaN(factor)) {
          console.log('Error found -------------------');
          console.log('side');
          console.log(i);
          console.log("total");
          console.log(total);
          console.log("info.name");
          console.log(info.name);
          console.log('factor number');
          console.log(j);
          console.log("this[info.name][i]");
          console.log(this[info.name][i]);
          console.log("factor");
          console.log(factor);
          throw new Error('BadVictoryFactor', 'factors must be numbers');
        }

        if (info.max_effect === undefined) {
          will_to_fight *= factor;
        } else {
          will_to_fight *= (factor + info.max_effect[0]) / info.max_effect[1];
        }
      }

      if (isNaN(will_to_fight)) {
        console.log("will_to_fight");
        console.log(will_to_fight);
        throw new Error('BadWillToFight', 'will to fight must always be a number');
      }

      this.will_to_fight[i] = will_to_fight;
    }

    Output.updateVictoryBar();
  },

  setWillFactorValues: function() {
    for (var i=0; i<2; i++) {
      for (var j in this.factor_values) {
        var info = this.factor_values[j];
        var total = this[info.getFunction](i);
        if (typeof total == 'object') total = total.length;
        // This value can be Infinity if total is zero. Handle elsewhere.
        this[info.name][i] = 1 / total;
      }
    }

  },

  entityDestroyed: function(entity, unit) {
    // handle victory effects of entity being destroyed

    // handle victory effects of destroying entity
    if (unit === undefined) return;
    console.log("testing ---");
    console.log("aggression before:");
    console.log(this.aggression[unit.side]);
    if (entity.side !== undefined && entity.side != unit.side) {
      var faction = Factions[Game.factions[unit.side]];
      console.log("faction");
      console.log(faction);
      if (!faction.goal || !faction.goal.aggressive) return;

      var type = entity.type.toLowerCase();
      var value_name = '{0}_values'.format(type);
      var value_array = this[value_name];
      console.log("value_array");
      console.log(value_array);
      var value = value_array[unit.side];
      var factor = 3;
      var increase = faction.goal.aggressive.aggression_increase * factor * value;
      this.aggression[unit.side] += increase;
      console.log("aggression after:");
      console.log(this.aggression[unit.side]);
    }
  },

  getTimeLeft: function(side) {
    return this.time_left[side];
  },

  getTotalTroops: function(side) {
    var units = this.getUnits(side);
    var total_troops = 0;
    for (var i=0; i<units.length; i++) {
      total_troops += units[i].getQuantity();
    }
    return total_troops;
  },

  getUnits: function(side) {
    var units = Units.getFriendlyUnits(side);
    return units;
  },

  getEntityOnSide: function(entity, side) {
    var entities = Entity.get(entity);
    var entities_on_sides = { 0: [], 1: [], undefined: [], };
    for (var i in entities) {
      entities_on_sides[entities[i].side].push(entities[i]);
    }
    return entities_on_sides[side];
  },

  getUnspoiledEntities: function(entity, side) {
    var entities = this.getEntityOnSide(entity, side);
    var unspoiled_entities = [];
    for (var i in entities) {
      if (entities[i].pillaged) continue;
      if (entities[i].sacked) continue;
      if (entities[i].burned) continue;
      if (entities[i].ruined) continue; // not yet used!

      unspoiled_entities.push(entities[i]);
    }
    return unspoiled_entities;
  },

  getUnpillagedFarms: function(side) {
    var unpillaged_farms = this.getUnspoiledEntities('Farm', side);
    return unpillaged_farms;
  },

  getUnsackedCities: function(side) {
    var unsacked_cities = this.getUnspoiledEntities('City', side);
    return unsacked_cities;
  },

  getUnsackedTowns: function(side) {
    var unsacked_towns = this.getUnspoiledEntities('Town', side);
    return unsacked_towns;
  },

  getStandingForests: function(side) {
    var standing_forests = this.getUnspoiledEntities('Tree', side);
    return standing_forests;
  },

}
