
/*
 * This class exists to create a level of abstraction between entities and the 
 * front-end application.
 * Return: the created entity
 * Front-end framework: Crafty.js (http://craftyjs.com/)
 */
var Entity = {

  /*
   * Takes a string of space separated components and creates a rendered
   * entity.
   */
  create: function(components) {
    return Crafty.e(components);
  },

  /*
   * Takes a search string of components and returns a list of entities.
   */
  get: function(search) {
    return Crafty(search).get();
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Entity;
} else {
  window.Entity = Entity;
}

