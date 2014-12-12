
var InstructionsBuilder = {
  generateInstructions: function() {
    this.addTitle('About the Game');
    this.addInstruction('general_intro');
    this.addInstructionList('strategic_elements');
    this.addInstruction('goal');
    this.addInstruction('map');
    this.addInstruction('how_to_win');
    this.addInstruction('morale_general');

    this.addTitle('How to Play');
    this.addSubTitle('The Basics');
    this.addInstruction('general_instructions');
    this.addInstruction('how_to_start_combat');
    this.addSubTitle('Morale');
    this.addInstruction('morale_general');
    this.addInstruction('morale');
    this.addSubTitle('Combat');
    this.addInstruction('combat_general');
    this.addInstruction('casualties');
    this.addSubTitle('Injured troops');
    this.addInstruction('injured_display');
    this.addInstruction('injured_troops');
    this.addInstruction('healing');
    this.addSubTitle('Supply');
    this.addInstruction('supply_general');
    this.addInstruction('supply_routes');
    this.addInstruction('unsupplied');
    this.addInstruction('supplied');
    this.addInstruction('other_factors');
    this.addSubTitle('Retreating');
    this.addInstruction('retreat_general');
    this.addInstruction('retreat_constraints');
    this.addSubTitle('Terrain Types');
    this.addInstruction('terrain_types_intro');
    this.addInstructionList('terrain_types');
    this.addSubTitle('Army/Unit Types');
    this.addInstruction('unit_composition');
    this.addSubTitle('Weather');
    this.addInstruction('weather');
    this.addInstruction('wind');
    this.addInstruction('fire');

    this.addTitle('Game Modes');
    this.addInstructionList('game_modes');
    this.addInstruction('hotseat');
    this.addInstruction('online');

    this.addTitle('Tips');
    this.addInstruction('selection');
    this.addInstruction('two_armies_better_than_one');
    this.addInstruction('retreat_movement_bonus');
    this.addInstruction('stopping_fire');
    this.addInstruction('using_wind');
    this.addInstruction('');
    this.addInstruction('');
  },

  createInstructionBlock: function(text, type) {
    if (!type) type = "p";
    var block = $("<{0} />".format(type));
    block.text(text);
    return block;
  },

  addTitle: function(text) {
    var block = this.createInstructionBlock(text, 'h2');
    $("#instructions").append(block);
  },

  addSubTitle: function(text) {
    var block = this.createInstructionBlock(text, 'h3');
    $("#instructions").append(block);
  },

  addInstruction: function(name, type) {
    var text = Instructions[name];
    var block = this.createInstructionBlock(text, type);
    $("#instructions").append(block);
  },

  addInstructionList: function(name) {
    var list = Instructions[name];
    var block = this.createInstructionBlock('', 'ul');
    $("#instructions").append(block);
    for (var i in list) {
      var list_item = this.createInstructionBlock(list[i], 'li');
      block.append(list_item);
    }
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = InstructionsBuilder;
} else {
  window.InstructionsBuilder = InstructionsBuilder;
}

