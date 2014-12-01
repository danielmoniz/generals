
/*
 * This class exists to create a level of abstraction between entities and the 
 * front-end application.
 * Return: the created entity
 * Front-end framework: Crafty.js (http://craftyjs.com/)
 */
var Entity = {

  cache: {},
  special_cache: {},
  special_caches: [
    'Unit',
    'Battle',
  ],

  /*
   * Takes a string of space separated components and creates a rendered
   * entity.
   */
  create: function(components) {
    var entity = Crafty.e(components);
    this.flushSpecialCache(components);
    return entity;
  },

  /*
   * Takes a search string of components and returns a list of entities.
   */
  get: function(search) {
    if (this.special_cache[search] !== undefined && Game.turn_count > 0) {
      return this.special_cache[search];
    }
    if (this.cache[search] !== undefined && Game.turn_count > 0) {
      return this.cache[search];
    }
    var result = Crafty(search).get();
    if (this.special_caches.indexOf(search) > -1) {
      this.special_cache[search] = result;
    } else {
      this.cache[search] = result;
    }
    return result;
  },

  flushCaches: function() {
    this.cache = {};
  },

  flushSpecialCache: function(name) {
    delete this.special_cache[name];
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Entity;
} else {
  window.Entity = Entity;
}

