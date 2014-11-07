Pathing = {

  totalCost: function(path) {
    var total_cost = 0;
    for (var i = 0; i < path.length; i++) {
      var cost = path[i].getCost();
      total_cost += cost;
    }
    return total_cost;
  },

  getPartialPath: function(path, max_cost, stop_points) {
    if (stop_points === undefined) stop_points = [];

    var final_index = 0;
    for (var i=0; i<path.length; i++) {
      var cost = this.totalCost(path.slice(0, i + 1));
      if (cost <= max_cost) {
        final_index = i;
        var end_pathing = false;
        for (var j in stop_points) {
          if (Utility.getDistance(path[i], stop_points[j]) == 0) {
            end_pathing = true;
            break;
          }
        }
        if (end_pathing) break;
      } else {
        break;
      }
    }
    var partial_path = path.slice(0, final_index + 1);
    for (var i=0; i<partial_path.length; i++) {
    }
    if (final_index == 0 && this.totalCost(partial_path) > max_cost) return false;
    return partial_path;
  },

  makeMovementPath: function(x, y, remaining, highlight) {
    // green, yellow, orange, purple
    var turn_colours = [
      'rgb(0, 128, 0)',
      'rgb(196, 196, 0)',
      'rgb(196, 121, 0)',
      'rgb(128, 0, 128)',
    ];
    remaining_color = (remaining - 1) % turn_colours.length;
    if (highlight) {
      var movement_path = Crafty.e('HighlightedMovementPath');
    } else {
      var movement_path = Crafty.e('MovementPath');
    }
    movement_path.at(x, y)
    movement_path.color(turn_colours[remaining_color])
    movement_path.remaining(remaining);

    if (highlight) {
      movement_path.colour = Utility.getColoursFromRgb(movement_path.color());
      movement_path.brightenColour(movement_path.brightness);
    }
    return movement_path;
  },

  colourMovementPath: function(unit, path, unit_movement, location) {
    var turns_required = 1;
    var movement_path = [];
    var target = { x: path[path.length - 1].x, y: path[path.length - 1].y };
    var start_location = unit.first_location;

    var movement_square = this.makeMovementPath(location.x, location.y, 1);
    var highlighted_square = this.makeMovementPath(location.x, location.y, 1, true);
    movement_path.push([movement_square, highlighted_square]);
    while (path.length > 0) {
      var stop_points = unit.getStopPoints(target, start_location);
      var next_partial_path = this.getPartialPath(path, unit_movement, stop_points);
      for (var i=0; i<next_partial_path.length; i++) {
        var movement_spot = this.makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required);
        var highlighted_spot = this.makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required, true);
        movement_path.push([movement_spot, highlighted_spot]);
      }
      turns_required += 1;
      path = path.slice(next_partial_path.length, path.length);
      start_location = next_partial_path[next_partial_path.length - 1];
    }
    return movement_path;
  },

  destroyMovementPath: function(movement_path) {
    if (movement_path === undefined) return;
    for (var i=0; i<movement_path.length; i++) {
      movement_path[i][0].destroy();
      movement_path[i][1].destroy();
    }
  },

  getPathList: function(move_target_path) {
    var path_list = [];
    for (var i in move_target_path) {
      var node = move_target_path[i];
      path_list.push({ x: node.x, y: node.y });
    }
    return path_list;
  },

  getPathFromPathList: function(path_list, start_pos) {
    if (path_list === undefined || path_list.length == 0) return undefined;
    var start = Game.terrain_graph.grid[start_pos.x][start_pos.y];
    var end = Game.terrain_graph.grid[path_list[0].x][path_list[0].y];
    var move_target_path = Game.pathfind.search(Game.terrain_graph, start, end);

    for (var i in path_list) {
      var start = Game.terrain_graph.grid[end.x][end.y];
      var end = Game.terrain_graph.grid[path_list[i].x][path_list[i].y];
      var small_path = Game.pathfind.search(Game.terrain_graph, start, end);
      move_target_path = move_target_path.concat(small_path);
    }
    return move_target_path;
  },

}

function highlightPath(movement_path) {
  for (var i=0; i<movement_path.length; i++) {
    movement_path[i][1].visible = true;
  }
}

// May not need this if using triggers
function unhighlightPath(movement_path) {
  for (var i=0; i<movement_path.length; i++) {
    movement_path[i][1].visible = false;
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Pathing;
} else {
  this.Pathing = Pathing;
}

