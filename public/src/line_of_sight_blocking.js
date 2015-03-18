LineOfSightBlocking = {

  getTilesInSight: function(unitLocation, max_sight, pointsInMaxSightRadius, boardLocations) {
    var listOfVisibleTiles = [];

    for(var i in pointsInMaxSightRadius){
      var lineToCheck = this.getLineOfTilesFromCentre(unitLocation, pointsInMaxSightRadius[i], boardLocations);

      var visible = this.determineTileInSightFromLine(lineToCheck, max_sight);
      if (visible) {
        listOfVisibleTiles.push(visible);
      }
    }

    var points = [];
    for (var i in listOfVisibleTiles) {
      var tile = listOfVisibleTiles[i].tile;
      var point = { x: tile.at().x, y: tile.at().y };
      points.push(point);
    }

    return points;
  },

  getLineOfTilesFromCentre: function(centre, target, boardLocations) {
    var tilesAlongLine = []; // then this becomes a list of actual tiles

    if (Math.abs(target.x-centre.x) >= Math.abs(target.y-centre.y)){ //if target has a greater x than y value
      tilesAlongLine = this.getLineOfTilesFromCentre_IteratingX(centre, target, boardLocations);
    } else{
      tilesAlongLine = this.getLineOfTilesFromCentre_IteratingY(centre, target, boardLocations);
    }

    return tilesAlongLine;
  },

  determineTileInSightFromLine: function(alongEachPath, max_sight) {
    var totalSightImpedance = 0;
    for (var i in alongEachPath) {
      var tileData = alongEachPath[i];
      totalSightImpedance += tileData.portion * tileData.sight_impedance;

      if (i < alongEachPath.length - 1) continue;
      if (totalSightImpedance <= max_sight) return tileData;
    }

    return false;
  },

  getLineOfTilesFromCentre_IteratingX: function(centre, target, boardLocations){
    var m = (target.y - centre.y) / (target.x - centre.x); // target.x and centre.x
    var tilesAlongLine = [];
    var subsetTilesAlongLine = [];
    for (var i=1; i<= Math.abs(target.x-centre.x); i++) {
      var x = centre.x + i * ( (target.x-centre.x) / Math.abs(target.x-centre.x) ); // * -1 or 1
      //var y = m*i + centre.y; // old equation; need to use x, not i
      var y = m * (x - centre.x) + centre.y;
      if (Math.abs(y % 1) >0){ // line does NOT pass through centre of tile
        // and then we add a tile to the list, rather than add coordinates
        subsetTilesAlongLine = this.assignPartialSightValuesX(m, x, y, boardLocations);
        tilesAlongLine = tilesAlongLine.concat(subsetTilesAlongLine);
      } else {
        subsetTilesAlongLine = this.assignWholeSightValueX(m, x, y, boardLocations);
        tilesAlongLine.push(subsetTilesAlongLine);
      }
    }
    return tilesAlongLine;
  },

  getLineOfTilesFromCentre_IteratingY: function(centre, target, boardLocations) {
    var m = (target.x - centre.x) / (target.y - centre.y); // target.y and centre.y
    var tilesAlongLine = [];
    var subsetTilesAlongLine = [];
    for (var i=1; i<= Math.abs(target.y-centre.y); i++) {
      var y = centre.y + i * ((target.y-centre.y) / Math.abs(target.y-centre.y) ); // * -1 or 1
      //var x = m*i + centre.x; // old equation - need to use y, not i
      var x = m * (y - centre.y) + centre.x;

      if (Math.abs(x % 1) >0){ // line does NOT pass through centre of tile
          // and then we add a tile to the list, rather than add coordinates
        subsetTilesAlongLine = this.assignPartialSightValuesY(m, y, x, boardLocations);
        tilesAlongLine = tilesAlongLine.concat(subsetTilesAlongLine);
      } else {
        subsetTilesAlongLine = this.assignWholeSightValueY(m, y, x, boardLocations);
        tilesAlongLine.push(subsetTilesAlongLine);
      }
    }
    return tilesAlongLine;
  },

  assignPartialSightValuesX: function(m, x, y, boardLocations){
    var tilesAlongLine = [];
    //var y_value = Math.trunc(y) + 1 * (target.y-centre.y) / Math.abs(target.y-centre.y);
    var y_value = Math.trunc(y) + 1;
    var tileRoundUp = boardLocations[x][y_value];

    var portion = Math.abs(y%1);
    var tileData = this.buildTileData();
    var tileData = this.buildTileData(tileRoundUp, portion, tileRoundUp.sight_impedance);
    tilesAlongLine.push(tileData);

    var tileRoundDown = boardLocations[x][Math.trunc(y)];
    var portion = 1 - Math.abs(y%1);

    var tileData = this.buildTileData(tileRoundDown, portion, tileRoundDown.sight_impedance);
    tilesAlongLine.push(tileData);
    return tilesAlongLine;
  },

  assignPartialSightValuesY: function(m, y, x, boardLocations){
    var tilesAlongLine = [];
    //var x_value = Math.trunc(x) + 1 * (target.x-centre.x) / Math.abs(target.x-centre.x);
    var x_value = Math.trunc(x) + 1;
    var tileRoundUp = boardLocations[x_value][y];
    var portion = Math.abs(x%1);
    var tileData = this.buildTileData(tileRoundUp, portion, tileRoundUp.sight_impedance);
    tilesAlongLine.push(tileData);

    var tileRoundDown = boardLocations[Math.trunc(x)][y];
    var portion = 1 - Math.abs(x%1);
    var tileData = this.buildTileData(tileRoundDown, portion, tileRoundDown.sight_impedance);
    tilesAlongLine.push(tileData);
    return tilesAlongLine;
  },

  assignWholeSightValueX: function(m, x, y, boardLocations) {
    var tileUnrounded = boardLocations[x][y];
    var tileData = this.buildTileData(tileUnrounded, 1, tileUnrounded.sight_impedance);
    return tileData
  },

  assignWholeSightValueY: function(m, y, x, boardLocations){
    var tileUnrounded = boardLocations[x][y];
    var tileData = this.buildTileData(tileUnrounded, 1, tileUnrounded.sight_impedance);
    return tileData;
  },

  buildTileData: function(tile, portion, sight_impede) {
    var tile_data = {
      'tile': tile,
      'portion': portion,
      'sight_impedance': sight_impede,
    };
    return tile_data;
  },

}
