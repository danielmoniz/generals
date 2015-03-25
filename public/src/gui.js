
var GUI = {

  outlineVisibleRegions: function(coords_in_sight, style) {

    for (var x in coords_in_sight) {
      for (var y in coords_in_sight[x]) {
        var point = { x: x, y: y };
        var adjacent_points = Utility.getPointsWithinDistance(point, 1, Game.map_grid);
        for (var i in adjacent_points) {
          var adjacent = adjacent_points[i];

          if (!coords_in_sight[adjacent.x] || !coords_in_sight[adjacent.x][adjacent.y]) {
            // @TODO Should find a more efficient way than creating every time
            // Eg. recycle tiles, or build entirely at the start and re-use
            this.renderOutline(point, adjacent, style);
          }
        }
      }
    }
  },

  displayCitySupplyRanges: function(side) {
    if (!Game.city_based_supply) return false;
    Crafty.trigger("RemoveSupplyDisplays");
    if (!Game.city_supply_ranges) return false;
    if (side === undefined) return false;

    var points = Supply.getCitySupplyArea(side);
    GUI.outlineVisibleRegions(points, 'all cities supply range');
  },

  renderOutline: function(point, adjacent, style) {
    var new_surround_object = Entity.create('BoxSurround');
    var x = point.x;
    var y = point.y;
    new_surround_object.at(x, y);

    if (style == 'enemy sight range') {
      new_surround_object.addComponent('SightLine');
      if (adjacent.x < x) {
        new_surround_object.addComponent('spr_box_surround_enemy_left');
      } else if (adjacent.x > x) {
        new_surround_object.addComponent('spr_box_surround_enemy_right');
      } else if (adjacent.y < y) {
        new_surround_object.addComponent('spr_box_surround_enemy_top');
      } else if (adjacent.y > y) {
        new_surround_object.addComponent('spr_box_surround_enemy_bottom');
      }

    } else if (style == 'ally sight range') {
      new_surround_object.addComponent('SightLine');
      if (adjacent.x < x) {
        new_surround_object.addComponent('spr_box_surround_left');
      } else if (adjacent.x > x) {
        new_surround_object.addComponent('spr_box_surround_right');
      } else if (adjacent.y < y) {
        new_surround_object.addComponent('spr_box_surround_top');
      } else if (adjacent.y > y) {
        new_surround_object.addComponent('spr_box_surround_bottom');
      }

    } else if (style == 'all cities supply range') {
      new_surround_object.addComponent('SupplyDisplay');
      if (adjacent.x < x) {
        new_surround_object.addComponent('spr_box_surround_teal_left');
      } else if (adjacent.x > x) {
        new_surround_object.addComponent('spr_box_surround_teal_right');
      } else if (adjacent.y < y) {
        new_surround_object.addComponent('spr_box_surround_teal_top');
      } else if (adjacent.y > y) {
        new_surround_object.addComponent('spr_box_surround_teal_bottom');
      }

    } else {
      throw new Error('BadParam, {0} is not an accepted box type.'.format(style));
    }
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = GUI;
} else {
  window.GUI = GUI;
}

