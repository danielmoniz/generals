
var Factions = {
  mongols: {
    name: "Mongols",
    blurb: "Genghis Khan, under the leadership of his chief general and strategist Subutai, divided their forces into four groups as they began their invasion of Europe. This strategy allowed for a concentration of force at a chosen point, while the allies of their opposition had to remain fixed in place out of worry for their own homelands.",

    victory_message: "The Mongol hordes have vanquished the {0}. It appears that none can resist the might of the warriors from the Steppes.",
    loss_message: "The Mongols have been defeated. Exhausted, their horses run half to death, they return to their homeland and scatter to the steppes, taking what refuge and solace they can find in their old nomadic way of life.",

    units: [
      {
        name: "Subutai",
        type: "Cavalry",
        quantity: 2500,
      },
      {
        name: "Genghis Khan",
        type: "Cavalry",
        quantity: 2500,
      },
      {
        name: "Kublai Khan",
        type: "Cavalry",
        quantity: 2500,
      },
      {
        name: "Batu Khan",
        type: "Cavalry",
        quantity: 2500,
      },

      /*
      {
        name: "Mandhuhai",
        type: "Scout",
        quantity: 2000,
      },
      */
    ],

    cities: ['Avarga', 'Karakorum', 'Dadu', 'Ikh Khuree'],
    goal: {
      'aggressive': {
        aggression_increase: 5,
        aggression_decrease: 0.5,
        turn_decrease: 4,
      },
      'defensive': false,
    },

    /* Other (simple) format - is given to every army in faction
    special_abilities: [
      'terrifying',
    ],
    */
    special_abilities: {
      'terrifying': {
        cavalry: true,
      },
    },

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
        quantity: 2500,
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

    cities: ['Rome', 'Constantinople', 'Antioch', 'Alexandria', 'Ephesus'],

    special_abilities: {
      'organized': {
        infantry: true,
        cavalry: false,
      },
    },

  },

  carthage: {
    name: 'Carthage',
    blurb: "Naval power, fought Rome in Punic Wars, Hannibal vs Scipio in 2nd Punic War, etc.",

    units: [
      {
        name: "Hannibal",
        type: "Light Cavalry",
        quantity: 3000,
      },
      {
        name: "Hasdrubal",
        type: "Infantry",
        quantity: 5000,
      },
      {
        name: "Mago",
        type: "Elephant",
        quantity: 38,
      },
      {
        name: "Himilco",
        type: "Scout",
        quantity: 1000,
      },
      {
        name: "Hamilcar",
        type: "Infantry",
        quantity: 5000,
      },
    ],

    cities: ['Carthage', 'Utique', 'Hippo Regius', 'Gades', 'Saguntum', 'Carthago Nova', 'Panormus', 'Lilybaeum', 'Hadrumetum', 'Zama Regia', 'Karalis', 'Malaca', 'Leptis Magna', 'Hippo Diarrhytus', 'Motya', 'Sulci', 'Tharros', 'Leptis Parva', 'Soluntum', 'Lixus', 'Oea', 'Theveste', 'Ibossim', 'Thapsus', 'Aleria', 'Tingis', 'Abyla', 'Sabratha', 'Rusadir', 'Baecula', 'Saldae'],

    special_abilities: {
      'testtest': {
        infantry: true,
        cavalry: false,
      },
    },

  },

  aztecs: {
    name: 'Aztecs',
    blurb: "Mystery!",

    units: [
      {
        name: "Montezuma",
        type: "Jaguar Warrior",
        quantity: 5000,
      },
      {
        name: "Huitzilopochtli",
        type: "Jaguar Warrior",
        quantity: 5000,
      },
      {
        name: "Cuauhtémoc",
        type: "Jaguar Warrior",
        quantity: 5000,
      },
      {
        name: "Popocatepetl",
        type: "Scout",
        quantity: 250,
      },
      {
        name: "Ahuitzotl",
        type: "Scout",
        quantity: 250,
      },
    ],

    cities: ['Tenochtitlan', 'Teotihuacan', 'Tlatelolco', 'Texcoco', 'Tlaxcala', 'Calixtlahuaca', 'Xochicalco', 'Tlacopan', 'Atzcapotzalco', 'Tzintzuntzen', 'Malinalco', 'Tula', 'Tamuin', 'Teayo', 'Cempoala', 'Chalco', 'Tlalmanalco', 'Ixtapaluca', 'Huexotla', 'Tepexpan', 'Tepetlaoxtoc', 'Chiconautla', 'Zitlaltepec', 'Coyotepec', 'Tequixquiac', 'Jilotzingo', 'Tlapanaloya', 'Tultitan', 'Ecatepec', 'Coatepec', 'Chalchiuites', 'Chiauhita', 'Chapultepec', 'Itzapalapa', 'Ayotzinco',],

  },

  chinese: {
    disabled: true,
    name: 'Chinese',
    cities: ['Beijing', 'Nanjing', 'Luoyang', "Chang’an (Xi’an)", 'Kaifeng', 'Hangzhou', 'Anyang', 'Zhengzhou'],
  },

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Factions;
} else {
  window.Factions = Factions;
}
