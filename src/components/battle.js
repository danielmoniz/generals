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
    var output = [];
    var battle_header = "New Battle: -------------";
    Output.push(battle_header);
    var attacker_info = "Attacker: Player " + attacker.side + "'s " + attacker.type + " with " + attacker.quantity;
    Output.push(attacker_info);
    var units_in_combat = this.units_in_combat();
    for (var i=0; i < units_in_combat.length; i++) {
      var unit = units_in_combat[i];
      unit.notify_of_battle();
    }
    Output.print();
  },

  resolve: function() {
    this.num_turns += 1;
    var units = Crafty('Unit').get();
    // assume for now that all units other than attacker are the defenders
    var units = this.attacker.get_present_units();
    var attackers = [this.attacker];
    var defenders = [];
    for (var i=0; i < units.length; i++) {
      if (units[i].side == this.attacker.side) {
        attackers.push(units[i]);
      } else {
        defenders.push(units[i]);
      }
    }
    var units_in_combat = this.units_in_combat();

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

    var TROOP_LOSS = 0.1;
    var MORALE_FACTOR = 0.75;
    var terrain_mod = 1;
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

    var attacker_losses = attacker_random_factor * defenders_quantity * TROOP_LOSS * (terrain_mod * defender_morale_factor * 1/attacker_morale_factor);
    var defender_losses = defender_random_factor * attackers_quantity * TROOP_LOSS * (1/terrain_mod * 1/defender_morale_factor * attacker_morale_factor);

    //attacker.kill(Math.ceil(attacker_losses));
    for (var i=0; i<attackers.length; i++) {
      attackers[i].kill(Math.ceil(attacker_losses * attacker_ratios[i]));
    }
    for (var i=0; i<defenders.length; i++) {
      defenders[i].kill(Math.ceil(defender_losses * defender_ratios[i]));
    }

    attackers_alive = false;
    for (var i=0; i<attackers.length; i++) {
      var attackers_alive = attackers[i].isAlive();
      var attacker_status = attackers[i].getStatus();
      //Output.add(attacker_status);
    }
    defenders_alive = false;
    for (var i=0; i<defenders.length; i++) {
      var defenders_alive = defenders[i].isAlive();
      var defender_status = defenders[i].getStatus();
      //Output.add(defenders_alive);
    }

    if (!attackers_alive || !defenders_alive) {
      //this.report();
      for (var i=0; i < units_in_combat.length; i++) {
        units_in_combat[i].battle_finished();
      }
      this.finished = true;
      this.destroy();
    }
    Output.printBattle(this);
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

