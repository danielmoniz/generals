
var Menus = {
  menu_id: '#menus',

  buildMenus: function() {
    Overlays.buildOverlays(this.menu_id);
  },

};

var Overlays = {

  buildOverlays: function(menu_id) {
    var overlays_div = Output.createDiv('overlays popout');
    var form = $('<form/>', {
    });
    overlays_div.append(form);

    var option_data = [
      {
        name: 'enemy_sight_lines',
        hotkey: 'v',
      },
      {
        name: 'ally_sight_lines',
        hotkey: 'a',
      },
      {
        name: 'show_units',
        hotkey: 'r',
      },
      {
        name: 'enemy_movement',
        hotkey: 'm',
      },
      {
        name: 'city_supply_ranges',
        hotkey: 'g',
      },
    ];

    $(document).off('keypress.menu');
    for (var i in option_data) {
      var option = this.buildOverlayOption(option_data[i]);
      form.append(option);
    }

    $(menu_id).append(overlays_div);
  },

  buildOverlayOption: function(option_data) {
    var option = Output.createDiv('option');
    var option_id = 'overlay_option_{0}'.format(option_data.name);
    var input = $('<input/>', {
      class: 'overlay_option',
      name: option_data.name,
      id: option_id,
      type: 'checkbox',
    });

    if (Game[option_data.name]) {
      input.prop('checked', true);
    }

    input.click(function() {
      var value = $('#' + option_id).is(':checked');
      Action.perform('toggle_{0}'.format(option_data.name), option_data.name);
      $(this).blur();
    });
    option.append(input);

    var display_template = "{0} ({1})";
    var display_name = option_data.name.replace(/_/g, ' ');
    display_name = Utility.capitalizeFirstLetter(display_name);
    option.append(display_template.format(display_name, option_data.hotkey));

    window['toggle_{0}'.format(option_data.name)] = function() {
      $('#' + option_id).click();
    };

    var char_code = option_data.hotkey.charCodeAt(0);
    // @TODO Set up overlay 'o' keypress somewhere here
    $(document).on('keypress.menu', function(e) {
      var active_tag = document.activeElement.tagName.toLowerCase();
      if (active_tag != 'body') return;

      if (e.keyCode == char_code) {
        var func_name = 'toggle_{0}'.format(option_data.name);
        window[func_name]();
        return false;
      }
    });

    return option;
  },

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Menus;
} else {
  window.Menus = Menus;
}

