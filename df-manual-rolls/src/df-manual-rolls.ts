import DFManualRolls from "./DFManualRolls.js";
import DFRollPrompt from "./DFRollPrompt.js";
import SETTINGS from "./lib/Settings.js";

SETTINGS.init('df-manual-rolls');

Hooks.on('init', function () {

	SETTINGS.register(DFManualRolls.PREF_GM_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings_GM_Name',
		hint: 'DF_MANUAL_ROLLS.Settings_GM_Hint',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options_Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options_Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options_Toggle'
		},
		onChange: () => { ui.controls.initialize() }
	});

	SETTINGS.register(DFManualRolls.PREF_PC_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings_PC_Name',
		hint: 'DF_MANUAL_ROLLS.Settings_PC_Hint',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options_Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options_Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options_Toggle'
		},
		onChange: () => { ui.controls.initialize() }
	});

	SETTINGS.register(DFRollPrompt.PREF_FOCUS_INPUT, {
		config: true,
		scope: 'client',
		name: 'DF_MANUAL_ROLLS.Settings_FocusInput_Name',
		hint: 'DF_MANUAL_ROLLS.Settings_FocusInput_Hint',
		type: Boolean,
		default: true
	});

	SETTINGS.register(DFManualRolls.PREF_FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings_Flagged_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});

	SETTINGS.register(DFManualRolls.PREF_TOGGLED, {
		config: false,
		scope: 'client',
		type: Boolean,
		default: false,
		onChange: (value: Boolean) => {
			const button = $('ol#controls>li#df-manual-roll-toggle');
			if (value) button.addClass('active');
			else button.removeClass('active');
		}
	})
	Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
		if (!DFManualRolls.toggleable) return;
		controls.find(x => x.name === 'token').tools.push({
			icon: 'fas fa-dice-d20',
			name: 'manualRoll',
			title: 'DF_MANUAL_ROLLS.SceneControlTitle',
			visible: DFManualRolls.toggleable,
			toggle: true,
			active: DFManualRolls.toggled,
			onClick: (toggled: boolean) => DFManualRolls.setToggled(toggled)
		});
	});
});
Hooks.on('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
		ui.notifications.error(game.i18n.localize("DF_MANUAL_ROLLS.Error_libWrapper_Missing"));
		return;
	}
	Handlebars.registerHelper({ mul: (v1, v2) => v1 * v2 });
	DFManualRolls.patch();
});

Hooks.on('createChatMessage', async (chatMessage: ChatMessage) => {
	// Ignore non-roll, non-flagged, non-manual messages
	if (!chatMessage.isRoll && !DFManualRolls.flagged && !DFManualRolls.shouldRollManually) return;
	var flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some((value) => value instanceof DiceTerm && value.options.isManualRoll))
		return;
	if (!!chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});