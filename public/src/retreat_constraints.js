
var RetreatConstraints = function(location) {
  if (location === undefined) {
    throw new Error("BadLocation", "Must specify a location.");
  }
  this.location = location;
  this.area = {};
  this.area['attacker'] = this.setAdjacentSpaces(location);
  this.area['defender'] = this.setAdjacentSpaces(location);
  this.setAdjacentSpaces();
};

RetreatConstraints.prototype.setAdjacentSpaces = function() {
  this.area['attacker'] = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ];
  this.area['defender'] = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];

  return this.area;
};

RetreatConstraints.prototype.getArrayDirection = function(direction) {
  if (!direction || direction.x === undefined || direction.y === undefined) {
    throw new Error('BadDirection', "Direction is not valid.");
  }
  var x = direction.x - this.location.x + 1;
  var y = direction.y - this.location.y + 1;
  var distance = Math.sqrt(Math.pow(x - 1, 2) + Math.pow(y - 1, 2));
  if (distance > 1) throw new Error('BadDirection', "Tile is not adjacent.");
  return { x: x, y: y };
};

RetreatConstraints.prototype.addUnit = function(side, move_direction) {
  var move_direction = this.getArrayDirection(move_direction);
  var opposite_side = this.getOppositeSide(side);
  this.area[side][move_direction.x][move_direction.y] = 1;
  this.area[opposite_side][move_direction.x][move_direction.y] = 0;
};

RetreatConstraints.prototype.applyToArray = function(side, array, property) {
  for (var x=0; x<this.area[side].length; x++) {
    var real_x = x + parseInt(this.location.x) - 1;
    if (array[real_x] === undefined) continue;

    for (var y=0; y<this.area[side][x].length; y++) {
      var real_y = y + parseInt(this.location.y) - 1;
      if (array[real_x][real_y] === undefined) continue;
      if (property) {
        array[real_x][real_y][property] *= this.area[side][x][y];
      } else {
        array[real_x][real_y] *= this.area[side][x][y];
      }
    }
  }
};

RetreatConstraints.prototype.convertToActual = function(relative_location) {
  var actual = {};
  actual.x = relative_location.x + parseInt(this.location.x) - 1;
  actual.y = relative_location.y + parseInt(this.location.y) - 1;
  return actual;
};

RetreatConstraints.prototype.relativeToCardinalDirection = function(relative) {
  if (relative.x == 0 && relative.y == 1) {
    return 'left';
  } else if (relative.x == 1 && relative.y == 0) {
    return 'top';
  } else if (relative.x == 1 && relative.y == 2) {
    return 'bottom';
  } else if (relative.x == 2 && relative.y == 1) {
    return 'right';
  }
  throw new Error("BadDirection");
};

RetreatConstraints.prototype.isMoveTargetValid = function(side, location) {
  try {
    var target = this.getArrayDirection(location);
  } catch (ex) {
    return true;
  }
  return Boolean(this.area[side][target.x][target.y]);
};

/*
 * Return actual map positions of unblocked spaces.
 */
RetreatConstraints.prototype.getAdjacentUnblockedSpaces = function(side, map_grid) {
  var spaces = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
  ];

  var unblocked = [];
  for (var i in spaces) {
    if (this.area[side][spaces[i].x][spaces[i].y]) {
      var actual = this.convertToActual(spaces[i]);
      if (actual.x < 0 || actual.x > map_grid.width - 1 || actual.y < 0 || actual.y > map_grid.height - 1) {
        continue;
      }
      unblocked.push(actual);
    }
  }
  return unblocked;
};

/*
 * Return actual map positions of unblocked spaces.
 */
/*
RetreatConstraints.prototype.getAdjacentBlockedSpaces = function(side, map_grid) {
  var spaces = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
  ];

  var blocked = [];
  for (var i in spaces) {
    if (!this.area[side][spaces[i].x][spaces[i].y]) {
      var actual = this.convertToActual(spaces[i]);
      if (actual.x < 0 || actual.x > map_grid.width - 1 || actual.y < 0 || actual.y > map_grid.height - 1) {
        continue;
      }
      blocked.push(actual);
    }
  }
  return blocked;
};
*/

RetreatConstraints.prototype.resetCornersAndCentre = function() {
  this.area[0][0] = 1;
  this.area[0][2] = 1;
  this.area[2][0] = 1;
  this.area[2][2] = 1;

  this.area[1][1] = 1;
};

RetreatConstraints.prototype.getOppositeSide = function(side) {
  if (side == 'attacker') return 'defender';
  if (side == 'defender') return 'attacker';
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = RetreatConstraints;
} else {
  window.RetreatConstraints = RetreatConstraints;
}

