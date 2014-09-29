this.Terrain = {
  "Water": {
    type: "Water", 
    move_difficulty: 0, 
    build_over: 8,
    defense_bonus: 0,
    colour: { r: 0, g: 128, b: 255 },
  },
  "Grass": {
    type: "Grass", 
    move_difficulty: 1, 
    build_over: 1,
    defense_bonus: 1,
  },
  "Tree": {
      type: "Tree", 
      move_difficulty: 2, 
      build_over: 3,
      defense_bonus: 1.05,
  },
  "Farm": {
    type: "Farm",
    build_over: 1,
    move_difficulty: 1.2,
    defense_bonus: 1,
    alpha: 0.5,
    provides_supply: 2,
    colour: { r: 196, g: 196, b: 0 },
  },
  "Village": {
  },

  "Road": {
  },
  "Bridge": {
    'parent': 'Road',
  },

  /*
   * Creates a complete set of stats for a given entity type.
   */
  create: function(type, stats) {
    var base_stats = this[type];
    if (this[type].parent) {
      var parent_stats = this[type].parent;
      base_stats = $.extend({}, parent_stats, base_stats);
    }
    var combined_stats = $.extend({}, base_stats, stats);
    combined_stats['type'] = type;
    return combined_stats;
  },

  /*
   * Creates a Crafty object based on a COMPLETE set of stats.
   * Assumes that .type exists.
   */
  render: function(stats) {
    var entity = Crafty.e(stats.type);
    entity.addStats(stats);
    return entity;
  },

};

// Terrain is an entity that will be drawn on the map and will affect movement
Crafty.c('Terrain', {
  init: function() {
    this.requires('Actor, Clickable');
    this.z = 80;
    this.attr({
      stats: {},
    });
  },

  addStats: function(dict) {
    this.attr(dict);
    for (var key in dict) {
      this.stats[key] = dict[key];
    }

    if (dict['colour'] !== undefined) {
      //console.log("dict['colour']");
      //console.log(dict['colour']);
      if (typeof dict['colour'] == 'object') {
        var colour_string = Utility.getColourStringFromObject(dict['colour']);
      } else {
        var colour_string = dict['colour'];
      }
      this.color(colour_string);
    }

    return this;
  },

  addStat: function(name, value) {
    var obj = {};
    obj[name] = value;
    this.addStats(obj);
    return this;
  },

  changeColour: function(colour_string) {
    this.addStats({ 'colour': colour_string });
    return this;
  },

  select: function() {
    this.report();
  },

  report: function() {
    Output.printTerrain(this);
  },

  setHeight: function() {
    this.height = Game.height_map[this.at().x][this.at().y];
    return this;
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
    this.requires('spr_tree, Terrain, Passable')
      .addStats({
      })
      ;
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
    this.requires('Terrain, Passable, Color')
      ;
  },

  pillage: function() {
    var provided_supply = this.provides_supply;
    this.addComponent("PillagedFarm");
    this.addStats({
        move_difficulty: 1.35,
        pillaged: true,
        provides_supply: 0,
      })
      .changeColour('brown')
      ;
    return provided_supply;
  },

});

Crafty.c('Water', {
  init: function() {
    this.requires('Color, Terrain, Impassable')
      //.changeColour({ r: 0, g: 128, b: 255 })
    ;
    //this.z = 75;
  }
});

// Grass is just green, passable terrain
Crafty.c('Bridge', {
  init: function() {
    this.requires('Color, Terrain, Passable, Transportation')
      .changeColour('rgb(192, 192, 192)')
      .addStats({
        type: "Bridge",
        move_difficulty: 1,
        build_over: 0.02 ,
        defense_bonus: 1.5,
        supply: 1,
      })
      ;
      this.z = 81;
  },
});

// A village is a tile on the grid that the PC must visit in order to win the
// game
Crafty.c('Village', {
  init: function() {
    this.requires('spr_village, Terrain, Passable')
      .attr({
        farms: [],
      })
      .addStats({
        type: "Village", 
        move_difficulty: 0.9,
        build_over: 0.01,
        defense_bonus: 1.25,
        supply: 1,
        provides_supply: 4,
        supply_remaining: 6,
      })
      ;
  },

  pillage: function() {
    var provided_supply = this.provides_supply;
    this.supply_remaining -= 2;
    if (this.supply_remaining <= 0) {
      this.sacked = true;
      this.provides_supply = 0;
      this.defense_bonus = 1.1;
      this.addComponent("Color");
      this.changeColour("black");
      this.alpha = 0.5;
    }

    return provided_supply;
  },
});

// Grass is just green, passable terrain
Crafty.c('Road', {
  init: function() {
    //this.requires('spr_road, Terrain, Passable')
    this.requires('Terrain, Passable, Transportation')
      .addStats({
        type: "Road",
        move_difficulty: 0.75,
        build_over: 0.01,
        defense_bonus: 1,
        is_supply_route: false,
        supply: 1,
      })
      ;
  },

  detect_type: function() {
    // look at adjacent road spaces and determine which component should be
    // added (ie. which sprite is required).
    function hasRoadConnection(tile) {
      var road_connections = ['Road', 'Bridge', 'Village'];
      for (var i=0; i<road_connections.length; i++) {
        if (tile.has(road_connections[i])) return true;
      }
      return false;
    }
    function getLeft(road) {
      if (road.getX() == 0) return false;
      var tile = Game.terrain[road.getX() - 1][road.getY()];
      return hasRoadConnection(tile);
    }
    function getRight(road) {
      if (road.getX() == Game.map_grid.width - 1) return false;
      var tile = Game.terrain[road.getX() + 1][road.getY()];
      return hasRoadConnection(tile);
    }
    function getUp(road) {
      if (road.getY() == 0) return false;
      var tile = Game.terrain[road.getX()][road.getY() - 1];
      return hasRoadConnection(tile);
    }
    function getDown(road) {
      if (road.getY() == Game.map_grid.height - 1) return false;
      var tile = Game.terrain[road.getX()][road.getY() + 1];
      return hasRoadConnection(tile);
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

