function totalCost(path) {
  var total_cost = 0;
  for (var i = 0; i < path.length; i++) {
    var cost = path[i].getCost();
    total_cost += cost;
  }
  return total_cost;
}

function getPartialPath(path, max_cost) {
  //if (path.length == 1) return path;
  var final_index = 0;
  for (var i=0; i<path.length; i++) {
    var cost = totalCost(path.slice(0, i + 1));
    if (cost <= max_cost) {
      final_index = i;
    } else {
      break;
    }
  }
  var partial_path = path.slice(0, final_index + 1);
  for (var i=0; i<partial_path.length; i++) {
  }
  if (final_index == 0 && totalCost(partial_path) > max_cost) return false;
  return partial_path;
}

function makeMovementPath(x, y, remaining, highlight) {
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
}

function colourMovementPath(path, unit_movement, location) {
  var turns_required = 1;
  var movement_path = [];

  var movement_square = makeMovementPath(location.x, location.y, 1);
  var highlighted_square = makeMovementPath(location.x, location.y, 1, true);
  movement_path.push([movement_square, highlighted_square]);
  while (path.length > 0) {
    var next_partial_path = getPartialPath(path, unit_movement);
    for (var i=0; i<next_partial_path.length; i++) {
      var movement_spot = makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required);
      var highlighted_spot = makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required, true);
      movement_path.push([movement_spot, highlighted_spot]);
    }
    turns_required += 1;
    path = path.slice(next_partial_path.length, path.length);
  }
  return movement_path;
}

function destroyMovementPath(movement_path) {
  if (movement_path === undefined) return;
  for (var i=0; i<movement_path.length; i++) {
    movement_path[i][0].destroy();
    movement_path[i][1].destroy();
  }
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
