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

function makeMovementPath(x, y, remaining) {
  var turn_colours = ['green', 'yellow', 'orange', 'purple'];
  remaining_color = (remaining - 1) % turn_colours.length;
  var movement_path = Crafty.e('MovementPath');
  movement_path.at(x, y)
  movement_path.color(turn_colours[remaining_color])
  movement_path.remaining(remaining);
  return movement_path;
}

function colourMovementPath(path, unit_movement, location) {
  var turns_required = 1;
  //console.log("Path remaining at start:");
  //console.log("start: " + path_remaining[0].x + ", " +  path_remaining[0].y);
  //console.log("end: " + path_remaining[path_remaining.length - 1].x + ", " +  path_remaining[path_remaining.length - 1].y);
  //console.log(path_remaining.length);

  var movement_path = [];

  movement_path.push(makeMovementPath(location.x, location.y, 1));
  while (path.length > 0) {
    var next_partial_path = getPartialPath(path, unit_movement);
    //console.log("Next partial path:");
    //console.log(next_partial_path.length);
    //console.log(next_partial_path[0].x, next_partial_path[0].y);
    for (var i=0; i<next_partial_path.length; i++) {
      var movement_spot = makeMovementPath(next_partial_path[i].x, next_partial_path[i].y, turns_required);
      movement_path.push(movement_spot);
    }
    turns_required += 1;
    path = path.slice(next_partial_path.length, path.length);
    //console.log("Path remaining:");
    //console.log(path.length);
  }
  return movement_path;
}

function destroyMovementPath(movement_path) {
  if (movement_path === undefined) return;
  for (var i=0; i<movement_path.length; i++) {
    movement_path[i].destroy();
  }
}
