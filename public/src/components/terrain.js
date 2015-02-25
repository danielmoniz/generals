
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

  ignite: function() {
    Crafty.e('Fire').at(this.at().x, this.at().y);

    var ignite_stats = {
      on_fire: true,
      flammable: false,
      provides_supply: 0,
    };
    this.addStats(ignite_stats);
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

      supply_to_steal: false,
    };
    this.addStats(burned_stats);
    if (this.pillage) {
      this.pillage();
    } else {
      var extra_burned_stats = {
        move_difficulty: 1.3,
        defense_bonus: 1.05,
      };
      this.addStats(extra_burned_stats);
      this.addComponent('Color');
      if (this.has('Color')) {
        this.addStat('colour', 'gray');
      }
    }
  },

  destroyTerrain: function(unit) {
    this.destroyed = true;
    Victory.entityDestroyed(this, unit);
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
    this.requires('spr_tree, Terrain, Passable');
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
    //this.requires('Terrain, Passable, Color');
    this.requires('Terrain, Passable, Color, spr_farm');
  },

  pillage: function(unit) {
    var supply = this.supply_to_steal;
    this.addNewComponent("PillagedFarm");
    this.addStats({
        move_difficulty: 1.35,
        pillaged: true,
        supply_to_steal: 0,
        flammable: false,
        provides_supply: 0,
      });
    this.destroyTerrain(unit);
    return supply;
  },

});

Crafty.c('PillagedFarm', {
  init: function() {
    this.requires('spr_farm_pillaged, Terrain');
  }
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
  },

});

Crafty.c('City', {
  init: function() {
    this.requires('spr_city, Settlement, Passable')
      .attr({
        farms: [],
      })
      .bind("NextTurn", this.handleSupply)
      ;
  },

  renderOthers: function() {
    var city_left = Crafty.e('CitySide').pickSide('left');
    city_left.at(this.at().x - 1, this.at().y);
    var city_right = Crafty.e('CitySide').pickSide('right');
    city_right.at(this.at().x + 1, this.at().y);
    this.addStat('city_sides', [city_left, city_right]);

    var flag = Crafty.e('Flag').pickSide(this.side);
    flag.at(this.at().x, this.at().y);
    this.addStat('flag', flag);
  },

  handleSupply: function() {
    // @TODO Update city's supply amount depending on whether it is supplied
    // from a supply route (depends on side, or if it is owned/neutral)
  },

  pillage: function(unit, pillage_power) {
    if (this.being_sacked === undefined) {
      this.being_sacked = Crafty.e('CityBeingSacked');
      this.being_sacked.at(this.at().x, this.at().y);
    }

    var supply_to_steal = Math.min(Game.supply_steal_factor * pillage_power, this.supply_remaining);
    this.supply_remaining -= supply_to_steal;
    if (this.supply_remaining <= 0) {
      this.addStats({
        sacked: true,
        supply_to_steal: 0,
        defense_bonus: 1.1,
        provides_supply: 0,
      });
      this.addComponent("spr_city_sacked");

      // for now, destroy the city sides when the city is sacked
      this.city_sides[0].destroy();
      this.city_sides[1].destroy();
      this.being_sacked.destroy();
      this.flag.destroy();
      this.destroyTerrain(unit);
    } else {
      this.being_sacked.show();
    }

    return supply_to_steal;
  },
});

Crafty.c('Flag', {
  init: function() {
    this.requires('Actor');
    this.z = 88;
    return this;
  },

  pickSide: function(player) {
    this.addComponent('spr_city_flag_{0}'.format(player));
    return this;
  },

});

Crafty.c('CityBeingSacked', {
  init: function() {
    this.requires('Actor, spr_city_being_sacked')
      .bind('NextTurn', this.nextTurn)
    ;
    this.z = 87;
    this.visible = false;
  },

  nextTurn: function() {
    if (Game.turn == this.turn_started) {
      this.hide();
    }
  },

  show: function() {
    this.visible = true;
    this.turn_started = Game.turn;
  },

  hide: function() {
    this.visible = false;
    this.turn_started = undefined;
  },
});

Crafty.c('CitySide', {
  init: function() {
    this.requires('Actor');
    this.z = 85;
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
});

Crafty.c('Town', {
  init: function() {
    this.requires('spr_town, Settlement, Passable')
      .attr({
        farms: [],
      })
      .bind("NextTurn", this.handleSupply)
      ;
  },

  renderOthers: function() {
    var flag = Crafty.e('Flag').pickSide(this.side);
    flag.at(this.at().x, this.at().y);
    this.addStat('flag', flag);
  },

  handleSupply: function() {
    // @TODO Update town's supply amount depending on whether it is supplied
    // from a supply route (depends on side, or if it is owned/neutral)
  },

  pillage: function(unit, pillage_power) {
    if (this.being_sacked === undefined) {
      this.being_sacked = Crafty.e('TownBeingSacked');
      this.being_sacked.at(this.at().x, this.at().y);
    }

    var supply_to_steal = Math.min(Game.supply_steal_factor * pillage_power, this.supply_remaining);
    this.supply_remaining -= supply_to_steal;
    if (this.supply_remaining <= 0) {
      this.addStats({
        sacked: true,
        supply_to_steal: 0,
        defense_bonus: 1.1,
        provides_supply: 0,
      });
      this.addComponent("spr_town_sacked");

      // for now, destroy the town sides when the town is sacked
      this.being_sacked.destroy();
      this.flag.destroy();
      this.destroyTerrain(unit);
    } else {
      this.being_sacked.show();
    }

    return supply_to_steal;
  },
});

Crafty.c('TownBeingSacked', {
  init: function() {
    this.requires('Actor, spr_town_being_sacked')
      .bind('NextTurn', this.nextTurn)
    ;
    this.z = 87;
    this.visible = false;
  },

  nextTurn: function() {
    if (Game.turn == this.turn_started) {
      this.hide();
    }
  },

  show: function() {
    this.visible = true;
    this.turn_started = Game.turn;
  },

  hide: function() {
    this.visible = false;
    this.turn_started = undefined;
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

      var supply_route = Crafty.e('SupplyRoute');
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

