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

  start: function(attacker) {
    this.attacker = attacker;
    this.attackers = [attacker];
    var units_in_combat = this.units_in_combat();
    this.defenders = units_in_combat.filter(function(unit) {
      return unit.getId() !== attacker.getId();
    });
    for (var i=0; i < this.attackers.length; i++) {
      var unit = this.attackers[i];
      unit.notify_of_battle("attacker");
    }
    for (var i=0; i < this.defenders.length; i++) {
      var unit = this.defenders[i];
      unit.notify_of_battle("defender");
    }
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
    if (unit.side == this.attacker.side) {
      this.attackers.push(unit);
    } else {
      this.defenders.push(unit);
    }
    if (unit.side == this.attacker.side) {
      var battle_side = this.attacker.side;
    } else {
      var battle_side = unit.getOppositeBattleSide();
    }
    unit.notify_of_battle(battle_side);
  },

  retreat: function(unit) {
    //unit.morale += 1;
    var attackers = this.attackers;
    var defenders = this.defenders;
    var losses = this.calculateLosses(attackers, defenders);

    var attackers_quantity = 0;
    for (var i=0; i<attackers.length; i++) {
      attackers_quantity += attackers[i].quantity;
    }
    var attacker_ratios = [];
    for (var i=0; i<attackers.length; i++) {
      attacker_ratios[i] = attackers[i].quantity / attackers_quantity;
    }
    var defenders_quantity = 0;
    for (var i=0; i<defenders.length; i++) {
      defenders_quantity += defenders[i].quantity;
    }
    var defender_ratios = [];
    for (var i=0; i<defenders.length; i++) {
      defender_ratios[i] = defenders[i].quantity / defenders_quantity;
    }

    var side = {};
    side["attacker"] = { 
      units: attackers,
      ratios: attacker_ratios,
    }
    side["defender"] = { 
      units: defenders,
      ratios: defender_ratios,
    }
    var units = side[unit.battle_side].units;
    console.log("units:");
    console.log(unit);
    console.log(units);

    //unit.kill(losses["attackers"]);
    for (var i=0; i<units.length; i++) {
      if (units[i].getId() == unit.getId()) {
        // @TODO Use the correct ratio here (attacker versus defender)
        console.log("Retreat losses info:");
        console.log(losses);
        console.log(losses[unit.battle_side]);
        console.log(side[unit.battle_side].ratios);
        console.log(side[unit.battle_side].ratios[i]);
        console.log(unit.getId());
        unit.kill(Math.ceil(losses[unit.battle_side] * side[unit.battle_side].ratios[i]));
        break;
      }
    }

    unit.battle_finished();
    if (!this.isBattleActive()) {
      this.end();
      Output.printBattle(this);
    }
  },

  calculateLosses: function(attackers, defenders) {

    var TROOP_LOSS = 0.1;
    var MORALE_FACTOR = 0.75;
    var terrain_mod = Game.terrain_defense_bonus[this.at().x][this.at().y];
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

    var attackers_quantity = 0;
    for (var i=0; i<attackers.length; i++) {
      attackers_quantity += attackers[i].quantity;
    }
    var defenders_quantity = 0;
    for (var i=0; i<defenders.length; i++) {
      defenders_quantity += defenders[i].quantity;
    }

    var attacker_losses = attacker_random_factor * defenders_quantity * TROOP_LOSS * (terrain_mod * defender_morale_factor * 1/attacker_morale_factor);
    var defender_losses = defender_random_factor * attackers_quantity * TROOP_LOSS * (1/terrain_mod * 1/defender_morale_factor * attacker_morale_factor);

    return { "attacker": attacker_losses, "defender": defender_losses }
  },

  resolve: function() {
    this.num_turns += 1;
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var units = this.attacker.getPresentUnits();
    var attackers = [this.attacker];
    var defenders = [];
    for (var i=0; i < units.length; i++) {
      if (units[i].side == this.attacker.side) {
        attackers.push(units[i]);
      } else {
        defenders.push(units[i]);
      }
    }

    var losses = this.calculateLosses(attackers, defenders);

    var attackers_quantity = 0;
    for (var i=0; i<attackers.length; i++) {
      attackers_quantity += attackers[i].quantity;
    }
    var attacker_ratios = [];
    for (var i=0; i<attackers.length; i++) {
      attacker_ratios[i] = attackers[i].quantity / attackers_quantity;
    }
    var defenders_quantity = 0;
    for (var i=0; i<defenders.length; i++) {
      defenders_quantity += defenders[i].quantity;
    }
    var defender_ratios = [];
    for (var i=0; i<defenders.length; i++) {
      defender_ratios[i] = defenders[i].quantity / defenders_quantity;
    }

    //attacker.kill(Math.ceil(attacker_losses));
    for (var i=0; i<attackers.length; i++) {
      attackers[i].kill(Math.ceil(losses["attacker"] * attacker_ratios[i]));
    }
    for (var i=0; i<defenders.length; i++) {
      defenders[i].kill(Math.ceil(losses["defender"] * defender_ratios[i]));
    }

    if (!this.isBattleActive()) {
      this.end();
    }

    Output.printBattle(this);
  },

  isBattleActive: function() {
    attackers_alive = false;
    attackers_active = false;
    for (var i=0; i<this.attackers.length; i++) {
      var attacker = this.attackers[i];
      var attackers_alive = this.attackers[i].isAlive();
      var attacker_status = this.attackers[i].getStatus();
      if (attacker.battle) {
        attackers_active = true;
        break;
      }
      //Output.add(attacker_status);
    }
    defenders_alive = false;
    defenders_active = false;
    for (var i=0; i<this.defenders.length; i++) {
      var defender = this.defenders[i];
      var defenders_alive = this.defenders[i].isAlive();
      var defender_status = this.defenders[i].getStatus();
      if (defender.battle) {
        defenders_active = true;
        break;
      }
      //Output.add(defenders_alive);
    }

    if (!defenders_active || !attackers_active ||  !attackers_alive || !defenders_alive) return false;
    return true;
  },

  select: function() {
    this.report();
  },

  report: function() {
    //var output = this.getStatus();
    //Output.push(output).print();
    Output.printBattle(this);
  },
  getStatus: function() {
    /*
    var output = [];
    var units_in_combat = this.units_in_combat();
    for (var i=0; i<units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      output.push(unit.getStatus());
    }
    var finished = "Battle report: finished!";
    if (this.finished) output.push(finished);
    return output;
    */
  },
});

