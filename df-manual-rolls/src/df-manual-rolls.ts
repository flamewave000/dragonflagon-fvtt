import DFManualRolls from "./DFManualRolls.js";
import SETTINGS from "./lib/Settings.js";

SETTINGS.init('df-manual-rolls');

Hooks.on('init', function () {

	SETTINGS.register(DFManualRolls.GM_STATE, {
		config: true,
		scope: 'world',
		name: 'For All GM',
		hint: 'Setting for all GM roles.',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'Disabled',
			always: 'Always use manual rolls',
			toggle: 'Toggle manual rolls (see documentation)'
		}
	});

	SETTINGS.register(DFManualRolls.PC_STATE, {
		config: true,
		scope: 'world',
		name: 'For All PC',
		hint: 'Setting for all PC roles.',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'Disabled',
			always: 'Always use manual rolls',
			toggle: 'Toggle manual rolls (see documentation)'
		}
	});

	SETTINGS.register(DFManualRolls.FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings_Flagged_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
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