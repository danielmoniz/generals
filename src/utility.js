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
