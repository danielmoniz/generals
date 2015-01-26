
this.BattleData = function(type, stats) {

  this.add = DataTools.add;
  this.addComponent = DataTools.addComponent;
  this.render = DataTools.render;

  var battle_data = {

    "Battle": {
      z: 200,
      num_turns: 0,
    },

  };

  //this.setUpEntityData(battle_data, stats);

};

Battle = {
  ATTACKER: "attacker",
  DEFENDER: "defender",
  getOppositeBattleSide: function(battle_side) {
    if (!battle_side) return false;
    if (battle_side == this.ATTACKER) return this.DEFENDER;
    if (battle_side == this.DEFENDER) return this.ATTACKER;
    throw "NoBattleSide: unit's battle_side should be {0} or {1}.".format(this.ATTACKER, this.DEFENDER);
  },
  
  getQuantity: function(units) {
    var quantity = 0;
    for (var i=0; i<units.length; i++) {
      if (!units[i]) console.log(units[i]);
      var unit = units[i];
      if (unit === undefined) {
        console.log('Unit is not defined!');
        console.log('Unit number (in tile): {0}'.format(i));
        continue;
      }
      if (unit !== undefined) {
        quantity += unit.getActive();
      }
    }
    return quantity;
  },

  // @TODO Add terrain as a parameter to allow for terrain-specific bonuses
  getCombatAbility: function(units) {
    var total = 0;
    for (var i=0; i<units.length; i++) {
      if (!units[i]) console.log(units[i]);
      var unit = units[i];
      if (unit === undefined) {
        console.log('Unit is not defined!');
        console.log('Unit number (in tile): {0}'.format(i));
        continue;
      }
      if (unit !== undefined) {
        total += unit.getActive() * unit.combat_ability;
      }
    }
    return total;
  },

  getDefensiveAbility: function(units) {
    var total = 0;
    var total_troops = 0;
    for (var i=0; i<units.length; i++) {
      if (!units[i]) console.log(units[i]);
      var unit = units[i];
      if (unit === undefined) {
        console.log('Unit is not defined!');
        console.log('Unit number (in tile): {0}'.format(i));
        continue;
      }
      if (unit !== undefined) {
        total += unit.getActive() * unit.defensive_ability;
        total_troops += unit.getActive();
      }
    }
    return total / total_troops;
  },

  getRatiosOfTotal: function(units, total) {
    var ratios = [];
    for (var i=0; i<units.length; i++) {
      ratios[i] = units[i].getActive() / total;
    }
    return ratios;
  },

  getLossesFromRatios: function(total_loss, ratios) {
    var losses = [];
    for (var i=0; i<ratios.length; i++) {
      losses[i] = Math.ceil(total_loss * ratios[i]);
    }
    return losses;
  },

  calculateSideMorale: function(units) {
    var total_weighted_morale = 0;
    var total_troops = 0;
    // temporary hotfix!
    return 0;
    for (var i in units) {
      var unit = units[i];
      total_troops += unit.getActive();
      total_weighted_morale += unit.morale * unit.getActive();
    }
    return total_weighted_morale / total_troops;
  },

  calculateTotalLosses: function(battle, attackers, defenders) {
    var TROOP_LOSS = Game.troop_loss_constant;
    var MORALE_FACTOR = Game.morale_factor;
    var terrain_mod = Game.terrain_defense_bonus[battle.at().x][battle.at().y];

    var attacker_morale = Battle.calculateSideMorale(attackers);
    var defender_morale = Battle.calculateSideMorale(defenders);

    if (attacker_morale != 0) {
      console.log("attacker_morale");
      console.log(attacker_morale);
      throw new Error('MoraleNotImplemented');
    }
    if (defender_morale != 0) {
      console.log("defender_morale");
      console.log(defender_morale);
      throw new Error('MoraleNotImplemented');
    }

    var attacker_morale_factor = Battle.calculateMoraleFactor(attacker_morale);
    var defender_morale_factor = Battle.calculateMoraleFactor(defender_morale);
    /*
    var attacker_random_factor = Math.random() * 0.2 + 0.9;
    var defender_random_factor = Math.random() * 0.2 + 0.9;
    */

    var attackers_ability = Battle.getCombatAbility(attackers);
    var defenders_ability = Battle.getCombatAbility(defenders);

    var attackers_defensive_ability = Battle.getDefensiveAbility(attackers);
    var defenders_defensive_ability = Battle.getDefensiveAbility(defenders);


    var attacker_attack_power = attackers_ability * (1/terrain_mod * attacker_morale_factor);
    var defender_losses = attacker_attack_power * TROOP_LOSS / defenders_defensive_ability / defender_morale_factor;

    var defender_attack_power = defenders_ability * (terrain_mod * defender_morale_factor);
    var attacker_losses = defender_attack_power * TROOP_LOSS / attackers_defensive_ability / attacker_morale_factor;


    var losses = {};
    losses[Battle.ATTACKER] = attacker_losses;
    losses[Battle.DEFENDER] = defender_losses;
    return losses;
  },

  // determine combat losses for a single turn
  determineCombatLosses: function(battle, attackers, defenders) {
    if (attackers === undefined) attackers = battle.attackers;
    if (defenders === undefined) defenders = battle.defenders;

    var total_losses = Battle.calculateTotalLosses(battle, attackers, defenders);

    var attackers_quantity = Battle.getQuantity(attackers);
    var defenders_quantity = Battle.getQuantity(defenders);

    var attacker_ratios = Battle.getRatiosOfTotal(attackers, attackers_quantity);
    var defender_ratios = Battle.getRatiosOfTotal(defenders, defenders_quantity);

    var attacker_losses = Battle.getLossesFromRatios(total_losses[Battle.ATTACKER], attacker_ratios);
    var defender_losses = Battle.getLossesFromRatios(total_losses[Battle.DEFENDER], defender_ratios);

    var units = attackers.concat(defenders);
    var losses = attacker_losses.concat(defender_losses);

    var total_losses = {};
    total_losses[this.ATTACKER] = attacker_losses.reduce(function(a, b) {
      return a + b;
    }, 0);
    total_losses[this.DEFENDER] = defender_losses.reduce(function(a, b) {
      return a + b;
    }, 0);

    return {
      units: units,
      losses: losses,
      total_losses: total_losses,
    };
  },

  fakeResolve: function() {
  },

  /*
   * NOTE: Not yet fully functional!
   * Intended to be used for determining which side will eventually win the
   * combat.
   */
  determineEventualWinner: function(battle) {
    var fake_battle = {};
    Utility.loadDataIntoObject(battle, fake_battle);
    console.log("fake_battle.getQuantity");
    console.log(fake_battle.getQuantity);
    fake_battle.attackers = [];
    fake_battle.defenders = [];
    for (var i in battle.attackers) {
      var unit = battle.attackers[i];
      var fake_unit = {};
      Utility.loadDataIntoObject(unit, fake_unit);
      fake_battle.attackers.push(fake_unit);
    }
    for (var i in battle.defenders) {
      var unit = battle.defenders[i];
      var fake_unit = {};
      Utility.loadDataIntoObject(unit, fake_unit);
      fake_battle.defenders.push(fake_unit);
    }
    console.log("fake_battle.defenders");
    console.log(fake_battle.defenders);

    for (var i=0; i<3; i++) {
      var battle_info = Battle.determineCombatLosses(battle, fake_battle.attackers, fake_battle.defenders);
      Battle.killUnits(battle_info.units, battle_info.losses);
    }
  },

  calculateMoraleFactor: function(morale_points) {
    var morale_factor = Math.pow(Game.morale_factor, morale_points);
    return morale_factor;
  },

  killUnits: function(units, losses) {
    for (var i=0; i<units.length; i++) {
      units[i].sufferCasualties(losses[i]);
    }
  },

}

