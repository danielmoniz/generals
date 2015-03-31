
/*
 * This class exists to create a level of abstraction between entities and the 
 * front-end application.
 * Return: the created entity
 * Front-end framework: Crafty.js (http://craftyjs.com/)
 */
var Entity = {

  cache: {},

  // This is a list of important components that need to be kept updated.
  // Primary components (eg. Unit, City, etc.) are kept updated automatically.
  // Therefore only special secondary components need to be here.
  keep_updated: [
    'Hideable',
  ],

  /*
   * Takes a string of space separated components and creates a rendered
   * entity.
   * @TODO Instead of flushing cache, simply add to it.
   */
  create: function(component) {
    //console.log('creating entity: {0}'.format(component));
    var entity = Crafty.e(component);
    if (entity.cached_as !== undefined) throw new Error('BadProperty', 'entity already has cached_as property');
    entity.cached_as = component;

    this.flushCache(component);
    this.flushImportantCaches(entity);
    return entity;
  },

  // @TODO Instead of flushing cache, simply remove from it.
  destroy: function(entity) {
    //console.log('destroying entity: {0}'.format(entity.cached_as));
    //console.log(entity);
    entity.destroy();
    this.flushCache(entity.cached_as);
    this.flushImportantCaches(entity);
  },

  /*
   * Takes a search string of components and returns a list of entities.
   */
  get: function(search, flush_first) {
    if (flush_first) {
      this.flushCache(search);
    }

    //if (this.cache[search] !== undefined && Game.turn_count > 0) {
    if (this.cache[search] !== undefined) {
      return this.cache[search];
    }
    var result = Crafty(search).get();
    if (result.length) {
      //console.log('building cache from search: {0}'.format(search));
      //console.log(result.length);
      this.cache[search] = result;
    }
    return result;
  },

  flushCache: function(search) {
    //console.log('flushing cache: {0}'.format(search));
    this.cache[search] = undefined;
  },

  flushCaches: function() {
    //console.log('flushing all caches');
    this.cache = {};
  },

  flushImportantCaches: function(entity) {
    for (var i in this.keep_updated) {
      var component = this.keep_updated[i];
      if (entity.has(component)) this.flushCache(component);
    }
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Entity;
} else {
  window.Entity = Entity;
}

