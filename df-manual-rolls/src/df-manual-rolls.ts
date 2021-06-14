import DFManualRolls from "./DFManualRolls.js";
import SETTINGS from "./lib/Settings.js";

SETTINGS.init('df-manual-rolls');

Hooks.on('init', function () {
	SETTINGS.register(DFManualRolls.FORCED, {
		name: "DF_MANUAL_ROLLS.Settings_Force_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Force_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		onChange: async _ => await Dialog.confirm({
			title: game.i18n.localize("DF_MANUAL_ROLLS.Reload_Title"),
			content: `<p>${game.i18n.localize("DF_MANUAL_ROLLS.Reload_Content")}</p>`,
			yes: () => window.location.reload(),
			no: () => { },
			defaultYes: true
		})
	});
	SETTINGS.register(DFManualRolls.ENABLED, {
		name: "DF_MANUAL_ROLLS.Settings_Enabled_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Enabled_Hint",
		scope: 'client',
		config: !DFManualRolls.forced,
		type: Boolean,
		default: true,
		onChange: value => {
			if (value || DFManualRolls.forced) DFManualRolls.patch();
			else DFManualRolls.unpatch();
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
	Handlebars.registerHelper({ mul: (v1, v2) => v1 * v2 });
	if (DFManualRolls.enabled || DFManualRolls.forced)
		DFManualRolls.patch();
});

Hooks.on('createChatMessage', async (chatMessage: ChatMessage) => {
	if (!chatMessage.isRoll || !DFManualRolls.flagged || !(DFManualRolls.enabled || DFManualRolls.forced)) return;
	var flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some((value) => value instanceof DiceTerm && value.options.isManualRoll))
		return;
	if (!!chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});