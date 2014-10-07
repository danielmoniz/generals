
var RetreatConstraints = function(location) {
  if (location === undefined) {
    throw new Error("BadLocation", "Must specify a location.");
  }
  this.location = location;
  this.area = this.setAdjacentSpaces(location);
};

RetreatConstraints.prototype.setAdjacentSpaces = function() {
  var area = [[], [], []];
  var centre = { x: 1, y: 1 };
  for (var x in area) {
    area[x] = [[], [], []];
    for (var y in area[x]) {
      area[x][y] = 1;
      if (x == centre.x) area[x][y] = 0;
      if (y == centre.y) area[x][y] = 0;
      if (x == centre.x && y == centre.y) area[x][y] = 1;
    }
  }

  return area;
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

RetreatConstraints.prototype.setSide = function(side, move_direction) {
  this.side = side;
  if (side.toLowerCase() == 'attacker') {
    return this.setAttacker(move_direction);
  } else if (side.toLowerCase() == 'defender') {
    return this.setDefender(move_direction);
  }
};

RetreatConstraints.prototype.setAttacker = function(attacker_direction) {
  var attacker_direction = this.getArrayDirection(attacker_direction);
  for (var x in this.area) {
    for (var y in this.area[x]) {
      if (x == attacker_direction.x && y == attacker_direction.y) {
        this.area[x][y] = 1;
      } else {
        this.area[x][y] = 0;
      }
    }
  }

  this.resetCornersAndCentre();
  return this.area;
};

RetreatConstraints.prototype.setDefender = function(attacker_direction) {
  var attacker_direction = this.getArrayDirection(attacker_direction);
  for (var x in this.area) {
    for (var y in this.area[x]) {
      if (x == attacker_direction.x && y == attacker_direction.y) {
        this.area[x][y] = 0;
      } else {
        this.area[x][y] = 1;
      }
    }
  }

  this.resetCornersAndCentre();
  return this.area;
};

RetreatConstraints.prototype.addUnit = function(side, move_direction) {
  var move_direction = this.getArrayDirection(move_direction);
  var value = 0;
  if (this.side.toLowerCase() == side) {
    value = 1;
  }
  this.area[move_direction.x][move_direction.y] = value;
};

RetreatConstraints.prototype.applyToArray = function(array, property) {
  for (var x=0; x<this.area.length; x++) {
    var real_x = x + parseInt(this.location.x) - 1;
    if (array[real_x] === undefined) continue;

    for (var y=0; y<this.area[x].length; y++) {
      var real_y = y + parseInt(this.location.y) - 1;
      if (array[real_x][real_y] === undefined) continue;
      if (property) {
        array[real_x][real_y][property] *= this.area[x][y];
      } else {
        array[real_x][real_y] *= this.area[x][y];
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

RetreatConstraints.prototype.isMoveTargetValid = function(location) {
  console.log("location");
  console.log(location);
  try {
    var target = this.getArrayDirection(location);
  } catch (ex) {
    return true;
  }
  console.log("target");
  console.log(target);
  return Boolean(this.area[target.x][target.y]);
};

RetreatConstraints.prototype.resetCornersAndCentre = function() {
  this.area[0][0] = 1;
  this.area[0][2] = 1;
  this.area[2][0] = 1;
  this.area[2][2] = 1;

  this.area[1][1] = 1;
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = RetreatConstraints;
} else {
  window.RetreatConstraints = RetreatConstraints;
}

