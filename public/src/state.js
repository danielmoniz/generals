
var State = {

  healthyRuinedAnimation: function() {
    return {
      undefined: function(entity) {
        entity.animate('healthy', -1);
      },
      healthy: function(entity) {
        entity.animate('healthy', -1);
      },
      ruined: function(entity) {
        entity.animate('ruined', -1);
      },
    };
  },

  /*
   * Used for entities that are visible until destroyed/ruined.
   */
  showUntilRuined: function() {
    return {
      undefined: function(entity) {
        entity.visible = true;
      },
      healthy: function(entity) {
        entity.visible = true;
      },
      ruined: function(entity) {
        entity.visible = false;
      },
    };
  },

  hideUntilActive: function() {
    return {
      undefined: function(entity) {
        entity.visible = false;
      },
      active: function(entity) {
        entity.visible = true;
      },
      gone: function(entity) {
        entity.visible = false;
      },
    };
  },

};

