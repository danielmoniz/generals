
var Instructions = {
  general_intro: "Generals is a turn-based strategy game that seeks to accurately represent ancient and medieval combat. This is achieved through the inclusion of a number of strategic elements commonly left out of games.",

  strategic_elements: [
    "supply routes",
    "pillaging",
    "injuries/deaths",
    "morale",
  ],

  general_instructions: "Select armies by clicking on them and move them by right-clicking where you want them to go. Queue up moves for all of your units and click Next Turn (or hit space bar). Units will sometimes have actions available to perform such as pillaging a farm. Click on the corresponding action button beside your unit's display box below the map.",

  goal: "The object of the game is to reduce your opponent's morale. This is represented by the colored victory bars at the top of the screen. This is accomplished by defeating your opponent's armies, pillaging their farms, and sacking their cities.",

  map: "The map itself is divided into thirds and consists of terrain and armies. Anything that starts in your third of the map belongs to you and your faction. If your cities are sacked or your farms pillaged, this will affect your faction's will to fight the war.",

  how_to_win: "You win if your opponent's morale drops to zero or if their morale becomes lower then one third of your own.",

  morale_general: "Players lose morale when they lose troops, have their farms pillaged, or have their cities sacked.",

  morale: "It is important to note that each factions' morale is based on a number of factors. Should any of these factors drop to zero, that player's morale will drop to zero! This means that if everyone of your farms is pillaged, you will lose the game, even if your opponent has only one farm left. Similarly, losing all of your armies or having all of your cities sacked also cause morale to drop to zero.",

  combat_general: "Combat occurs when two opposing armies are in the same tile. Each turn represents a single day of combat. Because of this, combat between two large armies can take days or even weeks to complete if both sides have a similar number of troops. Note, however, that even a small advantage in troop numbers at the beginning can turn into a large advantage within a few turns. The result is that, in almost every case, one side needs to retreat as soon as possible.",

  casualties: "Each turn, all armies on both sides will take some number of casualties. These will be divided between killed and injured troops. This is a calculation based on the total number of troops on each side.If you have multiple armies in a battle, they will receive casualties that corresponds to the relative size of their armies. For example, One army with 6000 troops might lose 600, but two armies with 3000 troops would each lose 300 in that same scenario.",

  how_to_start_combat: "Moving one of your armies into the same tile as another Army will start a combat. Note that a combat will be started regardless of your intentions if you attempt to move through an opposing army.",

  retreat_general: "You may retreat from a combat at any time if it is your turn. This will, however, inflict casualties to the retreating army as if they stayed in combat for one more turn. They will inflict no casualties on any opposing armies until they enter a new combat.",

  retreat_constraints: "Armies can only retreat from combat in certain directions. Initially, an attacking army may only retreat into the tile from which it attacked, while the defending army can move into the other tiles. Should another attacking army join from a different direction, both of those armies may now retreat in two directions, while the defenders are limited to the opposite two directions as well. Because of this, it is possible to not be able to retreat at all if your opponent has had armies join from all four directions. This can be remedied by entering the combat with a new army in order to open up that lane for retreating. Note also that retreat constraints do block supply (see Supply section).",

  supply_general: "Each player must ensure that their armies are supplied in order to avoid taking casualties due to attrition. This simply requires that each army be within one space from the road, and that that road be connected to their own supply route.",

  supply_routes: "Your supply route is the only road space that leads off the map on your own side. From it, your armies are supplied as long as the road is unbroken by enemy armies. Moreover, if one of your armies strays more than one space from a road/bridge/city, they cannot be supplied. ",

  unsupplied: "Any unsupplied army will lose 1 supply until they reach 0. After reaching 0, any further loss in supply will instead manifest as attrition casualties (killed and wounded).",

  supplied: "As soon as your army is once again connected to your own supply rooms, the army is considered supplied. At the start of each of your turns, each supplied army will increase its supply by 1 (up to its maximum).",

  other_factors: "If at any point an army's retreat is blocked, that blockade also prevents supply from that direction. This means that keeping the rear of your armies clear is of vital importance.",

  game_modes: [
    "Hotseat",
    "Online",
  ],

  hotseat: "In a Hotseat game, two players take turns on the same computer/tablet. If playing with fog of war (default), the map will become shaded between each of their turns. Neither player can see any information about army movements. This allows players to perform their moves in secrecy.",

  online: "In Online play, the player that invites an opponent becomes the host. The host gets to select a number of options after creating a game. Once the host hits 'Start', both players get a full look at the map before beginning. Once the first player hits 'Begin Game', they simply take turns placing moves, as no secrecy is required.",

  // Tips
  selection: "Armies can be selected at the bottom display by clicking on their display box. ",

  two_armies_better_than_one: "Two armies are better than one. Try attacking an enemy army from two different directions. In this way, their supply can be cut while simultaneously prohibiting retreat in certain directions.",

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Instructions;
} else {
  window.Instructions = Instructions;
}