Crafty.c('Battle', {
  init: function() {
    this.requires('Actor, Collision, Targetable, spr_battle, Clickable')
      //.bind("NextTurn", this.nextTurn)
      .bind("ResolveBattles", this.resolveIfNeeded)
      .bind("EndBattles", this.endIfNeeded)
      .attr({ type: "Battle" })
      ;
      this.z = 200;
      this.num_turns = 0;
  },

  customSelect: function() {
    // select current player's unit in battle
    if (this.attacking_side == Game.player) {
      var units = this.attackers;
    } else if (this.defending_side == Game.player) {
      var units = this.defenders;
    } else {
      return;
    }

    Game.select(units[0]);
    Output.selectBattles([this]);
  },

  resolveIfNeeded: function() {
    if (Game.turn % 1 == 0) this.resolve();
  },

  resolve: function() {
    this.num_turns += 1;

    //Battle.determineEventualWinner(this);

    var battle_info = Battle.determineCombatLosses(this);
    Battle.killUnits(battle_info.units, battle_info.losses);

    this.casualties[Battle.ATTACKER] = battle_info.total_losses[Battle.ATTACKER];
    this.casualties[Battle.DEFENDER] = battle_info.total_losses[Battle.DEFENDER];

    if (!this.isBattleActive()) {
      this.end_battle = true;
      Victory.updateWillToFight();
    }
  },

  prepareBattle: function() {
    var units_in_combat = this.unitsInCombat();
    var attacking_side = this.attacking_side;
    this.attackers = [this.attacker];

    this.defenders = units_in_combat.filter(function(unit) {
      return unit.side != attacking_side;
    });

    for (var i=0; i < this.defenders.length; i++) {
      var unit = this.defenders[i];
      unit.notify_of_battle(Battle.DEFENDER);
    }
  },

  start: function(attacker) {
    var attacker_direction = attacker.last_location;

    this.attacker = attacker;
    this.attacking_side = attacker.side;
    this.defending_side = 1 - attacker.side;

    this.unit_updates = [];
    this.retreat_constraints = {};
    this.retreat_constraints[Battle.ATTACKER] = new RetreatConstraints(this.at());
    this.retreat_constraints[Battle.ATTACKER].setSide(Battle.ATTACKER, attacker_direction);
    this.retreat_constraints[Battle.DEFENDER] = new RetreatConstraints(this.at());
    this.retreat_constraints[Battle.DEFENDER].setSide(Battle.DEFENDER, attacker_direction);

    this.casualties = [];
    this.new_units = [];
    Entity.flushSpecialCache('SimpleBattle');
    this.prepareBattle();
  },

  endIfNeeded: function() {
    if (this.end_battle) {
      this.end_battle = false;
      this.end();
    }
  },

  end: function() {
    // @TODO Should use attackers and defenders, not unitsInCombat()
    var units_in_combat = this.unitsInCombat();
    for (var i=0; i < units_in_combat.length; i++) {
      units_in_combat[i].battle_finished();
      this.winning_side = units_in_combat[i].side;
    }
    this.finished = true;
    Game.battleEnded(this);
    Entity.destroy(this);
  },

  join: function(unit) {
    this.end_battle = false;
    var battle_side = undefined;
    if (unit.side == this.attacking_side) {
      this.attackers.push(unit);
      battle_side = Battle.ATTACKER;
    } else {
      this.defenders.push(unit);
      battle_side = Battle.DEFENDER;
    }
    unit.notify_of_battle(battle_side);

    this.retreat_constraints[Battle.ATTACKER].addUnit(battle_side, unit.last_location);
    this.retreat_constraints[Battle.DEFENDER].addUnit(battle_side, unit.last_location);

    if (this.num_turns > 0) {
      this.new_units.push(unit);
    }
  },

  removeUnit: function(unit) {
    if (unit.battle_side == Battle.ATTACKER) {
      var units = this.attackers;
      if (this.attacker && this.attacker.is && this.attacker.is(unit)) delete this.attacker;
    } else if (unit.battle_side == Battle.DEFENDER) {
      var units = this.defenders;
    } else {
      console.log(unit);
      console.log(unit.battle_side);
      console.log(Battle.ATTACKER);
      console.log(Battle.DEFENDER);
      throw "NoBattleSide: unit had battle_side {0}. Needs to be 'attacker' or 'defender'.".format(unit.battle_side);
    }
    for (var i=units.length - 1; i>=0; i--) {
      if (!units[i] || units[i].is(unit)) {
        units.splice(i, 1);
      }
    }
  },

  unitDead: function(unit) {
    var unit_stats = this.getUnitUpdate(unit, 'killed');
    this.unit_updates.push(unit_stats);

    this.removeUnit(unit);
  },

  retreat: function(unit) {
    //unit.morale += 1;
    var attackers = this.attackers;
    var defenders = this.defenders;
    var losses = Battle.calculateTotalLosses(this, attackers, defenders);

    var attackers_quantity = Battle.getQuantity(attackers);
    var defenders_quantity = Battle.getQuantity(defenders);

    var attacker_ratios = Battle.getRatiosOfTotal(attackers, attackers_quantity);
    var defender_ratios = Battle.getRatiosOfTotal(defenders, defenders_quantity);

    var side = {};
    side[Battle.ATTACKER] = { 
      units: attackers,
      ratios: attacker_ratios,
    }
    side[Battle.DEFENDER] = { 
      units: defenders,
      ratios: defender_ratios,
    }

    var unit_stats = this.getUnitUpdate(unit, 'retreated');
    this.unit_updates.push(unit_stats);

    var units = side[unit.battle_side].units;

    for (var i=0; i<units.length; i++) {
      if (units[i].getId() == unit.getId()) {
        var num_losses = Math.ceil(losses[unit.battle_side] * side[unit.battle_side].ratios[i]);
        unit.sufferCasualties(num_losses);
        break;
      }
    }

    this.removeUnit(unit);

    unit.battle_finished();
    if (!this.isBattleActive()) {
      this.end_battle = true;
    }
    return num_losses;
  },

  getUnitUpdate: function(unit, event) {
    var unit_stats = {
      name: unit.name,
      alive: unit.isAlive(),
      quantity: unit.quantity,
      injured: unit.injured,
      active: unit.getActive(),
      battle_side: unit.battle_side,
      side: unit.side,
      battle_id: this.getId(),
      event: event,
    };
    unit_stats[event] = true;
    console.log("unit_stats");
    console.log(unit_stats);
    return unit_stats;
  },

  resetUnitUpdates: function() {
    this.unit_updates = [];
  },

  resetNewUnits: function() {
    this.new_units = [];
  },

  printed: function() {
    this.resetNewUnits();
    this.resetUnitUpdates();
  },

  isBattleActive: function() {
    attackers_alive = false;
    attackers_remaining = false;
    attackers_active = false;
    for (var i=0; i<this.attackers.length; i++) {
      var attacker = this.attackers[i];
      if (!attacker) continue;
      var attackers_alive = this.attackers[i].isAlive();
      var attackers_remaining = this.attackers[i].getActive();
      if (attacker.battle) {
        attackers_active = true;
        break;
      }
    }
    defenders_alive = false;
    defenders_remaining = false;
    defenders_active = false;
    for (var i=0; i<this.defenders.length; i++) {
      var defender = this.defenders[i];
      if (!defender) continue;
      var defenders_alive = this.defenders[i].isAlive();
      var defenders_remaining = this.defenders[i].getActive();
      if (defender.battle) {
        defenders_active = true;
        break;
      }
    }

    if (!defenders_active || !attackers_active ||  !attackers_alive || !defenders_alive || !attackers_remaining || !defenders_remaining) return false;
    return true;
  },

  report: function() {
  },

});

