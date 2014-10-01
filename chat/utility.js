
var Utility = {

  countItems: function(object) {
    var count = 0;
    for (var k in object) {
      if (object.hasOwnProperty(k)) {
        ++count;
      }
    }
    return count;
  },

  removeFromArray: function(array, value) {
    if (array === undefined) return array;
    for (var i=array.length - 1; i>=0; i--) {
      if (array[i] == value) {
        array.splice(i, 1);
        break;
      }
    }
    return array;
  },

}

module.exports = Utility;
