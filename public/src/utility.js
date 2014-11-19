
var Utility = {
  capitalizeFirstLetter: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  /*
   * Courtesy of Jarek Milewski on StackOverflow. Cheers!
   */
  copyToClipboard: function(text) {
    window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
  },

  getDistance: function(location1, location2) {
    var x = location1.x - location2.x;
    var y = location1.y - location2.y;
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  },

  getColoursFromRgb: function(rgb) {
    var start = rgb.indexOf('(') + 1;
    var end = rgb.indexOf(',');
    var red = rgb.slice(start, end);

    var rgb = rgb.slice(end + 1);
    var end = rgb.indexOf(',');
    var green = rgb.slice(0, end);

    var rgb = rgb.slice(end + 1);
    var end = rgb.indexOf(')');
    var blue = rgb.slice(0, end);

    return { r: parseInt(red), g: parseInt(green), b: parseInt(blue), };
  },

  getColourStringFromObject: function(rgb) {
    var string = "rgb({0}, {1}, {2})".format(rgb.r, rgb.g, rgb.b);
    return string;
  },

  isEmpty: function(object) {
    for (var i in object) {
      return false;
    }
    return true;
  },


  loadDataIntoObject: function(data, object) {
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        object[key] = data[key];
      }
    }
  },

  getAdjacentPoints: function(location, map_grid) {
    var directions = [
      { x: location.x - 1, y: location.y },
      { x: location.x + 1, y: location.y },
      { x: location.x, y: location.y - 1 },
      { x: location.x, y: location.y + 1 },
    ];
    var valid_directions = [];
    for (var i in directions) {
      if (directions[i].x < 0 || directions[i].x > map_grid.width - 1) {
        continue;
      }
      if (directions[i].y < 0 || directions[i].y > map_grid.height - 1) {
        continue;
      }
      valid_directions.push(directions[i]);
    }
    return valid_directions;
    //return this.getPointsWithinDistance(1);
  },

  getPointsWithinDistance: function(start, distance) {
    if (distance < 0) throw new Error('BadDistance', 'Distance must be positive.');
    var points = [];
    // Count backwards in order to start at outer ring
    for (var i=Math.ceil(distance); i>=0; i--) {
      points = points.concat(this.getRingAtDistance(start, i));
    }
    return points;
  },

  /*
   * Distance must be positive or 0.
   */
  getRingAtDistance: function(start, distance) {
    var ring = [];
    if (distance < 0) throw new Error('BadDistance', 'Distance must be positive.');
    if (distance < 1) return [];
    var tips = [
      { x: start.x, y: start.y - distance },
      { x: start.x + distance, y: start.y },
      { x: start.x, y: start.y + distance },
      { x: start.x - distance, y: start.y },
    ];
    for (var i=0; i<4; i++) {
      ring.push(tips[i]);
      var line_between = this.getLineBetweenPoints(tips[i], tips[(i + 1) % 4]);
      if (line_between) {
        ring = ring.concat(line_between);
      }
    }

    return ring;
  },

  /*
   * Returns a line of generic coordinates between (not including) two
   * end-points.
   */
  getLineBetweenPoints: function(start, end) {
    var points = [];
    var x_diff = end.x - start.x;
    var y_diff = end.y - start.y;
    var max_diff = Math.max(Math.abs(x_diff), Math.abs(y_diff));
    for (var i=1; i<max_diff; i++) {
      var x_increment = x_diff / max_diff;
      var y_increment = y_diff / max_diff;

      var point = {
        x: Math.round(start.x + x_increment * i),
        y: Math.round(start.y + y_increment * i),
      };
      points.push(point);
    }

    return points;
  },
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Utility;
} else {
  window.Utility = Utility;
}

