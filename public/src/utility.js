Utility = {
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
