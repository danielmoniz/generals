LineOfSight = {
  max_sight: 10,

  applyToAll: function() {
    console.log("applying line of sight to all tiles...");
    var fake_grass = Crafty('FakeGrass').get();
    for (var i=0; i<fake_grass.length; i++) {
      var amount = 5;
      //fake_grass[i].brightenColour(amount, amount, amount);
      fake_grass[i].visible = false;
    }
  },

  unapply: function() {
    var fake_grass = Crafty('FakeGrass').get();
    for (var i=0; i<fake_grass.length; i++) {
      var amount = 1;
      fake_grass[i].resetColour();
    }
  },

  makeVisible: function(entities) {
    for (var i=0; i<entities.length; i++) {
      entities[i].visible = true;
    }
    return this;
  },

  makeInvisible: function(entities) {
    for (var i=0; i<entities.length; i++) {
      entities[i].visible = false;
    }
    return this;
  },

  enemyInvisible: function(side) {
    var units = Crafty('Unit').get();
    for (var i=0; i<units.length; i++) {
      if (units[i].side != side) {
        units[i].visible = false;
      } else {
        units[i].visible = true;
      }
    }
  },

  allUnitsVisible: function() {
    return this.allEntitiesVisible('Unit');
  },

  allUnitsInvisible: function() {
    return this.allEntitiesInvisible('Unit');
  },

  allEntitiesVisible: function(entity) {
    var entities = Crafty(entity).get();
    for (var i=0; i<entities.length; i++) {
      entities[i].visible = true;
    }
    return this;
  },

  allEntitiesInvisible: function(entity) {
    var entities = Crafty(entity).get();
    for (var i=0; i<entities.length; i++) {
      entities[i].visible = false;
    }
    return this;
  },

  handleLineOfSight: function(side) {
    this.unitLineOfSight(side);
    this.battleLineOfSight(side);
    this.tileLineOfSight(side);
  },

  unitLineOfSight: function(side) {
    this.allUnitsInvisible();
    var units_in_sight = this.getEnemyUnitsInSight(side);
    this.makeVisible(units_in_sight);
    return this;
  },

  tileLineOfSight: function(side) {
    this.allEntitiesVisible('Shadow');
    var tiles_in_sight = this.getEntitiesInSight('Shadow', side);
    this.makeInvisible(tiles_in_sight);
    return this;
  },

  battleLineOfSight: function(side) {
    this.allEntitiesInvisible('Battle');
    var battles_in_sight = this.getBattlesInSight(side);
    this.makeVisible(battles_in_sight);
    return this;
  },

  getEnemyUnitsInSight: function(side) {
    var units = Unit.getUnitsBySide(side);
    var friendly_units = units.friendly;
    var enemy_units = units.enemy;

    var units_in_sight = [];
    for (var i=0; i<enemy_units.length; i++) {
      var in_sight = false;
      var enemy = enemy_units[i];
      for (var j=0; j<friendly_units.length; j++) {
        var friend = friendly_units[j];
        var distance = Utility.getDistance(friend.at(), enemy.at());
        if (distance < this.max_sight) {
          in_sight = true;
          break;
        }
      }
      if (in_sight) {
        units_in_sight.push(enemy);
      }
    }
    return units_in_sight.concat(friendly_units);
  },

  getBattlesInSight: function(side) {
    var friendly_units = Unit.getFriendlyUnits(side);

    var battles = Crafty('Battle').get();
    var battles_in_sight = [];
    for (var i=0; i<battles.length; i++) {
      var in_sight = false;
      var battle = battles[i];
      for (var j=0; j<friendly_units.length; j++) {
        var friend = friendly_units[j];
        var distance = Utility.getDistance(friend.at(), battle.at());
        if (distance < this.max_sight) {
          in_sight = true;
          break;
        }
      }
      if (in_sight) {
        battles_in_sight.push(battle);
      }
    }
    return battles_in_sight;
  },

  getEntitiesInSight: function(entity, side) {
    var friendly_units = Unit.getFriendlyUnits(side);

    var entities = Crafty(entity).get();
    var entities_in_sight = [];
    for (var i=0; i<entities.length; i++) {
      var in_sight = false;
      var entity = entities[i];
      for (var j=0; j<friendly_units.length; j++) {
        var friend = friendly_units[j];
        var distance = Utility.getDistance(friend.at(), entity.at());
        if (distance < this.max_sight) {
          in_sight = true;
          break;
        }
      }
      if (in_sight) {
        entities_in_sight.push(entity);
      }
    }
    return entities_in_sight;
  },

}
