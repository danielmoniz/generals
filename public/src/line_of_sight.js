LineOfSight = {

  handleLineOfSight: function(fog_of_war, side, ignore_sight_outlines) {
    var friendly_units = [];
    if (side !== undefined) friendly_units = Units.getFriendlyUnits(side);

    var points = this.determinePointsInSight(friendly_units);
    this.points_in_sight[side] = points;
    var units_in_sight = this.unitLineOfSight(points, side);

    if (Game.fog_of_war) {
      this.allEntitiesVisible('Shadow');
      var fog_in_sight = this.tileLineOfSight(points, side);
      this.makeInvisible(fog_in_sight);
    }

    if (!ignore_sight_outlines) this.handleSightOutlines(side);
  },

  determinePointsInSight: function(units) {
    var points = [];
    if (Game.fog_of_war) {
      for (var i in units) {
        var unit = units[i];
        var nearby = Utility.getPointsWithinDistance(unit.at(), unit.max_sight, Game.map_grid);
        points.push(unit.at());
        points = points.concat(nearby);
      }
    } else {
      for (var x=0; x<Game.map_grid.width; x++) {
        for (var y=0; y<Game.map_grid.height; y++) {
          points.push(Game.terrain[x][y].at());
        }
      }
    }

    var positional_points = this.getSpacialArrayFromList(points);
    for (var i in points) {
      var point = points[i];
    }
    return positional_points;
  },

  getSpacialArrayFromList: function(points) {
    var spacial = [];
    for (var i in points) {
      var x = points[i].x;
      var y = points[i].y;
      if (spacial[x] === undefined) spacial[x] = [];
      // @TODO This should probably be a coordinate (or be false/undefined)
      spacial[x][y] = true;
    }
    return spacial;
  },

  handleSightOutlines: function(side) {
    if (side === undefined) side = Game.player;
    this.hideSightOutlines();
    var points_in_sight = this.points_in_sight[side];

    if (Game.ally_sight_lines && side !== undefined) {
      this.outlineVisibleRegions(points_in_sight);
    }

    if (Game.enemy_sight_lines) {
      var enemy_units_in_sight = this.getEnemyUnitsInSight(side);
      var points = this.determinePointsInSight(enemy_units_in_sight);
      this.outlineVisibleRegions(points, 'enemy');
    }
  },

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

  tileLineOfSight: function(points, side, units) {
    var tiles_in_sight = [];
    for (var x in points) {
      for (var y in points[x]) {
        var fog_tile = Game.fog_map[x][y];
        tiles_in_sight.push(fog_tile);
      }
    }
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

  positionInSight: function(position, seeing_side) {
    var visible_points = this.points_in_sight[seeing_side];
    if (visible_points[position.x] && visible_points[position.x][position.y]) {
      return true;
    }
    return false;
  },

}
