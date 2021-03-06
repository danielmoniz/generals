LineOfSight = {

  handleLineOfSight: function(side, ignore_sight_outlines) {
    var points = this.determineSidePointsInSight(side);
    this.unitLineOfSight(points, side);

    if (Game.fog_of_war) {
      this.allEntitiesVisible('Shadow');
      var fog_in_sight = this.tileLineOfSight(points, side);
      this.makeInvisible(fog_in_sight);

      this.handleHideableElements(points, side);
    }

    if (!ignore_sight_outlines) this.handleSightOutlines(side);
  },

  determineSidePointsInSight: function(side) {
    var seeing_entities = [];
    var friendly_units = [];
    if (side !== undefined) friendly_units = Units.getFriendlyUnits(side);
    seeing_entities = seeing_entities.concat(friendly_units);

    var settlements = Entity.get('Settlement');
    for (var i in settlements) {
      var settlement = settlements[i];
      if (settlement.owner == side && !settlement.ruined && settlement.owner !== undefined) {
        seeing_entities.push(settlement);
      }
    }

    var points = this.determinePointsInSight(seeing_entities);
    this.points_in_sight[side] = points;
    return points;
  },

  getSightGrid: function(grid) {
    return Game.sight_grid;
  },

  determinePointsInSight: function(entities) {
    var sight_grid = this.getSightGrid(Game.terrain);

    var fires = Query.getNonDestroyed('Fire');
    for (var i in fires) {
      var fire = fires[i];
      var grid_item = sight_grid[fire.at().x][fire.at().y];
      grid_item.stop = true;
    }

    var points = [];
    if (Game.fog_of_war) {
      for (var i in entities) {
        var entity = entities[i];
        points.push(entity.at());
        if (entity.max_sight) {
          var visible_points = Utility.getPointsWithinDistance(entity.at(), entity.max_sight, Game.map_grid);
          if (Game.line_of_sight_blocking) {
            visible_points = LineOfSightBlocking.getTilesInSight(entity.at(), entity.max_sight, visible_points, sight_grid);
          }

          points = points.concat(visible_points);
        }

      }
    } else {

      for (var x=0; x<Game.map_grid.width; x++) {
        for (var y=0; y<Game.map_grid.height; y++) {
          points.push(Game.terrain[x][y].at());
        }
      }
    }

    var positional_points = Utility.getSpacialArrayFromList(points);
    for (var i in points) {
      var point = points[i];
    }

    return positional_points;
  },

  handleHideableElements: function(visible_points, side) {
    var greyable = Entity.get('Hideable');
    for (var i in greyable) {
      var entity = greyable[i];
      if (visible_points[entity.at().x] && visible_points[entity.at().x][entity.at().y]) {
        entity.spot(side);
      } else {
        entity.hide(side);
      }

      var data = entity.spotted[side];
      var state = undefined;
      if (data !== undefined) state = data.state;

      entity.getToVisualState(state);
    }
  },

  getPointsInSight: function(side) {
    return this.points_in_sight[side];
  },

  handleSightOutlines: function(side) {
    if (side === undefined) side = Game.player;
    this.hideSightOutlines();
    var points_in_sight = this.points_in_sight[side];

    if (Game.ally_sight_lines && side !== undefined) {
      GUI.outlineVisibleRegions(points_in_sight, 'ally sight range');
    }

    if (Game.enemy_sight_lines && side !== undefined) {
      var enemy_units = Units.getEnemyUnits(side);
      var enemy_units_in_sight = this.getEntitiesInSight(enemy_units, side);
      var settlements = Entity.get('Settlement');
      var apparent_enemy_settlements = Query.getSpottedEnemySettlements(side);

      var seeing_entities = enemy_units_in_sight.concat(apparent_enemy_settlements);
      var points = this.determinePointsInSight(seeing_entities);
      GUI.outlineVisibleRegions(points, 'enemy sight range');
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
    Crafty.trigger("RemoveSightLines");
  },

  unitLineOfSight: function(visible_points, side) {
    this.allUnitsInvisible();
    var units = Units.getAllUnits();
    if (Game.turn_count < 0) {
      if (Game.show_units) this.makeVisible(units);
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

  getEntitiesInSight: function(entities, side) {

    var points_in_sight = this.getPointsInSight(side);
    var entities_in_sight = entities.filter(function(entity) {
      try {
        return points_in_sight[entity.at().x][entity.at().y];
      } catch(error) {};
      return false;
    });

    return entities_in_sight;
  },

}
