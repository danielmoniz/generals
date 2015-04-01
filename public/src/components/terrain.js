
// Terrain is an entity that will be drawn on the map and will affect movement
Crafty.c('Terrain', {
  init: function() {
    this.requires('Actor, Clickable')
      .bind("NextTurn", this.nextTurn)
    ;
    this.z = 80;

  },

  nextTurn: function() {
    this.remaining_provided_supply = this.provides_supply;
    this.updateStats();
  },

  report: function() {
    Output.printTerrain(this);
  },

  setHeight: function() {
    this.height = Game.height_map[this.at().x][this.at().y];
    return this;
  },

  ignite: function(unit) {
    var fire = Entity.create('Fire').at(this.at().x, this.at().y);

    var ignite_stats = {
      on_fire: true,
      flammable: false,
      provides_supply: 0,
    };
    this.addStats(ignite_stats);

    if (unit !== undefined) fire.spot(unit.side);
  },

  extinguish: function() {
    var extinguish_stats = {
      on_fire: false,
      flammable: true,
    };
    this.addStats(extinguish_stats);
  },

  burn: function() {
    var burned_stats = {
      flammable: false,
      on_fire: false,
      burned: true,
      ruined: true,

      supply_to_steal: false,
    };
    this.addStats(burned_stats);

    if (this.pillage) {
      this.pillage();
    }
  },

  destroyTerrain: function(unit) {
    Victory.entityDestroyed(this, unit);
  },

  providesSupplyToSide: function(side) {
    var is_correct_side = true;
    if (this.has('Settlement')) { // can't supply from enemy cities
      is_correct_side = side === undefined || this.side === undefined || this.side == side;
    }
    return is_correct_side;
  },

  getStat: function(stat, side) {
    if (this[stat] === undefined) {
      throw new Error('BadStatName, {0} is not an stat possessed by terrain {1}.'.format(stat, this.type));
    }

    var owner_text = this.getOwnerText(side);
    if (this[stat][owner_text] === undefined) {
      return this[stat];
    }
    return this[stat][owner_text];
  },

  getOwnerText: function(side) {
    if (side == this.owner) return 'ally';
    if (this.owner === undefined) return 'neutral';
    if (side != this.owner) return 'enemy';
  },

});

// A Transportation object is one meant to carry people/items, eg. a road,
// bridge, etc.
Crafty.c('Transportation', {
  init: function() {
    this.requires('Terrain')
    ;
  },
});

// Deals with terrain that can be moved onto.
Crafty.c('Passable', {
  init: function() {
    this.requires('Grid, Mouse, Terrain, Receivable')
    ;
  }
});

// Deals with terrain that can be moved onto.
Crafty.c('Impassable', {
  init: function() {
    this.requires('Grid, Mouse, Solid, Terrain')
      .bind('MouseUp', function(e) {
      if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected) {
        console.log('Terrain is impassable! Cannot move here.');
      } else if (e.mouseButton == Crafty.mouseButtons.LEFT) {
        //Game.select(this);
      }
    })
    ;
  }
});

// A Tree is just an actor with a certain color
Crafty.c('Tree', {
  init: function() {
    this.requires('Terrain, Passable, Hideable, SpriteAnimation, spr_tree, Color');
    this.reel('healthy', 1000, 0, 0, 1);
    this.reel('ruined', 1000, 1, 0, 1);

    this.state = 'healthy';
    this.get_to_state = {
      undefined: function(entity) {
        entity.animate('healthy', -1);
      },
      healthy: function(entity) {
        entity.animate('healthy', -1);
      },
      ruined: function(entity) {
        entity.animate('ruined', -1);
      },
    };
  },

  pillage: function() {
    var extra_burned_stats = {
      move_difficulty: 1.3,
      defense_bonus: 1.05,
    };
    this.addStats(extra_burned_stats);

    this.state = 'ruined';
    this.getToVisualState(this.state);

    var supply = this.supply_to_steal;
    return supply;
  },

});

// Grass is just green, passable terrain
Crafty.c('Grass', {
  init: function() {
    this.requires('Terrain, Passable');
  },
});

