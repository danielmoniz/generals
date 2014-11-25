LineOfSight = {

  clearFog: function() {
    var fog = Entity.get('Shadow');
    this.makeInvisible(fog);
    return this;
  },

  changeVisibility: function(entities, value) {
    for (var i=0; i<entities.length; i++) {
      entities[i].visible = value;

      // set any colocated entities to match visibility
      if (entities[i].colocated_entities) {
        for (var j in entities[i].colocated_entities) {
          entities[i].colocated_entities[j].visible = value;
        }
      }
    }
    return this;
  },

  makeVisible: function(entities) {
    this.changeVisibility(entities, true);
  },

  makeInvisible: function(entities) {
    this.changeVisibility(entities, false);
  },

  allUnitsVisible: function() {
    return this.allEntitiesVisible('Unit');
  },

  allUnitsInvisible: function() {
    return this.allEntitiesInvisible('Unit');
  },

  allEntitiesVisible: function(entity) {
    var entities = Entity.get(entity);
    return this.makeVisible(entities);
  },

  allEntitiesInvisible: function(entity) {
    var entities = Entity.get(entity);
    return this.makeInvisible(entities);
  },

  handleLineOfSight: function(fog_of_war, side) {
    if (!fog_of_war) return false;
    this.unitLineOfSight(side);
    this.tileLineOfSight(side);
    // Uncomment below if battles should be hidden from in-between turn views
    //this.battleLineOfSight(side);
  },

  unitLineOfSight: function(side) {
    this.allUnitsInvisible();
    var units_in_sight = this.getUnitsInSight(side);
    this.makeVisible(units_in_sight);
    return this;
  },

  battleLineOfSight: function(side) {
    this.allEntitiesInvisible('Battle');
    var battles_in_sight = this.getGenericEntitiesInSight('Battle', side);
    this.makeVisible(battles_in_sight);
    return this;
  },

  tileLineOfSight: function(side) {
    this.allEntitiesVisible('Shadow');
    var tiles_in_sight = this.getGenericEntitiesInSight('Shadow', side);
    this.makeInvisible(tiles_in_sight);
    return this;
  },

  getUnitsInSight: function(side) {
    if (side === undefined) return [];
    var units = Unit.getUnitsBySide(side);
    var friendly_units = units.friendly;
    var enemy_units = units.enemy;
    var enemies_in_sight = this.getEntitiesInSight(enemy_units, friendly_units);
    return enemies_in_sight.concat(friendly_units);
  },

  getGenericEntitiesInSight: function(entity, side) {
    if (side === undefined) return [];
    var friendly_units = Unit.getFriendlyUnits(side);
    var entities = Entity.get(entity);
    return this.getEntitiesInSight(entities, friendly_units);
  },

  /*
   * Filters param entities to only those that can be seen by the
   * seeing_entities.
   */
  getEntitiesInSight: function(entities, friendly_units) {
    var entities_in_sight = [];
    for (var i=0; i<entities.length; i++) {
      var in_sight = false;
      var entity = entities[i];
      for (var j=0; j<friendly_units.length; j++) {
        var friend = friendly_units[j];
        var distance = Utility.getDistance(friend.at(), entity.at());
        if (distance <= friend.max_sight) {
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
