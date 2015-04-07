
var Instructions = {
  general_intro: "Generals is a turn-based strategy game that seeks to accurately represent ancient and medieval combat. This is achieved through the inclusion of a number of strategic elements commonly left out of games.",

  strategic_elements: [
    "supply routes",
    "pillaging",
    "injuries/deaths",
    "morale",
    "troop dissent",
  ],

  general_instructions: "Select armies by clicking on them and move them by right-clicking where you want them to go. Queue up moves for all of your units and click Next Turn (or hit space bar). Units will sometimes have actions available to perform such as pillaging a farm or starting a fire. Click on the corresponding action button beside your unit's display box below the map.",

  how_to_start_combat: "Moving one of your armies into the same tile as another army will start combat/battle.",

  terrain_types_general: "Terrain affects the movement and combat ability of your armies. For example, water is impassable, while forests are slow but provide a defensive bonus. (see Terrain Types)",

  unit_types_general: "",

  goal: "The object of the game is to reduce your opponent's morale. This is represented by the colored victory bars at the top of the screen. This is accomplished by defeating your opponent's armies, pillaging/burning their farms, and sacking their cities.",

  map: "The map itself is divided into thirds and consists of terrain and armies. Anything that starts in your third of the map belongs to you and your faction. If your cities are sacked or your farms pillaged, this will affect your faction's will to fight the war.",

  how_to_win: "You win if your opponent's morale drops to zero or if their morale becomes lower then one third of your own.",

  morale_general: "Players lose morale when they lose troops, have their farms pillaged, or have their cities sacked.",

  morale: "It is important to note that each factions' morale is based on a number of factors. Should any of these factors drop to zero, that player's morale will drop to zero! This means that if everyone of your farms is pillaged, you will lose the game, even if your opponent has only one farm left. Similarly, losing all of your armies or having all of your cities sacked also cause morale to drop to zero.",

  combat_general: "Combat occurs when two opposing armies are in the same tile. Each turn represents a single day of combat. Because of this, combat between two large armies can take days or even weeks to complete if both sides have a similar number of troops. Note, however, that even a small advantage in troop numbers at the beginning can turn into a large advantage within a few turns. The result is that, in almost every case, one side needs to retreat as soon as possible.",

  combat_winning: "A battle is won when one side no longer has any troops in combat. This could happen due to retreating or taking too many casualties. The army that wins a battle must consolidate their forces before moving on or pursuing. This means that movement on the next turn is decreased.",

  casualties: "Each turn, all armies on both sides will take some number of casualties. These will be divided between killed and injured troops. This is a calculation based on the total number of troops on each side.If you have multiple armies in a battle, they will receive casualties that corresponds to the relative size of their armies. For example, One army with 6000 troops might lose 600, but two armies with 3000 troops would each lose 300 in that same scenario.",

  injured_troops: "Injured or wounded troops are casualties that are not killed. They are unable to fight. Moreover, each turn a percentage of your wounded will succumb to their battle wounds and die. Injured troops count the same toward your victory score as uninjured (or active) troops. However, an army with only injured troops will be disbanded.",

  injured_display: "Armies will often display their forces in the following format: 2706/2952. This example means that the army has a total of 2952 troops, but that only 2706 are active/uninjured troops ready for combat. The rest are wounded troops that have the potential to be healed.",

  healing: "Injured troops may be healed. This can be automatic, as some very small fraction of your wounded will be healed each turn. Placing an army in an unsacked city will greatly speed up the healing process. Sacked cities provide no such advantage. Armies are also unable to benefit fron this bonus during combat.",

  retreat_general: "You may retreat from a combat at any time if it is your turn. This will, however, inflict casualties to the retreating army as if they stayed in combat for one more turn. They will inflict no casualties on any opposing armies until they enter a new combat. The dissent of the retreating army will also take a massive increase.",

  retreat_constraints: "Armies can only retreat from combat in certain directions. Initially, an attacking army may only retreat into the tile from which it attacked, while the defending army can move into the other tiles. Should another attacking army join from a different direction, both of those armies may now retreat in two directions, while the defenders are limited to the opposite two directions as well. Because of this, it is possible to not be able to retreat at all if your opponent has had armies join from all four directions. This can be remedied by entering the combat with a new army in order to open up that lane for retreating. Note also that retreat constraints do block supply (see Supply section).",

  supply_general: "Each player must ensure that their armies are supplied in order to avoid taking casualties due to attrition. This simply requires that each army be within one space from the road, and that that road be connected to their own supply route.",

  supply_routes: "Your supply route is the only road space that leads off the map on your own side. From it, your armies are supplied if they are on or adjacent to a road as long as the road is unbroken by enemy armies. Supply can therefore be cut by interposing an army between an enemy army and their supply route. This requires that the army cutting supply must have a minimum of 500 troops.",

  unsupplied: "Any unsupplied army will lose 1 supply until they reach 0. After reaching 0, any further loss in supply will instead manifest as attrition casualties (killed and wounded).",

  supplied: "As soon as your army is once again connected to your own supply rooms, the army is considered supplied. At the start of each of your turns, each supplied army will increase its supply by 1 (up to its maximum).",

  other_factors: "If at any point an army's retreat is blocked, that blockade also prevents supply from that direction. This means that keeping the rear of your armies clear is of vital importance.",

  dissent_general: "Armies do not always perform as they should. An army high on dissent will become less organized and effective. Dissent gets worse when negative events happen to your army. Some examples in order of severity:",

  dissent_examples: [
    'Retreating from battle.',
    'Losing troops due to supply attrition (starvation).',
    'Taking casualties in battle.',
    'Being outside (not in a city) when it rains.',
  ],

  dissent_in_combat: "Dissent is gained in combat when casualties are taken. It is based on the percentage of active troops lost (either dead or injured). Retreating works the same way, but casualties taken during a retreat have a much larger effect on dissent.",

  dissent_improvement: "If an army has a full turn without increasing its dissent, the army's dissent improves/decreases. Thus, giving your armies a rest can be vital to keeping them alive and effective. An army's dissent decreases less if it is unsupplied. It can also be improved by sacking towns and cities and by pillaging farms.",

  terrain_types_intro: "Terrain affects both combat and movement. The defender always gets the combat advantage if it exists.",

  terrain_types: [
    "Water: Impassable.",
    "Forest: Slow to move through. Provide a moderate defensive bonus.",
    "City: Slightly faster movement. Provide a large defensive bonus. Can be sacked for supply.",
    "Road: Fast movement. No defensive advantage.",
    "Bridge: As fast as Road. Provide a huge defensive bonus.",
    "Grass: Average movement speed. No defensive combat bonus.",
    "Farm: Slower than Grass. Slower yet when pillaged. No combat bonus. Can be pillaged for minor supply.",
  ],

  unit_composition: "Each faction starts with a set number of armies of different types. For example, the Mongols use primarily cavalry, while the Romans have more total troops but rely on infantry. Cavalry move much faster than infantry, but are otherwise equal.",

  weather: "The game contains a very basic weather simulation. Currently, the only weather factor is wind.",

  wind: "Wind has the effect of spreading fire toward the direction it is blowing. It's direction will change over the course of the game, although it will often remain constant for a number of turns. This allows players to plan around the direction of the wind and start fires strategically.",

  fire: "Armies can start fires on any flammable terrain tile, ie. forests and farms. Every round of play, every burning terrain tile has a chance of spreading in a random direction. It is also affected by the wind; there is a 100% chance that fire will spread in the direction of the wind if that terrain tile is flammable. Although fire spreads slowly initially, it can quickly and engulf areas of farmland and forests, thus permanently modifying the terrain.",

  unit_types: [
  ],

  game_modes: [
    "Hotseat",
    "Online",
  ],

  hotseat: "In a Hotseat game, two players take turns on the same computer/tablet. If playing with fog of war (default), the map will become shaded between each of their turns. Neither player can see any information about army movements. This allows players to perform their moves in secrecy. Both players get to view the full map before playing.",

  online: "In Online play, the player that invites an opponent becomes the host. The host gets to select a number of options after creating a game. Once the host hits 'Start', both players get a full look at the map before beginning. Once the first player hits 'Begin Game', they simply take turns placing moves, as no secrecy is required.",

  // Tips
  tips: [
    "Armies can be selected at the bottom display by clicking on their display box. ",

    "Double-clicking the information at the bottom for an army will display the stats for that army.",

    "Injured troops can't carry food, but they still need to eat. An army with a large amount of injured soldiers will have harder time keeping itself supplied.",

    "Two armies are better than one. Try attacking an enemy army from two different directions. Their supply can be cut while simultaneously prohibiting retreat in certain directions.",

    "Retreating provides a movement bonus of 1. This represents the fact that your army will do anything to get out of striking range of opposing forces. Use this to retreat just out of range of your pursuer. Be careful, however, because retreating into slow terrain means that you can often be caught!",

    "The spread of fire can be stopped by pillaging any farms to which it might spread. This can be useful if the fire has to pass through a single form of yours before spreading to other dangerous areas.",

    "Try starting a fire in a forest on an opponent's flank. Burnt down forests allow for quicker movement then live ones.",

    "When in battle, the game displays the retreat movement bonus only to the army whose turn it is currently.",

    "Armies can move farther than they can see. Avoid doing so when your opponent might be waiting to ambush!",

    "Armies cannot march into an enemy they could not see - they will be stopped one space early. Use this to wait beside roads and stage ambushes!",

    "Protect your home cities at all cost. Losing even one of three cities will drop your faction's morale by at least 33%.",

    "Sacked cities provide very little defensive protection.",

    "Bridges provide the largest defensive bonus. Ignore them at your peril.",

    "Fires follow the wind. Start one in favourable conditions to wreak havoc in enemy territory.",

    "Large armies sack cities and towns faster than small ones.",

    "Having an army's supply cut at a bad time can be devastating. Use this by getting between your opponent and their source of supply.",

    "Most terrain features such as trees, grass, and farms automatically provide some supply to present armies.",

    "An army that wins a battle must consolidate their troops before pursuing. The army therefore gets less movement on their next turn. This helps retreating armies escape.",

    "Managing dissent is vital to keeping your armies effective.",

    "Retreating is damaging to both an army's manpower and its dissent, but sometimes it has to be done.",
  ],

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Instructions;
} else {
  window.Instructions = Instructions;
}