// Farmland is open terrain that provides supply
Crafty.c('Farm', {
  init: function() {
    this.requires('Terrain, Passable, Hideable, SpriteAnimation, spr_farm');
    this.reel('healthy', 1000, 0, 0, 1);
    this.reel('ruined', 1000, 1, 0, 1);

    this.state = 'healthy';
    this.get_to_state = {
      undefined: function(entity) {
        entity.animate('healthy', -1);
      },
      healthy: function(entity) {
        entity.animate('healthy', -1);
      },
      ruined: function(entity) {
        entity.animate('ruined', -1);
      },
    };

  },

  pillage: function(unit) {
    this.state = 'ruined';
    if (unit !== undefined) this.spot(unit.side);
    this.getToVisualState(this.state);

    var supply = this.supply_to_steal;
    this.addStats({
        pillaged: true,
        ruined: true,
        move_difficulty: 1.35,
        supply_to_steal: 0,
        flammable: false,
        provides_supply: 0,
        sight_impedance: 1,
      });
    this.destroyTerrain(unit);
    return supply;
  },

});

Crafty.c('Water', {
  init: function() {
    this.requires('Color, Terrain, Impassable');
  }
});

// Grass is just empty passable terrain
Crafty.c('Bridge', {
  init: function() {
    this.requires('Color, Terrain, Passable, Transportation');
  },
});

Crafty.c('Settlement', {
  init: function() {
    this.requires('Terrain');
  },

  /*
   * Sets any dynamic stats for the unit that require this.stats to be set
   * properly.
   */
  setStats: function() {
    this.addStat('max_supply', this.population * this.max_supply_multiplier);
    this.addStat('supply_remaining', this.population * this.max_supply_multiplier);
    this.addStat('owner', this.side);
  },

  capture: function(side) {
    var flag = Entity.create('Flag').pickSide(side);
    flag.at(this.at().x, this.at().y);
    this.addStat('flag', flag);
    var old_owner = this.owner;
    this.addStat('owner', side);

    // inform previous owner of capturing their city
    if (side == 1 - old_owner) {
      flag.spot(old_owner);
    }
    this.spot(side);
  },

});

Crafty.c('City', {
  init: function() {
    this.requires('Settlement, Passable, Hideable, SpriteAnimation, spr_city')
      .attr({
        farms: [],
      })
      .bind("NextTurn", this.handleSupply)
      .reel('healthy', 1000, 1, 0, 1)
      .reel('ruined', 1000, 1, 1, 1)
      ;

    this.state = 'healthy';
    this.get_to_state = {
      undefined: function(entity) {
        entity.animate('healthy', -1);
      },
      healthy: function(entity) {
        entity.animate('healthy', -1);
      },
      ruined: function(entity) {
        entity.animate('ruined', -1);
      },
    };

  },

  renderOthers: function() {
    var city_left = Entity.create('CitySide').pickSide('left');
    city_left.at(this.at().x - 1, this.at().y);
    var city_right = Entity.create('CitySide').pickSide('right');
    city_right.at(this.at().x + 1, this.at().y);
    this.addStat('city_sides', [city_left, city_right]);

    var flag = Entity.create('Flag').pickSide(this.side);
    flag.at(this.at().x, this.at().y);
    this.addStat('flag', flag);
  },

  handleSupply: function() {
    // @TODO Update city's supply amount depending on whether it is supplied
    // from a supply route (depends on side, or if it is owned/neutral)
  },

  pillage: function(unit, pillage_power) {
    if (this.being_sacked === undefined) {
      this.being_sacked = Entity.create('CityBeingSacked');
      this.being_sacked.at(this.at().x, this.at().y);
    }

    var supply_to_steal = Math.min(Game.supply_steal_factor * pillage_power, this.supply_remaining);
    this.supply_remaining -= supply_to_steal;
    if (this.supply_remaining <= 0) {
      this.addStats({
        sacked: true,
        ruined: true,
        supply_to_steal: 0,
        defense_bonus: 1.1,
        provides_supply: 0,
      });

      // for now, destroy the city sides when the city is sacked
      this.city_sides[0].ruin();
      this.city_sides[1].ruin();

      this.being_sacked.end();
      this.being_sacked.spot(unit.side);

      this.flag.destroy();
      this.destroyTerrain(unit);

      this.state = 'ruined';
      this.getToVisualState(this.state);
    } else {
      this.being_sacked.show();
      this.being_sacked.spot(unit.side);
    }

    return supply_to_steal;
  },
});

