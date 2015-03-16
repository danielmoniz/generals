LineOfSight = {

  points_in_sight: {},

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

  handleLineOfSight: function(fog_of_war, side, ignore_sight_outlines) {
    if (!fog_of_war) return false;
    var points = this.determinePointsInSight(side);
    points = this.getSpacialArrayFromList(points);
    this.points_in_sight[side] = points;
    var units = this.unitLineOfSight(points, side);

    this.allEntitiesVisible('Shadow');
    var fog_in_sight = this.tileLineOfSight(points, side);
    this.makeInvisible(fog_in_sight);

    if (!ignore_sight_outlines) this.handleSightOutlines(side);

    // Uncomment below if battles should be hidden from in-between turn views
    //this.battleLineOfSight(side);

  },

  determinePointsInSight: function(side, units) {
    var points = [];
    var tiles_in_sight = this.getGenericEntitiesInSight('Shadow', side, units);
    for (var i in tiles_in_sight) {
      var tile = tiles_in_sight[i];
      points.push(tile.at());
    }
    return points;
  },

  getSpacialArrayFromList: function(points) {
    var spacial = [];
    for (var i in points) {
      var x = points[i].x;
      var y = points[i].y;
      if (spacial[x] === undefined) spacial[x] = [];
      spacial[x][y] = true;
    }
    return spacial;
  },

  handleSightOutlines: function(side) {
    if (side === undefined) side = Game.player;
    this.hideSightOutlines();
    var points_in_sight = this.points_in_sight[side];

    if (side !== undefined && Game.ally_sight_lines) {
      this.outlineVisibleRegions(points_in_sight);
    }

    if (Game.enemy_sight_lines) {
      var enemy_units_in_sight = this.getEnemyUnitsInSight(side);
      var points = this.determinePointsInSight(side, enemy_units_in_sight);
      points = this.getSpacialArrayFromList(points);

      this.outlineVisibleRegions(points, 'enemy');
    }
  },

  hideSightOutlines: function() {
    Crafty.trigger("RemoveBoxSurrounds");
  },

  outlineVisibleRegions: function(coords_in_sight, enemy) {

    for (var x in coords_in_sight) {
      for (var y in coords_in_sight[x]) {
        var point = { x: x, y: y };
        var adjacent_points = Utility.getPointsWithinDistance(point, 1, Game.map_grid);
        for (var i in adjacent_points) {
          var adjacent = adjacent_points[i];

          if (!coords_in_sight[adjacent.x] || !coords_in_sight[adjacent.x][adjacent.y]) {
            // @TODO Should find a more efficient way than creating every time
            // Eg. recycle tiles, or build entirely at the start and re-use
            this.renderOutline(point, adjacent, enemy);
          }
        }
      }
    }
  },

  renderOutline: function(point, adjacent, enemy) {
    var new_surround_object = Entity.create('BoxSurround');
    var x = point.x;
    var y = point.y;
    new_surround_object.at(x, y);

    if (enemy) {
      if (adjacent.x < x) {
        new_surround_object.addComponent('spr_box_surround_enemy_left');
      } else if (adjacent.x > x) {
        new_surround_object.addComponent('spr_box_surround_enemy_right');
      } else if (adjacent.y < y) {
        new_surround_object.addComponent('spr_box_surround_enemy_top');
      } else if (adjacent.y > y) {
        new_surround_object.addComponent('spr_box_surround_enemy_bottom');
      }
    } else {
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
  },

  unitLineOfSight: function(visible_points, side) {
    this.allUnitsInvisible();
    var units = Units.getAllUnits();
    if (Game.turn_count < 0) {
      return units;
    }

    var visible_units = this.getUnitsWithinPoints(units, visible_points);
    if (Game.show_units) this.makeVisible(visible_units);
    return visible_units;
  },

  getUnitsWithinPoints: function(units, points) {
    var visible_units = [];
    for (var i in units) {
      var unit = units[i];
      if (points[unit.at().x] &&
          points[unit.at().x][unit.at().y]) {
        visible_units.push(unit);
      }
    }

    return visible_units;
  },

  battleLineOfSight: function(side) {
    this.allEntitiesInvisible('Battle');
    var battles_in_sight = this.getGenericEntitiesInSight('Battle', side);
    this.makeVisible(battles_in_sight);
    return this;
  },

  tileLineOfSight: function(points, side, units) {
    var tiles_in_sight = this.getGenericEntitiesInSight('Shadow', side, units);
    return tiles_in_sight;
  },

  getEnemyUnitsInSight: function(side) {
    if (side === undefined) return [];
    var units = Units.getUnitsBySide(side).enemy;
    if (this.points_in_sight[side] === undefined) return units;
    var points_in_sight = this.points_in_sight[side];
    var visible_units = this.getUnitsWithinPoints(units, points_in_sight);
    return visible_units;
  },

  getGenericEntitiesInSight: function(entity, side, units) {
    var entities = Entity.get(entity);
    if (!Game.fog_of_war) {
      return entities;
    }
    if (side === undefined) return [];
    if (units !== undefined) {
      var friendly_units = units;
    } else {
      var friendly_units = Units.getFriendlyUnits(side);
    }
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

  entityInSight: function(entity, seeing_entities) {
    return this.positionInSight(entity.at(), seeing_entities);
  },

  positionInSight: function(position, seeing_entities) {
    for (var i=0; i<seeing_entities.length; i++) {
      var entity = seeing_entities[i];
      var distance = Utility.getDistance(entity.at(), position);
      if (distance <= entity.max_sight) {
        return true;
      }
    }
    return false;
  },

}
