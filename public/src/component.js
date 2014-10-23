
/*
 * This class exists to create a level of abstraction between components and
 * components and the front-end application.
 * Return: the created entity
 * Front-end framework: Crafty.js (http://craftyjs.com/)
 */
var Component = {

  /*
   * Takes a component name and a dictionary of functions.
   * Creates a component to be used for creating entities hierarchically.
   * Return: nothing
   */
  create: function(name, functions) {
    if (functins === undefined) functions = {};
    Crafty.c(name, functions);
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Component;
} else {
  window.Component = Component;
}