Crafty.c('Flag', {
  init: function() {
    this.requires('Actor, Hideable');
    this.z = 88;

    this.state = 'active';
    this.get_to_state = {
      undefined: function(entity) { entity.visible = false; },
      active: function(entity) { entity.visible = true; },
      gone: function(entity) { entity.visible = false; },
    };

    return this;
  },

  pickSide: function(player) {
    this.addComponent('spr_city_flag_{0}'.format(player));
    return this;
  },

});

Crafty.c('CityBeingSacked', {
  init: function() {
    this.requires('Actor, Hideable, spr_city_being_sacked')
      .bind('NextTurn', this.nextTurn)
    ;
    this.z = 87;

    this.state = 'active';
    this.get_to_state = {
      undefined: function(entity) {
        entity.visible = false;
      },
      active: function(entity) {
        entity.visible = true;
      },
      gone: function(entity) {
        entity.visible = false;
      },
    };
  },

  nextTurn: function() {
    if (Game.turn == this.turn_started) {
      this.end();
    }
  },

  show: function() {
    this.visible = true;
    this.addStat('turn_started', Game.turn);
    this.state = 'active';
    this.destroyed = false;
  },

  end: function() {
    this.addStat('turn_started', undefined);
    this.state = 'gone';
    this.destroyed = true;
  },
});

Crafty.c('CitySide', {
  init: function() {
    this.requires('Actor, Hideable');
    this.z = 85;

    this.state = 'healthy';
    this.get_to_state = {
      undefined: function(entity) {
        entity.visible = true;
      },
      healthy: function(entity) {
        entity.visible = true;
      },
      ruined: function(entity) {
        entity.visible = false;
      },
    };
  },

  pickSide: function(side) {
    if (side == 'left') {
      this.addComponent("spr_city_left");
    } else if (side == 'right') {
      this.addComponent("spr_city_right");
    } else {
      throw new Error('InvalidCitySideValue', "City side value must be 'left' or 'right'.");
    }
    return this;
  },

  ruin: function() {
    this.state = 'ruined';
    this.destroyed = true;
    this.getToVisualState(this.state);
  },

});

Crafty.c('Town', {
  init: function() {
    this.requires('Settlement, Passable, Hideable, SpriteAnimation, spr_town')
      .attr({
        farms: [],
      })
      .bind("NextTurn", this.handleSupply)
      .reel('healthy', 1000, 0, 0, 1)
      .reel('ruined', 1000, 2, 0, 1)
      ;

    this.state = 'healthy';
    this.get_to_state = {
      undefined: function(entity) {
        entity.animate('healthy', -1);
      },
      healthy: function(entity) {
        entity.animate('healthy', -1);
      },
      ruined: function(entity) {
        entity.animate('ruined', -1);
      },
    };
  },

  renderOthers: function() {
    var flag = Entity.create('Flag').pickSide(this.side);
    flag.at(this.at().x, this.at().y);
    this.addStat('flag', flag);
  },

  handleSupply: function() {
    // @TODO Update town's supply amount depending on whether it is supplied
    // from a supply route (depends on side, or if it is owned/neutral)
  },

  pillage: function(unit, pillage_power) {
    if (this.being_sacked === undefined) {
      this.being_sacked = Entity.create('TownBeingSacked');
      this.being_sacked.at(this.at().x, this.at().y);
    }

    var supply_to_steal = Math.min(Game.supply_steal_factor * pillage_power, this.supply_remaining);
    this.supply_remaining -= supply_to_steal;
    if (this.supply_remaining <= 0) {
      this.addStats({
        sacked: true,
        ruined: true,
        supply_to_steal: 0,
        defense_bonus: 1.1,
        provides_supply: 0,
      });

      // for now, destroy the town sides when the town is sacked
      this.being_sacked.end();
      this.being_sacked.spot(unit.side);

      this.flag.destroy();
      this.destroyTerrain(unit);

      this.state = 'ruined';
      this.getToVisualState(this.state);

    } else {
      this.being_sacked.show();
      this.being_sacked.spot(unit.side);
    }

    return supply_to_steal;
  },
});