Crafty.c('SimpleBattle', {
  init: function() {
    this.requires('Battle');
  },

  unitsInCombat: function() {
    var units = Units.getAllUnits();
    var units_in_combat = [];
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      if (unit.together(this)) units_in_combat.push(unit);
    }
    return units_in_combat;
  },

  getTotalTroops: function() {
    var units = Units.getPresentUnits(this.at());
    var total = {
      0: { active: 0, injured: 0, total: 0 },
      1: { active: 0, injured: 0, total: 0 },
    };
    for (var i in units) {
      var unit = units[i];
      total[unit.side]['active'] += unit.getActive();
      total[unit.side]['injured'] += unit.quantity - unit.getActive();
      total[unit.side]['total'] += unit.quantity;
    }
    return total;
  },

});

Crafty.c('SiegeBattle', {
  init: function() {
    this.requires('Battle');
  },

  setSiegeBattleData: function(siege) {
    this.sieging_side = siege.sieging_side;
    this.besieged_side = siege.besieged_side;
    this.centre = siege.at();
    this.affected_tiles = siege.affected_tiles;
  },

  unitsInCombat: function() {
    var units = Units.getAllUnits();
    var units_in_combat = [];
    var locations = this.getAllSiegeAreas();
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      for (var j in locations) {
        var location = locations[j];
        if (!unit.isAtLocation(location)) continue;
        units_in_combat.push(unit);
      }
    }
    return units_in_combat;
  },

  getAllSiegeAreas: function() {
    var locations = [this.centre];
    for (var i in this.affected_tiles) {
      locations.push(this.affected_tiles[i].at());
    }
    return locations;
  },

  getTotalTroops: function() {
    var units = this.unitsInCombat();
    return Units.getTotalTroops(units);
  },

});

