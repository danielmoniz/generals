
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
      total += unit.getActive() * unit.combat_ability;
    }
    return total;
  },

  getAttackPower: function(units, terrain, is_retreat) {
    var total_attack_power = 0;
    for (var i in units) {
      var unit = units[i];
      //var terrain_defense = Game.terrain_defense_bonus[unit.at().x][unit.at().y];
      var dissent_factor = Battle.calculateDissentFactor(unit.dissent);
      if (dissent_factor != 1) {
        console.log("{0}'s dissent is {1} (MF of {2})".format(unit.name, unit.dissent, dissent_factor));
      }
      var combat_ability = Battle.getCombatAbility([unit]);
      var attack_power = combat_ability * dissent_factor;
      if (is_retreat) attack_power *= unit.pursuit_ability;
      if (unit.charging) {
        var charge_ability = unit.getChargeAbility(terrain);
        attack_power *= charge_ability;
      }
      total_attack_power += attack_power;
    }
    return total_attack_power;
  },

  calculateDissentFactor: function(dissent_points) {
    var dissent_factor = Math.pow(Game.dissent_factor, dissent_points);
    return dissent_factor;
  },

  killUnits: function(units, losses) {
    for (var i=0; i<units.length; i++) {
      units[i].sufferBattleCasualties(losses[i], Dissent.reasons.degrade.battle);
    }
  },

  getFormationRatios: function(units) {
    var formation_widths = units.map(function(unit) {
      // Assume square formations for now
      return Math.sqrt(unit.getActive());
    });
    var total_width = formation_widths.reduce(function(prevValue, width) {
      return prevValue + width;
    });
    var ratios = formation_widths.map(function(width) {
      return width / total_width;
    });
    return ratios;
  },

  getUnitDefensiveAbility: function(unit, terrain, use_terrain) {
    var total_defensive_power = 0;
    var terrain_defense = 1;
    if (use_terrain) {
      var terrain_defense = terrain.getStat('defense_bonus', unit.side);
    }
    var dissent_factor = Battle.calculateDissentFactor(unit.dissent);
    if (dissent_factor != 1) {
      console.log("{0}'s dissent is {1} (DF of {2}".format(unit.name, unit.dissent, dissent_factor));
    }
    return unit.defensive_ability * terrain_defense * dissent_factor;
  },

  calculateRetreatLosses: function(battle, attackers, defenders, unit) {
    var TROOP_LOSS = Game.troop_loss_constant;
    // @TODO Calculate ranged attacker damage first

    var terrain = Game.getTerrainAtPoint(battle);
    var allied_units = defenders;
    var opposite_units = attackers;
    if (unit.battle_side == 'attacker') {
      allied_units = attackers;
      opposite_units = defenders;
    }

    var unit_index = allied_units.indexOf(unit);

    var attack_power = this.getAttackPower(opposite_units, terrain) * TROOP_LOSS;
    var ratios = this.getFormationRatios(allied_units);
    var defensive_ability = this.getUnitDefensiveAbility(unit, terrain);
    var exact_losses = ratios[unit_index] * attack_power / unit.retreat_ability;
    var unit_losses = Math.ceil(exact_losses);
    return unit_losses;
  },

  calculateSideLosses: function(battle, attacking_units, defending_units, use_terrain) {
    // @TODO Calculate ranged attacker damage first
    var TROOP_LOSS = Game.troop_loss_constant;
    var terrain = Game.getTerrainAtPoint(battle);
    var attack_power = this.getAttackPower(attacking_units, terrain) * TROOP_LOSS;
    var ratios = this.getFormationRatios(defending_units);
    var side_losses = defending_units.map(function(unit, index) {
      var defensive_ability = this.getUnitDefensiveAbility(unit, terrain, use_terrain);
      var exact_losses = ratios[index] * attack_power / defensive_ability;
      return Math.ceil(exact_losses)
    }.bind(this));
    return side_losses;
  },

  resolveBattle: function(battle, attackers, defenders) {
    var attacker_losses = this.calculateSideLosses(battle, defenders, attackers);
    var defender_losses = this.calculateSideLosses(battle, attackers, defenders, true);
    function add(a, b) { return a + b; }
    battle.casualties[this.ATTACKER] = attacker_losses.reduce(add);
    battle.casualties[this.DEFENDER] = defender_losses.reduce(add);

    var units = attackers.concat(defenders);
    this.killUnits(units, attacker_losses.concat(defender_losses));
  },

}

