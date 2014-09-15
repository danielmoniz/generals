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
      quantity += units[i].getActive();
    }
    return quantity;
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

  killUnits: function(units, losses) {
    for (var i=0; i<units.length; i++) {
      units[i].sufferCasualties(losses[i]);
    }
  },

}
Crafty.c('Battle', {
  init: function() {
    this.requires('Actor, Collision, Targetable, spr_battle, Clickable')
      .bind("NextTurn", this.nextTurn)
      .attr({ type: "Battle" })
      ;
      this.z = 200;
      this.num_turns = 0;
  },

  nextTurn: function() {
    if (Game.turn % 1 == 0) this.resolve();
  },

  units_in_combat: function() {
    var units_in_combat = [];
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      if (unit.together(this)) units_in_combat.push(unit);
    }
    return units_in_combat;
  },

  prepareBattle: function() {
    var units_in_combat = this.units_in_combat();
    var attacking_side = this.attacking_side;
    this.attackers = units_in_combat.filter(function(unit) {
      return unit.side == attacking_side;
    });
    this.defenders = units_in_combat.filter(function(unit) {
      return unit.side != attacking_side;
    });
    for (var i=0; i < this.attackers.length; i++) {
      var unit = this.attackers[i];
      unit.notify_of_battle(Battle.ATTACKER);
    }
    for (var i=0; i < this.defenders.length; i++) {
      var unit = this.defenders[i];
      unit.notify_of_battle(Battle.DEFENDER);
    }
  },

  start: function(attacker) {
    this.attacker = attacker;
    this.attacking_side = attacker.side;
    //this.attackers = [attacker];
    this.prepareBattle();
    Output.printBattleStart(this);
  },

  end: function() {
    var units_in_combat = this.units_in_combat();
    for (var i=0; i < units_in_combat.length; i++) {
      units_in_combat[i].battle_finished();
    }
    this.finished = true;
    this.destroy();
  },

  join: function(unit) {
    if (unit.side == this.attacking_side) {
      var battle_side = undefined;
      this.attackers.push(unit);
      battle_side = Battle.ATTACKER;
    } else {
      this.defenders.push(unit);
      battle_side = Battle.DEFENDER;
    }
    unit.notify_of_battle(battle_side);
    Output.printBattleJoin(this, unit);
  },

  unitDead: function(unit) {
    if (unit.battle_side == Battle.ATTACKER) {
      if (this.attacker && this.attacker.is && this.attacker.is(unit)) delete this.attacker;
      var dead_index = undefined;
      for (var i=0; i<this.attackers.length; i++) {
        if (!this.attackers[i] || this.attackers[i].is(unit)) {
          dead_index = i;
          delete this.attackers[i];
          break;
        }
      }
    } else if (unit.battle_side == Battle.DEFENDER) {
      for (var i=0; i<this.defenders.length; i++) {
        if (!this.defenders[i] || this.defenders[i].is(unit)) {
          delete this.defenders[i];
          break;
        }
      }
    } else {
      console.log(unit);
      console.log(unit.battle_side);
      console.log(Battle.ATTACKER);
      console.log(Battle.DEFENDER);
      throw "NoBattleSide: unit had battle_side {0}. Needs to be 'attacker' or 'defender'.".format(unit.battle_side);
    }
  },

  retreat: function(unit) {
    //unit.morale += 1;
    var attackers = this.attackers;
    var defenders = this.defenders;
    var losses = this.calculateLosses(attackers, defenders);

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
    var units = side[unit.battle_side].units;

    for (var i=0; i<units.length; i++) {
      if (units[i].getId() == unit.getId()) {
        var num_losses = Math.ceil(losses[unit.battle_side] * side[unit.battle_side].ratios[i]);
        unit.sufferCasualties(num_losses);
        break;
      }
    }

    unit.battle_finished();
    if (!this.isBattleActive()) {
      this.end();
      Output.printBattle(this);
    }
    return num_losses;
  },

  calculateLosses: function(attackers, defenders) {

    var TROOP_LOSS = 0.1;
    var MORALE_FACTOR = 0.75;
    var terrain_mod = Game.terrain_defense_bonus[this.at().x][this.at().y];
    console.log("terrain_mod for battle:");
    console.log(terrain_mod);
    var attacker_morale = 0;
    var defender_morale = 0;

    var attacker_morale_factor = Math.pow(MORALE_FACTOR, attacker_morale);
    var defender_morale_factor = Math.pow(MORALE_FACTOR, defender_morale);
    /*
    var attacker_random_factor = Math.random() * 0.2 + 0.9;
    var defender_random_factor = Math.random() * 0.2 + 0.9;
    */
    var attacker_random_factor = 1;
    var defender_random_factor = 1;

    var attackers_quantity = Battle.getQuantity(attackers);
    var defenders_quantity = Battle.getQuantity(defenders);

    var attacker_losses = attacker_random_factor * defenders_quantity * TROOP_LOSS * (terrain_mod * defender_morale_factor * 1/attacker_morale_factor);
    var defender_losses = defender_random_factor * attackers_quantity * TROOP_LOSS * (1/terrain_mod * 1/defender_morale_factor * attacker_morale_factor);

    var losses = {};
    losses[Battle.ATTACKER] = attacker_losses;
    losses[Battle.DEFENDER] = defender_losses;
    return losses;
  },

  resolve: function() {
    this.num_turns += 1;
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var attackers = this.attackers;
    var defenders = this.defenders;

    var total_losses = this.calculateLosses(attackers, defenders);

    var attackers_quantity = Battle.getQuantity(attackers);
    var defenders_quantity = Battle.getQuantity(defenders);

    var attacker_ratios = Battle.getRatiosOfTotal(attackers, attackers_quantity);
    var defender_ratios = Battle.getRatiosOfTotal(defenders, defenders_quantity);

    var attacker_losses = Battle.getLossesFromRatios(total_losses[Battle.ATTACKER], attacker_ratios);
    var defender_losses = Battle.getLossesFromRatios(total_losses[Battle.DEFENDER], defender_ratios);

    var units = attackers.concat(defenders);
    var losses = attacker_losses.concat(defender_losses);

    Battle.killUnits(units, losses);

    if (!this.isBattleActive()) {
      this.end();
      Victory.updateWillToFight();
    }

    Output.printBattle(this);
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

  select: function() {
    this.report();
  },

  report: function() {
    Output.printBattle(this);
  },

  getPresentUnits: function() {
    present_units = [];
    units = Crafty('Unit').get();
    for (var i=0; i < units.length; i++) {
      if (units[i].together(this, true)) {
        present_units.push(units[i]);
      }
    }
    return present_units;
  },

});

