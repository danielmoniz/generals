
/*
 * This class exists to create a level of abstraction between entities and the 
 * front-end application.
 * Return: the created entity
 * Front-end framework: Crafty.js (http://craftyjs.com/)
 */
var Entity = {

  // @TODO Is the special cache needed?
  cache: {},
  special_cache: {},
  special_caches: [
    'Unit',
    'Battle',
    'SimpleBattle',
    'SiegeBattle',
    'Fire',
  ],

  /*
   * Takes a string of space separated components and creates a rendered
   * entity.
   */
  create: function(components) {
    var entity = Crafty.e(components);
    this.flushCache(components);
    this.flushSpecialCache(components);
    return entity;
  },

  destroy: function(entity) {
    var caches_to_flush =[];
    for (var i in this.special_caches) {
      var component = this.special_caches[i];
      if (entity.has(component)) {
        caches_to_flush.push(component);
      }
    }

    entity.destroy();

    for (var i in caches_to_flush) {
      var cache = caches_to_flush[i];
      this.flushSpecialCache(cache);
      this.flushCache(cache);
    }
  },

  /*
   * Takes a search string of components and returns a list of entities.
   */
  get: function(search, flush_first) {
    if (flush_first) {
      this.flushCache(search);
      this.flushSpecialCache(search);
    }

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

  getNonDestroyed: function(search, flush_first) {
    var entities = this.get(search, flush_first);
    var non_destroyed_entities = entities.filter(function(entity) {
      return !entity.destroyed;
    });
    return non_destroyed_entities;
  },

  flushCache: function(search) {
    this.cache[search] = undefined;
  },

  flushCaches: function() {
    this.cache = {};
  },

  flushSpecialCache: function(name) {
    //console.log('Flushing special cache: {0}'.format(name));
    delete this.special_cache[name];
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Entity;
} else {
  window.Entity = Entity;
}

