
if (typeof require !== 'undefined') {
}

var Random = {
  seed: 1,
  called: 0,

  setSeed: function(seed) {
    this.seed = seed;
    if (this.seed === undefined) this.seed = 1;
  },

  random: function() {
    this.called += 1;
    console.log("random function called: {0}".format(this.called));
    var x = Math.sin(10000 * this.seed++) * 10000;
    var random = x - Math.floor(x);
    console.log("random value: {0}".format(random));
    console.log("-----");
    return random;
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

