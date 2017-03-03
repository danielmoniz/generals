var locations = {
  test: {
    height_map: {
      noise: 'perlin2',
      size: 4/4,
    },
    ground: { r: 87, g: 109, b: 20 },
    water: {
      size: 4/4,
      water_level: 0.45,
    },
    trees: {
      size: 1/8,
      freq: .60,
      noise: 'perlin2',
    },
    climate: {
      chance_of_rain: .10,
      chance_rain_stops: .35,
      chance_of_wind: .5,
      chance_of_wind_change: .15,
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
    climate: {
      chance_of_rain: .10,
      chance_rain_stops: .35,
      chance_of_wind: .5,
      chance_of_wind_change: .15,
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
    height_map: {
      noise: 'perlin2',
      size: 1/4,
    },
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