Crafty.c('TownBeingSacked', {
  init: function() {
    this.requires('Actor, Hideable, spr_town_being_sacked')
      .bind('NextTurn', this.nextTurn)
    ;
    this.z = 87;

    this.state = 'active';
    this.get_to_state = {
      undefined: function(entity) {
        entity.visible = false;
      },
      active: function(entity) {
        entity.visible = true;
      },
      gone: function(entity) {
        entity.visible = false;
      },
    };
  },

  nextTurn: function() {
    if (Game.turn == this.turn_started) {
      this.end();
    }
  },

  show: function() {
    this.visible = true;
    this.addStat('turn_started', Game.turn);
    this.state = 'active';
    this.destroyed = false;
  },

  end: function() {
    this.addStat('turn_started', undefined);
    this.state = 'gone';
    this.destroyed = true;
  },
});

// Grass is just green, passable terrain
Crafty.c('Road', {
  init: function() {
    this.requires('Terrain, Passable, Transportation');
    this.z = this.z + 1; // one above other terrain
  },

  detect_type: function() {

    // look at adjacent road spaces and determine which component should be
    // added (ie. which sprite is required).
    function hasRoadConnection(x, y) {
      var road_connections = ['Road', 'Bridge', 'Settlement'];
      var tile = Game.terrain[x][y];
      var road = Game.roads[x][y];
      for (var i=0; i<road_connections.length; i++) {
        if (tile.has(road_connections[i]) || (road !== undefined && road !== null)) return true;
      }
      return false;
    }

    function getLeft(road) {
      if (road.getX() == 0) return false;
      return hasRoadConnection(road.getX() - 1, road.getY());
    }
    function getRight(road) {
      if (road.getX() == Game.map_grid.width - 1) return false;
      return hasRoadConnection(road.getX() + 1, road.getY());
    }
    function getUp(road) {
      if (road.getY() == 0) return false;
      return hasRoadConnection(road.getX(), road.getY() - 1);
    }
    function getDown(road) {
      if (road.getY() == Game.map_grid.height - 1) return false;
      return hasRoadConnection(road.getX(), road.getY() + 1);
    }

    this.sprite_key = "";
    function booleanToKey(bool_val) {
      var key = bool_val ? 'T' : 'F';
      return key;
    }
    var directions = [getUp, getRight, getDown, getLeft];
    var num_connections = 0;
    for (var i=0; i<directions.length; i++) {
      var connection = directions[i](this);
      this.sprite_key += booleanToKey(connection);
      if (connection) num_connections++;
    }

    // Ensure that supply roads properly lead off the map
    if (this.is_supply_route) {
      if (this.getX() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 3, 'T');
      } else if (this.getX() == Game.map_grid.width - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 1, 'T');
      } else if (this.getY() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 0, 'T');
      } else if (this.getY() == Game.map_grid.height - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 2, 'T');
      }

      var supply_route = Entity.create('SupplyRoute');
      supply_route.at(this.at().x, this.at().y);
    }

    /*
    // Ensure that roads on the edge of the mat are not dead ends
    if (num_connections == 1) {
      if (this.getX() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 3, 'T');
      } else if (this.getX() == Game.map_grid.width - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 1, 'T');
      } else if (this.getY() == 0) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 0, 'T');
      } else if (this.getY() == Game.map_grid.height - 1) {
        this.sprite_key = modifyStringIndex(this.sprite_key, 2, 'T');
      }
    }
    */

    function modifyStringIndex(string, index, new_str) {
      return string.substr(0, index) + new_str + string.substr(index + new_str.length);
    }
  },

  set_sprite: function() {
    var road_sprite_map = {
      "TFFF": "spr_road_vertical",
      "TFTF": "spr_road_vertical",
      "FFTF": "spr_road_vertical",
      "FTFF": "spr_road_horizontal",
      "FFFT": "spr_road_horizontal",
      "FTFT": "spr_road_horizontal",
      "TTFF": "spr_road_top_right",
      "FTTF": "spr_road_bottom_right",
      "FFTT": "spr_road_bottom_left",
      "TFFT": "spr_road_top_left",
      // 3-way and 4-way pieces - not made yet!
      "FTTT": "spr_road_no_top",
      "TFTT": "spr_road_no_right",
      "TTFT": "spr_road_no_bottom",
      "TTTF": "spr_road_no_left",
      "TTTT": "spr_road_all",
    }
    this.detect_type();
    var component = road_sprite_map[this.sprite_key];
    this.addComponent(component);
  },
});