Crafty.c('Siege', {
  init: function() {
    this.requires('Color, Actor, Targetable, Clickable')
      .bind("ResolveSieges", this.resolveIfNeeded)
      .color('Red');
    this.z = 95;
    this.affected_tiles = [];
  },

  setSides: function(side) {
    this.sieging_side = side;
    this.besieged_side = 1 - side;
  },

  setAffectedRegion: function() {
    var adjacent_points = Utility.getPointsWithinDistance(this.at(), 1, Game.map_grid);
    for (var i in adjacent_points) {
      var point = adjacent_points[i];
      var terrain = Game.terrain[point.x][point.y];
      if (!terrain.has('Passable')) continue;
      var siege_adjacent = Entity.create('SiegeAdjacent').at(point.x, point.y);
      this.affected_tiles.push(siege_adjacent);
    }

    var units_present = Units.getPresentUnits(this.at());
    for (var i in units_present) {
      var unit = units_present[i];
      unit.besiege(this.getId());
    }

    return this;
  },

  resolveIfNeeded: function() {
    var end_siege = true;
    var sieging_troops = 0;
    for (var i in this.affected_tiles) {
      var tile = this.affected_tiles[i];
      var units_present = Units.getPresentUnits(tile.at());
      if (units_present.length > 0) {
        var unit = units_present[0];
        var battle = unit.isBattlePresent();
        if (battle) {
          var new_unit = false;
          for (var k in battle.attackers) {
            var attacker = battle.attackers[k];
            if (!attacker.besieged) {
              // units at this tile no longer considered sieging - they are
              // distracted by a non-besieged army
              new_unit = true;
              break;
            }
          }
          if (new_unit) continue;
        }

        var hostile_units = false;
        for (var j in units_present) {
          var unit = units_present[j];
          if (unit.side == this.sieging_side) {
            hostile_units = true;
            sieging_troops += unit.getActive();
          }
        }
        if (hostile_units && sieging_troops >= Game.min_troops_for_siege) {
          end_siege = false;
          break;
        }
      }
    }

    if (end_siege) {
      this.liftSiege();
    }
  },

  liftSiege: function() {
    for (var i in this.affected_tiles) {
      var tile = this.affected_tiles[i];
      Entity.destroy(tile);
    }
    Entity.destroy(this);
    Crafty.trigger('SiegeLifted', this.getId());
  },

});

Crafty.c('SiegeAdjacent', {
  init: function() {
    this.requires('Color, Actor')
      .color('Yellow');
    this.z = 95;
    this.alpha = 60;
  },
});

