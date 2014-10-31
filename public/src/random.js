
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
    console.log("this.called");
    console.log(this.called);
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

