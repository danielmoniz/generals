
var EnemyMoves = {

  displayEnemyMoves: function(player, turn) {
    if (player % 1 != 0 || player != turn) return;

    var units = Units.getEnemyUnits(player);
    for (var i in units) {
      var unit = units[i];
      if (unit.last_moves.length == 0) continue;

      var path = [unit.start_location].concat(unit.last_moves);
      for (var j=1; j<path.length; j++) {
        var node = path[j];
        this.createMovementArrows(path[j-1], path[j], player);
      }
    }

    if (Game.enemy_movement) {
      Crafty.trigger('ShowEnemyMovement');
    } else {
      Crafty.trigger('HideEnemyMovement');
    }
  },

  createMovementArrows: function(node1, node2, side) {
    var arrow_positions = this.getMovementArrowFromAdjacentPoints(node1, node2);
    this.createMovementArrow(node1, side, arrow_positions[0]);
    this.createMovementArrow(node2, side, arrow_positions[1]);
  },

  createMovementArrow: function(node, side, position) {
    if (LineOfSight.positionInSight(node, side)) {
      var move_arrow = Entity.create('MovementArrow');
      var component = 'spr_movement_arrow_{0}'.format(position);
      move_arrow.addComponent(component);
      move_arrow.at(node.x, node.y);
    }
  },

  getMovementArrowFromAdjacentPoints: function(start, target) {
    if (start.y == target.y && start.x < target.x) return ['right', 'left'];
    if (start.y == target.y && start.x > target.x) return ['left', 'right'];
    if (start.x == target.x && start.y < target.y) return ['down', 'up'];
    if (start.x == target.x && start.y > target.y) return ['up', 'down'];
  },

};

