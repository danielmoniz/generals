var locations = {
  test: {
    height_map: {
      noise: 'perlin2',
      size: 1/4,
    },
    ground: { r: 87, g: 109, b: 20 },
    water: {
      size: 1/4,
      water_level: 0.65,
    },
    trees: {
      size: 1/4,
      freq: .80,
      noise: 'perlin2',
    },
  },
  black_forest: {
    height_map: {
      noise: 'perlin2',
      size: 1/4,
    },
    ground: { r: 87, g: 109, b: 20 },
    water: {
      size: 1/4,
      water_level: 0.65,
    },
    trees: {
      size: 1/4,
      freq: .80,
      noise: 'perlin2',
    },
  },
  northern_ontario: {
    height_map: {
      noise: 'perlin2',
      size: 1/4,
    },
    ground: { r: 87, g: 109, b: 20 },
    water: {
      size: 1/4,
      water_level: 0.65,
    },
    trees: {
      size: 1/16,
      freq: .70,
      noise: 'simplex2',
    },
  },
  idaho: {
    water: {
      size: 1/8,
      freq: .35,
      noise: 'perlin2',
    },
    trees: {
      size: 1/16,
      freq: .20,
      noise: 'simplex2',
    },
  },
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = locations;
} else {
  window.locations = locations;
}
