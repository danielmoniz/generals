
// The Grid component allows an element to be located on a grid of tiles
Crafty.c('Grid', {
  init: function() {
    this.attr({
      w: Game.map_grid.tile.width,
      h: Game.map_grid.tile.height,
    })
  },

  // Locate this entity at the given position on the grid
  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: (this.y - Game.board_title.height) / Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) + Game.board_title.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });

      // move colocated entities, if any
      if (this.colocated_entities) {
        for (var i in this.colocated_entities) {
          var entity = this.colocated_entities[i];
          entity.at(x, y);
        }
      }
      return this;
    }
  },

  /*
   * Simply a new version of together(), not requiring passed in objects to
   * have an at() function.
   */
  isAtLocation: function(location) {
    if (this.at().x == location.x && this.at().y == location.y) {
      return true;
    }
    return false;
  },

  /*
   * Deprecated.
   */
  together: function(grid_object, ignore_self) {
    if (ignore_self === undefined) ignore_self = true;
    if (grid_object.at().x == this.at().x && grid_object.at().y == this.at().y) {
      if (grid_object !== this) {
        return true;
      }
    }
    return false;
  },

  getX: function() {
    var at = this.at();
    return at.x;
  },
  getY: function() {
    var at = this.at();
    return at.y;
  },
});

// An "Actor" is an entity that is drawn in 2D on canvas
Crafty.c('Actor', {
  init: function() {
    this.requires('2D, DOM, Grid');
    this.attr({
      stats: {
        components: [],
      },
    });
  },

  addStats: function(dict) {
    this.attr(dict);
    for (var key in dict) {
      this.stats[key] = dict[key];
    }

    if (dict['colour'] !== undefined) {
      if (typeof dict['colour'] == 'object') {
        var colour_string = Utility.getColourStringFromObject(dict['colour']);
      } else {
        var colour_string = dict['colour'];
      }
      if (this.color() != colour_string) {
        this.color(colour_string);
      }
    }

    return this;
  },

  addStat: function(name, value) {
    var obj = {};
    obj[name] = value;
    this.addStats(obj);
    return this;
  },

  /*
   * Updates the .stats dict using the current stats of the entity.
   */
  updateStats: function() {
    for (var stat in this.stats) {
      var real_value = this[stat];
      this.addStat(stat, real_value);
    }

    this.addStat('location', this.at());
  },

  addNewComponent: function(component) {
    if (this.stats.components === undefined) {
      this.stats.components = [];
    }
    this.stats.components.push(component);
    this.addComponent(component);
  },

  changeColour: function(colour_string) {
    this.addStats({ 'colour': colour_string });
    return this;
  },

  select: function() {
    this.report();

    if (this.customSelect !== undefined) this.customSelect();

    var local_terrain = Game.terrain[this.at().x][this.at().y];
    if (local_terrain.getId() != this.getId()) {
      local_terrain.report();
    }
  },

});

Crafty.c("Divider", {
  init: function() {
    this.requires('Actor, Color')
      .color("black")
    ;
    this.w = 1;
    this.z = 200;
  },
});

Crafty.c("TitleBar", {
  init: function() {
    this.requires("2D, Canvas, Text");
    this.attr({
      //w: 60,
      h: Game.board_title.height,
    });
    this.textColor('#FFFFFF');
    this.textFont({size: '17px', });
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) - Game.y_offset;
      var new_y = y * Game.map_grid.tile.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },
});


Crafty.c("ToolBar", {
  init: function() {
    this.requires("2D, Canvas, HTML");
    this.attr({
      h: Game.board_tool_bar.height,
    });
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) - Game.y_offset;
      var new_y = y * Game.map_grid.tile.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },
});

Crafty.c("VictoryBar", {
  init: function() {
    this.requires("2D, DOM, HTML");
    this.attr({
      //w: 60,
      h: Game.board_title.height,
    });
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
    } else {
      var new_y = Math.max(0, y * Game.map_grid.tile.height) - Game.y_offset;
      var new_y = y * Game.map_grid.tile.height;
      this.attr({ x: x * Game.map_grid.tile.width, y: new_y });
      return this;
    }
  },
});


