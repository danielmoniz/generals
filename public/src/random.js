
if (typeof require !== 'undefined') {
}

var Random = {
  seed: 1,

  setSeed: function(seed) {
    this.seed = seed;
    if (this.seed === undefined) this.seed = 1;
  },

  random: function() {
    var x = Math.sin(10000 * this.seed++) * 10000;
    return x - Math.floor(x);
  },

  nextVal: function() {
    var value = this.random();
    this.seed--;
  },
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Random;
} else {
  window.Random = Random;
}

