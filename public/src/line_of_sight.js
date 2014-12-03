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
    var enemy_units_in_sight = this.unitLineOfSight(side);
    var tiles_in_sight = this.tileLineOfSight(side);
    //var tiles_in_sight_of_enemy = this.tileLineOfSight(side, enemy_units_in_sight);

    Crafty.trigger("RemoveBoxSurrounds");
    var coords_in_sight = {};
    for (var x=0; x<Game.map_grid.width; x++) {
      coords_in_sight[x] = {};
    }
    for (var i in tiles_in_sight) {
      var tile = tiles_in_sight[i];
      coords_in_sight[tile.getX()][tile.getY()] = true;
    }

    for (var x in coords_in_sight) {
      for (var y in coords_in_sight[x]) {
        var point = { x: x, y: y };
        var adjacent_points = Utility.getPointsWithinDistance(point, 1, Game.map_grid);
        for (var i in adjacent_points) {
          var adjacent = adjacent_points[i];

          if (!coords_in_sight[adjacent.x][adjacent.y]) {
            // @TODO Should find a more efficient way than creating every time
            // Eg. recycle tiles, or build entirely at the start and re-use
            var new_surround_object = Entity.create('BoxSurround');
            new_surround_object.at(x, y);

            if (adjacent.x < x) {
              new_surround_object.addComponent('spr_box_surround_left');
            } else if (adjacent.x > x) {
              new_surround_object.addComponent('spr_box_surround_right');
            } else if (adjacent.y < y) {
              new_surround_object.addComponent('spr_box_surround_top');
            } else if (adjacent.y > y) {
              new_surround_object.addComponent('spr_box_surround_bottom');
            }
          }
        }
      }
    }

    // Uncomment below if battles should be hidden from in-between turn views
    //this.battleLineOfSight(side);

  },

  unitLineOfSight: function(side) {
    this.allUnitsInvisible();
    var units_in_sight = this.getUnitsInSight(side);
    this.makeVisible(units_in_sight);
    return units_in_sight;
  },

  battleLineOfSight: function(side) {
    this.allEntitiesInvisible('Battle');
    var battles_in_sight = this.getGenericEntitiesInSight('Battle', side);
    this.makeVisible(battles_in_sight);
    return this;
  },

  tileLineOfSight: function(side, units) {
    this.allEntitiesVisible('Shadow');
    var tiles_in_sight = this.getGenericEntitiesInSight('Shadow', side, units);
    this.makeInvisible(tiles_in_sight);
    return tiles_in_sight;
  },

  getUnitsInSight: function(side, enemies_only) {
    if (side === undefined) return [];
    var units = Units.getUnitsBySide(side);
    var enemies_in_sight = this.getEntitiesInSight(units.enemy, units.friendly);
    if (enemies_only) return enemies_in_sight;
    return enemies_in_sight.concat(units.friendly);
  },

  getEnemyUnitsInSight: function(side) {
    return this.getUnitsInSight(side, 'enemies only');
  },

  getGenericEntitiesInSight: function(entity, side, units) {
    if (side === undefined) return [];
    if (units !== undefined) {
      var friendly_units = units;
    } else {
      var friendly_units = Units.getFriendlyUnits(side);
    }
    var entities = Entity.get(entity);
    return this.getEntitiesInSight(entities, friendly_units);
  },

  /*
   * Filters param entities to only those that can be seen by the
   * seeing entities.
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