Crafty.c('Clickable', {
  init: function() {
    this.requires('Mouse, Actor')
      // NOTE: 'Click' does not work with right clicking!
      .bind('MouseUp', function(e) { 
        if (e.mouseButton == Crafty.mouseButtons.LEFT && !this.ignore_next_mouse_up && this.mouse_went_down_here) {
          Action.perform('left click', this, Game.selected);
        }
        this.ignoreNextMouseUp = false;
        this.resetLeftMouseDown();
      })
      .bind('MouseDown', this.tabletHoldClick)
      .bind('MouseUp', this.tabletClearHoldClick)
      .bind('MouseOut', this.tabletClearHoldClick)
      .bind('MouseDown', this.tabletDoubleHoldClick)
      .bind('MouseUp', this.tabletClearDoubleHoldClick)
      .bind('MouseOut', this.tabletClearDoubleHoldClick)
      .bind('MouseDown', this.setLeftMouseDown)
    ;
  },

  setLeftMouseDown: function() {
    this.mouse_went_down_here = true;
  },

  resetLeftMouseDown: function() {
    this.mouse_went_down_here = false;
  },

  tabletHoldClick: function(e) {
    var that = this;
    if (this.rightClick === undefined) return false;
    tablet_click_timeout_id = setTimeout(function() {
      that.rightClick(e);
      that.ignore_next_mouse_up = true;
    }, 800);
  },

  tabletClearHoldClick: function() {
    if (typeof tablet_click_timeout_id !== 'undefined') {
      clearTimeout(tablet_click_timeout_id);
    }
  },

  tabletDoubleHoldClick: function(e) {
    var that = this;
    if (this.rightClick === undefined) return false;
    tablet_double_click_timeout_id = setTimeout(function() {
      that.rightClick(e, 'double');
      that.ignore_next_mouse_up = true;
    }, 1600);
  },

  tabletClearDoubleHoldClick: function() {
    if (typeof tablet_double_click_timeout_id !== 'undefined') {
      clearTimeout(tablet_double_click_timeout_id);
    }
  },

});

// A Selected item should display that it is selected.
Crafty.c('Selected', {
  init: function() {
    this.requires('Clickable, Color')
      .color('purple')
    ;
    this.z = 55;
  },
});

// A ColourSquare is a box of colour that shows the army's player-owner.
Crafty.c('ColourSquare', {
  init: function() {
    this.requires('Actor')
    ;
    this.z = 250;
  },

  pickSide: function(side) {
    if (side == 0) {
      this.addComponent('spr_player_colour_blue');
    } else if (side == 1) {
      this.addComponent('spr_player_colour_white');
    }
    return this;
  },
});

Crafty.c('Movable', {
  init: function() {
    this.requires('Clickable');
  },
});

Crafty.c('Receivable', {
  init: function() {
    this.requires('Clickable')
      .bind('MouseDown', this.setRightMouseDown)
      .bind('MouseDown', this.setDoubleRightMouseDown)
      .bind('MouseUp', function(e) {
        if (e.mouseButton == Crafty.mouseButtons.RIGHT && Game.selected && Game.selected.has("Movable")) {
          this.rightClick(e);
        }
        this.resetDoubleRightMouseDown();
      })
    ;
  },

  rightClick: function(e, double_hold) {
    Action.perform('right click', this, e, double_hold);
  },

  setRightMouseDown: function() {
    this.right_mouse_went_down_here = true;
  },

  resetRightMouseDown: function() {
    this.right_mouse_went_down_here = false;
  },

  setDoubleRightMouseDown: function() {
    this.double_right_mouse_went_down_here = true;
  },

  resetDoubleRightMouseDown: function() {
    this.double_right_mouse_went_down_here = false;
  },

});

