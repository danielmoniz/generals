
var Factions = {
  mongols: {
    name: "Mongols",
    blurb: "Genghis Khan, under the leadership of his chief general and strategist Subutai, divided their forces into four groups as they began their invasion of Europe.",

    victory_message: "The {0} have been defeated by the Mongol hordes. It appears that none can resist the might of the warriors from the Steppes.",
    loss_message: "The Mongols have been defeated. Exhausted, their horses run half to death, they return to their homeland and scatter to the steppes, taking what refuge and solace they can find in their old nomadic way of life.",

    units: [
      {
        name: "Subutai",
        type: "Cavalry",
        quantity: 3000,
      },
      {
        name: "Genghis Khan",
        type: "Cavalry",
        quantity: 3000,
      },
      {
        name: "Kublai Khan",
        type: "Cavalry",
        quantity: 3000,
      },
      {
        name: "Batu Khan",
        type: "Cavalry",
        quantity: 3000,
      },
      {
        name: "Mandhuhai",
        type: "Infantry",
        quantity: 3000,
      },
    ],

    sprites: {
      Infantry: "spr_infantry_mongols",
      Cavalry: "spr_cavalry_mongols",
    },

    cities: ['Avarga', 'Karakorum', 'Dadu'],
  },

  romans: {
    name: "Romans",
    blurb: "The core unit of a Roman army was the well-trained and disciplined Legionary. These were professional soldiers enlisted for 25 years at a time. However, Scipio Africanus, the defeater of Hannibal in the 2nd Punic War, was arguably the greatest general in Roman history. His adaptation to Hannibal's tactics - highly trained cavalry on the flanks for encircling a less-mobile enemy - led to the defeat of the Carthaginians and the continued existence of the Roman Empire.",

    victory_message: "The {0} have been defeated by the Roman Empire. Organized and efficient, elite infantry with the aid of specialized cavalry drove the {0} from the field.",
    loss_message: "The Romans have been defeated. Their empire, once the gem of the civilized world, has been pillaged and broken.",

    units: [
      {
        name: "Scipio",
        type: "Cavalry",
        quantity: 4000,
      },
      {
        name: "Agrippa",
        type: "Infantry",
        quantity: 6000,
      },
      {
        name: "Rufus",
        type: "Infantry",
        quantity: 4000,
      },
      {
        name: "Flavius",
        type: "Infantry",
        quantity: 2000,
      },
      {
        name: "Marc Antony",
        type: "Infantry",
        quantity: 2000,
      },
    ],

    sprites: {
      Infantry: "spr_infantry_romans",
      Cavalry: "spr_cavalry_romans",
    },

    cities: ['Rome', 'Constantinople', 'Antioch', 'Alexandria', 'Ephesus', 'Carthage'],
  },

  chinese: {
    cities: ['Beijing', 'Nanjing', 'Luoyang', "Chang’an (Xi’an)", 'Kaifeng', 'Hangzhou', 'Anyang', 'Zhengzhou'],
  },

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Factions;
} else {
  window.Factions = Factions;
}
