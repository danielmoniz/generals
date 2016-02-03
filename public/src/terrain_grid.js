
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

$(document).ready(function() {

var gridType = getURLParameter('gridType');

var width = getURLParameter('width');
var height = getURLParameter('height');
var location = getURLParameter('location');

var map_grid = {
  width: parseInt(width) || 48,
  height: parseInt(height) || 22
};

var options = {
  location: locations[location] || locations.black_forest,
  map_grid: map_grid,

      player_colour: { 0: "Blue", 1: "White" },
      num_sections: 1,
      num_cities_total: 9,

      max_farm_distance: 2,
      farm_probability_factor: 0.8,
};

var mapCreator = new MapCreator();
var terrain_map = mapCreator.buildNewTerrainMap(options).terrain_type;

var terrain_map = terrain_map[0].map(function(col, i) { 
  return terrain_map.map(function(row) { 
    return row[i] 
  });
});
console.log(terrain_map);

function make_square(class_name, content, height) {
  var square_div = jQuery('<div/>', {
    class: class_name + ' square',
  });

  //var contents = "<span>{0}</span><div></div><div></div>".format(content);
  //square_div.append(contents);

  return square_div;
}

function add_square_row() {
  var square_row_div = jQuery('<div/>', {
    class: 'squarerow',
  });
  $('.grid').append(square_row_div);
  return square_row_div;
}

function make_hex(class_name, content) {
  var hex_div = jQuery('<div/>', {
    class: class_name,
  });
  var contents = "<span>{0}</span><div></div><div></div>".format(content);

  hex_div.append(contents);
  return hex_div;
}

function add_hex_row() {
  var hex_row_div = jQuery('<div/>', {
    class: 'hexrow',
  });
  $('.grid').append(hex_row_div);
  return hex_row_div;
}

if (gridType == 'hex') {

  for (var i=0; i<terrain_map.length; i++) {
    var row = add_hex_row();
    for (var j=0; j < terrain_map[i].length; j++) {
      var text = '{0}, {1}'.format(i, j);
      var hex = make_hex(terrain_map[i][j].type, '');
      row.append(hex);
    }
  }
} else { // default to square grid

  for (var i=0; i<terrain_map.length; i++) {
    var row = add_square_row();
    for (var j=0; j < terrain_map[i].length; j++) {
      var text = '{0}, {1}'.format(i, j);
      var square = make_square(terrain_map[i][j].type, '');
      row.append(square);
    }
  }
}

});