Crafty.c('Targetable', {
  init: function() {
    this.requires('Collision, Receivable')
      ;
  },
});

Crafty.c('ChangeableColor', {
  init: function() {
    this.requires('Color');
  },

  resetColour: function() {
    this.color("rgb({0}, {1}, {2})".format(this.base_colour.r, this.base_colour.g, this.base_colour.b));
    this.colour = $.extend({}, this.base_colour);
  },

  setColour: function(red, green, blue) {
    this.base_colour = {r: red, g: green, b: blue, };
    this.colour = {r: red, g: green, b: blue, };
    this.color("rgb({0}, {1}, {2})".format(red, green, blue));
  },

  dimColour: function(red, green, blue) {
    var new_red = Math.min(255, Math.max(0, this.colour.r - red));
    var new_green = Math.min(255, Math.max(0, this.colour.g - green));
    var new_blue = Math.min(255, Math.max(0, this.colour.b - blue));
    this.color("rgb({0}, {1}, {2})".format(new_red, new_green, new_blue));
    this.colour = { r: new_red, g: new_green, b: new_blue, };
  },

  brightenColour: function(quantity) {
    this.dimColour(-quantity, -quantity, -quantity);
  },

});

// FakeGrass is just green colour (not terrain!)
Crafty.c('FakeGrass', {
  init: function() {
    this.requires('ChangeableColor, Actor')
      .color('rgb(87, 109, 20)')
      .attr({ 
        type: "FakeGrass", 
        colour: { r: 87, g: 109, b: 20 },
        base_colour: { r: 87, g: 109, b: 20 },
      })
      ;
    this.z = 1;
  },

});

Crafty.c("Shadow", {
  init: function() {
    this.requires('FakeGrass');
    this.z = 2;
    this.dim_value = 25;
    this.type = "Shadow";
  },
});

Crafty.c("CityHighlight", {
  init: function() {
    this.requires('Actor, Color');
    this.z = 5;
    this.type = "CityHighlight";
    this.alpha = 60;
  },

  setColour: function(side) {
    var side_to_colour = { 0: 'blue', 1: 'white', };
    return side_to_colour[side];
  },
});

Crafty.c('MovementPath', {
  init: function(turns_left) {
    this.requires('Actor, ChangeableColor')
      .bind("NextTurn", this.nextTurn)
      .bind("ResetVisuals", this.destroy)
      ;
    this.z = 50;
    this.turns_left = 1;
    return this;
  },
  remaining: function(turns_left) {
    this.turns_left = turns_left;
  },
  nextTurn: function() {
    /*
    this.turns_left -= 1;
    if (this.turns_left <= 0) this.destroy();
    */
   this.destroy();
  },
});

Crafty.c("HighlightedMovementPath", {
  init: function() {
    this.requires('MovementPath');
    this.z = 51;
    this.brightness = 45;
    this.bind("DimPaths", this.dim)
    //this.dimColour(this.dim_value, this.dim_value, this.dim_value);
  },

  dim: function() {
    this.visible = false;
  },
});

var RetreatBlockComponents = {
  friendly: {
    left: 'spr_retreat_block_left_green',
    bottom: 'spr_retreat_block_bottom_green',
    right: 'spr_retreat_block_right_green',
    top: 'spr_retreat_block_top_green',
  },
  enemy: {
    left: 'spr_retreat_block_left_red',
    bottom: 'spr_retreat_block_bottom_red',
    right: 'spr_retreat_block_right_red',
    top: 'spr_retreat_block_top_red',
  },
};

Crafty.c('RetreatBlock', {
  init: function() {
    this.requires('Actor');
    this.z = 250;
  },

  setSide: function(battle_side, direction) {
    this.addComponent(RetreatBlockComponents[battle_side][direction]);
  },
});