Crafty.c('Battle', {
  init: function() {
    this.requires('Actor, Collision, Targetable, spr_battle, Clickable')
      //.bind("NextTurn", this.nextTurn)
      .bind("RetreatUnits", this.retreatUnits)
      .bind("ResolveBattles", this.resolveIfNeeded)
      .bind("EndBattles", this.endIfNeeded)
      .attr({ type: "Battle" })
      ;
      this.z = 200;
      this.num_turns = 0;
      this.retreated_units = [];
  },

  resolveIfNeeded: function() {
    if (Game.turn % 1 == 0) this.resolve();
  },

  resolve: function() {
    this.num_turns += 1;
    var units = this.attackers.concat(this.defenders);
    Battle.resolveBattle(this, this.attackers, this.defenders);

    units.forEach(function(unit) {
      unit.stopCharge();
    });

    if (!this.isBattleActive()) {
      this.end_battle = true;
      Victory.updateWillToFight();
    }
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

    if (this.attacker.terrifying) {
      this.terrifyDefenders();
    }
  },

  start: function(attacker) {
    var attacker_direction = attacker.last_location;
    attacker.charge();

    this.attacker = attacker;
    this.attacking_side = attacker.side;
    this.defending_side = 1 - attacker.side;

    this.unit_updates = [];
    this.setRetreatConstraints(attacker_direction, attacker.at());

    this.casualties = [];
    this.new_units = [];

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
      units_in_combat[i].battle_finished('win');
      this.winning_side = units_in_combat[i].side;
    }
    this.finished = true;
    Game.battleEnded(this);
    Entity.destroy(this);
    if (this.siege_battle) Crafty.trigger('EndSiegeBattle', this);
    console.log('BATTLE ENDED');
  },

  join: function(unit) {
    this.end_battle = false;
    unit.charge();
    var battle_side = undefined;
    if (unit.side == this.attacking_side) {
      this.attackers.push(unit);
      battle_side = Battle.ATTACKER;
    } else {
      this.defenders.push(unit);
      battle_side = Battle.DEFENDER;
    }
    unit.notify_of_battle(battle_side);

    var retreat_constraints = this.getRetreatConstraints(unit.at());
    // @TODO Is this updating the retreat constraints in this object?
    retreat_constraints.addUnit(battle_side, unit.last_location);

    if (this.num_turns == 0 && unit.terrifying) {
      this.terrifyDefenders();
    }

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

  removeUnitById: function(unit_id) {
    var units = this.attackers;
    Units.removeUnitFromList(unit_id, this.attackers);
    Units.removeUnitFromList(unit_id, this.defenders);
  },

  unitDead: function(unit) {
    var unit_stats = this.getUnitUpdate(unit, 'killed');
    this.unit_updates.push(unit_stats);

    this.removeUnit(unit);
  },

  retreat: function(unit) {
    var losses = Battle.calculateRetreatLosses(
      this, this.attackers, this.defenders, unit);
    unit.sufferBattleCasualties(losses, Dissent.reasons.degrade.retreat);

    var unit_stats = this.getUnitUpdate(unit, 'retreated');
    this.unit_updates.push(unit_stats);

    this.retreated_units.push(unit.getId());

    unit.battle_finished('retreat');
    if (!this.isBattleActive()) {
      this.end_battle = true;
    }
    return losses;
  },

  retreatUnits: function() {
    for (var i in this.retreated_units) {
      var unit_id = this.retreated_units[i];
      this.removeUnitById(unit_id);
    }

    this.retreated_units = [];
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

  getBattleSideFromPlayer: function(player) {
    var battle_sides = {};
    battle_sides[this.attacking_side] = Battle.ATTACKER;
    battle_sides[this.defending_side] = Battle.DEFENDER;
    return battle_sides[player];
  },

  terrifyDefenders: function() {
    if (this.terrify_used) return;
    this.degradeUnitsDissent(this.defenders, 'terrified');
    this.terrify_used = true;
  },

  degradeUnitsDissent: function(units, dissent_gain_type) {
    for (var i in units) {
      Dissent.degrade(units[i], Dissent.reasons.degrade[dissent_gain_type]);
    }
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

  setRetreatConstraints: function(attacker_direction) {
    this.retreat_constraints = {};
    this.retreat_constraints = new RetreatConstraints(this.at());
    this.retreat_constraints.addUnit(Battle.ATTACKER, attacker_direction);
  },

  getRetreatConstraints: function(location) {
    return this.retreat_constraints;
  },

});

Crafty.c('SiegeBattle', {
  init: function() {
    this.requires('Battle');
    this.siege_battle = true;
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
    for (var i=0; i<units.length; i++) {
      var unit = units[i];
      for (var j in this.affected_tiles) {
        var location = this.affected_tiles[j].at();
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

  setRetreatConstraints: function(attacker_direction, location) {
    this.retreat_constraints = {};
    for (var i in this.affected_tiles) {
      var point = this.affected_tiles[i].at();
      if (this.retreat_constraints[point.x] === undefined) this.retreat_constraints[point.x] = {};
      var retreat = new RetreatConstraints(point);

      this.retreat_constraints[point.x][point.y] = retreat;
    }
    // @TODO This might not be the centre tile. Perform this on centre instead.
      if (this.retreat_constraints[point.x] === undefined) this.retreat_constraints[location.x] = {};

    this.retreat_constraints[location.x][location.y] = new RetreatConstraints(location);
    this.retreat_constraints[location.x][location.y].addUnit(Battle.ATTACKER, attacker_direction);
  },

  getRetreatConstraints: function(location) {
    if (location === undefined) return this.retreat_constraints;
    return this.retreat_constraints[location.x][location.y];
  },

});

Crafty.c('Siege', {
  init: function() {
    this.requires('Color, Actor, Targetable, Clickable')
      .bind("ResolveSieges", this.resolveIfNeeded)
      .bind("EndSiegeBattle", this.endSiegeBattleIfNeeded)
      .color('Red');
    this.z = 95;
    this.affected_tiles = [];
  },

  setSides: function(side) {
    this.sieging_side = side;
    this.besieged_side = 1 - side;
  },

  startSiegeBattle: function(attacker) {
    var battle = Entity.create('SiegeBattle');
    battle.at(this.at().x, this.at().y);
    battle.setSiegeBattleData(this);
    battle.start(attacker);

    this.battle = battle;
  },

  isSiegeBattleAt: function(location) {
    if (!this.battle) return false;
    // no siege battle in centre (will be a 'storm the city' battle
    if (location.x == this.at().x && location.y == this.at().y) {
      return false;
    }
    for (var i in this.affected_tiles) {
      var tile = this.affected_tiles[i];
      if (tile.at().x == location.x && tile.at().y == location.y) {
        return this.battle;
      }
    }
    return false;
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

  getAllSiegeAreas: function() {
    var locations = [this.at()];
    for (var i in this.affected_tiles) {
      locations.push(this.affected_tiles[i].at());
    }
    return locations;
  },

  resolveIfNeeded: function() {
    if (this.battle) return;
    var sieging_troops = 0;
    var besieged_troops = 0;
    var points = this.getAllSiegeAreas();

    for (var i in points) {
      var tile = points[i];
      var units_present = Units.getPresentUnits(tile);
      if (units_present.length > 0) {
        var unit = units_present[0];

        for (var j in units_present) {
          var unit = units_present[j];
          if (unit.side == this.sieging_side) {
            sieging_troops += unit.getActive();
          } else if (unit.side != this.sieging_side && unit.besieged) {
            besieged_troops += unit.getActive();
          }
        }
      }
    }

    if (besieged_troops <= 0 || sieging_troops < Game.min_troops_for_siege) {
      this.liftSiege();
    }
  },

  endSiegeBattleIfNeeded: function(battle) {
    if (this.battle == battle) {
      console.log('ending battle in siege');
      this.battle = undefined;
    }
  },

  liftSiege: function() {
    console.log("this.battle");
    console.log(this.battle);
    console.log('siege lifted!');
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
      //.color('Yellow');
      ;
    this.z = 95;
    this.alpha = 60;
  },
});

