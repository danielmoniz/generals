
function outputTilesInSight(unitLocation, tilesInMaxSightRadius, boardLocations) { 
  var listOfVisibleTiles = []

  for(var i in tilesInMaxSightRadius){

    var lineToCheck = getLineOfTilesFromCentre(unitLocation, tilesInMaxSightRadius[i], boardLocations)


    var visible= determineTilesInSightFromLine(lineToCheck)
    listOfVisibleTiles.push(visible)

  }
  return listOfVisibleTiles;
}

function getLineOfTilesFromCentre(centre, target, boardLocations){ 
  var tilesAlongLine = []; // then this becomes a list of actual tiles

  if (Math.abs(target.x-centre.x) >= Math.abs(target.y-centre.y)){ //if target has a greater x than y value
    tilesAlongLine = getLineOfTilesFromCentre_IteratingX(centre, target, boardLocations)
  }

  else{
    tilesAlongLine = getLineOfTilesFromCentre_IteratingY(centre, target, boardLocations)
  }

  return tilesAlongLine;
}

function getLineOfTilesFromCentre_IteratingX(centre, target, boardLocations){
  var m = (target.y - centre.y) / (target.x - centre.x); // target.x and centre.x
  var tilesAlongLine = []
  var subsetTilesAlongLine = []
  for (var i=1; i<= Math.abs(target.x-centre.x); i++) {
    var x = centre.x + i * ( (target.x-centre.x) / Math.abs(target.x-centre.x) ); // * -1 or 1
    var y = m*i + centre.y;
    if (Math.abs(y % 1) >0){ // line does NOT pass through centre of tile
        // and then we add a tile to the list, rather than add coordinates
        subsetTilesAlongLine = assignPartialSightValuesX(m, x, y, centre, target, boardLocations)
        tilesAlongLine.push(subsetTilesAlongLine)
    }
    else{
        subsetTilesAlongLine = assignWholeSightValueX(m, x, y, boardLocations)
          tilesAlongLine.push(subsetTilesAlongLine)
    }
  }
  return tilesAlongLine
}

function getLineOfTilesFromCentre_IteratingY(centre, target, boardLocations) {
  var m = (target.x - centre.x) / (target.y - centre.y); // target.y and centre.y
  var tilesAlongLine = []
  var subsetTilesAlongLine = []
  for (var i=1; i<= Math.abs(target.y-centre.y); i++) {
    var y = centre.y + i * ((target.y-centre.y) / Math.abs(target.y-centre.y) ); // * -1 or 1
    var x = m*i + centre.x;
    if (Math.abs(x % 1) >0){ // line does NOT pass through centre of tile
        // and then we add a tile to the list, rather than add coordinates
      subsetTilesAlongLine = assignPartialSightValuesY(m, y, x, centre, target, boardLocations)
      tilesAlongLine.push(subsetTilesAlongLine)
    }
    else{
      subsetTilesAlongLine = assignWholeSightValueY(m, y, x, boardLocations)
      tilesAlongLine.push(subsetTilesAlongLine)
    }
  }
  return tilesAlongLine
} 

function assignPartialSightValuesX(m, x, y, centre, target, boardLocations){
  var tilesAlongLine = []
  var tileRoundUp = boardLocations[x][Math.trunc(y) + 1 * (target.y-centre.y)/Math.abs(target.y-centre.y))];
  var portion = Math.abs(y%1); 
  var tileData = {
    ‘tile’: tileRoundUp,
    ‘portion’: portion,
    ‘sightImpede’: tileRoundUp.sightImpede
  };
  tilesAlongLine.push(tileData) 

  var tileRoundDown = boardLocations[x][math.trunc(y)];
  var portion = 1 - Math.abs(y%1);

  var tileData = {
    ‘tile’: tileRoundDown
    ‘portion’: portion
    ‘SightImpede’: tileRoundDown.sightImpede
  };
  tilesAlongLine.push(tileData) 
  return tilesAlongLine
} 

function assignPartialSightValuesY(m, y, x, centre, target, boardLocations){
  var tilesAlongLine = []
  var tileRoundUp = boardLocations[Math.trunc(x) + 1 * (target.x-centre.x) / Math.abs(target.x-centre.x))][y];
  var portion = Math.abs(x%1); 
  var tileData = {
    ‘tile’: tileRoundUp,
    ‘portion’: portion,
    ‘SightImpede’: tileRoundUp.sightImpede
  };
  tilesAlongLine.push(tileData) 

  var tileRoundDown = boardLocations[math.trunc(x)][y];
  var portion = 1 - Math.abs(x%1);
  var tileData = {
    ‘tile’: tileRoundDown
    ‘portion’: portion
    ‘SightImpede’: tileRoundDown.sightImpede
  };
  tilesAlongLine.push(tileData) 
  return tilesAlongLine
}

function assignWholeSightValueX(m, x, y, boardLocations) {

  var tileUnrounded = boardLocations[x][y];
  var tileData = {//Is that what you are thinking?
    ‘tile’ = tileUnrounded
    ‘portion’ = 1
    ‘SightImpede’: tileUnrounded.sightImpede
  };
  return tileData
}

function assignWholeSightValueY(m, y, x, boardLocations){

  var tileUnrounded = boardLocations[x][y];
  var tileData = {
    ‘tile’ = tileUnrounded
    ‘portion’ = 1
    ‘SightImpede’: tileUnrounded.sightImpede
  };
  return tileData
}