Crafty.c('Fire', {
  init: function() {
    this.requires('Actor, spr_fire');
    this.bind("SpreadFire", this.updateFire)
    this.z = 75;
    this.days_left = 3;
    this.turn_started = Game.turn;
  },

  updateFire: function() {
    if (Game.turn != this.turn_started) return false;

    this.days_left -= 1;
    this.spread();
    if (this.days_left <= 0) {
      var local_terrain = Game.terrain[this.at().x][this.at().y];
      local_terrain.burn();
      this.destroy();
    }
  },

  spread: function() {
    // spread in direction of wind
    var wind_spot = this.getWindSpreadSpot();
    if (wind_spot) {
      var fire = Crafty.e('Fire');
      fire.at(wind_spot.x, wind_spot.y);
    }

    // spread in a random direction with a random chance
    var directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (var i in directions) {
      var direction = directions[i];
      var spot = { x: this.at().x + direction[0], y: this.at().y + direction[1] };
      var chance_of_spread = 0.2;

      if (Game.terrain[spot.x] && Game.terrain[spot.x][spot.y]) {
        var local_terrain = Game.terrain[spot.x][spot.y];
        var random = Random.random();
        if (local_terrain.flammable && random < chance_of_spread) {
          local_terrain.ignite();
        }
      }
    }
  },

  getWindSpreadSpot: function() {
    var wind_dir = Game.weather.wind_dir;
    var wind_spot = {
      x: this.at().x + wind_dir[0],
      y: this.at().y + wind_dir[1],
    };
    if (wind_spot.x < 0 || wind_spot.x > Game.map_grid.width - 1 || wind_spot.y < 0 || wind_spot.y > Game.map_grid.width - 1) {
      return false;
    }
    var local_terrain = Game.terrain[wind_spot.x][wind_spot.y];
    if (!local_terrain) return false;
    if (!local_terrain.flammable) {
      return false;
    }

    return wind_spot;
  },

});

/*
Crafty.c('SupplyBlock', {
  init: function(turns_left) {
    this.requires('Actor, Color')
      .color('black')
      .bind("NextTurn", this.destroy)
      .attr({
        supply: 0,
      })
      ;
    this.z = 60;
    this.turns_left = 1;
    return this;
  },
  //removeSupplyFromRoad
  remaining: function(turns_left) {
    this.turns_left = turns_left;
  },
  nextTurn: function() {
   this.turns_left -= 1;
   if (this.turns_left <= 0) this.clear();
  },
  clear: function() {
    this.destroy();
  },
});
*/

// Marks a supply route for a player
Crafty.c('SupplyRoute', {
  init: function() {
    this.requires('Actor, spr_supply');
    this.z = 90;
  },
});

// TEST - for debugging purposes only!
Crafty.c('Supply', {
  init: function() {
    this.requires('Color, Actor')
      .color('pink')
      .attr({ 
        type: "Supply",
        //supply: 1,
      })
      ;
      this.z = 48;
  },
});

// TEST - for debugging purposes only!
Crafty.c('NoSupply', {
  init: function() {
    this.requires('Color, Actor')
      .color('brown')
      .attr({ 
        type: "NoSupply",
        //supply: 1,
      })
      ;
      this.z = 49;
  },
});

Crafty.c('PlayerCharacter', {
  init: function() {
    this.requires('Actor, Fourway, Collision, spr_player, Movable')
      .fourway(4)
      //.stopOnSolids()
      //.onHit('City', this.visitCity)
      ;
    this.z = 1000;
  },

  // Registers a stop-movement function to be called when this entity hits an
  // entity with the "Solid" component
  stopOnSolids: function() {
    this.onHit('Solid', this.stopMovement);

    return this;
  },

  // Stops the movement
  stopMovement: function() {
    this._speed = 0;
    if (this._movement) {
      this.x -= this._movement.x;
      this.y -= this._movement.y;
    }
  },

  // Respond to this player visiting a city
  visitCity: function(data) {
    var city = data[0].obj;
    city.collect();
  },
});

